"""HTTP API for the general-purpose WayMed prototype."""

import json
import math
import heapq
import os
import uuid
from datetime import datetime, time, timedelta
from pathlib import Path
from typing import Literal

from fastapi import Depends, FastAPI, HTTPException, Query
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, ConfigDict, Field
from sqlalchemy.orm import Session, joinedload

from .database import Base, SessionLocal, engine
from .models import (
    Department,
    Doctor,
    Feedback,
    IntakeRecord,
    JourneyEvent,
    Location,
    RouteEdge,
    Visit,
)
from .recommender import recommend_department

STORY_PATH = Path(__file__).resolve().parents[1] / "data" / "story.json"
JOURNEY_STAGES = (
    "arrival",
    "registration",
    "consultation",
    "lab_radiology",
    "pharmacy",
    "exit",
)
STAGE_LABELS = {
    "arrival": "Arrival",
    "registration": "Registration",
    "consultation": "Consultation",
    "lab_radiology": "Lab/Radiology",
    "pharmacy": "Pharmacy",
    "exit": "Exit",
}

Base.metadata.create_all(bind=engine)
app = FastAPI(
    title="WayMed API",
    description=(
        "A general-purpose, fictional healthcare-navigation prototype. "
        "Demo locations and sample records are not tied to a real facility."
    ),
    version="0.1.0",
)
configured_origins = os.environ.get("WAYMED_CORS_ORIGINS")
allowed_origins = (
    [origin.strip() for origin in configured_origins.split(",") if origin.strip()]
    if configured_origins
    else [
        "http://localhost:5173",
        "http://127.0.0.1:5173",
        "http://localhost:4173",
        "http://127.0.0.1:4173",
    ]
)
app.add_middleware(
    CORSMiddleware,
    allow_origins=allowed_origins,
    allow_credentials=False,
    allow_methods=["GET", "POST"],
    allow_headers=["Content-Type"],
)


def get_db():
    """Yield one database session per request."""
    database = SessionLocal()
    try:
        yield database
    finally:
        database.close()


class IntakeRequest(BaseModel):
    model_config = ConfigDict(str_strip_whitespace=True)

    patient_age: int = Field(ge=0, le=120)
    patient_sex: Literal["female", "male", "other", "prefer_not_to_say"] | None = None
    patient_role: Literal["myself", "my_child", "my_relative"]
    complaint_text: str = Field(min_length=1, max_length=1000)
    language_code: Literal["en", "ur", "sd"] = "en"
    duration: str | None = Field(default=None, max_length=80)
    severity: int | None = Field(default=None, ge=1, le=10)
    red_flags: list[
        Literal[
            "chest_pain",
            "breathing_trouble",
            "heavy_bleeding",
            "stroke_signs",
            "unconsciousness",
            "severe_injury",
        ]
    ] = Field(default_factory=list, max_length=12)
    mobility_support: bool = False


class RecommendRequest(BaseModel):
    model_config = ConfigDict(str_strip_whitespace=True)

    patient_age: int = Field(ge=0, le=120)
    patient_role: Literal["myself", "my_child", "my_relative"]
    complaint_text: str = Field(min_length=1, max_length=1000)
    language_code: Literal["en", "ur", "sd"] = "en"
    red_flags: list[
        Literal[
            "chest_pain",
            "breathing_trouble",
            "heavy_bleeding",
            "stroke_signs",
            "unconsciousness",
            "severe_injury",
        ]
    ] = Field(default_factory=list, max_length=12)
    starting_location: str = Field(default="entrance", min_length=1, max_length=48)
    mobility_support: bool = False


class LostRouteRequest(BaseModel):
    nearest_landmark: str = Field(min_length=1, max_length=48)
    destination: str = Field(min_length=1, max_length=48)
    language: Literal["en", "ur", "sd"] = "en"
    accessible: bool = False
    patient_age: int | None = Field(default=None, ge=0, le=120)
    mobility_support: bool = False


class JourneyEventRequest(BaseModel):
    stage: Literal[
        "arrival",
        "registration",
        "consultation",
        "lab_radiology",
        "pharmacy",
        "exit",
    ]
    status: Literal["done", "current", "upcoming"]
    time_spent_seconds: int | None = Field(default=None, ge=0, le=86400)


