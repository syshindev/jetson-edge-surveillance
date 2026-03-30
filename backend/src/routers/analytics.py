from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from sqlalchemy import func
from datetime import datetime, timedelta
from database import get_db
from models import Event

router = APIRouter()


@router.get("/analytics/zone-count")
def zone_count(db: Session = Depends(get_db)):
    results = db.query(Event.zone_name, func.count(Event.id)).group_by(Event.zone_name).all()
    return [{"zone": zone, "count": count} for zone, count in results]


@router.get("/analytics/total")
def total_count(db: Session = Depends(get_db)):
    count = db.query(func.count(Event.id)).scalar()
    return {"total": count}


@router.get("/analytics/type-count")
def type_count(db: Session = Depends(get_db)):
    results = db.query(Event.event_type, func.count(Event.id)).group_by(Event.event_type).all()
    return [{"type": t, "count": c} for t, c in results]


@router.get("/analytics/summary")
def summary(db: Session = Depends(get_db)):
    today_start = datetime.now().replace(hour=0, minute=0, second=0, microsecond=0)

    total = db.query(func.count(Event.id)).scalar()
    today = db.query(func.count(Event.id)).filter(Event.timestamp >= today_start).scalar()
    intrusions = db.query(func.count(Event.id)).filter(Event.event_type == "intrusion").scalar()
    loitering = db.query(func.count(Event.id)).filter(Event.event_type == "loitering").scalar()
    line_crossing = db.query(func.count(Event.id)).filter(Event.event_type == "line_crossing").scalar()
    active_tracks = db.query(func.count(func.distinct(Event.track_id))).scalar()

    return {
        "total_events": total,
        "today_events": today,
        "intrusions": intrusions,
        "loitering": loitering,
        "line_crossing": line_crossing,
        "active_tracks": active_tracks,
    }


@router.get("/analytics/hourly")
def hourly_count(db: Session = Depends(get_db)):
    today = datetime.now().replace(hour=0, minute=0, second=0, microsecond=0)
    hours = []
    for i in range(24):
        start = today + timedelta(hours=i)
        end = start + timedelta(hours=1)
        count = db.query(func.count(Event.id)).filter(
            Event.timestamp >= start, Event.timestamp < end
        ).scalar()
        hours.append({"hour": start.strftime("%H:%M"), "count": count})
    return hours


@router.get("/analytics/recent-alerts")
def recent_alerts(stream_id: int = None, db: Session = Depends(get_db)):
    query = db.query(Event).order_by(Event.timestamp.desc())
    if stream_id is not None:
        query = query.filter(Event.stream_id == stream_id)
    events = query.limit(10).all()
    return [
        {
            "id": e.id,
            "event_type": e.event_type,
            "zone_name": e.zone_name,
            "track_id": e.track_id,
            "timestamp": e.timestamp.isoformat() if e.timestamp else None,
        }
        for e in events
    ]

@router.get("/analytics/by-stream")
def by_stream(db: Session = Depends(get_db)):
    results = db.query(Event.stream_id, Event.event_type, func.count(Event.id)).group_by(Event.stream_id, Event.event_type).all()
    data = {}
    for stream_id, event_type, count in results:
        if stream_id not in data:
            data[stream_id] = {"stream_id": stream_id, "intrusion": 0, "loitering": 0, "line_crossing": 0}
        data[stream_id][event_type] = count
    return list(data.values())
