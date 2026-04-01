from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from database import get_db
from models import ZoneModel
from auth import get_current_user

router = APIRouter()


@router.get("/zones")
def get_zones(db: Session = Depends(get_db)):
    return db.query(ZoneModel).all()


@router.get("/zones/{stream_id}")
def get_zones_by_stream(stream_id: int, db: Session = Depends(get_db)):
    return db.query(ZoneModel).filter(ZoneModel.stream_id == stream_id).all()


@router.post("/zones")
def create_zone(stream_id: int, name: str, zone_type: str, polygon: str, db: Session = Depends(get_db), user=Depends(get_current_user)):
    zone = ZoneModel(stream_id=stream_id, name=name, zone_type=zone_type, polygon=polygon)
    db.add(zone)
    db.commit()
    return zone


@router.delete("/zones/{stream_id}")
def delete_zones(stream_id: int, db: Session = Depends(get_db), user=Depends(get_current_user)):
    db.query(ZoneModel).filter(ZoneModel.stream_id == stream_id).delete()
    db.commit()
    return {"message": "Zones deleted"}