class FeedbackRequest(BaseModel):
    visit_id: str | None = Field(default=None, max_length=36)
    task_completed: bool
    time_taken_seconds: int | None = Field(default=None, ge=0, le=86400)
    confusion_text: str | None = Field(default=None, max_length=2000)
    rating: int = Field(ge=1, le=5)


def get_visit(db: Session, visit_code: str) -> Visit:
    visit = db.query(Visit).filter(Visit.visit_code == visit_code).first()
    if visit is None:
        raise HTTPException(status_code=404, detail="Visit not found.")
    return visit


def make_graph(
    db: Session,
    accessible_only: bool,
) -> tuple[dict[str, Location], dict[str, list[tuple[str, float, RouteEdge]]]]:
    locations = {location.code: location for location in db.query(Location).all()}
    graph: dict[str, list[tuple[str, float, RouteEdge]]] = {
        code: [] for code in locations
    }
    query = db.query(RouteEdge).options(
        joinedload(RouteEdge.from_location),
        joinedload(RouteEdge.to_location),
    )
    if accessible_only:
        query = query.filter(RouteEdge.accessible.is_(True))

    for edge in query.all():
        graph[edge.from_location.code].append(
            (edge.to_location.code, edge.distance_m, edge)
        )
    return locations, graph


def shortest_path(
    start: str,
    target: str,
    graph: dict[str, list[tuple[str, float, RouteEdge]]],
) -> tuple[list[str], list[RouteEdge], float]:
    distances = {start: 0.0}
    previous: dict[str, tuple[str, RouteEdge]] = {}
    queue = [(0.0, start)]

    while queue:
        distance, node = heapq.heappop(queue)
        if distance != distances.get(node):
            continue
        if node == target:
            break
        for neighbor, edge_distance, edge in graph[node]:
            candidate = distance + edge_distance
            if candidate < distances.get(neighbor, math.inf):
                distances[neighbor] = candidate
                previous[neighbor] = (node, edge)
                heapq.heappush(queue, (candidate, neighbor))

    if target not in distances:
        raise HTTPException(
            status_code=404,
            detail="No route is available between these demo locations.",
        )

    nodes = [target]
    edges: list[RouteEdge] = []
    cursor = target
    while cursor != start:
        parent, edge = previous[cursor]
        nodes.append(parent)
        edges.append(edge)
        cursor = parent
    nodes.reverse()
    edges.reverse()
    return nodes, edges, distances[target]


def localized_name(location: Location, language: str) -> str:
    return getattr(location, f"name_{language}")


def route_result(
    nodes: list[str],
    edges: list[RouteEdge],
    distance_m: float,
    locations: dict[str, Location],
    language: str,
    accessible: bool,
) -> dict:
    steps = []
    for index, edge in enumerate(edges):
        steps.append(
            {
                "from": localized_name(locations[nodes[index]], language),
                "to": localized_name(locations[nodes[index + 1]], language),
                "landmark": getattr(edge, f"landmark_{language}"),
                "floor": locations[nodes[index + 1]].floor,
            }
        )
    return {
        "locations": [
            {
                "code": code,
                "name": localized_name(locations[code], language),
                "floor": locations[code].floor,
                "type": locations[code].location_type,
            }
            for code in nodes
        ],
        "steps": steps,
        "distance_m": round(distance_m, 1),
        "estimated_walking_minutes": max(1, math.ceil(distance_m / 72)),
        "accessible": accessible,
        "fictional_demo_map": True,
    }


def available_slots(doctor: Doctor, now: datetime | None = None) -> list[dict]:
    """Return the next three illustrative slots from a doctor's demo schedule."""
    current_time = now or datetime.now().replace(second=0, microsecond=0)
    slots: list[dict] = []
    for offset in range(14):
        slot_date = (current_time + timedelta(days=offset)).date()
        for schedule in doctor.schedules:
            if schedule.weekday != slot_date.weekday() or not schedule.available:
                continue
            start = datetime.combine(slot_date, time.fromisoformat(schedule.start_time))
            end = datetime.combine(slot_date, time.fromisoformat(schedule.end_time))
            cursor = start
            while cursor + timedelta(minutes=schedule.slot_minutes) <= end:
                if cursor > current_time:
                    slots.append(
                        {
                            "starts_at": cursor.isoformat(timespec="minutes"),
                            "ends_at": (
                                cursor + timedelta(minutes=schedule.slot_minutes)
                            ).isoformat(timespec="minutes"),
                            "demo_schedule": True,
                        }
                    )
                cursor += timedelta(minutes=schedule.slot_minutes)
    slots.sort(key=lambda item: item["starts_at"])
    return slots[:3]


