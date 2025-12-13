import { useRef, useEffect, useState } from "react";
import { useWebcamWebSocket } from "../hooks/useWebcamWebSocket";

export default function WebcamCanvas() {
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const [stream, setStream] = useState(null);

  // Handler khi BE gửi frame styled về
  const handleFrame = (blob) => {
    const url = URL.createObjectURL(blob);
    const ctx = canvasRef.current.getContext("2d");

    const img = new Image();
    img.onload = () => {
      ctx.drawImage(img, 0, 0, canvasRef.current.width, canvasRef.current.height);
      URL.revokeObjectURL(url);
    };
    img.src = url;
  };

  const wsRef = useWebcamWebSocket("/ws/video", handleFrame);

  // Start webcam (đã fix)
  const startWebcam = async () => {
    const s = await navigator.mediaDevices.getUserMedia({
      video: true,
      audio: false,
    });

    videoRef.current.srcObject = s;

    // Đợi video load xong mới stream frame
    videoRef.current.onloadedmetadata = () => {
      videoRef.current.play();
      setStream(s);
    };
  };

  // Send frames liên tục qua WebSocket (đã fix)
  useEffect(() => {
    const sendFrame = () => {
      if (
        !videoRef.current ||
        !wsRef.current ||
        wsRef.current.readyState !== WebSocket.OPEN
      ) {
        requestAnimationFrame(sendFrame);
        return;
      }

      // Webcam chưa sẵn sàng → không gửi frame rỗng
      if (
        videoRef.current.videoWidth === 0 ||
        videoRef.current.videoHeight === 0
      ) {
        requestAnimationFrame(sendFrame);
        return;
      }

      const canvas = document.createElement("canvas");
      canvas.width = videoRef.current.videoWidth;
      canvas.height = videoRef.current.videoHeight;

      const ctx = canvas.getContext("2d");
      ctx.drawImage(videoRef.current, 0, 0);

      canvas.toBlob(
        (blob) => {
          if (blob && wsRef.current.readyState === WebSocket.OPEN) {
            wsRef.current.send(blob);
          }
        },
        "image/jpeg",
        0.8
      );

      requestAnimationFrame(sendFrame);
    };

    if (stream) requestAnimationFrame(sendFrame);
  }, [stream, wsRef]);

  return (
    <div>
      {/* video preview */}
      <video
        ref={videoRef}
        autoPlay
        muted
        style={{ width: "640px", height: "480px", border: "1px solid #333" }}
      />

      {/* output (styled) */}
      <canvas
        ref={canvasRef}
        width={640}
        height={480}
        style={{ border: "1px solid #000", marginTop: "10px" }}
      />

      <button onClick={startWebcam}>Start Webcam</button>
    </div>
  );
}
