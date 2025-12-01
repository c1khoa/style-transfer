from fastapi import APIRouter, UploadFile, File, Form, HTTPException, Response
from app.utils import style_transfer_bytes
import os, glob
from app import config
router = APIRouter()

os.makedirs(config.STYLE_DIR, exist_ok=True)
LIST_STYLES = glob.glob(os.path.join(config.STYLE_DIR, "*"))
STYLE_NAMES = [os.path.basename(f) for f in LIST_STYLES]

@router.get("/api/styles")
def get_styles():
    return [{"id": name, "thumbnail": f"/static/styles/{name}.jpg"} for name in STYLE_NAMES]

@router.post("/api/style/image")
async def style_image(
    content_image: UploadFile = File(...),
    style_image: UploadFile = File(None),
    style_name: str = Form(None),
    model_name: str = Form(...)
):
    content_bytes = await content_image.read()
    style_bytes = await style_image.read() if style_image else None
    
    result_bytes = style_transfer_bytes(content_bytes, style_bytes, style_name, model_name)

    return Response(content=result_bytes, media_type="image/jpeg")