@app.get("/health")
def health_check():
    return {"status": "ok", "service": "WayMed API"}


@app.post("/intake", status_code=201)
def create_intake(payload: IntakeRequest, db: Session = Depends(get_db)):
    """Create an anonymous demo visit without collecting names or contact details."""
    visit = Visit(visit_code=str(uuid.uuid4()), language_code=payload.language_code)
    db.add(visit)
    db.flush()
    db.add(
        IntakeRecord(
            visit_id=visit.id,
            patient_age=payload.patient_age,
            patient_sex=payload.patient_sex,
            patient_role=payload.patient_role,
            complaint_text=payload.complaint_text,
            duration=payload.duration,
            severity=payload.severity,
            red_flags_json=json.dumps(payload.red_flags, ensure_ascii=False),
            mobility_support=payload.mobility_support,
        )
    )
    db.add(JourneyEvent(visit_id=visit.id, stage="arrival", status="current"))
    db.commit()
    return {
        "visit_id": visit.visit_code,
        "language_code": visit.language_code,
        "next_step": "Ask a human at reception.",
        "disclaimer": "This prototype does not diagnose or provide medical advice.",
    }


@app.post("/recommend")
def get_recommendation(
    payload: RecommendRequest,
    db: Session = Depends(get_db),
):
    """Return a non-diagnostic, explainable demo department suggestion."""
    result = recommend_department(
        db=db,
        complaint_text=payload.complaint_text,
        patient_age=payload.patient_age,
        patient_role=payload.patient_role,
        language=payload.language_code,
        reported_flags=payload.red_flags,
    )
    if result["emergency"]:
        emergency_code = result["recommendations"][0]["department_code"]
        locations, graph = make_graph(
            db,
            accessible_only=payload.patient_age >= 65 or payload.mobility_support,
        )
        if payload.starting_location not in locations:
            raise HTTPException(status_code=404, detail="Demo location not found.")
        if emergency_code not in locations:
            raise HTTPException(
                status_code=503,
                detail="Emergency directions are unavailable in the demo map.",
            )
        nodes, edges, distance = shortest_path(
            payload.starting_location,
            emergency_code,
            graph,
        )
        result["route"] = route_result(
            nodes,
            edges,
            distance,
            locations,
            payload.language_code,
            payload.patient_age >= 65 or payload.mobility_support,
        )
        result["accessible_route_suggested"] = (
            payload.patient_age >= 65 or payload.mobility_support
        )
    return result


@app.get("/departments")
def list_departments(language: Literal["en", "ur", "sd"] = "en", db: Session = Depends(get_db)):
    return [
        {"code": item.code, "name": getattr(item, f"name_{language}")}
        for item in db.query(Department).order_by(Department.id).all()
    ]


@app.get("/doctors")
def list_doctors(
    dept: str = Query(min_length=1, max_length=32),
    language: Literal["en", "ur", "sd"] | None = None,
    gender: Literal["female", "male"] | None = None,
    db: Session = Depends(get_db),
):
    doctors = (
        db.query(Doctor)
        .options(joinedload(Doctor.schedules))
        .filter(Doctor.specialty_code == dept)
        .order_by(Doctor.id)
        .all()
    )
    ranked = []
    for doctor in doctors:
        languages = json.loads(doctor.languages)
        slots = available_slots(doctor)
        language_match = language is None or {
            "en": "English",
            "ur": "Urdu",
            "sd": "Sindhi",
        }[language] in languages
        gender_match = gender is None or doctor.gender == gender
        availability_match = bool(slots)
        score = (
            50
            + (25 if language_match else 0)
            + (15 if gender_match else 0)
            + (10 if availability_match else 0)
        )
        ranked.append(
            {
                "id": doctor.id,
                "demo_code": doctor.demo_code,
                "name": doctor.name,
                "specialty_code": doctor.specialty_code,
                "specialty_en": doctor.specialty_en,
                "specialty_ur": doctor.specialty_ur,
                "specialty_sd": doctor.specialty_sd,
                "languages": languages,
                "gender": doctor.gender,
                "fit_score": score,
                "fit_reasons": {
                    "specialty": "matches_requested_department",
                    "language": "matches_preference" if language_match else "no_preference_match",
                    "gender": "matches_preference" if gender_match else "no_preference_match",
                    "availability": "slots_listed" if availability_match else "no_upcoming_demo_slots",
                },
                "next_slots": slots,
                "soonest_slot": slots[0] if slots else None,
                "demo_record": True,
            }
        )
    ranked.sort(
        key=lambda doctor: (
            -doctor["fit_score"],
            doctor["soonest_slot"]["starts_at"] if doctor["soonest_slot"] else "9999",
            doctor["id"],
        )
    )
    return {
        "department_code": dept,
        "preferences": {"language": language, "gender": gender},
        "ranking_notice": (
            "Illustrative matching based on language match, gender preference, and soonest availability; "
            "not live doctor availability or booking."
        ),
        "doctors": ranked,
    }


