"""Integration tests for the local WayMed API using an isolated SQLite database."""

import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from sqlalchemy.pool import StaticPool

from backend.app.api import app, get_db
from backend.app.database import Base
from backend.scripts.seed import seed_database


@pytest.fixture
def client():
    test_engine = create_engine(
        "sqlite://",
        connect_args={"check_same_thread": False},
        poolclass=StaticPool,
    )
    TestSession = sessionmaker(
        bind=test_engine,
        autoflush=False,
        autocommit=False,
    )
    Base.metadata.create_all(bind=test_engine)
    seed_database(
        reset=True,
        target_engine=test_engine,
        session_factory=TestSession,
        records_per_department=10,
    )

    def override_get_db():
        database = TestSession()
        try:
            yield database
        finally:
            database.close()

    app.dependency_overrides[get_db] = override_get_db
    with TestClient(app) as test_client:
        yield test_client
    app.dependency_overrides.clear()
    test_engine.dispose()


def test_health_and_trilingual_departments(client):
    assert client.get("/health").json()["status"] == "ok"
    departments = client.get("/departments?language=sd").json()
    assert len(departments) == 10
    assert departments[0]["name"] == "ٻارن جي ايمرجنسي"


def test_intake_starts_anonymous_journey_and_validates_age(client):
    response = client.post(
        "/intake",
        json={
            "patient_age": 7,
            "patient_role": "my_child",
            "complaint_text": "demo fever",
            "language_code": "ur",
        },
    )
    assert response.status_code == 201
    visit_id = response.json()["visit_id"]
    assert response.json()["next_step"] == "Ask a human at reception."
    assert client.get(f"/journey/{visit_id}").json()["stages"][0]["status"] == "current"
    assert client.post(
        "/intake",
        json={
            "patient_age": 121,
            "patient_role": "my_child",
            "complaint_text": "demo fever",
        },
    ).status_code == 422


def test_doctor_slots_are_labeled_as_demo_availability(client):
    doctors = client.get("/doctors?dept=paediatrics")
    assert doctors.status_code == 200
    ranked_doctors = doctors.json()["doctors"]
    assert len(ranked_doctors) == 3
    slots = client.get(f"/slots?doctor_id={ranked_doctors[0]['id']}").json()
    assert slots["schedule_notice"] == "Illustrative demo availability; not a live booking."
    assert len(slots["slots"]) <= 3
    assert slots["soonest_slot"] == (slots["slots"][0] if slots["slots"] else None)
    assert ranked_doctors[0]["soonest_slot"] == (
        ranked_doctors[0]["next_slots"][0]
        if ranked_doctors[0]["next_slots"]
        else None
    )


def test_doctor_ranking_explains_language_gender_and_availability(client):
    response = client.get("/doctors?dept=paediatrics&language=ur&gender=female")
    result = response.json()
    doctors = result["doctors"]
    assert len(doctors) == 3
    assert result["preferences"] == {"language": "ur", "gender": "female"}
    assert [doctor["fit_score"] for doctor in doctors] == sorted(
        (doctor["fit_score"] for doctor in doctors),
        reverse=True,
    )
    for doctor in doctors:
        language_match = "Urdu" in doctor["languages"]
        gender_match = doctor["gender"] == "female"
        assert doctor["fit_score"] == (
            50
            + (25 if language_match else 0)
            + (15 if gender_match else 0)
            + (10 if doctor["next_slots"] else 0)
        )
        assert doctor["fit_reasons"]["language"] == (
            "matches_preference" if language_match else "no_preference_match"
        )
        assert len(doctor["next_slots"]) <= 3
        assert doctor["soonest_slot"] == (
            doctor["next_slots"][0] if doctor["next_slots"] else None
        )
    if any("Urdu" in doctor["languages"] and doctor["gender"] == "female" for doctor in doctors):
        assert "Urdu" in doctors[0]["languages"]
        assert doctors[0]["gender"] == "female"


@pytest.mark.parametrize(
    ("complaint", "expected_flag"),
    [
        ("I have chest pain", "chest_pain"),
        ("trouble breathing", "breathing_trouble"),
        ("heavy bleeding", "heavy_bleeding"),
        ("stroke signs", "stroke_signs"),
        ("unconscious", "unconsciousness"),
        ("severe injury", "severe_injury"),
        ("سینے میں درد", "chest_pain"),
        ("ساهه کڻڻ ۾ تڪليف", "breathing_trouble"),
        ("گهڻو رت وهي", "heavy_bleeding"),
        ("فالج", "stroke_signs"),
        ("بيهوش", "unconsciousness"),
        ("سخت چوٽ", "severe_injury"),
    ],
)
def test_red_flags_always_route_to_emergency_before_model(
    client,
    complaint,
    expected_flag,
):
    response = client.post(
        "/recommend",
        json={
            "patient_age": 7,
            "patient_role": "my_child",
            "complaint_text": complaint,
        },
    )
    result = response.json()
    assert response.status_code == 200
    assert result["emergency"] is True
    assert expected_flag in result["red_flags"]
    assert result["recommendations"][0]["department_code"] == "child_emergency"
    assert result["route"]["locations"][-1]["code"] == "child_emergency"
    assert "not a medical assessment" in result["confidence_notice"]


