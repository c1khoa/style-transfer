import numpy as np
from typing import Union
from PIL import Image

from .preprocess import preprocess_image, postprocess_tensor
from .inference import run_inference
from ..models.loader import load_model

def apply_style(
    content_img: Union[np.ndarray, Image.Image],
    style_img: Union[np.ndarray, Image.Image],
    model_name: str = "adain",
    alpha: float = 1.0,
    target_size: tuple = (256, 256)
) -> np.ndarray:
    """
    Pipeline tổng hợp để áp dụng style transfer.
    
    Args:
        content_img: Ảnh content (PIL Image hoặc numpy array shape (H, W, C))
        style_img: Ảnh style (PIL Image hoặc numpy array shape (H, W, C))
        model_name: "adain" hoặc "sanet"
        alpha: Style strength (0.0 - 1.0), chỉ dùng cho AdaIN
        target_size: Kích thước target (width, height)
    
    Returns:
        np.ndarray: Ảnh kết quả đã styled, shape (H, W, C), dtype uint8, range [0, 255]
    """
    if model_name not in ["adain", "sanet"]:
        raise ValueError(f"model_name phải là 'adain' hoặc 'sanet', nhận được: {model_name}")
    
    session = load_model(model_name)
    
    normalize = (model_name == "adain")
    content_tensor = preprocess_image(content_img, target_size=target_size, normalize=normalize)
    style_tensor = preprocess_image(style_img, target_size=target_size, normalize=normalize)
    
    output_tensor = run_inference(
        session,
        content_tensor,
        style_tensor,
        alpha=alpha,
        model_name=model_name
    )
    
    result_image = postprocess_tensor(output_tensor, denormalize=normalize)
    
    return result_image