@app.get("/slots")
def list_slots(
    doctor_id: int = Query(gt=0),
    db: Session = Depends(get_db),
):
    doctor = (
        db.query(Doctor)
        .options(joinedload(Doctor.schedules))
        .filter(Doctor.id == doctor_id)
        .first()
    )
    if doctor is None:
        raise HTTPException(status_code=404, detail="Demo doctor not found.")

    slots = available_slots(doctor)
    return {
        "doctor_id": doctor.id,
        "slots": slots[:3],
        "soonest_slot": slots[0] if slots else None,
        "schedule_notice": "Illustrative demo availability; not a live booking.",
    }


@app.get("/locations")
def list_locations(
    language: Literal["en", "ur", "sd"] = "en",
    db: Session = Depends(get_db),
):
    return {
        "fictional_demo_map": True,
        "facility_notice": "Generic fictional demo layout; not a real facility map.",
        "locations": [
            {
                "code": location.code,
                "name": localized_name(location, language),
                "floor": location.floor,
                "type": location.location_type,
            }
            for location in db.query(Location).order_by(Location.floor, Location.id).all()
        ],
    }


@app.get("/route")
def get_route(
    from_: str = Query(alias="from", min_length=1, max_length=48),
    to: str = Query(min_length=1, max_length=48),
    accessible: bool = False,
    patient_age: int | None = Query(default=None, ge=0, le=120),
    mobility_support: bool = False,
    language: Literal["en", "ur", "sd"] = "en",
    db: Session = Depends(get_db),
):
    accessible_route = accessible or (patient_age is not None and patient_age >= 65) or mobility_support
    locations, graph = make_graph(db, accessible_only=accessible_route)
    if from_ not in locations or to not in locations:
        raise HTTPException(status_code=404, detail="Demo location not found.")
    nodes, edges, distance = shortest_path(from_, to, graph)
    result = route_result(
        nodes,
        edges,
        distance,
        locations,
        language,
        accessible_route,
    )
    result["accessible_route_suggested"] = (
        patient_age is not None and patient_age >= 65
    ) or mobility_support
    return result


@app.post("/route/recalculate")
def recalculate_lost_route(
    payload: LostRouteRequest,
    db: Session = Depends(get_db),
):
    """Re-route immediately from a user-selected landmark."""
    accessible_route = (
        payload.accessible
        or (payload.patient_age is not None and payload.patient_age >= 65)
        or payload.mobility_support
    )
    locations, graph = make_graph(db, accessible_only=accessible_route)
    if (
        payload.nearest_landmark not in locations
        or payload.destination not in locations
    ):
        raise HTTPException(status_code=404, detail="Demo location not found.")
    nodes, edges, distance = shortest_path(
        payload.nearest_landmark,
        payload.destination,
        graph,
    )
    result = route_result(
        nodes,
        edges,
        distance,
        locations,
        payload.language,
        accessible_route,
    )
    result["rerouted"] = True
    result["starting_landmark"] = payload.nearest_landmark
    result["accessible_route_suggested"] = (
        payload.patient_age is not None and payload.patient_age >= 65
    ) or payload.mobility_support
    return result


