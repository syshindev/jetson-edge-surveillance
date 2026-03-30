from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from database import get_db
from models import Event

router = APIRouter()


@router.get("/events")
def get_events(db: Session = Depends(get_db)):
    return db.query(Event).order_by(Event.timestamp.desc()).all()


@router.post("/events")
def create_event(event_type: str, track_id: int, zone_name: str, center_x: int, center_y: int, db: Session = Depends(get_db)):
    event = Event(event_type=event_type, track_id=track_id, zone_name=zone_name, center_x=center_x, center_y=center_y)
    db.add(event)
    db.commit()
    return event


@router.delete("/events")
def delete_events(db: Session = Depends(get_db)):
    db.query(Event).delete()
    db.commit()
    return {"message": "All events deleted"}
