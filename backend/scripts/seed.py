"""Create and populate the local demo database with reproducible fictional data."""

import argparse
import json
import random
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))

from app.database import Base, DATABASE_PATH, SessionLocal, engine
from app.models import Department, Doctor, DoctorSchedule, Location, RouteEdge, SyntheticSymptom
from app.synthetic_data import DEPARTMENTS, build_synthetic_records


DEMO_DOCTORS = [
    ("child_emergency", 3),
    ("paediatrics", 3),
    ("adult_emergency", 3),
    ("general_medicine", 3),
    ("surgery", 2),
    ("gynaecology", 2),
    ("orthopaedics", 2),
    ("ent_eye", 2),
    ("cardiology", 2),
    ("skin", 3),
]

LOCATIONS = [
    ("entrance", "Entrance", "داخلہ", "داخلا", 0, "entrance"),
    ("reception", "Reception", "استقبالیہ", "استقباليه", 0, "reception"),
    ("adult_emergency", "Emergency (adult)", "بالغوں کی ایمرجنسی", "وڏن جي ايمرجنسي", 0, "department"),
    ("child_emergency", "Child Emergency", "بچوں کی ایمرجنسی", "ٻارن جي ايمرجنسي", 0, "department"),
    ("pharmacy", "Pharmacy", "فارمیسی", "فارميسي", 0, "pharmacy"),
    ("family_waiting", "Family waiting area", "خاندان کا انتظار گاہ", "خاندان جي انتظارگاهه", 0, "waiting"),
    ("washroom_gf", "Washroom", "بیت الخلا", "باٿ روم", 0, "washroom"),
    ("elevator_gf", "Elevator", "لفٹ", "لفٽ", 0, "elevator"),
    ("stairs_gf", "Stairs", "سیڑھیاں", "ڏاڪڻ", 0, "stairs"),
    ("general_medicine", "General Medicine", "جنرل میڈیسن", "جنرل ميڊيسن", 1, "department"),
    ("paediatrics", "Paediatrics", "بچوں کا شعبہ", "ٻارن جو شعبو", 1, "department"),
    ("gynaecology", "Gynaecology", "امراضِ نسواں", "عورتن جو شعبو", 1, "department"),
    ("lab", "Laboratory", "لیبارٹری", "ليبارٽري", 1, "lab"),
    ("family_waiting_1", "Family waiting area", "خاندان کا انتظار گاہ", "خاندان جي انتظارگاهه", 1, "waiting"),
    ("prayer_area", "Prayer area", "نماز کی جگہ", "نماز جي جاءِ", 1, "prayer"),
    ("elevator_1", "Elevator", "لفٹ", "لفٽ", 1, "elevator"),
    ("stairs_1", "Stairs", "سیڑھیاں", "ڏاڪڻ", 1, "stairs"),
    ("surgery", "Surgery", "سرجری", "سرجري", 2, "department"),
    ("orthopaedics", "Orthopaedics", "ہڈیوں کا شعبہ", "هڏن جو شعبو", 2, "department"),
    ("ent_eye", "ENT/Eye", "ناک، کان، گلا اور آنکھ", "نڪ، ڪن، ڳلي ۽ اک", 2, "department"),
    ("cardiology", "Cardiology", "امراضِ قلب", "دل جو شعبہ", 2, "department"),
    ("skin", "Skin", "جلد کا شعبہ", "چمڙي جو شعبو", 2, "department"),
    ("radiology", "Radiology", "ریڈیولوجی", "ريڊيولاجي", 2, "radiology"),
    ("family_waiting_2", "Family waiting area", "خاندان کا انتظار گاہ", "خاندان جي انتظارگاهه", 2, "waiting"),
    ("washroom_2", "Washroom", "بیت الخلا", "باٿ روم", 2, "washroom"),
    ("elevator_2", "Elevator", "لفٹ", "لفٽ", 2, "elevator"),
    ("stairs_2", "Stairs", "سیڑھیاں", "ڏاڪڻ", 2, "stairs"),
    ("ramp_gf", "Ramp", "ریمپ", "ريمپ", 0, "ramp"),
    ("ramp_1", "Ramp", "ریمپ", "ريمپ", 1, "ramp"),
    ("ramp_2", "Ramp", "ریمپ", "ريمپ", 2, "ramp"),
]

