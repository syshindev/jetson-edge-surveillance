from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from database import Base, engine
from routers import events, stream, analytics, zones

Base.metadata.create_all(bind=engine)

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


@app.on_event("shutdown")
async def on_shutdown():
    stream._shutdown.set()
    for pc in list(stream.pcs):
        await pc.close()
    stream.pcs.clear()


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8001, timeout_graceful_shutdown=1)
