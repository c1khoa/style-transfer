# Style Transfer Services - API Documentation

Tài liệu mô tả các hàm trong `backend/app/services/` 

---

## Cấu Trúc Files

```
backend/app/services/
├── preprocess.py      # Tiền/hậu xử lý ảnh
├── inference.py        # Chạy ONNX inference
├── style_transfer.py   # Pipeline tổng hợp
└── README.md          # File này
```

---

## preprocess.py

### `preprocess_image(image, target_size=(512, 512), normalize=True)`

**Mô tả**: Tiền xử lý ảnh để đưa vào model.

**Input**:
- `image`: PIL Image hoặc numpy array shape `(H, W, C)`, dtype uint8, range [0, 255]
- `target_size`: Tuple `(width, height)` - mặc định `(512, 512)`
- `normalize`: Có normalize theo ImageNet stats không - mặc định `True`

**Output**:
- `np.ndarray`: Tensor đã preprocess, shape `(1, 3, H, W)`, dtype float32
- Nếu `normalize=True`: range theo ImageNet (mean/std)
- Nếu `normalize=False`: range [0, 1]

**Ví dụ**:
```python
from PIL import Image
from app.services.preprocess import preprocess_image

img = Image.open("content.jpg")
tensor = preprocess_image(img, target_size=(512, 512))
print(tensor.shape)  # (1, 3, 512, 512)
```

---

### `postprocess_tensor(tensor, denormalize=True)`

**Mô tả**: Hậu xử lý tensor từ model output thành ảnh.

**Input**:
- `tensor`: Output từ model, shape `(1, 3, H, W)` hoặc `(batch, 3, H, W)`, dtype float32
- `denormalize`: Có denormalize theo ImageNet stats không - mặc định `True`

**Output**:
- `np.ndarray`: Ảnh RGB, shape `(H, W, 3)`, dtype uint8, range [0, 255]

**Ví dụ**:
```python
from app.services.preprocess import postprocess_tensor

output_tensor = model_output  # shape (1, 3, 512, 512)
result_image = postprocess_tensor(output_tensor)
print(result_image.shape)  # (512, 512, 3)
print(result_image.dtype)  # uint8
```

---

### `resize_image_keep_aspect(image, max_size=512)`

**Mô tả**: Resize ảnh giữ nguyên aspect ratio, cạnh dài nhất = max_size.

**Input**:
- `image`: Ảnh input, shape `(H, W, C)`
- `max_size`: Kích thước tối đa cho cạnh dài nhất - mặc định `512`

**Output**:
- `Tuple[np.ndarray, Tuple[int, int]]`: `(resized_image, original_size)`

**Ví dụ**:
```python
from app.services.preprocess import resize_image_keep_aspect

img = np.array(Image.open("large_image.jpg"))  # (2000, 3000, 3)
resized, orig_size = resize_image_keep_aspect(img, max_size=512)
print(resized.shape)  # (341, 512, 3)
print(orig_size)      # (3000, 2000)
```

---

## inference.py

### `run_inference(session, content_tensor, style_tensor, alpha=1.0, model_name="adain")`

**Mô tả**: Chạy inference với ONNX model.

**Input**:
- `session`: ONNX Runtime `InferenceSession` (từ `loader.load_model()`)
- `content_tensor`: Content image tensor, shape `(1, 3, H, W)`, dtype float32
- `style_tensor`: Style image tensor, shape `(1, 3, H, W)`, dtype float32
- `alpha`: Style strength (0.0 - 1.0), chỉ dùng cho AdaIN - mặc định `1.0`
- `model_name`: `"adain"` hoặc `"sanet"` - mặc định `"adain"`

**Output**:
- `np.ndarray`: Output tensor, shape `(1, 3, H, W)`, dtype float32

**Ví dụ**:
```python
from app.models.loader import load_model
from app.services.inference import run_inference
from app.services.preprocess import preprocess_image

session = load_model("adain")
content_tensor = preprocess_image(content_img)
style_tensor = preprocess_image(style_img)

output = run_inference(session, content_tensor, style_tensor, alpha=0.8, model_name="adain")
```

---

### `run_inference_batch(session, content_tensors, style_tensors, alpha=1.0, model_name="adain")`

**Mô tả**: Chạy inference cho batch ảnh.

**Input**:
- `session`: ONNX Runtime `InferenceSession`
- `content_tensors`: Batch content tensors, shape `(batch, 3, H, W)`
- `style_tensors`: Batch style tensors, shape `(batch, 3, H, W)`
- `alpha`: Style strength
- `model_name`: `"adain"` hoặc `"sanet"`

**Output**:
- `np.ndarray`: Batch output tensors, shape `(batch, 3, H, W)`

---

## style_transfer.py

### `apply_style(content_img, style_img, model_name="adain", alpha=1.0, target_size=(512, 512))`

**Mô tả**: Pipeline tổng hợp để áp dụng style transfer. Hàm này gọi tất cả các bước:
1. Load model ONNX
2. Preprocess content và style images
3. Chạy inference
4. Postprocess output thành ảnh

