import numpy as np
from PIL import Image
import cv2
from typing import Tuple, Union

IMAGENET_MEAN = np.array([0.485, 0.456, 0.406])
IMAGENET_STD = np.array([0.229, 0.224, 0.225])

def preprocess_image(
    image: Union[np.ndarray, Image.Image],
    target_size: Tuple[int, int] = (512, 512),
    normalize: bool = True
) -> np.ndarray:
    """
    Tiền xử lý ảnh để đưa vào model.
    
    Args:
        image: Ảnh input (PIL Image hoặc numpy array shape (H, W, C))
        target_size: Kích thước target (width, height)
        normalize: Có normalize theo ImageNet stats không
    
    Returns:
        np.ndarray: Tensor đã preprocess, shape (1, 3, H, W), dtype float32, range [0, 1] hoặc normalized
    """
    if isinstance(image, Image.Image):
        image = np.array(image)
    
    if len(image.shape) == 2:
        image = cv2.cvtColor(image, cv2.COLOR_GRAY2RGB)
    elif image.shape[2] == 4:
        image = cv2.cvtColor(image, cv2.COLOR_RGBA2RGB)
    if target_size is not None:
        h, w = image.shape[:2]
        target_w, target_h = target_size
        
        if h != target_h or w != target_w:
            image = cv2.resize(image, (target_w, target_h), interpolation=cv2.INTER_AREA)
    
    image = image.astype(np.float32) / 255.0
    
    if normalize:
        image = (image - IMAGENET_MEAN) / IMAGENET_STD
    
    image = np.transpose(image, (2, 0, 1))
    image = np.expand_dims(image, axis=0)
    
    return image.astype(np.float32)

def postprocess_tensor(
    tensor: np.ndarray,
    denormalize: bool = True
) -> np.ndarray:
    """
    Hậu xử lý tensor từ model output thành ảnh.
    
    Args:
        tensor: Output từ model, shape (1, 3, H, W) hoặc (batch, 3, H, W)
        denormalize: Có denormalize theo ImageNet stats không
    
    Returns:
        np.ndarray: Ảnh RGB, shape (H, W, 3), dtype uint8, range [0, 255]
    """
    if len(tensor.shape) == 4:
        tensor = tensor[0]
    
    tensor = np.transpose(tensor, (1, 2, 0))
    
    if denormalize:
        tensor = tensor * IMAGENET_STD + IMAGENET_MEAN
    
    tensor = np.clip(tensor, 0, 1)
    tensor = (tensor * 255.0).astype(np.uint8)
    
    return tensor

def resize_image_keep_aspect(
    image: np.ndarray,
    max_size: int = 512
) -> Tuple[np.ndarray, Tuple[int, int]]:
    """
    Resize ảnh giữ nguyên aspect ratio, cạnh dài nhất = max_size.
    
    Args:
        image: Ảnh input, shape (H, W, C)
        max_size: Kích thước tối đa cho cạnh dài nhất
    
    Returns:
        Tuple[np.ndarray, Tuple[int, int]]: (resized_image, original_size)
    """
    h, w = image.shape[:2]
    original_size = (w, h)
    
    if max(h, w) <= max_size:
        return image, original_size
    
    if h > w:
        new_h = max_size
        new_w = int(w * max_size / h)
    else:
        new_w = max_size
        new_h = int(h * max_size / w)
    
    resized = cv2.resize(image, (new_w, new_h), interpolation=cv2.INTER_LINEAR)
    return resized, original_size