# The graph is explicitly fictional and exists only for the prototype.
ROUTE_PAIRS = [
    ("entrance", "reception", 12, True, "Follow the entrance signs", "داخلے کے نشانات کی طرف جائیں", "داخلا جي نشانين ڏانهن وڃو"),
    ("reception", "adult_emergency", 24, True, "Pass the reception desk", "استقبالیہ کے سامنے سے گزریں", "استقباليه جي سامهون کان گذرو"),
    ("reception", "child_emergency", 30, True, "Follow the blue corridor", "نیلے راستے پر چلیں", "نيري رستي تي هلو"),
    ("reception", "pharmacy", 18, True, "Pharmacy is beside reception", "فارمیسی استقبالیہ کے پاس ہے", "فارميسي استقباليه جي ڀرسان آهي"),
    ("reception", "family_waiting", 16, True, "Waiting area is beside reception", "انتظار گاہ استقبالیہ کے پاس ہے", "انتظارگاهه استقباليه جي ڀرسان آهي"),
    ("reception", "washroom_gf", 20, True, "Follow the washroom sign", "بیت الخلا کے نشان کی طرف جائیں", "باٿ روم جي نشاني ڏانهن وڃو"),
    ("reception", "elevator_gf", 22, True, "Elevator is at the corridor end", "لفٹ راہداری کے آخر میں ہے", "لفٽ رستي جي آخر ۾ آهي"),
    ("reception", "stairs_gf", 20, False, "Stairs are at the corridor end", "سیڑھیاں راہداری کے آخر میں ہیں", "ڏاڪڻ رستي جي آخر ۾ آهي"),
    ("elevator_gf", "elevator_1", 12, True, "Take the elevator to floor 1", "لفٹ سے پہلی منزل پر جائیں", "لفٽ سان پهرين ماڙ تي وڃو"),
    ("stairs_gf", "stairs_1", 12, False, "Use the stairs to floor 1", "سیڑھیوں سے پہلی منزل پر جائیں", "ڏاڪڻ سان پهرين ماڙ تي وڃو"),
    ("elevator_1", "elevator_2", 14, True, "Take the elevator to floor 2", "لفٹ سے دوسری منزل پر جائیں", "لفٽ سان ٻي ماڙ تي وڃو"),
    ("stairs_1", "stairs_2", 14, False, "Use the stairs to floor 2", "سیڑھیوں سے دوسری منزل پر جائیں", "ڏاڪڻ سان ٻي ماڙ تي وڃو"),
    ("elevator_1", "general_medicine", 18, True, "Turn left after the elevator", "لفٹ کے بعد بائیں مڑیں", "لفٽ کان پوءِ کاٻي پاسي مڙو"),
    ("elevator_1", "paediatrics", 22, True, "Paediatrics is beside the elevator", "بچوں کا شعبہ لفٹ کے پاس ہے", "ٻارن جو شعبو لفٽ جي ڀرسان آهي"),
    ("elevator_1", "gynaecology", 28, True, "Continue down the corridor", "راہداری میں آگے بڑھیں", "رستي ۾ اڳتي وڌو"),
    ("elevator_1", "lab", 20, True, "Laboratory is past the waiting area", "لیبارٹری انتظار گاہ کے آگے ہے", "ليبارٽري انتظارگاهه کان اڳتي آهي"),
    ("elevator_1", "family_waiting_1", 10, True, "Waiting area is beside the elevator", "انتظار گاہ لفٹ کے پاس ہے", "انتظارگاهه لفٽ جي ڀرسان آهي"),
    ("elevator_1", "prayer_area", 24, True, "Follow the prayer area sign", "نماز کی جگہ کے نشان کی طرف جائیں", "نماز جي جاءِ جي نشاني ڏانهن وڃو"),
    ("stairs_1", "general_medicine", 18, False, "Turn left after the stairs", "سیڑھیوں کے بعد بائیں مڑیں", "ڏاڪڻ کان پوءِ کاٻي پاسي مڙو"),
    ("stairs_1", "paediatrics", 22, False, "Paediatrics is beside the stairs", "بچوں کا شعبہ سیڑھیوں کے پاس ہے", "ٻارن جو شعبو ڏاڪڻ جي ڀرسان آهي"),
    ("stairs_1", "gynaecology", 28, False, "Continue down the corridor", "راہداری میں آگے بڑھیں", "رستي ۾ اڳتي وڌو"),
    ("stairs_1", "lab", 20, False, "Laboratory is past the waiting area", "لیبارٹری انتظار گاہ کے آگے ہے", "ليبارٽري انتظارگاهه کان اڳتي آهي"),
    ("stairs_1", "family_waiting_1", 10, False, "Waiting area is beside the stairs", "انتظار گاہ سیڑھیوں کے پاس ہے", "انتظارگاهه ڏاڪڻ جي ڀرسان آهي"),
    ("elevator_2", "surgery", 18, True, "Turn right after the elevator", "لفٹ کے بعد دائیں مڑیں", "لفٽ کان پوءِ ساڄي پاسي مڙو"),
    ("elevator_2", "orthopaedics", 22, True, "Follow the orthopaedics sign", "ہڈیوں کے شعبے کے نشان کی طرف جائیں", "هڏن جي شعبي جي نشاني ڏانهن وڃو"),
    ("elevator_2", "ent_eye", 16, True, "ENT/Eye is beside the elevator", "ناک، کان، گلا اور آنکھ کا شعبہ لفٹ کے پاس ہے", "نڪ، ڪن، ڳلي ۽ اک جو شعبو لفٽ جي ڀرسان آهي"),
    ("elevator_2", "cardiology", 28, True, "Continue along the main corridor", "مرکزی راہداری میں آگے بڑھیں", "مکيه رستي ۾ اڳتي وڌو"),
    ("elevator_2", "skin", 32, True, "Follow the skin department sign", "جلد کے شعبے کے نشان کی طرف جائیں", "چمڙي جي شعبي جي نشاني ڏانهن وڃو"),
    ("elevator_2", "radiology", 24, True, "Radiology is past the waiting area", "ریڈیولوجی انتظار گاہ کے آگے ہے", "ريڊيولاجي انتظارگاهه کان اڳتي آهي"),
    ("elevator_2", "family_waiting_2", 12, True, "Waiting area is beside the elevator", "انتظار گاہ لفٹ کے پاس ہے", "انتظارگاهه لفٽ جي ڀرسان آهي"),
    ("elevator_2", "washroom_2", 20, True, "Follow the washroom sign", "بیت الخلا کے نشان کی طرف جائیں", "باٿ روم جي نشاني ڏانهن وڃو"),
    ("stairs_2", "surgery", 18, False, "Turn right after the stairs", "سیڑھیوں کے بعد دائیں مڑیں", "ڏاڪڻ کان پوءِ ساڄي پاسي مڙو"),
    ("stairs_2", "orthopaedics", 22, False, "Follow the orthopaedics sign", "ہڈیوں کے شعبے کے نشان کی طرف جائیں", "هڏن جي شعبي جي نشاني ڏانهن وڃو"),
    ("stairs_2", "ent_eye", 16, False, "ENT/Eye is beside the stairs", "ناک، کان، گلا اور آنکھ کا شعبہ سیڑھیوں کے پاس ہے", "نڪ، ڪن، ڳلي ۽ اک جو شعبو ڏاڪڻ جي ڀرسان آهي"),
    ("stairs_2", "cardiology", 28, False, "Continue along the main corridor", "مرکزی راہداری میں آگے بڑھیں", "مکيه رستي ۾ اڳتي وڌو"),
    ("stairs_2", "skin", 32, False, "Follow the skin department sign", "جلد کے شعبے کے نشان کی طرف جائیں", "چمڙي جي شعبي جي نشاني ڏانهن وڃو"),
    ("stairs_2", "radiology", 24, False, "Radiology is past the waiting area", "ریڈیولوجی انتظار گاہ کے آگے ہے", "ريڊيولاجي انتظارگاهه کان اڳتي آهي"),
    ("stairs_2", "family_waiting_2", 12, False, "Waiting area is beside the stairs", "انتظار گاہ سیڑھیوں کے پاس ہے", "انتظارگاهه ڏاڪڻ جي ڀرسان آهي"),
    ("stairs_2", "washroom_2", 20, False, "Follow the washroom sign", "بیت الخلا کے نشان کی طرف جائیں", "باٿ روم جي نشاني ڏانهن وڃو"),
]

