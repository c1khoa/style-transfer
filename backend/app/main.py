from fastapi import FastAPI
from fastapi.staticfiles import StaticFiles
from app.api import rest, websocket
from app import config
import os
from fastapi.middleware.cors import CORSMiddleware

app = FastAPI(title="Style Transfer API")

os.makedirs(config.STYLE_DIR, exist_ok=True)
app.mount("/static/styles", StaticFiles(directory=config.STYLE_DIR), name="styles")

app.include_router(rest.router)
app.include_router(websocket.router)