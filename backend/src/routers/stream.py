import sys
import json
import time
import threading
import queue

import cv2
import torch
import numpy as np
from fastapi import APIRouter, Request
from fastapi.responses import JSONResponse, Response, StreamingResponse
from ultralytics import YOLO
from aiortc import RTCPeerConnection, RTCSessionDescription, VideoStreamTrack
from aiortc.codecs import h264
from av import VideoFrame

sys.path.append("../../ai/src")
from events.intrusion import Zone, IntrusionDetector
from events.loitering import LoiteringDetector
from events.line_crossing import LineCrossingDetector

from database import SessionLocal
from models import Event, ZoneModel
from types import SimpleNamespace
from ultralytics.trackers.bot_sort import BOTSORT
from ultralytics.engine.results import Boxes


h264.DEFAULT_BITRATE = 8000000

router = APIRouter()
_shared_model = YOLO("yolo11n.pt")
_shared_model.predict(np.zeros((720, 1280, 3), dtype=np.uint8), verbose=False)


VIDEO_SOURCES = [
    "C:/Users/gmission/Desktop/video-test/GX012760.MP4",
    "C:/Users/gmission/Desktop/video-test/GX012761.MP4",
    "C:/Users/gmission/Desktop/video-test/GX012762.MP4",
]


def create_tracker():
    args = SimpleNamespace(
        tracker_type="botsort",
        track_high_thresh=0.5,
        track_low_thresh=0.1,
        new_track_thresh=0.6,
        track_buffer=30,
        match_thresh=0.8,
        fuse_score=True,
        gmc_method="none",
        proximity_thresh=0.5,
        appearance_thresh=0.25,
        with_reid=False,
    )
    return BOTSORT(args, frame_rate=30)


_event_queue = queue.Queue()
def _event_writer():
    while True:
        item = _event_queue.get()
        if item is None:
            break
        db = SessionLocal()
        try:
            db.add(Event(**item))
            db.commit()
        finally:
            db.close()
threading.Thread(target=_event_writer, daemon=True).start()


def save_event(event_type, track_id, zone_name, center_x, center_y, stream_id):
    _event_queue.put({
        "event_type": event_type,
        "track_id": track_id,
        "zone_name": zone_name,
        "center_x": center_x,
        "center_y": center_y,
        "stream_id": stream_id,
    })


def load_zones(stream_id):
    db = SessionLocal()
    try:
        return db.query(ZoneModel).filter(ZoneModel.stream_id == stream_id).all()
    finally:
        db.close()


class StreamProcessor:

    def __init__(self, stream_id):
        self.stream_id = stream_id
        self.cap = cv2.VideoCapture(VIDEO_SOURCES[stream_id])
        self.tracker = create_tracker()
        self.last_annotated = None
        self.loitering_throttle = {}   # {track_id: last_save_time}
        self.intrusion_throttle = {}   # {track_id: last_save_time}
        self.detectors = []
        self._lock = threading.Lock()
        self._load_detectors()

        ret, frame = self.cap.read()
        if ret:
            self.last_annotated = cv2.resize(frame, (1280, 720))

        self._running = True
        self._thread = threading.Thread(target=self._process_loop, daemon=True)
        self._thread.start()

    def _load_detectors(self):
        self.detectors = []
        db_zones = load_zones(self.stream_id)
        for z in db_zones:
            polygon = json.loads(z.polygon)
            if z.zone_type == "intrusion":
                zone = Zone(z.name, polygon)
                self.detectors.append({"type": "intrusion", "name": z.name, "detector": IntrusionDetector([zone]), "polygon": polygon})
            elif z.zone_type == "loitering":
                zone = Zone(z.name, polygon)
                self.detectors.append({"type": "loitering", "name": z.name, "detector": LoiteringDetector([zone], threshold=5.0), "polygon": polygon})
            elif z.zone_type == "line_crossing":
                self.detectors.append({"type": "line_crossing", "name": z.name, "detector": LineCrossingDetector(tuple(polygon[0]), tuple(polygon[1])), "line": polygon})

    def reload_zones(self):
        self._load_detectors()
        self.loitering_throttle.clear()
        self.intrusion_throttle.clear()

    def _process_loop(self):
        while self._running and self.cap.isOpened() and not _shutdown.is_set():
            ret, frame = self.cap.read()
            if not ret:
                self.cap.set(cv2.CAP_PROP_POS_FRAMES, 0)
                for d in self.detectors:
                    if d["type"] == "line_crossing":
                        d["detector"].confirmed_side.clear()
                        d["detector"].streak_side.clear()
                        d["detector"].streak_count.clear()
                        d["detector"].last_cross_time.clear()
                        d["detector"].last_seen.clear()
                        d["detector"]._frame = 0
                    elif d["type"] == "loitering":
                        d["detector"].track_times.clear()
                self.loitering_throttle.clear()
                self.intrusion_throttle.clear()
                continue

            frame = cv2.resize(frame, (1280, 720))

            results = _shared_model(frame, conf=0.5, classes=[0], verbose=False)
            det = results[0]
            tracks = self.tracker.update(det.boxes.cpu(), img=frame)

            if len(tracks) > 0:
                new_boxes = torch.tensor(tracks[:, :7])
                det.boxes = Boxes(new_boxes, det.orig_shape)

            annotated = frame.copy()
            if len(tracks) > 0:
                for t in tracks:
                    x1, y1, x2, y2 = int(t[0]), int(t[1]), int(t[2]), int(t[3])
                    track_id = int(t[4])
                    cv2.rectangle(annotated, (x1, y1), (x2, y2), (255, 100, 0), 2)
                    cv2.putText(annotated, str(track_id), (x1, y1 - 5), cv2.FONT_HERSHEY_SIMPLEX, 0.5, (255, 100, 0), 1)

            for d in self.detectors:
                events = d["detector"].check(results)
                has_event = len(events) > 0

                if d["type"] in ("intrusion", "loitering"):
                    pts_poly = np.array(d["polygon"]).reshape((-1, 1, 2))
                    if has_event:
                        overlay = annotated.copy()
                        cv2.fillPoly(overlay, [pts_poly], (96, 69, 233))
                        cv2.addWeighted(overlay, 0.2, annotated, 0.8, 0, annotated)
                    cv2.polylines(annotated, [pts_poly], True, (96, 69, 233), 2)
                elif d["type"] == "line_crossing":
                    cv2.line(annotated, tuple(d["line"][0]), tuple(d["line"][1]), (96, 69, 233), 2)

                for event in events:
                    track_id = event["track_id"]
                    now = time.time()
                    if d["type"] == "loitering":
                        # 4s throttle: keeps badge alive while person stays in zone
                        if now - self.loitering_throttle.get(track_id, 0) >= 4.0:
                            self.loitering_throttle[track_id] = now
                            save_event(
                                event_type=d["type"],
                                track_id=track_id,
                                zone_name=d["name"],
                                center_x=event.get("center", (0, 0))[0],
                                center_y=event.get("center", (0, 0))[1],
                                stream_id=self.stream_id,
                            )
                    elif d["type"] == "intrusion":
                        # 10s throttle: fires on entry and re-entry, ignores jitter
                        if now - self.intrusion_throttle.get(track_id, 0) >= 10.0:
                            self.intrusion_throttle[track_id] = now
                            save_event(
                                event_type=d["type"],
                                track_id=track_id,
                                zone_name=d["name"],
                                center_x=event.get("center", (0, 0))[0],
                                center_y=event.get("center", (0, 0))[1],
                                stream_id=self.stream_id,
                            )
                    elif d["type"] == "line_crossing":
                        # No throttle needed: sign-change detector fires once per crossing
                        save_event(
                            event_type=d["type"],
                            track_id=track_id,
                            zone_name=d["name"],
                            center_x=event.get("center", (0, 0))[0],
                            center_y=event.get("center", (0, 0))[1],
                            stream_id=self.stream_id,
                        )

            with self._lock:
                self.last_annotated = annotated

    def get_frame(self):
        with self._lock:
            return self.last_annotated


