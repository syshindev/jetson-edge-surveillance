import sys
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
from models import Event

router = APIRouter()

STREAM_CONFIG = [
    {
        "source": "C:/Users/gmission/Desktop/video-test/GX012760.MP4",
        "type": "intrusion",
        "zone": [[925, 450], [1346, 526], [827, 860], [650, 657]],
    },
    {
        "source": "C:/Users/gmission/Desktop/video-test/GX012761.MP4",
        "type": "line_crossing",
        "line": [(514, 741), (921, 794)],
    },
    {
        "source": "C:/Users/gmission/Desktop/video-test/GX012762.MP4",
        "type": "loitering",
        "zone": [[854, 633], [1176, 583], [1241, 744], [925, 809]],
    },
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

@router.websocket("/ws/stream/{stream_id}")
async def stream(websocket: WebSocket, stream_id: int = 0):
    await websocket.accept()

    config = STREAM_CONFIG[stream_id]
    cap = cv2.VideoCapture(config["source"])
    model = YOLO("yolo11n.pt")

    # Create event detector
    sent_ids = set()
    detector = None
    if config["type"] == "intrusion":
        zone = Zone("intrusion", config["zone"])
        detector = IntrusionDetector([zone])
    elif config["type"] == "loitering":
        zone = Zone("loitering", config["zone"])
        detector = LoiteringDetector([zone], threshold=5.0)
    elif config["type"] == "line_crossing":
        detector = LineCrossingDetector(config["line"][0], config["line"][1])

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

                # Draw ROI based on stream type
                if config["type"] in ("intrusion", "loitering"):
                    pts = np.array(config["zone"]).reshape((-1, 1, 2))
                    cv2.polylines(annotated, [pts], True, (0, 255, 0), 2)
                    cv2.putText(annotated, config["type"], tuple(config["zone"][0]),
                                cv2.FONT_HERSHEY_SIMPLEX, 0.5, (0, 255, 0), 1)
                elif config["type"] == "line_crossing":
                    cv2.line(annotated, config["line"][0], config["line"][1], (0, 255, 0), 2)
                    cv2.putText(annotated, "line_crossing", config["line"][0],
                                cv2.FONT_HERSHEY_SIMPLEX, 0.5, (0, 255, 0), 1)

                last_annotated = annotated

                # Check events and save to DB
                if detector:
                    events = detector.check(results)
                    for event in events:
                        track_id = event["track_id"]
                        if track_id not in sent_ids:
                            sent_ids.add(track_id)
                            save_event(
                                event_type=config["type"],
                                track_id=track_id,
                                zone_name=config["type"],
                                center_x=event.get("center", (0, 0))[0],
                                center_y=event.get("center", (0, 0))[1],
                            )
            else:
                annotated = last_annotated if last_annotated is not None else frame

            # Send annotated frame (resized for speed)
            small = cv2.resize(annotated, (960, 540))
            _, buffer = cv2.imencode(".jpg", small, [cv2.IMWRITE_JPEG_QUALITY, 70])
            await websocket.send_bytes(buffer.tobytes())
            await asyncio.sleep(0.033)
    finally:
        cap.release()
        await websocket.close()
