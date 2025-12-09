import io
from PIL import Image
import numpy as np
from app.services.style_transfer import apply_style
from app import config
import os

def style_transfer_bytes(content_bytes: bytes, style_bytes: bytes, model_name: str = "adain") -> bytes:

    if not content_bytes:
        raise ValueError("Empty content_bytes")
    if not style_bytes:
        raise ValueError("Empty style_bytes")
    try:
        content_img = Image.open(io.BytesIO(content_bytes)).convert("RGB")
    except Exception as e:
        print("❌ Cannot decode content image:", e)
        raise ValueError("Invalid content image bytes") from e

    try:
        style_img = Image.open(io.BytesIO(style_bytes)).convert("RGB")
    except Exception as e:
        print("❌ Cannot decode style image:", e)
        raise ValueError("Invalid style image bytes") from e

    content_np = np.asarray(content_img, dtype=np.uint8)
    style_np = np.asarray(style_img, dtype=np.uint8)

    result_np = apply_style(content_np, style_np, model_name)

    # Bảo vệ output
    if not isinstance(result_np, np.ndarray):
        raise TypeError("apply_style must return numpy ndarray")
    if result_np.dtype != np.uint8:
        result_np = result_np.astype(np.uint8)

    result_pil = Image.fromarray(result_np)

    buffer = io.BytesIO()
    result_pil.save(buffer, format="JPEG", quality=95)
    return buffer.getvalue()