_shutdown = threading.Event()

_processors = {}
for _sid in range(len(VIDEO_SOURCES)):
    _processors[_sid] = StreamProcessor(_sid)


class SharedVideoTrack(VideoStreamTrack):
    kind = "video"

    def __init__(self, stream_id):
        super().__init__()
        self.processor = _processors[stream_id]

    async def recv(self):
        pts, time_base = await self.next_timestamp()

        frame = self.processor.get_frame()
        if frame is None:
            frame = np.zeros((720, 1280, 3), dtype=np.uint8)

        video_frame = VideoFrame.from_ndarray(frame, format="bgr24")
        video_frame.pts = pts
        video_frame.time_base = time_base
        return video_frame


@router.get("/snapshot/{stream_id}")
def snapshot(stream_id: int = 0):
    cap = cv2.VideoCapture(VIDEO_SOURCES[stream_id])
    ret, frame = cap.read()
    cap.release()
    if not ret:
        return Response(status_code=404)
    frame = cv2.resize(frame, (1280, 720))
    _, buffer = cv2.imencode(".jpg", frame, [cv2.IMWRITE_JPEG_QUALITY, 90])
    return Response(content=buffer.tobytes(), media_type="image/jpeg")


def _mjpeg_generator(stream_id: int):
    proc = _processors.get(stream_id)
    while proc and not _shutdown.is_set():
        frame = proc.get_frame()
        if frame is not None:
            _, buffer = cv2.imencode(".jpg", frame, [cv2.IMWRITE_JPEG_QUALITY, 90])
            yield (b"--frame\r\nContent-Type: image/jpeg\r\n\r\n" + buffer.tobytes() + b"\r\n")
        _shutdown.wait(1 / 30)


@router.get("/mjpeg/{stream_id}")
def mjpeg_stream(stream_id: int = 0):
    return StreamingResponse(
        _mjpeg_generator(stream_id),
        media_type="multipart/x-mixed-replace; boundary=frame",
    )


pcs = set()


@router.post("/webrtc/offer/{stream_id}")
async def webrtc_offer(request: Request, stream_id: int = 0):
    params = await request.json()
    offer = RTCSessionDescription(sdp=params["sdp"], type=params["type"])

    pc = RTCPeerConnection()
    pcs.add(pc)

    @pc.on("connectionstatechange")
    async def on_state_change():
        if pc.connectionState in ("failed", "closed"):
            await pc.close()
            pcs.discard(pc)

    pc.addTrack(SharedVideoTrack(stream_id))

    await pc.setRemoteDescription(offer)
    answer = await pc.createAnswer()
    await pc.setLocalDescription(answer)

    return JSONResponse({"sdp": pc.localDescription.sdp, "type": pc.localDescription.type})


@router.post("/reload-zones/{stream_id}")
def reload_zones(stream_id: int = 0):
    proc = _processors.get(stream_id)
    if proc:
        proc.reload_zones()
    return {"message": "Zones reloaded"}
