from fastapi import APIRouter, WebSocket, WebSocketDisconnect
import cv2
import numpy as np
from app.utils import style_transfer_bytes

router = APIRouter()

@router.websocket("/ws/video")
async def websocket_video(ws: WebSocket):
    await ws.accept()
    print("Client connected")

    style_bytes = None
    model_name = "adain"

    try:
        while True:
            message = await ws.receive()

            if "text" in message:
                data = message["text"]
                import json
                payload = json.loads(data)

                if "style" in payload:
                    if payload["style"] is None:
                        style_bytes = None
                        print("⚪ Style cleared")
                    else:
                        import base64
                        style_bytes = base64.b64decode(payload["style"])
                        print("🔥 Style updated!")

                if "model" in payload:
                    model_name = payload["model"]

                continue

            if "bytes" in message:
                frame_bytes = message["bytes"]

                np_arr = np.frombuffer(frame_bytes, np.uint8)
                frame = cv2.imdecode(np_arr, cv2.IMREAD_COLOR)

                if frame is None:
                    print("Decode failed")
                    continue

                if style_bytes is None:
                    _, encoded = cv2.imencode(".jpg", frame)
                    await ws.send_bytes(encoded.tobytes())
                    continue

                try:
                    result = style_transfer_bytes(
                        frame_bytes,
                        style_bytes,
                        model_name
                    )
                except Exception as e:
                    print("❌ Style error:", e)
                    _, encoded = cv2.imencode(".jpg", frame)
                    await ws.send_bytes(encoded.tobytes())
                    continue

                await ws.send_bytes(result)

    except WebSocketDisconnect:
        print("Client disconnected")