@app.get("/waiting-areas")
def get_waiting_areas(
    from_: str = Query(alias="from", min_length=1, max_length=48),
    accessible: bool = False,
    patient_age: int | None = Query(default=None, ge=0, le=120),
    mobility_support: bool = False,
    language: Literal["en", "ur", "sd"] = "en",
    db: Session = Depends(get_db),
):
    accessible_route = accessible or (patient_age is not None and patient_age >= 65) or mobility_support
    locations, graph = make_graph(db, accessible_only=accessible_route)
    if from_ not in locations:
        raise HTTPException(status_code=404, detail="Demo location not found.")
    candidates = sorted(
        location.code
        for location in locations.values()
        if location.location_type == "waiting"
    )
    options = []
    for target in candidates:
        nodes, edges, distance = shortest_path(from_, target, graph)
        options.append(
            route_result(
                nodes,
                edges,
                distance,
                locations,
                language,
                accessible=accessible_route,
            )
        )
    options.sort(key=lambda item: item["distance_m"])
    return {
        "waiting_areas": options,
        "nearest_waiting_area": options[0] if options else None,
        "accessible_route_suggested": (
            patient_age is not None and patient_age >= 65
        ) or mobility_support,
        "fictional_demo_map": True,
    }


@app.post("/journey/events", status_code=201)
def add_journey_event(
    visit_id: str,
    payload: JourneyEventRequest,
    db: Session = Depends(get_db),
):
    visit = get_visit(db, visit_id)
    event = JourneyEvent(
        visit_id=visit.id,
        stage=payload.stage,
        status=payload.status,
        time_spent_seconds=payload.time_spent_seconds,
    )
    db.add(event)
    db.commit()
    db.refresh(event)
    return {
        "event_id": event.id,
        "visit_id": visit.visit_code,
        "stage": event.stage,
        "status": event.status,
        "time_spent_seconds": event.time_spent_seconds,
    }


@app.get("/journey/{visit_id}")
def get_journey(visit_id: str, db: Session = Depends(get_db)):
    visit = get_visit(db, visit_id)
    events = (
        db.query(JourneyEvent)
        .filter(JourneyEvent.visit_id == visit.id)
        .order_by(JourneyEvent.created_at, JourneyEvent.id)
        .all()
    )
    latest_by_stage = {event.stage: event for event in events}
    stages = []
    for index, stage in enumerate(JOURNEY_STAGES):
        event = latest_by_stage.get(stage)
        stages.append(
            {
                "stage": stage,
                "label": STAGE_LABELS[stage],
                "status": event.status if event else "upcoming",
                "time_spent_seconds": event.time_spent_seconds if event else None,
            }
        )
    current = next((stage for stage in stages if stage["status"] == "current"), None)
    next_step = (
        f"Continue with {current['label']}."
        if current
        else "Ask a human at reception if you need help."
    )
    return {
        "visit_id": visit.visit_code,
        "stages": stages,
        "next_step": next_step,
        "disclaimer": "This tracker does not provide medical advice.",
    }


@app.post("/feedback", status_code=201)
def submit_feedback(payload: FeedbackRequest, db: Session = Depends(get_db)):
    visit = get_visit(db, payload.visit_id) if payload.visit_id else None
    feedback = Feedback(
        visit_id=visit.id if visit else None,
        task_completed=payload.task_completed,
        time_taken_seconds=payload.time_taken_seconds,
        confusion_text=payload.confusion_text,
        rating=payload.rating,
    )
    db.add(feedback)
    db.commit()
    return {"feedback_id": feedback.id, "saved": True}


@app.get("/feedback/summary")
def feedback_summary(db: Session = Depends(get_db)):
    feedback_items = db.query(Feedback).all()
    count = len(feedback_items)
    return {
        "response_count": count,
        "average_rating": (
            round(sum(item.rating for item in feedback_items) / count, 2)
            if count
            else None
        ),
        "task_completion_rate": (
            round(sum(item.task_completed for item in feedback_items) / count, 2)
            if count
            else None
        ),
        "results_notice": (
            "Prototype feedback only; not clinical outcomes."
            if count
            else "[PLACEHOLDER: no prototype feedback has been collected]"
        ),
    }


@app.get("/story")
def get_story():
    with STORY_PATH.open(encoding="utf-8") as story_file:
        return json.load(story_file)
