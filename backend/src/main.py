from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from database import Base, engine
from routers import events, stream, analytics, zones

# Create DB tables
Base.metadata.create_all(bind=engine)

app = FastAPI()

# Allow frontend to access API
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

# Register router
app.include_router(events.router)
app.include_router(stream.router)
app.include_router(analytics.router)
app.include_router(zones.router)