**Input**:
- `content_img`: Ảnh content (PIL Image hoặc numpy array shape `(H, W, C)`)
- `style_img`: Ảnh style (PIL Image hoặc numpy array shape `(H, W, C)`)
- `model_name`: `"adain"` hoặc `"sanet"` - mặc định `"adain"`
- `alpha`: Style strength (0.0 - 1.0), chỉ dùng cho AdaIN - mặc định `1.0`
- `target_size`: Kích thước target `(width, height)` - mặc định `(512, 512)`

**Output**:
- `np.ndarray`: Ảnh kết quả đã styled, shape `(H, W, 3)`, dtype uint8, range [0, 255]

**Ví dụ**:
```python
from PIL import Image
from app.services.style_transfer import apply_style

content = Image.open("content.jpg")
style = Image.open("style.jpg")

result = apply_style(content, style, model_name="adain", alpha=0.8)
Image.fromarray(result).save("output.jpg")
```

**Lưu ý**:
- Hàm này tự động load model vào memory (có cache)
- Nếu model chưa được convert sang ONNX, sẽ raise `FileNotFoundError`
- Content và style images sẽ được resize về `target_size` trước khi inference

---

## models/loader.py

### `load_model(model_name, providers=None)`

**Mô tả**: Load ONNX model vào memory và trả về InferenceSession.

**Input**:
- `model_name`: `"adain"` hoặc `"sanet"`
- `providers`: List providers cho ONNX Runtime (mặc định: `['CPUExecutionProvider']` hoặc `['CUDAExecutionProvider', 'CPUExecutionProvider']` nếu có GPU)

**Output**:
- `ort.InferenceSession`: ONNX Runtime session

**Ví dụ**:
```python
from app.models.loader import load_model

session = load_model("adain")
```

**Lưu ý**:
- Models được cache trong memory, chỉ load 1 lần
- Nếu file `.onnx` không tồn tại, raise `FileNotFoundError`

---

### `get_model_info(model_name)`

**Mô tả**: Lấy thông tin về model (input/output shapes, names).

**Input**:
- `model_name`: `"adain"` hoặc `"sanet"`

**Output**:
- `dict`: Thông tin model

**Ví dụ**:
```python
from app.models.loader import get_model_info

info = get_model_info("adain")
print(info)
# {
#   "model_name": "adain",
#   "inputs": [{"name": "content", "shape": [1, 3, 512, 512], ...}, ...],
#   "outputs": [{"name": "output", "shape": [1, 3, 512, 512], ...}, ...]
# }
```

---

### `clear_cache()`

**Mô tả**: Xóa cache models (dùng khi cần reload models).

**Ví dụ**:
```python
from app.models.loader import clear_cache

clear_cache()
```

---

## Workflow Hoàn Chỉnh

### Cách sử dụng đơn giản nhất:

```python
from PIL import Image
from app.services.style_transfer import apply_style

content = Image.open("content.jpg")
style = Image.open("style.jpg")

result = apply_style(content, style, model_name="adain", alpha=0.8)
Image.fromarray(result).save("output.jpg")
```

### Cách sử dụng chi tiết (tối ưu performance):

```python
from PIL import Image
import numpy as np
from app.models.loader import load_model
from app.services.preprocess import preprocess_image, postprocess_tensor
from app.services.inference import run_inference

session = load_model("adain")

content = Image.open("content.jpg")
style = Image.open("style.jpg")

content_tensor = preprocess_image(content, target_size=(512, 512))
style_tensor = preprocess_image(style, target_size=(512, 512))

output_tensor = run_inference(session, content_tensor, style_tensor, alpha=0.8, model_name="adain")
result = postprocess_tensor(output_tensor)

Image.fromarray(result).save("output.jpg")
```

---

## Lưu Ý Quan Trọng

1. **Model ONNX phải được convert trước**: Chạy `convert_to_onnx.py` để tạo file `.onnx`
2. **Kích thước ảnh**: Mặc định resize về 512x512, có thể thay đổi qua `target_size`
3. **Alpha parameter**: Chỉ có ý nghĩa với AdaIN, SANet không dùng
4. **Memory**: Models được cache, nếu cần reload thì gọi `clear_cache()`
5. **GPU support**: ONNX Runtime tự động detect GPU nếu có CUDA

---

## Troubleshooting

### Lỗi: `FileNotFoundError: Model adain không tìm thấy`
- **Giải pháp**: Chạy script `convert_to_onnx.py` để tạo file ONNX

### Lỗi: `ValueError: model_name phải là 'adain' hoặc 'sanet'`
- **Giải pháp**: Kiểm tra lại tên model, chỉ chấp nhận `"adain"` hoặc `"sanet"`

### Inference chậm
- **Giải pháp**: 
  - Kiểm tra có GPU không: `onnxruntime.get_device()`
  - Giảm `target_size` xuống (ví dụ: 256x256)
  - Đảm bảo model đã được optimize (FP16 nếu có GPU)

---

## Benchmark Target

- **Latency**: < 200ms/frame (512x512, CPU)
- **Memory**: < 500MB RAM cho mỗi model
- **Throughput**: > 5 FPS (512x512, CPU)

