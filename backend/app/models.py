"""SQLAlchemy tables used by WayMed's data and seed phases."""

from sqlalchemy import (
    Boolean,
    Column,
    DateTime,
    Float,
    ForeignKey,
    Integer,
    String,
    Text,
    UniqueConstraint,
    func,
)
from sqlalchemy.orm import relationship

from .database import Base


class Department(Base):
    __tablename__ = "departments"

    id = Column(Integer, primary_key=True)
    code = Column(String(32), unique=True, nullable=False)
    name_en = Column(String(120), nullable=False)
    name_ur = Column(String(120), nullable=False)
    name_sd = Column(String(120), nullable=False)


class Location(Base):
    __tablename__ = "locations"

    id = Column(Integer, primary_key=True)
    code = Column(String(48), unique=True, nullable=False)
    name_en = Column(String(120), nullable=False)
    name_ur = Column(String(120), nullable=False)
    name_sd = Column(String(120), nullable=False)
    floor = Column(Integer, nullable=False)
    location_type = Column(String(40), nullable=False)


class RouteEdge(Base):
    __tablename__ = "route_edges"
    __table_args__ = (UniqueConstraint("from_location_id", "to_location_id"),)

    id = Column(Integer, primary_key=True)
    from_location_id = Column(Integer, ForeignKey("locations.id"), nullable=False)
    to_location_id = Column(Integer, ForeignKey("locations.id"), nullable=False)
    distance_m = Column(Float, nullable=False)
    accessible = Column(Boolean, nullable=False, default=True)
    landmark_en = Column(String(160), nullable=False)
    landmark_ur = Column(String(160), nullable=False)
    landmark_sd = Column(String(160), nullable=False)

    from_location = relationship("Location", foreign_keys=[from_location_id])
    to_location = relationship("Location", foreign_keys=[to_location_id])


class Doctor(Base):
    __tablename__ = "doctors"

    id = Column(Integer, primary_key=True)
    demo_code = Column(String(24), unique=True, nullable=False)
    name = Column(String(100), nullable=False)
    specialty_code = Column(String(32), ForeignKey("departments.code"), nullable=False)
    specialty_en = Column(String(120), nullable=False)
    specialty_ur = Column(String(120), nullable=False)
    specialty_sd = Column(String(120), nullable=False)
    languages = Column(Text, nullable=False)
    gender = Column(String(16), nullable=False)
    department = relationship("Department")
    schedules = relationship("DoctorSchedule", back_populates="doctor")


class DoctorSchedule(Base):
    __tablename__ = "doctor_schedules"
    __table_args__ = (UniqueConstraint("doctor_id", "weekday", "start_time"),)

    id = Column(Integer, primary_key=True)
    doctor_id = Column(Integer, ForeignKey("doctors.id"), nullable=False)
    weekday = Column(Integer, nullable=False)
    start_time = Column(String(5), nullable=False)
    end_time = Column(String(5), nullable=False)
    slot_minutes = Column(Integer, nullable=False)
    available = Column(Boolean, nullable=False, default=True)
    doctor = relationship("Doctor", back_populates="schedules")


class SyntheticSymptom(Base):
    __tablename__ = "synthetic_symptoms"

    id = Column(Integer, primary_key=True)
    complaint_en = Column(Text, nullable=False)
    complaint_ur = Column(Text, nullable=False)
    complaint_sd = Column(Text, nullable=False)
    department_code = Column(String(32), ForeignKey("departments.code"), nullable=False)
    split = Column(String(12), nullable=False)
    is_synthetic = Column(Boolean, nullable=False, default=True)


class Visit(Base):
    __tablename__ = "visits"

    id = Column(Integer, primary_key=True)
    visit_code = Column(String(36), unique=True, nullable=False)
    language_code = Column(String(2), nullable=False)
    created_at = Column(DateTime, nullable=False, server_default=func.now())
    events = relationship("JourneyEvent", back_populates="visit")
    intake = relationship("IntakeRecord", back_populates="visit", uselist=False)


class IntakeRecord(Base):
    __tablename__ = "intake_records"

    id = Column(Integer, primary_key=True)
    visit_id = Column(Integer, ForeignKey("visits.id"), unique=True, nullable=False)
    patient_age = Column(Integer, nullable=False)
    patient_sex = Column(String(16), nullable=True)
    patient_role = Column(String(16), nullable=False)
    complaint_text = Column(Text, nullable=False)
    duration = Column(String(80), nullable=True)
    severity = Column(Integer, nullable=True)
    red_flags_json = Column(Text, nullable=False, default="[]")
    mobility_support = Column(Boolean, nullable=False, default=False)
    visit = relationship("Visit", back_populates="intake")


class JourneyEvent(Base):
    __tablename__ = "journey_events"

    id = Column(Integer, primary_key=True)
    visit_id = Column(Integer, ForeignKey("visits.id"), nullable=False)
    stage = Column(String(32), nullable=False)
    status = Column(String(16), nullable=False)
    time_spent_seconds = Column(Integer, nullable=True)
    created_at = Column(DateTime, nullable=False, server_default=func.now())
    visit = relationship("Visit", back_populates="events")


class Feedback(Base):
    __tablename__ = "feedback"

    id = Column(Integer, primary_key=True)
    visit_id = Column(Integer, ForeignKey("visits.id"), nullable=True)
    task_completed = Column(Boolean, nullable=False)
    time_taken_seconds = Column(Integer, nullable=True)
    confusion_text = Column(Text, nullable=True)
    rating = Column(Integer, nullable=False)
    created_at = Column(DateTime, nullable=False, server_default=func.now())
