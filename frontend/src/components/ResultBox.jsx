import { useRef, useEffect } from "react";

export default function ResultBox({ result, inputPreview, webcamStream, isProcessing }) {
  const videoRef = useRef(null);

  // Gán stream vào webcam video nếu có
  useEffect(() => {
    if (videoRef.current && webcamStream) {
      videoRef.current.srcObject = webcamStream;
    }
  }, [webcamStream]);

  // =============================
  // ⭐ FULLSCREEN KẾT QUẢ
  // =============================
  const openFullscreen = (e) => {
    e.stopPropagation();

    let element;

    // Nếu có result (ảnh/video đã xử lý)
    if (result) {
      // Kiểm tra xem result là video hay ảnh
      const isVideo = result.endsWith('.mp4') || result.endsWith('.webm') || result.endsWith('.avi');
      
      if (isVideo) {
        element = document.createElement("video");
        element.src = result;
        element.controls = true;
        element.autoplay = true;
      } else {
        element = document.createElement("img");
        element.src = result;
      }
    }
    // Nếu chưa có result, hiện preview input
    else if (inputPreview) {
      const isVideo = inputPreview.includes('video');
      
      if (isVideo) {
        element = document.createElement("video");
        element.src = inputPreview;
        element.controls = true;
        element.autoplay = true;
      } else {
        element = document.createElement("img");
        element.src = inputPreview;
      }
    }
    // Nếu là webcam
    else if (webcamStream) {
      element = document.createElement("video");
      element.autoplay = true;
      element.srcObject = webcamStream;
    }

    if (!element) return;

    element.style.width = "100%";
    element.style.height = "100%";
    element.style.objectFit = "contain";

    // Wrapper full màn hình
    const wrapper = document.createElement("div");
    wrapper.style.position = "fixed";
    wrapper.style.top = 0;
    wrapper.style.left = 0;
    wrapper.style.width = "100vw";
    wrapper.style.height = "100vh";
    wrapper.style.background = "black";
    wrapper.style.zIndex = 999999;
    wrapper.style.display = "flex";
    wrapper.style.alignItems = "center";
    wrapper.style.justifyContent = "center";
    wrapper.style.cursor = "zoom-out";

    wrapper.appendChild(element);
    document.body.appendChild(wrapper);

    wrapper.onclick = () => wrapper.remove();
  };

  // =============================
  // ⭐ DOWNLOAD KẾT QUẢ
  // =============================
  const handleDownload = (e) => {
    e.stopPropagation();

    if (!result) return;

    // Tạo link download
    const link = document.createElement('a');
    link.href = result;
    
    // Xác định tên file và extension
    const isVideo = result.endsWith('.mp4') || result.endsWith('.webm') || result.endsWith('.avi');
    const timestamp = new Date().getTime();
    link.download = isVideo ? `result_${timestamp}.mp4` : `result_${timestamp}.png`;
    
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // ⭐ Kiểm tra có result hay không
  const hasResult = result && !isProcessing;

  return (
    <div className={`upload-box ${!hasResult && !isProcessing ? "empty" : ""}`}>
      
      {/* DOWNLOAD BUTTON - chỉ hiện khi có result */}
      {result && !isProcessing && (
        <button
          className="download-btn"
          onClick={handleDownload}
          title="Download"
        >
          ⬇
        </button>
      )}

      {/* LOADING STATE */}
      {isProcessing && (
        <div className="loading-container">
          <p className="loading-text">
            <span className="char char1">P</span>
            <span className="char char2">R</span>
            <span className="char char3">O</span>
            <span className="char char4">C</span>
            <span className="char char5">E</span>
            <span className="char char6">S</span>
            <span className="char char7">S</span>
            <span className="char char8">I</span>
            <span className="char char9">N</span>
            <span className="char char10">G</span>
            <span className="char char11">.</span>
            <span className="char char12">.</span>
            <span className="char char13">.</span>
          </p>
          <div className="wave-container">
            <div className="wave wave1"></div>
            <div className="wave wave2"></div>
            <div className="wave wave3"></div>
            <div className="wave wave4"></div>
            <div className="wave wave5"></div>
          </div>
        </div>
      )}

      {/* Hiển thị result (ảnh/video đã xử lý) */}
      {!isProcessing && result && (
        <>
          {result.endsWith('.mp4') || result.endsWith('.webm') || result.endsWith('.avi') ? (
            <video className="preview-video" src={result} controls />
          ) : (
            <img src={result} className="preview-img" alt="result" />
          )}
        </>
      )}

      {/* ⭐ Chỉ hiển thị text khi KHÔNG có result và KHÔNG đang processing */}
      {!isProcessing && !result && (
        <div className="text-block">
          <h2 className="title">Result</h2>
          <p className="content-text">Your result will appear here</p>
        </div>
      )}

      {/* FULLSCREEN BUTTON - chỉ hiện khi có result và không processing */}
      {result && !isProcessing && (
        <button
          className="fullscreen-btn"
          onClick={openFullscreen}
        >
          ⤢
        </button>
      )}
    </div>
  );
}