def test_reported_red_flag_routes_adult_to_accessible_emergency(client):
    response = client.post(
        "/recommend",
        json={
            "patient_age": 70,
            "patient_role": "my_relative",
            "complaint_text": "needs help",
            "red_flags": ["chest_pain"],
        },
    )
    result = response.json()
    assert result["recommendations"][0]["department_code"] == "adult_emergency"
    assert result["route"]["accessible"] is True
    assert result["accessible_route_suggested"] is True


def test_keyword_rules_explain_trilingual_suggestions(client):
    english = client.post(
        "/recommend",
        json={
            "patient_age": 7,
            "patient_role": "my_child",
            "complaint_text": "my child has a fever",
        },
    ).json()
    sindhi = client.post(
        "/recommend",
        json={
            "patient_age": 32,
            "patient_role": "myself",
            "complaint_text": "چمڙي تي خارش",
            "language_code": "sd",
        },
    ).json()
    assert english["recommendations"][0]["department_code"] == "paediatrics"
    assert english["recommendations"][0]["confidence_source"] == "explainable_keyword_rule"
    assert "my child" in english["recommendations"][0]["reason"]
    assert sindhi["recommendations"][0]["department_code"] == "skin"
    assert sindhi["recommendations"][0]["department"] == "چمڙي جو شعبو"
    assert sindhi["recommendations"][0]["confidence_source"] == "explainable_keyword_rule"
    assert "اسڪور" in sindhi["confidence_notice"]


def test_unknown_complaint_offers_human_and_synthetic_model_notice(client):
    result = client.post(
        "/recommend",
        json={
            "patient_age": 32,
            "patient_role": "myself",
            "complaint_text": "zxqv plmokn random words",
        },
    ).json()
    assert len(result["recommendations"]) == 3
    assert result["ask_human"] is True
    assert result["model_notice"].startswith("Machine-learning suggestions use synthetic")


def test_fictional_map_routes_accessibility_and_waiting_areas(client):
    locations = client.get("/locations?language=ur").json()
    assert locations["fictional_demo_map"] is True
    route = client.get("/route?from=entrance&to=child_emergency&language=sd").json()
    assert route["fictional_demo_map"] is True
    assert route["locations"][-1]["code"] == "child_emergency"
    assert route["steps"][0]["landmark"] == "داخلا جي نشانين ڏانهن وڃو"
    accessible = client.get("/route?from=entrance&to=surgery&accessible=true").json()
    assert accessible["accessible"] is True
    assert not {
        "stairs_gf",
        "stairs_1",
        "stairs_2",
    }.intersection(item["code"] for item in accessible["locations"])
    age_suggested = client.get(
        "/route?from=entrance&to=surgery&patient_age=65"
    ).json()
    assert age_suggested["accessible_route_suggested"] is True
    assert age_suggested["accessible"] is True
    mobility_suggested = client.get(
        "/route?from=entrance&to=surgery&mobility_support=true"
    ).json()
    assert mobility_suggested["accessible_route_suggested"] is True
    assert mobility_suggested["accessible"] is True
    ramp_route = client.get(
        "/route?from=ramp_gf&to=ramp_2&accessible=true"
    ).json()
    assert [item["code"] for item in ramp_route["locations"]] == [
        "ramp_gf",
        "ramp_1",
        "ramp_2",
    ]
    assert client.get(
        "/route?from=stairs_gf&to=surgery&accessible=true"
    ).status_code == 404
    waiting = client.get("/waiting-areas?from=entrance").json()
    assert waiting["waiting_areas"][0]["locations"][-1]["type"] == "waiting"
    accessible_waiting = client.get(
        "/waiting-areas?from=entrance&mobility_support=true"
    ).json()
    assert accessible_waiting["accessible_route_suggested"] is True
    assert accessible_waiting["nearest_waiting_area"] == accessible_waiting["waiting_areas"][0]
    assert accessible_waiting["nearest_waiting_area"]["accessible"] is True
    assert client.get("/route?from=missing&to=pharmacy").status_code == 404
    rerouted = client.post(
        "/route/recalculate",
        json={
            "nearest_landmark": "pharmacy",
            "destination": "child_emergency",
            "language": "ur",
        },
    )
    assert rerouted.status_code == 200
    assert rerouted.json()["rerouted"] is True
    assert rerouted.json()["locations"][0]["code"] == "pharmacy"
    assert rerouted.json()["locations"][-1]["code"] == "child_emergency"
    assert client.post(
        "/route/recalculate",
        json={"nearest_landmark": "unknown", "destination": "pharmacy"},
    ).status_code == 404


def test_journey_feedback_and_story_endpoints(client):
    visit_id = client.post(
        "/intake",
        json={
            "patient_age": 30,
            "patient_role": "myself",
            "complaint_text": "demo complaint",
        },
    ).json()["visit_id"]
    event = client.post(
        f"/journey/events?visit_id={visit_id}",
        json={
            "stage": "registration",
            "status": "current",
            "time_spent_seconds": 60,
        },
    )
    assert event.status_code == 201
    assert client.get(f"/journey/{visit_id}").json()["stages"][1]["status"] == "current"
    assert client.post(
        "/feedback",
        json={
            "visit_id": visit_id,
            "task_completed": True,
            "time_taken_seconds": 120,
            "confusion_text": "demo feedback",
            "rating": 4,
        },
    ).status_code == 201
    summary = client.get("/feedback/summary").json()
    assert summary["response_count"] == 1
    assert summary["average_rating"] == 4
    assert len(client.get("/story").json()["stickies"]) == 34
