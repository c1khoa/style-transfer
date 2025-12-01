from fastapi import APIRouter, WebSocket, WebSocketDisconnect
import base64
from app.utils import style_transfer_bytes

router = APIRouter()

@router.websocket("/ws/style")
async def websocket_style_transfer(ws: WebSocket):
    await ws.accept()

    try:
        while True:
            data = await ws.receive_json()

            # client gửi:
            # { "content": "base64...", "style": "base64...", "model": "adain" }

            content_b64 = data.get("content")
            style_b64 = data.get("style")
            model_name = data.get("model")

            if content_b64 is None or model_name is None:
                await ws.send_json({"error": "Missing fields"})
                continue

            content_bytes = base64.b64decode(content_b64)
            style_bytes = base64.b64decode(style_b64) if style_b64 else None

            result = style_transfer_bytes(content_bytes, style_bytes, None, model_name)

            result_b64 = base64.b64encode(result).decode()

            await ws.send_json({"result": result_b64})

    except WebSocketDisconnect:
        print("Client disconnected")
