"""Database connection and session helpers for the WayMed prototype."""

import os
from pathlib import Path

from sqlalchemy import create_engine
from sqlalchemy.orm import declarative_base, sessionmaker

BACKEND_DIR = Path(__file__).resolve().parents[1]
DATABASE_PATH = BACKEND_DIR / "waymed.db"
DATABASE_URL = os.environ.get(
    "WAYMED_DATABASE_URL",
    f"sqlite:///{DATABASE_PATH.as_posix()}",
)

engine = create_engine(
    DATABASE_URL,
    connect_args={"check_same_thread": False},
)
SessionLocal = sessionmaker(bind=engine, autoflush=False, autocommit=False)
Base = declarative_base()
