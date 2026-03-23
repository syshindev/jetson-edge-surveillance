# DOBER — AI Surveillance System

Real-time edge AI video surveillance system powered by YOLO11n and BoTSORT, designed for NVIDIA Jetson Orin Nano Super. Features object detection, multi-object tracking, event detection (intrusion, loitering, line crossing), and a web-based monitoring dashboard.

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
│ File         │    └──────────┬───────────────────┘    │  Vite       │
└──────────────┘               │                        └──────┬──────┘
                               v                               │
                    ┌──────────────────┐        WebSocket      │
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
| Frontend | React + Vite |
| Streaming | WebSocket |
| Deployment | Docker Compose |
| Edge Inference | TensorRT (FP16) on Jetson |

## Project Structure

```
jetson-edge-surveillance/
├── ai/
│   ├── src/
│   │   ├── inference/      # YOLO detection (PyTorch + TensorRT)
│   │   ├── tracking/       # BoTSORT tracker
│   │   ├── events/         # Intrusion, loitering, line crossing
│   │   ├── video/          # Video source handler
│   │   ├── pipeline/       # Detection + tracking pipeline
│   │   └── main.py         # AI entry point
│   └── Dockerfile
├── backend/
│   ├── src/
│   │   ├── routers/        # API endpoints (events, stream, analytics)
│   │   ├── database.py     # SQLite configuration
│   │   ├── models.py       # DB models
│   │   └── main.py         # FastAPI entry point
│   └── Dockerfile
├── frontend/
│   ├── src/
│   │   ├── App.jsx         # Dashboard layout
│   │   ├── VideoStream.jsx # Real-time video display
│   │   ├── EventLog.jsx    # Event log table
│   │   ├── Analytics.jsx   # Event statistics
│   │   └── ZoneConfig.jsx  # Zone configuration
│   └── Dockerfile
├── notebooks/              # Test notebooks
├── docker-compose.yml
└── README.md
```

## Getting Started

### Prerequisites

- Python 3.12+
- Node.js 20+
- Docker (optional)

### Installation

```bash
# Clone
git clone https://github.com/syshindev/jetson-edge-surveillance.git
cd jetson-edge-surveillance

# Backend
pip install fastapi uvicorn sqlalchemy
cd backend/src
uvicorn main:app --reload

# Frontend
cd frontend
npm install
npm run dev
```

### Docker

```bash
docker compose up
```

## Roadmap

- [x] Project setup
- [x] Real-time object detection + tracking pipeline
- [x] Event detection (zone intrusion, loitering, line crossing)
- [x] FastAPI backend + web dashboard
- [x] Docker deployment + Jetson TensorRT optimization
- [ ] **VLM Integration** — Vision-Language Model for natural language event descriptions and complex scene understanding beyond rule-based detection