from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from sqlalchemy import func
from database import SessionLocal
from models import Event

router = APIRouter()

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

# Get event count per zone
@router.get("/analytics/zone-count")
def zone_count(db: Session = Depends(get_db)):
    results = db.query(Event.zone_name, func.count(Event.id)).group_by(Event.zone_name).all()
    return [{"zone": zone, "count": count} for zone, count in results]

# Get total event count
@router.get("/analytics/total")
def total_count(db: Session = Depends(get_db)):
    count = db.query(func.count(Event.id)).scalar()
    return {"total": count}