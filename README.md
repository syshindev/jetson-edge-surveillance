# Jetson Edge AI Surveillance

Real-time video surveillance system powered by YOLO11n and BoTSORT, designed for NVIDIA Jetson Orin Nano Super. Features object detection, multi-object tracking, event detection, and a web-based monitoring dashboard.

## Features

- **Object Detection** — YOLO11n (~2.6M params) for real-time person/vehicle detection
- **Multi-Object Tracking** — BoTSORT with ReID for persistent identity tracking across frames
- **Event Detection** — Rule-based alerts: zone intrusion, loitering, line crossing
- **Web Dashboard** — Live video stream, real-time event log, analytics charts, interactive zone editor
- **Edge Optimized** — TensorRT FP16 inference on Jetson (100+ FPS), PyTorch fallback on PC

## Architecture

```
┌──────────────┐    ┌──────────────────────────────┐    ┌─────────────┐
│ Video Source │───>│          AI Pipeline         │───>│  Dashboard  │
│ RTSP/Webcam/ │    │  YOLO11n → BoTSORT → Events  │    │  React +    │
│ File         │    └──────────┬───────────────────┘    │  Tailwind   │
└──────────────┘               │                        └──────┬──────┘
                               v                               │
                    ┌──────────────────┐     WebSocket/SSE     │
                    │  FastAPI Backend │<──────────────────────┘
                    │  REST API + DB   │
                    └──────────────────┘
```

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Detection | Ultralytics YOLO11n |
| Tracking | BoTSORT |
| Backend | FastAPI + SQLite |
| Frontend | React + Vite + TypeScript + Tailwind |
| Streaming | WebSocket + MJPEG |
| Deployment | Docker Compose |
| Edge Inference | TensorRT (FP16) on Jetson |

## Roadmap

- [x] Project setup
- [ ] Real-time object detection + tracking pipeline
- [ ] Event detection (zone intrusion, loitering, line crossing)
- [ ] FastAPI backend + web dashboard
- [ ] Docker deployment + Jetson TensorRT optimization
- [ ] **VLM Integration** — Vision-Language Model for natural language event descriptions (e.g., "A person climbed over the fence into the restricted area") and complex scene understanding beyond rule-based detection