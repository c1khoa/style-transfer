import { useState, useRef, useEffect } from "react";

export default function StyleBox({ styleImage, onUploadStyle }) {
  const [isOpen, setIsOpen] = useState(false);
  const [styleList, setStyleList] = useState([]);
  const [showSlider, setShowSlider] = useState(false);
  const [uploadedImage, setUploadedImage] = useState(null);
  const [currentIndex, setCurrentIndex] = useState(0);
  const fileRef = useRef(null);

  useEffect(() => {
    fetch("/styles.json")
      .then((res) => res.json())
      .then((data) => setStyleList(data.styles))
      .catch((err) => console.error("Cannot load styles.json:", err));
  }, []);

  const getAllImages = () => {
    const images = [];
    images.push({ type: "upload", src: uploadedImage || null });
    styleList.forEach((src) => {
      images.push({ type: "preset", src });
    });
    return images;
  };

  const handleClickBox = () => {
    if (!showSlider) {
      setIsOpen(true);
    }
  };

  const handleUploadClick = () => {
    fileRef.current.click();
  };

  const handleFileChange = (e) => {
    if (!e.target.files[0]) return;
    const url = URL.createObjectURL(e.target.files[0]);
    setUploadedImage(url);
    setShowSlider(true);
    setCurrentIndex(0);
    setIsOpen(false);
    onUploadStyle({ type: "upload", file: e.target.files[0] });
  };

  const handleGridItemClick = (img) => {
    const images = getAllImages();
    const index = images.findIndex((item) => item.src === img);
    setCurrentIndex(index >= 0 ? index : 0);
    setShowSlider(true);
    setIsOpen(false);
  };

  const handlePrevious = (e) => {
    e.stopPropagation();
    const images = getAllImages();
    setCurrentIndex((prev) => (prev > 0 ? prev - 1 : images.length - 1));
  };

  const handleNext = (e) => {
    e.stopPropagation();
    const images = getAllImages();
    setCurrentIndex((prev) => (prev < images.length - 1 ? prev + 1 : 0));
  };

  const handleSelectCurrent = (e) => {
    e.stopPropagation();
    const images = getAllImages();
    const current = images[currentIndex];
    
    if (current.type === "upload" && !current.src) {
      fileRef.current.click();
      return;
    }
    
    if (current.type === "upload") {
      onUploadStyle({ type: "upload", file: null, src: current.src });
    } else {
      onUploadStyle({ type: "preset", src: current.src });
    }
    
    setShowSlider(false);
  };

  const handleCloseSlider = (e) => {
    e.stopPropagation();
    setShowSlider(false);
  };

  const openFullscreen = (e) => {
    e.stopPropagation();
    if (!styleImage) return;

    const element = document.createElement("img");
    element.src = styleImage;
    element.style.width = "100%";
    element.style.height = "100%";
    element.style.objectFit = "contain";

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

  const images = getAllImages();
  const currentImage = images[currentIndex];

  return (
    <div className={`upload-box ${!styleImage ? "style-empty" : ""}`} onClick={handleClickBox}>
      {/* ⭐ Hiển thị ảnh hoặc text placeholder */}
      {styleImage ? (
        <img src={styleImage} alt="style preview" className="preview-img" />
      ) : (
        <div className="text-block">
          <h2 className="title">Style</h2>
          <p className="content-text">Upload and/or select your style image</p>
        </div>
      )}

      {styleImage && !isOpen && !showSlider && (
        <button className="fullscreen-btn" onClick={openFullscreen}>
          ⤢
        </button>
      )}

      {isOpen && !showSlider && (
        <div className="style-grid-container" onClick={(e) => e.stopPropagation()}>
          <div className="style-grid">
            <div className="style-item upload-item" onClick={handleUploadClick}>
            </div>
            {styleList.map((img, idx) => (
              <div key={idx} className="style-item" onClick={() => handleGridItemClick(img)}>
                <img src={img} alt={`style ${idx}`} className="style-thumb" />
              </div>
            ))}
          </div>
        </div>
      )}

      {showSlider && (
        <div className="slider-container" onClick={(e) => e.stopPropagation()}>
          <button className="close-btn" onClick={handleCloseSlider}>✕</button>
          <button className="select-btn" onClick={handleSelectCurrent}>✓</button>
          <div className="slider-image-wrapper">
            {currentImage && (
              <>
                {currentImage.type === "upload" && !currentImage.src && (
                  <div className="upload-placeholder" onClick={() => fileRef.current.click()}>
                    <span className="upload-placeholder-text">Click to Upload</span>
                  </div>
                )}
                {currentImage.src && (
                  <>
                    <img src={currentImage.src} alt="style" className="slider-image" />
                    {currentImage.type === "upload" && (
                      <div className="upload-badge">
                        <img src="/upload_style_icon.png" alt="upload" className="upload-icon" />
                      </div>
                    )}
                  </>
                )}
              </>
            )}
          </div>
          <button className="slider-btn prev-btn" onClick={handlePrevious}>‹</button>
          <button className="slider-btn next-btn" onClick={handleNext}>›</button>
          <div className="slider-counter">{currentIndex + 1} / {images.length}</div>
        </div>
      )}

      <input type="file" accept="image/png, image/jpeg" style={{ display: "none" }} ref={fileRef} onChange={handleFileChange} />
    </div>
  );
}