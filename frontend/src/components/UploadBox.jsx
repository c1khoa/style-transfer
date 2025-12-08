import { useRef, useEffect } from "react";

export default function UploadBox({
  mode,
  inputData,
  webcamStream,
  onUpload,
  onOpenWebcam,
  onClear,
}) {
  const inputRef = useRef(null);
  const videoRef = useRef(null);

  const handleClick = () => {
    if (mode === "webcam") {
      onOpenWebcam();
    } else {
      inputRef.current.click();
    }
  };

  const fileTypes = mode === "image" ? "image/png,image/jpeg" : mode === "video" ? "video/mp4,video/mkv,video/avi" : "";

  useEffect(() => {
    if (mode === "webcam" && videoRef.current && webcamStream) {
      videoRef.current.srcObject = webcamStream;
    }
  }, [webcamStream, mode]);

  const openFullscreen = (e) => {
    e.stopPropagation();
    let element;

    if (mode === "image" && inputData) {
      element = document.createElement("img");
      element.src = inputData;
      element.style.width = "100%";
      element.style.height = "100%";
      element.style.objectFit = "contain";
    }

    if (mode === "video" && inputData) {
      element = document.createElement("video");
      element.src = inputData;
      element.controls = true;
      element.autoplay = true;
      element.style.width = "100%";
      element.style.height = "100%";
      element.style.objectFit = "contain";
    }

    if (mode === "webcam" && webcamStream) {
      element = document.createElement("video");
      element.autoplay = true;
      element.srcObject = webcamStream;
      element.style.width = "100%";
      element.style.height = "100%";
      element.style.objectFit = "contain";
    }

    if (!element) return;

    const wrapper = document.createElement("div");
    wrapper.style.position = "fixed";
    wrapper.style.top = "0";
    wrapper.style.left = "0";
    wrapper.style.width = "100vw";
    wrapper.style.height = "100vh";
    wrapper.style.background = "black";
    wrapper.style.zIndex = "999999";
    wrapper.style.display = "flex";
    wrapper.style.alignItems = "center";
    wrapper.style.justifyContent = "center";
    wrapper.style.cursor = "zoom-out";

    wrapper.appendChild(element);
    document.body.appendChild(wrapper);
    wrapper.onclick = () => wrapper.remove();
  };

  // ⭐ Kiểm tra xem có content hay không
  const hasContent = inputData || webcamStream;

  return (
    <div className={`upload-box ${!hasContent ? "empty" : ""}`} onClick={handleClick}>
      {(inputData || webcamStream) && (
        <button className="close-btn" onClick={(e) => { e.stopPropagation(); onClear(); }}>
          ✕
        </button>
      )}

      {mode === "image" && inputData && (
        <img src={inputData} className="preview-img" alt="preview" />
      )}

      {mode === "video" && inputData && (
        <video className="preview-video" src={inputData} controls />
      )}

      {/* ⭐ CHỈ render video khi có webcamStream */}
      {mode === "webcam" && webcamStream && (
        <video className="preview-video" autoPlay ref={videoRef} />
      )}

      {/* ⭐ Chỉ hiển thị text khi KHÔNG có content */}
      {!hasContent && mode !== "webcam" && (
        <div className="text-block">
          <h2 className="title">Content</h2>
          <p className="content-text">Click here to upload your {mode}</p>
        </div>
      )}

      {!hasContent && mode === "webcam" && (
        <div className="text-block">
          <h2 className="title">Content</h2>
          <p className="content-text">Click here to open your camera</p>
        </div>
      )}

      {mode !== "webcam" && (
        <input ref={inputRef} type="file" accept={fileTypes} style={{ display: "none" }} onChange={(e) => onUpload(e.target.files[0])} />
      )}

      {(inputData || webcamStream) && (
        <button className="fullscreen-btn" onClick={openFullscreen}>
          ⤢
        </button>
      )}
    </div>
  );
}