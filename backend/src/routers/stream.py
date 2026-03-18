from fastapi import APIRouter, WebSocket
import cv2
import base64

router = APIRouter()

@router.websocket("/ws/stream")
async def stream(websocket: WebSocket):
    await websocket.accept()

    cap = cv2.VideoCapture(0)   # Webcam (change to video path for testing)

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
    finally:
        cap.release()
        await websocket.close()