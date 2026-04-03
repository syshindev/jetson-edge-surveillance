from fastapi import FastAPI, WebSocket
from fastapi.middleware.cors import CORSMiddleware
from database import Base, engine
from ws_manager import manager
import models
import asyncio
import signal
import os

Base.metadata.create_all(bind=engine)

from routers import events, stream, analytics, zones, auth

signal.signal(signal.SIGINT, lambda *_: os._exit(0))

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(events.router)
app.include_router(stream.router)
app.include_router(analytics.router)
app.include_router(zones.router)
app.include_router(auth.router)


@app.websocket("/ws")
async def websocket_endpoint(ws: WebSocket):
    await manager.connect(ws)
    try:
        while True:
            await ws.receive_text()
    except Exception:
        manager.disconnect(ws)


@app.on_event("startup")
async def on_startup():
    from ws_manager import set_loop
    set_loop(asyncio.get_running_loop())


@app.on_event("shutdown")
async def on_shutdown():
    stream._shutdown.set()
    for ws in manager.connections[:]:
        try:
            await ws.close()
        except Exception:
            pass
    manager.connections.clear()
    for pc in list(stream.pcs):
        try:
            await pc.close()
        except Exception:
            pass
    stream.pcs.clear()


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000, timeout_graceful_shutdown=0)
