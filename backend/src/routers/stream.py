from fastapi import APIRouter, WebSocket
import cv2
import base64
import asyncio

router = APIRouter()

@router.websocket("/ws/stream")
async def stream(websocket: WebSocket):
    await websocket.accept()

    cap = cv2.VideoCapture("C:/Users/gmission/Desktop/video-test/GX012760.MP4")

    try:
        while cap.isOpened():
            ret, frame = cap.read()
            if not ret:
                break

            # Encode frame to JPEG
            _, buffer = cv2.imencode(".jpg", frame)
            # Convert to base64 string
            data = base64.b64encode(buffer).decode("utf-8")
            # Send to browser
            await websocket.send_text(data)
            # Limit to ~30 FPS
            await asyncio.sleep(0.033)
    finally:
        cap.release()
        await websocket.close()