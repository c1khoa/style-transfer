import onnxruntime as ort
import os
from typing import Optional

MODEL_DIR = os.path.join(os.path.dirname(__file__))
ADAIN_MODEL_PATH = os.path.join(MODEL_DIR, "adain.onnx")
SANET_MODEL_PATH = os.path.join(MODEL_DIR, "sanet.onnx")

_sessions = {}

def load_model(model_name: str, providers: Optional[list] = None) -> ort.InferenceSession:
    """
    Load ONNX model vào memory và trả về InferenceSession.
    
    Args:
        model_name: "adain" hoặc "sanet"
        providers: List providers cho ONNX Runtime (mặc định: ['CPUExecutionProvider'])
    
    Returns:
        ort.InferenceSession: ONNX Runtime session
    
    Raises:
        FileNotFoundError: Nếu file model không tồn tại
        ValueError: Nếu model_name không hợp lệ
    """
    if model_name not in ["adain", "sanet"]:
        raise ValueError(f"model_name phải là 'adain' hoặc 'sanet', nhận được: {model_name}")
    
    if model_name in _sessions:
        return _sessions[model_name]
    
    if providers is None:
        available_providers = ort.get_available_providers()
        providers = []
        
        if model_name == "sanet":
            if 'CUDAExecutionProvider' in available_providers:
                providers.append('CUDAExecutionProvider')
            elif 'ROCMExecutionProvider' in available_providers:
                providers.append('ROCMExecutionProvider')
            providers.append('CPUExecutionProvider')
        else:
            if 'DmlExecutionProvider' in available_providers:
                providers.append('DmlExecutionProvider')
            elif 'CUDAExecutionProvider' in available_providers:
                providers.append('CUDAExecutionProvider')
            elif 'ROCMExecutionProvider' in available_providers:
                providers.append('ROCMExecutionProvider')
            
            providers.append('CPUExecutionProvider')
    
    if model_name == "adain":
        model_path = ADAIN_MODEL_PATH
    else:
        model_path = SANET_MODEL_PATH
    
    if not os.path.exists(model_path):
        raise FileNotFoundError(
            f"Model {model_name} không tìm thấy tại {model_path}. "
            f"Hãy chạy convert_to_onnx.py để tạo file ONNX."
        )
    
    try:
        session = ort.InferenceSession(
            model_path,
            providers=providers
        )
    except Exception as e:
        if len(providers) > 1 and 'CPUExecutionProvider' in providers:
            print(f"Warning: GPU provider failed, falling back to CPU: {e}")
            session = ort.InferenceSession(
                model_path,
                providers=['CPUExecutionProvider']
            )
        else:
            raise
    
    _sessions[model_name] = session
    return session

def get_model_info(model_name: str) -> dict:
    """
    Lấy thông tin về model (input/output shapes, names).
    
    Args:
        model_name: "adain" hoặc "sanet"
    
    Returns:
        dict: Thông tin model
    """
    session = load_model(model_name)
    
    info = {
        "model_name": model_name,
        "inputs": [],
        "outputs": []
    }
    
    for inp in session.get_inputs():
        info["inputs"].append({
            "name": inp.name,
            "shape": inp.shape,
            "type": inp.type
        })
    
    for out in session.get_outputs():
        info["outputs"].append({
            "name": out.name,
            "shape": out.shape,
            "type": out.type
        })
    
    return info

def clear_cache():
    """Xóa cache models (dùng khi cần reload models)."""
    global _sessions
    _sessions.clear()

