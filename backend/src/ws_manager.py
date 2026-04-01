from fastapi import WebSocket
import asyncio

class ConnectionManager:
    def __init__(self):
        self.connections: list[WebSocket] = []

    async def connect(self, ws: WebSocket):
        await ws.accept()
        self.connections.append(ws)

    def disconnect(self, ws: WebSocket):
        self.connections.remove(ws)

    async def broadcast(self, data: dict):
        for ws in self.connections[:]:
            try:
                await ws.send_json(data)
            except Exception:
                self.connections.remove(ws)

manager = ConnectionManager()

_loop = None

def set_loop(loop):
    global _loop
    _loop = loop

def notify_clients(data: dict):
    if _loop and _loop.is_running():
        asyncio.run_coroutine_threadsafe(manager.broadcast(data), _loop)
