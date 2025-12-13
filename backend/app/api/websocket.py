from fastapi import APIRouter, WebSocket, WebSocketDisconnect, UploadFile, File
import cv2
import numpy as np
import asyncio
import time
from app.utils import style_transfer_bytes  

router = APIRouter()

processing = False
latest_frame = None
CURRENT_STYLE_IMAGE = None
CURRENT_MODEL_NAME = "adain"
FRAME_INTERVAL = 1 / 2     # xử lý tối đa 5 FPS
last_frame_time = 0


@router.post("/ws/set")
async def set_style(style_image: UploadFile = File(...), model: str = "adain"):
    global CURRENT_STYLE_IMAGE, CURRENT_MODEL_NAME

    bytes_data = await style_image.read()

    img_np = np.frombuffer(bytes_data, np.uint8)
    CURRENT_STYLE_IMAGE = cv2.imdecode(img_np, cv2.IMREAD_COLOR)
    CURRENT_MODEL_NAME = model

    return {"ok": True}


@router.websocket("/ws/video")
async def websocket_video(ws: WebSocket):
    global processing, latest_frame, last_frame_time
    processing = False
    latest_frame = None
    last_frame_time = 0

    await ws.accept()
    print("🔌 WebSocket connected")

    async def process_loop():
        """Process newest frame only, skip old frames."""
        global processing, latest_frame

        if processing:
            return

        processing = True

        while latest_frame is not None:
            frame_bytes = latest_frame
            latest_frame = None

            # Decode content frame
            np_arr = np.frombuffer(frame_bytes, np.uint8)
            content_np = cv2.imdecode(np_arr, cv2.IMREAD_COLOR)
            if content_np is None:
                print("❌ decode content failed")
                processing = False
                return

            # Encode style image
            ok, style_buf = cv2.imencode(".jpg", CURRENT_STYLE_IMAGE)
            style_bytes = style_buf.tobytes()

            # Encode content
            ok, content_buf = cv2.imencode(".jpg", content_np)
            content_bytes = content_buf.tobytes()

            # Apply style transfer
            try:
                output_bytes = style_transfer_bytes(
                    content_bytes=content_bytes,
                    style_bytes=style_bytes,
                    model_name=CURRENT_MODEL_NAME
                )
            except Exception as e:
                print("❌ Style transfer error:", e)
                processing = False
                return

            await ws.send_bytes(output_bytes)

        processing = False

    try:
        while True:
            frame_bytes = await ws.receive_bytes()

            # ==== FPS LIMIT HERE ====
            now = time.time()
            if now - last_frame_time < FRAME_INTERVAL:
                continue  # skip frame (too soon)
            last_frame_time = now
            # =========================

            latest_frame = frame_bytes
            asyncio.create_task(process_loop())

    except WebSocketDisconnect:
        print("🔌 WebSocket closed")
