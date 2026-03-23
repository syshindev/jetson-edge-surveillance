from fastapi import APIRouter, WebSocket
import cv2
import base64
import asyncio
from ultralytics import YOLO
import numpy as np

router = APIRouter()

DEMO_ZONES = [
    {"name": "test_area", "polygon": np.array([[925, 450], [1346, 526], [827, 860], [650, 657]])}
]

@router.websocket("/ws/stream")
async def stream(websocket: WebSocket):
    await websocket.accept()

    cap = cv2.VideoCapture("C:/Users/gmission/Desktop/video-test/GX012760.MP4")
    model = YOLO("yolo11n.pt")

    try:
        while cap.isOpened():
            ret, frame = cap.read()
            if not ret:
                break
            
            # Run detection + tracking
            results = model.track(frame, persist=True, conf=0.5, classes=[0], verbose=False)
            # Draw tracking results (bbox + ID)
            annotated = results[0].plot(line_width=1, font_size=0.5)
            # Draw zone polygons
            for zone in DEMO_ZONES:
                pts = zone["polygon"].reshape((-1, 1, 2))
                cv2.polylines(annotated, [pts], True, (0, 255, 0), 2)
                cv2.putText(annotated, zone["name"], tuple(zone["polygon"][0]), cv2.FONT_HERSHEY_SIMPLEX, 0.5, (0, 255, 0), 1)
            # Encode frame to JPEG
            _, buffer = cv2.imencode(".jpg", annotated)
            # Convert to base64 string
            data = base64.b64encode(buffer).decode("utf-8")
            # Send to browser
            await websocket.send_text(data)
            # Limit to ~30 FPS
            await asyncio.sleep(0.033)
    finally:
        cap.release()
        await websocket.close()