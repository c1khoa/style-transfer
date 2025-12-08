import { useState, useEffect } from "react";
import Header from "./components/Header";
import ModeSelector from "./components/ModeSelector";
import ModelSelector from "./components/ModelSelector";
import UploadBox from "./components/UploadBox";
import StyleBox from "./components/StyleBox";
import ResultBox from "./components/ResultBox";

import "./App.css";

function App() {
  const [mode, setMode] = useState("image");
  const [model, setModel] = useState("model1");

  const [inputData, setInputData] = useState(null);
  const [inputFile, setInputFile] = useState(null); // ⭐ Lưu file gốc
  const [styleImage, setStyleImage] = useState(null);
  const [styleFile, setStyleFile] = useState(null); // ⭐ Lưu file style gốc
  const [result, setResult] = useState(null);
  const [isProcessing, setIsProcessing] = useState(false);

  const [webcamStream, setWebcamStream] = useState(null);

  // Reset khi đổi chế độ
  useEffect(() => {
    setInputData(null);

    if (webcamStream) {
      webcamStream.getTracks().forEach((t) => t.stop());
      setWebcamStream(null);
    }
  }, [mode]);

  // Upload file ảnh/video
  const handleUpload = (file) => {
    if (!file) return;
    const url = URL.createObjectURL(file);
    setInputData(url);
    setInputFile(file); // ⭐ Lưu file gốc để gửi backend
  };

  // Upload ảnh style - cập nhật để xử lý cả upload và preset
  const handleStyleUpload = (data) => {
    if (data.type === "upload") {
      // Nếu có file mới từ input
      if (data.file) {
        const url = URL.createObjectURL(data.file);
        setStyleImage(url);
        setStyleFile(data.file); // ⭐ Lưu file gốc
      } 
      // Nếu đã có src (từ slider)
      else if (data.src) {
        setStyleImage(data.src);
        setStyleFile(null); // ⭐ Clear file nếu chọn từ uploaded
      }
    } else {
      // Preset style
      setStyleImage(data.src);
      setStyleFile(null); // ⭐ Preset không có file, phải fetch từ URL
    }
  };

  // Mở webcam
  const startWebcam = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: true,
        audio: false,
      });
      setWebcamStream(stream);
      setInputData(null);
    } catch (err) {
      alert("Không thể mở webcam: " + err.message);
    }
  };

  // Nút X: clear ảnh / video / webcam
  const handleClear = () => {
    setInputData(null);
    setInputFile(null); // ⭐ Clear file gốc

    if (webcamStream) {
      webcamStream.getTracks().forEach((t) => t.stop());
      setWebcamStream(null);
    }
  };

  // ============================
  // ⭐ START PROCESSING
  // ============================
  const handleStart = async () => {
    // Kiểm tra có đủ input và style không
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

    try {
      // ============================
      // ⭐ CHUẨN BỊ DỮ LIỆU GỬI LÊN BACKEND
      // ============================
      
      // 1. Tạo FormData để gửi file
      const formData = new FormData();
      
      // 2. Thêm model đã chọn
      formData.append('model', model); // 'adain' hoặc 'sanet'
      
      // 3. Thêm mode (image/video/webcam)
      formData.append('mode', mode);
      
      // 4. Xử lý content file (input)
      if (mode === 'webcam' && webcamStream) {
        // Chụp ảnh từ webcam
        const canvas = document.createElement('canvas');
        const video = document.createElement('video');
        video.srcObject = webcamStream;
        await video.play();
        
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;
        canvas.getContext('2d').drawImage(video, 0, 0);
        
        // Convert canvas sang blob
        const blob = await new Promise(resolve => canvas.toBlob(resolve, 'image/jpeg'));
        formData.append('content_file', blob, 'webcam_capture.jpg');
      } else if (inputData) {
        // Lấy file gốc từ URL (nếu có lưu reference)
        // Hoặc fetch blob từ URL
        const response = await fetch(inputData);
        const blob = await response.blob();
        const fileName = mode === 'image' ? 'content.jpg' : 'content.mp4';
        formData.append('content_file', blob, fileName);
      }
      
      // 5. Xử lý style image
      const styleResponse = await fetch(styleImage);
      const styleBlob = await styleResponse.blob();
      formData.append('style_image', styleBlob, 'style.jpg');

      // ============================
      // ⭐ GỬI REQUEST ĐẾN BACKEND
      // ============================
      const apiResponse = await fetch('http://localhost:5000/api/style-transfer', {
        method: 'POST',
        body: formData,
        // Không set Content-Type, browser tự động set với boundary
      });

      if (!apiResponse.ok) {
        throw new Error('API request failed');
      }

      const data = await apiResponse.json();
      
      // ============================
      // ⭐ XỬ LÝ KẾT QUẢ TỪ BACKEND
      // ============================
      // Backend trả về URL hoặc base64 của ảnh/video kết quả
      setResult(data.result_url); // hoặc data.result_base64
      
    } catch (error) {
      console.error('Error processing:', error);
      alert('Failed to process image: ' + error.message);
      
      // ============================
      // ⭐ GIẢI PHƯƠNG GIẤU LẬP (CHỈ ĐỂ TEST GIAO DIỆN)
      // ============================
      // TODO: Xóa phần này khi có backend thật
      setTimeout(() => {
        setResult(styleImage);
      }, 2000);
    } finally {
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
          <div className="box-with-label">
            <UploadBox
              mode={mode}
              inputData={inputData}
              webcamStream={webcamStream}
              onUpload={handleUpload}
              onOpenWebcam={startWebcam}
              onClear={handleClear}
            />
            <p className="box-label">Content Image</p>
          </div>

          <div className="box-with-label">
            <StyleBox
              styleImage={styleImage}
              onUploadStyle={handleStyleUpload}
            />
            <p className="box-label">Style Image</p>
          </div>

          <div className="box-with-label">
            <ResultBox
              result={result}
              inputPreview={inputData}
              webcamStream={webcamStream}
              isProcessing={isProcessing}
            />
            <p className="box-label">Result Image</p>
          </div>
        </div>

        {/* START BUTTON - dưới StyleBox */}
        <div className="start-button-wrapper">
          <button 
            className={`start-btn ${isProcessing ? 'processing' : ''}`}
            onClick={handleStart}
            disabled={isProcessing}
          >
            Start
          </button>
        </div>
      </div>
    </>
  );
}

export default App;