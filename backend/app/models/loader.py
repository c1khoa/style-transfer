import onnxruntime as ort
import os
from typing import Optional

_sessions = {}

# Tự động xác định thư mục models dựa trên vị trí file này
BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))  # backend/
MODEL_DIR = os.path.join(BASE_DIR, "models")
ADAIN_MODEL_PATH = os.path.join(MODEL_DIR, "adain.onnx")
SANET_MODEL_PATH = os.path.join(MODEL_DIR, "sanet.onnx")

def load_model(model_name: str, providers: Optional[list] = None) -> ort.InferenceSession:
    """
    Load ONNX model vào memory và trả về InferenceSession.
    """
    print(f"🟢 Loading model: {model_name}...")
    
    if model_name not in ["adain", "sanet"]:
        raise ValueError(f"model_name phải là 'adain' hoặc 'sanet', nhận được: {model_name}")
    
    if model_name in _sessions:
        print(f"⚡ Model '{model_name}' đã được load sẵn, dùng cache.")
        return _sessions[model_name]
    
    # Chọn path model
    model_path = ADAIN_MODEL_PATH if model_name == "adain" else SANET_MODEL_PATH

    if not os.path.exists(model_path):
        raise FileNotFoundError(
            f"Model {model_name} không tìm thấy tại {model_path}. "
            f"Hãy chạy convert_to_onnx.py để tạo file ONNX."
        )
    
    # Chọn providers nếu chưa có
    if providers is None:
        available_providers = ort.get_available_providers()
        providers = []

        if model_name == "sanet":
            if 'CUDAExecutionProvider' in available_providers:
                providers.append('CUDAExecutionProvider')
            elif 'ROCMExecutionProvider' in available_providers:
                providers.append('ROCMExecutionProvider')
            providers.append('CPUExecutionProvider')
        else:  # adain
            if 'DmlExecutionProvider' in available_providers:
                providers.append('DmlExecutionProvider')
            elif 'CUDAExecutionProvider' in available_providers:
                providers.append('CUDAExecutionProvider')
            elif 'ROCMExecutionProvider' in available_providers:
                providers.append('ROCMExecutionProvider')
            providers.append('CPUExecutionProvider')
    
    # Load ONNX Runtime session
    try:
        session = ort.InferenceSession(model_path, providers=providers)
        print(f"✅ Model '{model_name}' loaded thành công với providers: {providers}")
    except Exception as e:
        if 'CPUExecutionProvider' not in providers:
            print(f"⚠ GPU provider failed, fallback CPU: {e}")
            session = ort.InferenceSession(model_path, providers=['CPUExecutionProvider'])
        else:
            raise
    
    _sessions[model_name] = session
    return session

def get_model_info(model_name: str) -> dict:
    session = load_model(model_name)
    info = {
        "model_name": model_name,
        "inputs": [{"name": inp.name, "shape": inp.shape, "type": inp.type} for inp in session.get_inputs()],
        "outputs": [{"name": out.name, "shape": out.shape, "type": out.type} for out in session.get_outputs()]
    }
    return info

def clear_cache():
    """Xóa cache models."""
    global _sessions
    _sessions.clear()
    print("⚡ Cache models đã được xóa.")
