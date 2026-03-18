from fastapi import FastAPI
from database import Base, engine
from routers import events, stream

# Create DB tables
Base.metadata.create_all(bind=engine)

app = FastAPI()

# Register router
app.include_router(events.router)
app.include_router(stream.router)