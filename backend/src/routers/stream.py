import sys
import json
import asyncio

import cv2
import numpy as np
from fastapi import APIRouter, WebSocket
from ultralytics import YOLO

sys.path.append("../../ai/src")
from events.intrusion import Zone, IntrusionDetector
from events.loitering import LoiteringDetector
from events.line_crossing import LineCrossingDetector

from database import SessionLocal
from models import Event, ZoneModel

router = APIRouter()

VIDEO_SOURCES = [
    "C:/Users/gmission/Desktop/video-test/GX012760.MP4",
    "C:/Users/gmission/Desktop/video-test/GX012761.MP4",
    "C:/Users/gmission/Desktop/video-test/GX012762.MP4",
]

def save_event(event_type, track_id, zone_name, center_x, center_y):
    db = SessionLocal()
    try:
        event = Event(
            event_type=event_type,
            track_id=track_id,
            zone_name=zone_name,
            center_x=center_x,
            center_y=center_y,
        )
        db.add(event)
        db.commit()
    finally:
        db.close()

def load_zones(stream_id):
    db = SessionLocal()
    try:
        return db.query(ZoneModel).filter(ZoneModel.stream_id == stream_id).all()
    finally:
        db.close()

@router.websocket("/ws/stream/{stream_id}")
async def stream(websocket: WebSocket, stream_id: int = 0):
    await websocket.accept()

    cap = cv2.VideoCapture(VIDEO_SOURCES[stream_id])
    model = YOLO("yolo11n.pt")

    # Load zones from DB
    sent_ids = set()
    detectors = []
    db_zones = load_zones(stream_id)

    for z in db_zones:
        polygon = json.loads(z.polygon)
        if z.zone_type == "intrusion":
            zone = Zone(z.name, polygon)
            detectors.append({"type": "intrusion", "name": z.name, "detector": IntrusionDetector([zone]), "polygon": polygon})
        elif z.zone_type == "loitering":
            zone = Zone(z.name, polygon)
            detectors.append({"type": "loitering", "name": z.name, "detector": LoiteringDetector([zone], threshold=5.0), "polygon": polygon})
        elif z.zone_type == "line_crossing":
            detectors.append({"type": "line_crossing", "name": z.name, "detector": LineCrossingDetector(tuple(polygon[0]), tuple(polygon[1])), "line": polygon})

    frame_count = 0
    last_annotated = None

    try:
        while cap.isOpened():
            ret, frame = cap.read()
            if not ret:
                break

            frame_count += 1

            # Run detection every 3 frames
            if frame_count % 3 == 0:
                results = model.track(frame, persist=True, conf=0.5, classes=[0], verbose=False)
                annotated = results[0].plot(line_width=1, font_size=0.5)

                # Draw ROI and check events for each zone
                for d in detectors:
                    events = d["detector"].check(results)
                    has_event = len(events) > 0

                    if d["type"] in ("intrusion", "loitering"):
                        pts = np.array(d["polygon"]).reshape((-1, 1, 2))
                        if has_event:
                            overlay = annotated.copy()
                            cv2.fillPoly(overlay, [pts], (96, 69, 233))
                            cv2.addWeighted(overlay, 0.2, annotated, 0.8, 0, annotated)
                        cv2.polylines(annotated, [pts], True, (96, 69, 233), 2)
                    elif d["type"] == "line_crossing":
                        cv2.line(annotated, tuple(d["line"][0]), tuple(d["line"][1]), (96, 69, 233), 2)
                    for event in events:
                        track_id = event["track_id"]
                        if track_id not in sent_ids:
                            sent_ids.add(track_id)
                            save_event(
                                event_type=d["type"],
                                track_id=track_id,
                                zone_name=d["name"],
                                center_x=event.get("center", (0, 0))[0],
                                center_y=event.get("center", (0, 0))[1],
                            )

                last_annotated = annotated
            else:
                annotated = last_annotated if last_annotated is not None else frame

            # Send annotated frame
            _, buffer = cv2.imencode(".jpg", annotated)
            await websocket.send_bytes(buffer.tobytes())
            await asyncio.sleep(0.033)
    finally:
        cap.release()
        await websocket.close()
