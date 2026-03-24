from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from database import SessionLocal
from models import ZoneModel

router = APIRouter()

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

# Get all zones
@router.get("/zones")
def get_zones(db: Session = Depends(get_db)):
    return db.query(ZoneModel).all()

# Get zones by stream ID
@router.get("/zones/{stream_id}")
def get_zones_by_stream(stream_id: int, db: Session = Depends(get_db)):
    return db.query(ZoneModel).filter(ZoneModel.stream_id == stream_id).all()

# Save a zone
@router.post("/zones")
def create_zone(stream_id: int, name: str, zone_type: str, polygon: str, db: Session = Depends(get_db)):
    zone = ZoneModel(stream_id=stream_id, name=name, zone_type=zone_type, polygon=polygon)
    db.add(zone)
    db.commit()
    return zone

# Delete zones by stream ID
@router.delete("/zones/{stream_id}")
def delete_zones(stream_id: int, db: Session = Depends(get_db)):
    db.query(ZoneModel).filter(ZoneModel.stream_id == stream_id).delete()
    db.commit()
    return {"message": "Zones deleted"}
