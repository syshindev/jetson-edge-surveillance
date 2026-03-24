from sqlalchemy import Column, Integer, String, DateTime
from datetime import datetime
from database import Base

class Event(Base):
    __tablename__ = "events"

    id = Column(Integer, primary_key=True, index=True)
    event_type = Column(String)
    track_id = Column(Integer)
    zone_name = Column(String)
    center_x = Column(Integer)
    center_y = Column(Integer)
    timestamp = Column(DateTime, default=datetime.now)

class ZoneModel(Base):
    __tablename__ = "zones"

    id = Column(Integer, primary_key=True, index=True)
    stream_id = Column(Integer)
    name = Column(String)
    zone_type = Column(String)
    polygon = Column(String)
    