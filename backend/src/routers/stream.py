from fastapi import APIRouter, WebSocket
import cv2
import base64
import asyncio
from ultralytics import YOLO
import numpy as np

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

@router.websocket("/ws/stream/{stream_id}")
async def stream(websocket: WebSocket, stream_id: int = 0):
    await websocket.accept()

    config = STREAM_CONFIG[stream_id]
    cap = cv2.VideoCapture(config["source"])
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
