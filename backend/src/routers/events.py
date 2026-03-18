from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from database import SessionLocal
from models import Event

router = APIRouter()

# Get DB session
def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

# Get all events
@router.get("/events")
def get_events(db: Session = Depends(get_db)):
    return db.query(Event).all()

# Create new event
@router.post("/events")
def create_event(track_id: int, zone_name: str, center_x: int, center_y: int, db: Session = Depends(get_db)):
    event = Event(track_id=track_id, zone_name=zone_name, center_x=center_x, center_y=center_y)
    db.add(event)
    db.commit()
    return event