RAMP_CONNECTIONS = [
    ("reception", "ramp_gf", 16, "Follow the ramp sign", "ریمپ کے نشان کی طرف جائیں", "ريمپ جي نشاني ڏانهن وڃو"),
    ("ramp_gf", "ramp_1", 40, "Follow the ramp to floor 1", "ریمپ سے پہلی منزل پر جائیں", "ريمپ سان پهرين ماڙ تي وڃو"),
    ("ramp_1", "ramp_2", 44, "Follow the ramp to floor 2", "ریمپ سے دوسری منزل پر جائیں", "ريمپ سان ٻي ماڙ تي وڃو"),
]
RAMP_DESTINATIONS = {
    "ramp_1": [
        ("general_medicine", 24, "Continue along the ramp corridor", "ریمپ کی راہداری میں آگے بڑھیں", "ريمپ واري رستي ۾ اڳتي وڌو"),
        ("paediatrics", 26, "Paediatrics is beside the ramp corridor", "بچوں کا شعبہ ریمپ کی راہداری کے پاس ہے", "ٻارن جو شعبو ريمپ واري رستي جي ڀرسان آهي"),
        ("gynaecology", 32, "Continue down the ramp corridor", "ریمپ کی راہداری میں آگے بڑھیں", "ريمپ واري رستي ۾ اڳتي وڌو"),
        ("lab", 24, "Laboratory is beyond the waiting area", "لیبارٹری انتظار گاہ کے آگے ہے", "ليبارٽري انتظارگاهه کان اڳتي آهي"),
        ("family_waiting_1", 14, "Waiting area is beside the ramp corridor", "انتظار گاہ ریمپ کی راہداری کے پاس ہے", "انتظارگاهه ريمپ واري رستي جي ڀرسان آهي"),
        ("prayer_area", 28, "Follow the prayer area sign", "نماز کی جگہ کے نشان کی طرف جائیں", "نماز جي جاءِ جي نشاني ڏانهن وڃو"),
    ],
    "ramp_2": [
        ("surgery", 24, "Continue along the ramp corridor", "ریمپ کی راہداری میں آگے بڑھیں", "ريمپ واري رستي ۾ اڳتي وڌو"),
        ("orthopaedics", 28, "Follow the orthopaedics sign", "ہڈیوں کے شعبے کے نشان کی طرف جائیں", "هڏن جي شعبي جي نشاني ڏانهن وڃو"),
        ("ent_eye", 22, "ENT/Eye is beside the ramp corridor", "ناک، کان، گلا اور آنکھ کا شعبہ ریمپ کی راہداری کے پاس ہے", "نڪ، ڪن، ڳلي ۽ اک جو شعبو ريمپ واري رستي جي ڀرسان آهي"),
        ("cardiology", 34, "Continue along the ramp corridor", "ریمپ کی راہداری میں آگے بڑھیں", "ريمپ واري رستي ۾ اڳتي وڌو"),
        ("skin", 38, "Follow the skin department sign", "جلد کے شعبے کے نشان کی طرف جائیں", "چمڙي جي شعبي جي نشاني ڏانهن وڃو"),
        ("radiology", 30, "Radiology is beyond the waiting area", "ریڈیولوجی انتظار گاہ کے آگے ہے", "ريڊيولاجي انتظارگاهه کان اڳتي آهي"),
        ("family_waiting_2", 18, "Waiting area is beside the ramp corridor", "انتظار گاہ ریمپ کی راہداری کے پاس ہے", "انتظارگاهه ريمپ واري رستي جي ڀرسان آهي"),
        ("washroom_2", 26, "Follow the washroom sign", "بیت الخلا کے نشان کی طرف جائیں", "باٿ روم جي نشاني ڏانهن وڃو"),
    ],
}

