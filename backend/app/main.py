from fastapi import FastAPI
from fastapi.staticfiles import StaticFiles
from api import rest
import config, os

app = FastAPI(title="Style Transfer API")

os.makedirs(config.STYLE_DIR, exist_ok=True)
app.mount("/static/styles", StaticFiles(directory=config.STYLE_DIR), name="styles")

app.include_router(rest.router)
