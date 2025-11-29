# Tài Liệu Phân Công Chi Tiết - Dự Án Real-time Style Transfer

**Nhóm:** 4 người | **Tech Stack:** FastAPI + React.js | **Model:** AdaIN/SANet

---

## 📋 MỤC LỤC

1. [Cấu trúc thư mục tổng quan](#-cấu-trúc-thư-mục-tổng-quan)
2. [Phân công chi tiết từng người](#-phân-công-chi-tiết)
3. [Quy tắc làm việc chung](#-quy-tắc-làm-việc-chung)
4. [Timeline & Điểm kiểm tra](#-timeline--điểm-kiểm-tra)

---

## 📁 CẤU TRÚC THƯ MỤC TỔNG QUAN

```
image-style-transfer/
│
├── README.md                    # Mô tả dự án tổng quan
├── .gitignore                   # Ignore node_modules, __pycache__, .env
├── requirements.txt             # Python dependencies (nếu có global)
│
├── notebooks/                   # Jupyter notebooks thử nghiệm
├── src/                         # Source code training (nếu có)
├── docs/                        # Tài liệu kỹ thuật
├── results/                     # Kết quả test/benchmark
│
├── backend/                     # ← Khang Hy & Anh Khoa LÀM VIỆC Ở ĐÂY
│   ├── app/
│   │   ├── main.py             # File khởi động FastAPI (Anh Khoa)
│   │   ├── api/
│   │   │   ├── rest.py         # REST endpoints (Anh Khoa)
│   │   │   └── websocket.py    # WebSocket endpoint (Anh Khoa)
│   │   ├── services/
│   │   │   ├── style_transfer.py   # Logic chính style transfer (Khang Hy)
│   │   │   ├── inference.py        # Chạy ONNX model (Khang Hy)
│   │   │   └── preprocess.py       # Tiền xử lý ảnh (Khang Hy)
│   │   ├── models/
│   │   │   ├── adain.onnx      # Model ONNX (Khang Hy)
│   │   │   ├── sanet.onnx      # Model ONNX (Khang Hy)
│   │   │   └── loader.py       # Load model vào memory (Khang Hy)
│   │   ├── styles/
│   │   │   ├── style_1.jpg      # Ảnh style có sẵn
│   │   │   ├── style_2.jpg      # Ảnh style có sẵn
│   │   │   └── style_3.jpg      # Ảnh style có sẵn
│   │   └── schemas/
│   │       └── image.py        # Pydantic schemas (Anh Khoa)
│   ├── requirements.txt        # FastAPI, onnxruntime, opencv, etc.
│   └── run.sh                  # Script chạy uvicorn (Anh Khoa)
│
└── frontend/                   # ← Hồng Hạnh & Nick Võ LÀM VIỆC Ở ĐÂY
    ├── package.json            # npm dependencies
    ├── public/                 # Static assets
    └── src/
        ├── components/         # React components (Hồng Hạnh)
        │   ├── WebcamFeed.jsx       # Component webcam (Hồng Hạnh)
        │   ├── StyleSelector.jsx    # Chọn style (Hồng Hạnh)
        │   ├── StyledCanvas.jsx     # Hiển thị kết quả (Hồng Hạnh)
        │   └── ImageUploader.jsx    # Upload ảnh (Hồng Hạnh)
        ├── services/           # API logic (Nick Võ)
        │   ├── api.js               # REST API calls (Hồng Hạnh tạo skeleton, Nick Võ hoàn thiện)
        │   └── websocket.js         # WebSocket logic (Nick Võ)
        ├── hooks/              # Custom hooks (Nick Võ)
        │   └── useWebsocket.js      # Hook quản lý WebSocket (Nick Võ)
        ├── App.jsx             # Main app (Hồng Hạnh & 4 cùng làm)
        └── index.js            # Entry point (Hồng Hạnh)
```

---

## 👥 PHÂN CÔNG CHI TIẾT

### **Khang Hy – Backend ML Engineer (ONNX + Inference)**

#### 📂 **Các file phụ trách:**

| File                                     | Mô tả                  | Nội dung chính                                                             |
| ---------------------------------------- | ---------------------- | -------------------------------------------------------------------------- |
| `backend/app/models/adain.onnx`          | Model AdaIN đã convert | File binary ONNX                                                           |
| `backend/app/models/sanet.onnx`          | Model SANet đã convert | File binary ONNX                                                           |
| `backend/app/models/loader.py`           | Load model vào RAM     | `load_model(model_name)` → trả về ONNX session                             |
| `backend/app/services/inference.py`      | Chạy inference         | `run_inference(session, input_tensor)` → output_tensor                     |
| `backend/app/services/preprocess.py`     | Tiền/hậu xử lý ảnh     | `preprocess_image(image)` → tensor<br>`postprocess_tensor(tensor)` → image |
| `backend/app/services/style_transfer.py` | Pipeline tổng hợp      | `apply_style(content_image, style_name)` → styled_image                    |

#### ✅ **Nhiệm vụ cụ thể:**

1. **Convert model sang ONNX:**

    - Export PyTorch/TensorFlow model thành `.onnx`
    - Test model ONNX chạy đúng bằng `onnxruntime`

2. **Tối ưu ONNX:**

    - Dynamic axes cho batch size linh hoạt
    - FP16 precision (nếu có GPU)
    - Đo latency: phải < 200ms/frame (target)

3. **Viết các hàm xử lý:**

    - `preprocess.py`: Resize, normalize, convert PIL → numpy → tensor
    - `inference.py`: Chạy ONNX session, trả về tensor
    - `style_transfer.py`: Hàm tổng hợp gọi tất cả steps trên

4. **Tạo file README riêng:**
    - `backend/app/services/README.md`: Giải thích input/output của từng hàm
    - Ví dụ: `preprocess_image()` nhận gì, trả về shape gì

#### 📦 **Output bàn giao:**

-   [ ] 2 file ONNX chạy được không lỗi
-   [ ] 4 file Python chạy thành công standalone test
-   [ ] README.md mô tả API của từng hàm
-   [ ] Benchmark report: latency, memory usage

#### ⚠️ **Lưu ý:**

-   **KHÔNG** được động vào file `rest.py`, `websocket.py` (của Anh Khoa)
-   Nếu cần thay đổi interface hàm, phải thông báo Anh Khoa trước
-   Test riêng bằng script Python trước khi tích hợp vào API

---

### **Anh Khoa – Backend API Engineer (FastAPI + REST + WebSocket)**

#### 📂 **Các file phụ trách:**

| File                           | Mô tả               | Nội dung chính                                                         |
| ------------------------------ | ------------------- | ---------------------------------------------------------------------- |
| `backend/app/main.py`          | Entry point FastAPI | Khởi tạo app, include routers, CORS config                             |
| `backend/app/api/rest.py`      | REST API endpoints  | `POST /style/image`, `GET /styles`                                     |
| `backend/app/api/websocket.py` | WebSocket endpoint  | `/ws/stream` – nhận/gửi frames real-time                               |
| `backend/app/schemas/image.py` | Pydantic models     | Define request/response schemas                                        |
| `backend/requirements.txt`     | Python dependencies | fastapi, uvicorn, onnxruntime, opencv-python, pillow, python-multipart |
| `backend/run.sh`               | Script chạy server  | `uvicorn app.main:app --reload --host 0.0.0.0 --port 8000`             |

#### ✅ **Nhiệm vụ cụ thể:**

1. **Tạo file `main.py`:**

    ```python
    from fastapi import FastAPI
    from fastapi.middleware.cors import CORSMiddleware
    from app.api import rest, websocket

    app = FastAPI(title="Style Transfer API")

    # CORS config
    app.add_middleware(
        CORSMiddleware,
        allow_origins=["http://localhost:3000"],  # Frontend URL
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )

    app.include_router(rest.router, prefix="/api")
    app.include_router(websocket.router)
    ```

2. **Tạo REST API (`rest.py`):**

    - `POST /api/style/image`:
        - Nhận: `UploadFile` (ảnh) + `style_name` (string)
        - Gọi: `style_transfer.apply_style(image, style_name)`
        - Trả về: Ảnh styled dạng `FileResponse` hoặc base64
    - `GET /api/styles`:
        - Trả về: `["style1", "style2", "style3"]` (danh sách style có sẵn)

3. **Tạo WebSocket (`websocket.py`):**

    ```python
    @router.websocket("/ws/stream")
    async def websocket_endpoint(websocket: WebSocket):
        await websocket.accept()
        while True:
            # Nhận frame (base64 JPEG)
            data = await websocket.receive_text()
            # Decode → inference → encode
            styled_frame = process_frame(data)
            # Gửi lại frame styled
            await websocket.send_text(styled_frame)
    ```

4. **Logging & Error Handling:**

    - Bắt lỗi khi model fail
    - Log request/response time
    - Trả về HTTP 500 khi có lỗi, kèm message rõ ràng

5. **Tạo `run.sh`:**
    ```bash
    #!/bin/bash
    cd backend
    uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
    ```

#### 📦 **Output bàn giao:**

-   [ ] `main.py` chạy được, Swagger UI mở tại `http://localhost:8000/docs`
-   [ ] REST API test thành công qua Postman (kèm collection export)
-   [ ] WebSocket test bằng HTML client đơn giản (tạo file test.html)
-   [ ] README.md mô tả cách chạy backend, các endpoint

#### ⚠️ **Lưu ý:**

-   **KHÔNG** được sửa logic inference của Khang Hy
-   Nếu Khang Hy chưa xong, tạo mock function trả về ảnh giả để test API trước
-   CORS phải config đúng origin của frontend (hỏi Hồng Hạnh/Nick Võ)

---

### **Hồng Hạnh – Frontend UI/UX Engineer (React Components)**

#### 📂 **Các file phụ trách:**

| File                                        | Mô tả                     | Nội dung chính                               |
| ------------------------------------------- | ------------------------- | -------------------------------------------- |
| `frontend/src/components/ImageUploader.jsx` | Upload ảnh                | Button upload + preview ảnh                  |
| `frontend/src/components/WebcamFeed.jsx`    | Hiển thị webcam           | `<video>` element + getUserMedia()           |
| `frontend/src/components/StyleSelector.jsx` | Chọn style                | Dropdown hoặc grid thumbnails                |
| `frontend/src/components/StyledCanvas.jsx`  | Hiển thị kết quả          | `<canvas>` hoặc `<img>` render ảnh styled    |
| `frontend/src/services/api.js`              | REST API calls (skeleton) | `uploadImage()`, `getStyles()` – dùng axios  |
| `frontend/src/App.jsx`                      | Main app layout           | Ghép các components lại                      |
| `frontend/src/index.js`                     | Entry point               | `ReactDOM.render(<App />)`                   |
| `frontend/package.json`                     | npm dependencies          | react, react-dom, axios, tailwind (nếu dùng) |

#### ✅ **Nhiệm vụ cụ thể:**

1. **Tạo components React:**

    - `ImageUploader.jsx`:
        ```jsx
        // Có button "Upload", khi chọn file → setState(image)
        // Hiển thị preview ảnh đã chọn
        ```
    - `WebcamFeed.jsx`:
        ```jsx
        // Dùng navigator.mediaDevices.getUserMedia()
        // Render video stream vào <video> tag
        ```
    - `StyleSelector.jsx`:
        ```jsx
        // Fetch danh sách style từ API (hoặc mock)
        // Hiển thị dạng grid/dropdown
        // Khi click style → callback onStyleSelect(styleName)
        ```
    - `StyledCanvas.jsx`:
        ```jsx
        // Nhận prop styledImage (base64 hoặc URL)
        // Render ra <img> hoặc <canvas>
        ```

2. **Thiết kế layout (`App.jsx`):**

    ```jsx
    function App() {
        return (
            <div>
                <h1>Real-time Style Transfer</h1>
                <StyleSelector />
                <ImageUploader />
                <WebcamFeed />
                <StyledCanvas />
            </div>
        );
    }
    ```

3. **Mock data để test UI:**

    - Tạo fake list styles: `["mosaic", "candy", "starry_night"]`
    - Mock ảnh styled bằng ảnh tĩnh trong `public/`

4. **Tạo skeleton API calls (`api.js`):**

    ```javascript
    import axios from 'axios';

    const API_BASE = 'http://localhost:8000/api';

    export async function uploadImage(file, styleName) {
        const formData = new FormData();
        formData.append('file', file);
        formData.append('style_name', styleName);
        const response = await axios.post(`${API_BASE}/style/image`, formData);
        return response.data; // URL hoặc base64 ảnh styled
    }

    export async function getStyles() {
        const response = await axios.get(`${API_BASE}/styles`);
        return response.data; // ["style1", "style2"]
    }
    ```

#### 📦 **Output bàn giao:**

-   [ ] 4 components React chạy được, hiển thị đúng UI
-   [ ] `App.jsx` ghép components, chạy được `npm start`
-   [ ] Mock data test UI mượt, không có lỗi console
-   [ ] README.md mô tả cách chạy frontend, cấu trúc components

#### ⚠️ **Lưu ý:**

-   **KHÔNG** cần lo WebSocket, Nick Võ sẽ làm
-   Focus vào UI/UX đẹp, responsive
-   Nếu backend chưa ready, dùng mock data JSON
-   Component phải reusable, nhận props rõ ràng

---

### **Nick Võ – Frontend Integration Engineer (WebSocket + Performance)**

#### 📂 **Các file phụ trách:**

| File                                        | Mô tả                    | Nội dung chính                               |
| ------------------------------------------- | ------------------------ | -------------------------------------------- |
| `frontend/src/services/websocket.js`        | WebSocket client logic   | Connect, send frame, receive styled frame    |
| `frontend/src/hooks/useWebsocket.js`        | React hook quản lý WS    | `useWebSocket(url, onFrame)` → { sendFrame } |
| `frontend/src/services/api.js` (hoàn thiện) | Tối ưu REST calls        | Thêm error handling, retry logic             |
| `frontend/src/App.jsx` (phần tích hợp)      | Kết nối WebSocket vào UI | Gọi hook, xử lý real-time rendering          |

#### ✅ **Nhiệm vụ cụ thể:**

1. **Tạo WebSocket client (`websocket.js`):**

    ```javascript
    class StyleTransferWebSocket {
        constructor(url) {
            this.ws = new WebSocket(url);
            this.ws.onopen = () => console.log('Connected');
            this.ws.onmessage = (event) => {
                // Nhận styled frame (base64)
                this.onFrame(event.data);
            };
        }

        sendFrame(frameBase64) {
            if (this.ws.readyState === WebSocket.OPEN) {
                this.ws.send(frameBase64);
            }
        }

        close() {
            this.ws.close();
        }
    }
    ```

2. **Tạo React hook (`useWebsocket.js`):**

    ```javascript
    import { useEffect, useRef } from 'react';

    export function useWebSocket(url, onFrameReceived) {
        const wsRef = useRef(null);

        useEffect(() => {
            wsRef.current = new StyleTransferWebSocket(url);
            wsRef.current.onFrame = onFrameReceived;

            return () => wsRef.current.close();
        }, [url]);

        return {
            sendFrame: (frame) => wsRef.current.sendFrame(frame),
        };
    }
    ```

3. **Tích hợp vào `App.jsx`:**

    ```jsx
    function App() {
        const [styledFrame, setStyledFrame] = useState(null);
        const { sendFrame } = useWebSocket('ws://localhost:8000/ws/stream', setStyledFrame);

        // Lấy frame từ webcam → sendFrame()
        // Khi nhận styledFrame → render vào StyledCanvas
    }
    ```

4. **Tối ưu performance:**

    - **Throttle frames:** Chỉ gửi 10-15 FPS thay vì 30 FPS

    ```javascript
    let lastSentTime = 0;
    const THROTTLE_MS = 66; // ~15 FPS

    function captureFrame() {
        const now = Date.now();
        if (now - lastSentTime > THROTTLE_MS) {
            sendFrame(frameBase64);
            lastSentTime = now;
        }
    }
    ```

    - **Dùng Web Workers** (optional): Encode/decode ảnh trong worker
    - **Tối ưu canvas rendering:** `requestAnimationFrame()`

5. **Deployment:**
    - Build production: `npm run build`
    - Deploy lên Vercel hoặc Nginx
    - Config biến môi trường cho backend URL

#### 📦 **Output bàn giao:**

-   [ ] WebSocket kết nối thành công, gửi/nhận frame
-   [ ] Webcam demo chạy real-time, FPS ổn định (10-30 FPS)
-   [ ] App deployed, có URL public để test
-   [ ] README.md hướng dẫn deploy, config biến môi trường

#### ⚠️ **Lưu ý:**

-   Phối hợp với Anh Khoa để test WebSocket endpoint
-   Nếu lag quá, giảm FPS hoặc resize frame nhỏ hơn
-   Test trên Chrome, Firefox để đảm bảo tương thích
-   Nếu Hồng Hạnh chưa xong UI, tạo UI đơn giản để test WebSocket trước

---

## 🔧 QUY TẮC LÀM VIỆC CHUNG

### 1. **Quy tắc Git:**

-   **Branch naming:** `feature/<tên-tính-năng>` hoặc `fix/<tên-bug>`
-   **Commit message:** Rõ ràng, VD: `feat: add REST API for image upload`
-   **KHÔNG** được push trực tiếp lên `main`
-   Tạo Pull Request, leader (Khoa) review trước khi merge

### 2. **Giao tiếp giữa Backend & Frontend:**

-   **Backend URL mặc định:** `http://localhost:8000`
-   **Frontend dev server:** `http://localhost:3000`
-   **CORS:** Anh Khoa config allow origin `http://localhost:3000`
-   **Định dạng dữ liệu:**
    -   REST: JSON hoặc `multipart/form-data` (upload file)
    -   WebSocket: Base64-encoded JPEG

### 3. **API Contract (quan trọng!):**

#### REST API:

| Endpoint           | Method | Input                                 | Output                                      |
| ------------------ | ------ | ------------------------------------- | ------------------------------------------- |
| `/api/style/image` | POST   | `file` (image), `style_name` (string) | `{ "styled_image": "base64..." }` hoặc File |
| `/api/styles`      | GET    | None                                  | `["style1", "style2", "style3"]`            |

#### WebSocket:

-   **URL:** `ws://localhost:8000/ws/stream`
-   **Client → Server:** Base64 JPEG frame
-   **Server → Client:** Base64 JPEG styled frame

### 4. **Xử lý conflict:**

-   Nếu 2 người cần sửa cùng 1 file → báo leader trước
-   Người làm xong trước merge trước, người sau rebase
-   Leader quyết định nếu có tranh chấp

### 5. **Testing:**

-   **Backend:** Dùng Postman/curl test từng endpoint
-   **Frontend:** Dùng React DevTools, console log
-   **Integration:** Test end-to-end trước khi demo

---

## 📅 TIMELINE & ĐIỂM KIỂM TRA (2 TUẦN)

### **Tuần 1: Foundation & Integration**

#### **Ngày 1-3:**

-   [ ] **Khang Hy:** Convert ONNX xong, test inference standalone
-   [ ] **Anh Khoa:** Setup FastAPI project, tạo REST API endpoints (mock data)
-   [ ] **Hồng Hạnh:** Setup React project, tạo components cơ bản
-   [ ] **Nick Võ:** Setup WebSocket skeleton, research throttling

**Checkpoint (Cuối ngày 3):** Mỗi người demo phần của mình chạy được độc lập

#### **Ngày 4-5:**

-   [ ] **Khang Hy + Anh Khoa:** Tích hợp inference vào REST API, test với ảnh tĩnh
-   [ ] **Hồng Hạnh:** Hoàn thiện UI/UX, mock data đầy đủ
-   [ ] **Nick Võ:** Implement WebSocket client, test kết nối với backend

**Checkpoint (Cuối ngày 5):** REST API hoạt động end-to-end

#### **Ngày 6-7:**

-   [ ] **Anh Khoa + 4:** Hoàn thiện WebSocket endpoint
-   [ ] **Hồng Hạnh + 4:** Tích hợp REST API vào frontend, test upload ảnh
-   [ ] **Khang Hy:** Tối ưu inference speed, giảm latency

**Checkpoint (Cuối tuần 1):**

-   REST API chạy mượt với ảnh
-   UI/UX hoàn chỉnh với mock data
-   WebSocket kết nối được

---

### **Tuần 2: Real-time & Polish**

#### **Ngày 8-10:**

-   [ ] **Nick Võ:** Tích hợp WebSocket vào UI, implement webcam streaming
-   [ ] **Anh Khoa:** Optimize WebSocket performance, error handling
-   [ ] **Khang Hy:** Fine-tune model inference, memory optimization
-   [ ] **Hồng Hạnh:** Polish UI, responsive design, loading states

**Checkpoint (Cuối ngày 10):** Webcam real-time chạy được (có thể còn lag)

#### **Ngày 11-12:**

-   [ ] **Nick Võ:** Tối ưu FPS, throttling, Web Workers (nếu cần)
-   [ ] **Tất cả:** Fix bugs, cross-browser testing
-   [ ] **Nick Võ:** Deploy frontend (Vercel/Nginx)
-   [ ] **Anh Khoa:** Chuẩn bị backend cho production

**Checkpoint (Cuối ngày 12):** App chạy mượt, FPS ổn định >=15

#### **Ngày 13-14:**

-   [ ] **Tất cả:**
    -   Final testing trên nhiều thiết bị
    -   Hoàn thiện documentation
    -   Chuẩn bị slide/script demo
    -   Dry-run demo đầy đủ

**Checkpoint (Cuối tuần 2):** 🎯 **DEMO HOÀN CHỈNH**

---

## ✅ CHECKLIST TRƯỚC KHI DEMO

-   [ ] Backend chạy được: `cd backend && sh run.sh`
-   [ ] Frontend chạy được: `cd frontend && npm start`
-   [ ] REST API test qua Postman thành công
-   [ ] WebSocket real-time chạy mượt (>=10 FPS)
-   [ ] UI đẹp, responsive, không lỗi
-   [ ] README.md đầy đủ hướng dẫn chạy
-   [ ] Code đã push lên Git, không có file thừa

---