for start, end, distance, landmark_en, landmark_ur, landmark_sd in RAMP_CONNECTIONS:
    ROUTE_PAIRS.append(
        (start, end, distance, True, landmark_en, landmark_ur, landmark_sd)
    )
for ramp_code, destinations in RAMP_DESTINATIONS.items():
    for destination, distance, landmark_en, landmark_ur, landmark_sd in destinations:
        ROUTE_PAIRS.append(
            (
                ramp_code,
                destination,
                distance,
                True,
                landmark_en,
                landmark_ur,
                landmark_sd,
            )
        )


def seed_database(
    reset: bool = False,
    target_engine=engine,
    session_factory=SessionLocal,
    records_per_department: int = 500,
) -> None:
    if reset:
        Base.metadata.drop_all(bind=target_engine)
    Base.metadata.create_all(bind=target_engine)

    with session_factory() as session:
        if not reset and session.query(Department).first():
            print(f"Database already contains seed data: {target_engine.url}")
            print("Use --reset to rebuild the local demo database.")
            return

        departments = [
            Department(code=code, name_en=en, name_ur=ur, name_sd=sd)
            for code, en, ur, sd in DEPARTMENTS
        ]
        session.add_all(departments)
        session.flush()

        locations = {
            code: Location(
                code=code,
                name_en=en,
                name_ur=ur,
                name_sd=sd,
                floor=floor,
                location_type=location_type,
            )
            for code, en, ur, sd, floor, location_type in LOCATIONS
        }
        session.add_all(locations.values())
        session.flush()

        for from_code, to_code, distance, accessible, en, ur, sd in ROUTE_PAIRS:
            for start, end in ((from_code, to_code), (to_code, from_code)):
                session.add(
                    RouteEdge(
                        from_location_id=locations[start].id,
                        to_location_id=locations[end].id,
                        distance_m=distance,
                        accessible=accessible,
                        landmark_en=en,
                        landmark_ur=ur,
                        landmark_sd=sd,
                    )
                )

        languages = ["English", "Urdu", "Sindhi"]
        gender_options = ["female", "male"]
        randomizer = random.Random(2601)
        doctor_number = 0
        for department_code, count in DEMO_DOCTORS:
            department = next(item for item in departments if item.code == department_code)
            for _ in range(count):
                doctor_number += 1
                doctor = Doctor(
                    demo_code=f"DEMO-{doctor_number:02}",
                    name=f"Demo Doctor {doctor_number:02}",
                    specialty_code=department.code,
                    specialty_en=department.name_en,
                    specialty_ur=department.name_ur,
                    specialty_sd=department.name_sd,
                    languages=json.dumps(
                        randomizer.sample(languages, k=2),
                        ensure_ascii=False,
                    ),
                    gender=gender_options[(doctor_number - 1) % len(gender_options)],
                )
                session.add(doctor)
                session.flush()
                start_hour = 8 + (doctor_number % 5)
                session.add(
                    DoctorSchedule(
                        doctor_id=doctor.id,
                        weekday=(doctor_number - 1) % 7,
                        start_time=f"{start_hour:02}:00",
                        end_time=f"{start_hour + 4:02}:00",
                        slot_minutes=20,
                        available=True,
                    )
                )

        synthetic_records = build_synthetic_records(records_per_department)
        session.add_all(SyntheticSymptom(**record) for record in synthetic_records)
        session.commit()

    print(f"Seeded demo database: {target_engine.url}")
    print(f"Departments: {len(DEPARTMENTS)}")
    print(f"Doctors: {doctor_number}")
    print(f"Locations: {len(LOCATIONS)} across 3 fictional floors")
    print(f"Synthetic symptom examples: {len(synthetic_records)}")


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument(
        "--reset",
        action="store_true",
        help="rebuild the local demo database from the reproducible seed",
    )
    seed_database(reset=parser.parse_args().reset)
