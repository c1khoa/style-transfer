import { useEffect, useRef } from "react";

export function useWebcamWebSocket(url, onFrame) {
  const wsRef = useRef(null);

  useEffect(() => {
    if (!url) return;

    wsRef.current = new WebSocket(url);
    wsRef.current.binaryType = "blob";

    wsRef.current.onopen = () => console.log("WS connected");
    wsRef.current.onmessage = (event) => {
      const blob = event.data;
      if (onFrame) onFrame(blob);  // callback để update canvas
    };
    wsRef.current.onerror = (err) => console.error("WS error:", err);
    wsRef.current.onclose = () => console.log("WS closed");

    return () => {
      if (wsRef.current) wsRef.current.close();
    };
  }, [url]);

  return wsRef;
}
