import io
from PIL import Image
import numpy as np
from service.style_transfer import apply_style
import config
import os

def style_transfer_bytes(
    content_bytes: bytes,
    style_bytes: bytes = None,
    style_name: str = None,
    model_name: str = "adain"
) -> bytes:
    
    content_image = Image.open(io.BytesIO(content_bytes)).convert("RGB")
    
    if style_bytes:  
        style_image_pil = Image.open(io.BytesIO(style_bytes)).convert("RGB")
    elif style_name:  
        style_path = os.path.join(config.STYLE_DIR, f"{style_name}.jpg")
        if not os.path.exists(style_path):
            raise ValueError(f"Style {style_name} không tồn tại")
        style_image_pil = Image.open(style_path).convert("RGB")
        style_image_pil = Image.open(f"{config.STYLE_DIR}/{style_name}.jpg").convert("RGB")
    else:
        raise ValueError("Cần cung cấp style_image hoặc style_name")

    result_image = apply_style(
        np.array(content_image), 
        np.array(style_image_pil), 
        model_name
    )
    buffer = io.BytesIO()
    Image.fromarray(result_image).save(buffer, format="JPEG")
    return buffer.getvalue()
