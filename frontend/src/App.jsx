import { useState, useEffect, useRef } from "react";
import Header from "./components/Header";
import ModeSelector from "./components/ModeSelector";
import ModelSelector from "./components/ModelSelector";
import UploadBox from "./components/UploadBox";
import StyleBox from "./components/StyleBox";
import ResultBox from "./components/ResultBox";
import Webcam from "./components/WebcamCanvas";

import "./App.css";

function App() {
  const [mode, setMode] = useState("image");
  const [model, setModel] = useState("adain");

  const [inputData, setInputData] = useState(null);
  const [inputFile, setInputFile] = useState(null); // ⭐ Lưu file gốc
  const [styleImage, setStyleImage] = useState(null);
  const [styleFile, setStyleFile] = useState(null); // ⭐ Lưu file style gốc
  const [result, setResult] = useState(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [progress, setProgress] = useState(""); // ⭐ trạng thái tiến trình

  const [webcamStream, setWebcamStream] = useState(null);
  const wsRef = useRef(null);
  const videoRef = useRef(null);

  // Reset khi đổi chế độ
  useEffect(() => {
    setInputData(null);
    setProgress("");
    if (webcamStream) {
      webcamStream.getTracks().forEach((t) => t.stop());
      setWebcamStream(null);
    }
    if (wsRef.current) {
      wsRef.current.close();
      wsRef.current = null;
    }
  }, [mode]);

  const handleUpload = (file) => {
    if (!file) return;
    const url = URL.createObjectURL(file);
    setInputData(url);
    setInputFile(file);
  };

  const handleStyleUpload = (data) => {
    if (data.type === "upload") {
      if (data.file) {
        const url = URL.createObjectURL(data.file);
        setStyleImage(url);
        setStyleFile(data.file);
      } else if (data.src) {
        setStyleImage(data.src);
        setStyleFile(null);
      }
    } else {
      setStyleImage(data.src);
      setStyleFile(null);
    }
  };

  const startWebcam = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: false });
      setWebcamStream(stream);
      setInputData(null);
      if (videoRef.current) videoRef.current.srcObject = stream;
    } catch (err) {
      alert("Không thể mở webcam: " + err.message);
    }
  };

  const handleClear = () => {
    setInputData(null);
    setInputFile(null);
    setProgress("");
    if (webcamStream) {
      webcamStream.getTracks().forEach((t) => t.stop());
      setWebcamStream(null);
    }
    if (wsRef.current) {
      wsRef.current.close();
      wsRef.current = null;
    }
    setResult(null);
  };

  // ============================
  // ⭐ START PROCESSING
  // ============================
  const handleStart = async () => {
    if (!inputData && !webcamStream) {
      alert("Please upload an image/video or open webcam first!");
      return;
    }
    if (!styleImage) {
      alert("Please select a style image!");
      return;
    }

    setIsProcessing(true);
    setResult(null);
    setProgress("Preparing files...");

    try {
      if (mode === "image") {
        // ===== Image POST request như trước =====
        const formData = new FormData();
        formData.append("model", model);

        // Content file
        let contentBlob = null;
        let contentFileName = "content.jpg";
        if (inputData) {
          const response = await fetch(inputData);
          contentBlob = await response.blob();
        }
        formData.append("content_file", contentBlob, contentFileName);

        // Style file
        let styleBlob = styleFile ? styleFile : await (await fetch(styleImage)).blob();
        formData.append("style_image", styleBlob, "style.jpg");

        const apiResponse = await fetch("/api/style/image", { method: "POST", body: formData });
        if (!apiResponse.ok) throw new Error("API request failed");
        const resultBlob = await apiResponse.blob();
        setResult(URL.createObjectURL(resultBlob));
      } else if (mode === "webcam" || mode === "video") {
        // ===== WebSocket streaming =====
        setProgress("Connecting to WebSocket...");
        wsRef.current = new WebSocket("/ws/video");

        wsRef.current.onopen = () => {
          console.log("WebSocket connected");
          setProgress("Streaming webcam frames...");
        };

        wsRef.current.onmessage = (event) => {
          const blob = new Blob([event.data], { type: "image/jpeg" });
          const url = URL.createObjectURL(blob);
          setResult(url);
        };

        wsRef.current.onerror = (err) => {
          console.error("WebSocket error:", err);
          setProgress("WebSocket error");
        };

        wsRef.current.onclose = () => {
          console.log("WebSocket closed");
          setProgress("WebSocket closed");
        };

        // Gửi frame liên tục
        const sendFrame = () => {
          if (!videoRef.current || !wsRef.current || wsRef.current.readyState !== WebSocket.OPEN) return;
          const canvas = document.createElement("canvas");
          canvas.width = videoRef.current.videoWidth;
          canvas.height = videoRef.current.videoHeight;
          canvas.getContext("2d").drawImage(videoRef.current, 0, 0);
          canvas.toBlob((blob) => {
            if (blob && wsRef.current.readyState === WebSocket.OPEN) wsRef.current.send(blob);
          }, "image/jpeg");
          // Bật webcam nếu chưa bật
          if (!videoRef.current.srcObject) {
            navigator.mediaDevices.getUserMedia({ video: true })
              .then(stream => {
                videoRef.current.srcObject = stream;
                videoRef.current.play();
              })
              .catch(err => {
                console.error("Lỗi mở webcam:", err);
                setProgress("Không thể mở webcam");
              });
          }

          if (wsRef.current.readyState === WebSocket.OPEN) {
            requestAnimationFrame(sendFrame);
          }
        };
        requestAnimationFrame(sendFrame);
      }
    } catch (error) {
      console.error("Error processing:", error);
      setProgress("Error occurred");
      alert("Failed to process: " + error.message);
      setTimeout(() => setResult(styleImage), 2000);
    } finally {
      setIsProcessing(mode === "image" ? false : true); // với webcam/video giữ WS mở
    }
  };

  return (
  <>
    <Header />
    <div className="content">
      <div className="top-buttons">
        <ModelSelector onSelect={setModel} />
        <ModeSelector onChange={setMode} />
      </div>

      <div className="three-boxes">
        {/* Content / Webcam Box */}
        <div className="box-with-label">
          {mode === "image" ? (
            <UploadBox
              mode={mode}
              inputData={inputData}
              onUpload={handleUpload}
              onClear={handleClear}
            />
          ) : (
            <Webcam
              videoRef={videoRef}
              webcamStream={webcamStream}
              onStart={startWebcam}
              onClear={handleClear}
            />
          )}
          <p className="box-label">
            {mode === "image" ? "Content Image" : "Webcam Input"}
          </p>
        </div>

        {/* Style Box */}
        <div className="box-with-label">
          <StyleBox styleImage={styleImage} onUploadStyle={handleStyleUpload} />
          <p className="box-label">Style Image</p>
        </div>

        {/* Result Box */}
        <div className="box-with-label">
          <ResultBox
            result={result}
            inputPreview={inputData}
            webcamStream={webcamStream}
            isProcessing={isProcessing}
          />
          <p className="box-label">
            {mode === "image" ? "Result Image" : "Result Video Frame"}
          </p>
        </div>
      </div>

      {/* Start Button */}
      <div className="start-button-wrapper">
        <button
          className={`start-btn ${isProcessing ? "processing" : ""}`}
          onClick={handleStart}
          disabled={isProcessing && mode === "image"} // giữ WS mở cho webcam/video
        >
          Start
        </button>
        <div className="progress">{progress}</div>
      </div>
    </div>
  </>
);
}

export default App;
