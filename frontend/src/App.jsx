import { useState, useEffect, useRef } from "react";
import Header from "./components/Header";
import ModeSelector from "./components/ModeSelector";
import ModelSelector from "./components/ModelSelector";
import UploadBox from "./components/UploadBox";
import StyleBox from "./components/StyleBox";
import ResultBox from "./components/ResultBox";

import "./App.css";

function App() {
  const [mode, setMode] = useState("image");
  const [model, setModel] = useState("adain");

  const [inputData, setInputData] = useState(null);
  const [inputFile, setInputFile] = useState(null);
  const [styleImage, setStyleImage] = useState(null);
  const [styleFile, setStyleFile] = useState(null);
  const [result, setResult] = useState(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [progress, setProgress] = useState("");

  const [webcamStream, setWebcamStream] = useState(null);
  const wsRef = useRef(null);
  const videoRef = useRef(null);

  // Reset khi đổi chế độ
  useEffect(() => {
    setInputData(null);
    setInputFile(null);
    setResult(null);
    setProgress("");
    setIsProcessing(false);
    
    // Dừng webcam stream nếu có
    if (webcamStream) {
      webcamStream.getTracks().forEach((t) => t.stop());
      setWebcamStream(null);
    }
    
    // Đóng WebSocket nếu có
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
      const stream = await navigator.mediaDevices.getUserMedia({ 
        video: true, 
        audio: false 
      });
      setWebcamStream(stream);
      setInputData(null);
    } catch (err) {
      alert("Không thể mở webcam: " + err.message);
    }
  };

  const handleClear = () => {
    setInputData(null);
    setInputFile(null);
    setResult(null);
    setProgress("");
    
    if (webcamStream) {
      webcamStream.getTracks().forEach((t) => t.stop());
      setWebcamStream(null);
    }
    
    if (wsRef.current) {
      wsRef.current.close();
      wsRef.current = null;
    }
    
    setIsProcessing(false);
  };

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
        // Image processing
        const formData = new FormData();
        formData.append("model", model);

        let contentBlob = null;
        if (inputFile) {
          contentBlob = inputFile;
        } else if (inputData) {
          const response = await fetch(inputData);
          contentBlob = await response.blob();
        }
        formData.append("content_file", contentBlob, "content.jpg");

        let styleBlob = styleFile ? styleFile : await (await fetch(styleImage)).blob();
        formData.append("style_image", styleBlob, "style.jpg");

        setProgress("Processing image...");
        const apiResponse = await fetch("/api/style/image", { 
          method: "POST", 
          body: formData 
        });
        
        if (!apiResponse.ok) throw new Error("API request failed");
        
        const resultBlob = await apiResponse.blob();
        setResult(URL.createObjectURL(resultBlob));
        setProgress("Done!");
        setIsProcessing(false);
        
      } else if (mode === "webcam" || mode === "video") {
        // WebSocket streaming
        setProgress("Connecting to WebSocket...");
        wsRef.current = new WebSocket("ws://localhost:8000/ws/video");

        wsRef.current.onopen = () => {
          console.log("WebSocket connected");
          setProgress("Streaming frames...");
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
          setProgress("Connection closed");
          setIsProcessing(false);
        };

        // Send frames continuously
        const sendFrame = () => {
          if (!wsRef.current || wsRef.current.readyState !== WebSocket.OPEN) {
            return;
          }

          let videoElement = null;
          
          // Lấy video element từ webcam hoặc uploaded video
          if (mode === "webcam" && webcamStream) {
            // Tìm video element trong UploadBox
            const uploadBox = document.querySelector('.upload-box video');
            if (uploadBox && uploadBox.videoWidth > 0) {
              videoElement = uploadBox;
            }
          } else if (mode === "video" && inputData) {
            const uploadBox = document.querySelector('.upload-box video');
            if (uploadBox && uploadBox.videoWidth > 0) {
              videoElement = uploadBox;
            }
          }

          if (videoElement) {
            const canvas = document.createElement("canvas");
            canvas.width = videoElement.videoWidth;
            canvas.height = videoElement.videoHeight;
            canvas.getContext("2d").drawImage(videoElement, 0, 0);
            
            canvas.toBlob((blob) => {
              if (blob && wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
                wsRef.current.send(blob);
              }
            }, "image/jpeg", 0.8);
          }

          if (wsRef.current.readyState === WebSocket.OPEN) {
            requestAnimationFrame(sendFrame);
          }
        };
        
        // Đợi một chút để video element sẵn sàng
        setTimeout(() => {
          requestAnimationFrame(sendFrame);
        }, 500);
      }
    } catch (error) {
      console.error("Error processing:", error);
      setProgress("Error occurred: " + error.message);
      alert("Failed to process: " + error.message);
      setIsProcessing(false);
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
          {/* Content Box - Dùng chung UploadBox cho cả 3 mode */}
          <div className="box-with-label">
            <UploadBox
              mode={mode}
              inputData={inputData}
              webcamStream={webcamStream}
              onUpload={handleUpload}
              onOpenWebcam={startWebcam}
              onClear={handleClear}
            />
            <p className="box-label">
              {mode === "image" ? "Content Image" : mode === "video" ? "Content Video" : "Webcam Input"}
            </p>
          </div>

          {/* Style Box */}
          <div className="box-with-label">
            <StyleBox 
              styleImage={styleImage} 
              onUploadStyle={handleStyleUpload} 
            />
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
              {mode === "image" ? "Result Image" : "Result Frame"}
            </p>
          </div>
        </div>

        {/* Start Button */}
        <div className="start-button-wrapper">
          <button
            className={`start-btn ${isProcessing ? "processing" : ""}`}
            onClick={handleStart}
            disabled={isProcessing && mode === "image"}
          >
            {isProcessing ? "Processing..." : "Start"}
          </button>
          {progress && <div className="progress">{progress}</div>}
        </div>
      </div>
    </>
  );
}

export default App;