import numpy as np
import onnxruntime as ort
from typing import Optional, Tuple

def run_inference(
    session: ort.InferenceSession,
    content_tensor: np.ndarray,
    style_tensor: np.ndarray,
    alpha: float = 1.0,
    model_name: str = "adain"
) -> np.ndarray:
    """
    Chạy inference với ONNX model.
    
    Args:
        session: ONNX Runtime InferenceSession
        content_tensor: Content image tensor, shape (1, 3, H, W)
        style_tensor: Style image tensor, shape (1, 3, H, W)
        alpha: Style strength (0.0 - 1.0), chỉ dùng cho AdaIN
        model_name: "adain" hoặc "sanet"
    
    Returns:
        np.ndarray: Output tensor, shape (1, 3, H, W)
    """
    input_names = [inp.name for inp in session.get_inputs()]
    output_names = [out.name for out in session.get_outputs()]
    
    if model_name == "adain":
        if "alpha" in input_names:
            inputs = {
                "content": content_tensor,
                "style": style_tensor,
                "alpha": np.array([alpha], dtype=np.float32)
            }
        else:
            inputs = {
                "content": content_tensor,
                "style": style_tensor
            }
    else:
        inputs = {
            "content": content_tensor,
            "style": style_tensor
        }
    
    try:
        outputs = session.run(output_names, inputs)
    except Exception as e:
        if 'DmlExecutionProvider' in str(session.get_providers()):
            raise RuntimeError(
                f"DirectML execution failed. This may be a compatibility issue. "
                f"Try using CPU for {model_name} model. Error: {e}"
            )
        raise
    
    if len(outputs) > 1:
        return outputs[0]
    return outputs[0]

def run_inference_batch(
    session: ort.InferenceSession,
    content_tensors: np.ndarray,
    style_tensors: np.ndarray,
    alpha: float = 1.0,
    model_name: str = "adain"
) -> np.ndarray:
    """
    Chạy inference cho batch ảnh.
    
    Args:
        session: ONNX Runtime InferenceSession
        content_tensors: Batch content tensors, shape (batch, 3, H, W)
        style_tensors: Batch style tensors, shape (batch, 3, H, W)
        alpha: Style strength
        model_name: "adain" hoặc "sanet"
    
    Returns:
        np.ndarray: Batch output tensors, shape (batch, 3, H, W)
    """
    batch_size = content_tensors.shape[0]
    outputs = []
    
    for i in range(batch_size):
        output = run_inference(
            session,
            content_tensors[i:i+1],
            style_tensors[i:i+1],
            alpha,
            model_name
        )
        outputs.append(output[0])
    
    return np.stack(outputs, axis=0)

