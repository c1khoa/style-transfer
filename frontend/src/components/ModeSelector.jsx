import { useState } from "react";

export default function ModeSelector({ onChange }) {
  const [open, setOpen] = useState(false);
  const [selectedLabel, setSelectedLabel] = useState("Image");

  const handleSelect = (value, label) => {
    setSelectedLabel(label);
    onChange(value);
    setOpen(false);
  };

  return (
    <div className="dropdown-container">
      {/* Nút bấm */}
      <button className="dropdown-btn" onClick={() => setOpen(!open)}>
        {selectedLabel} ▼
      </button>

      {/* Dropdown */}
      {open && (
        <div className="dropdown-menu">
          <div
            className="dropdown-item"
            onClick={() => handleSelect("image", "Image")}
          >
            Image
          </div>
          <div
            className="dropdown-item"
            onClick={() => handleSelect("video", "Video")}
          >
            Video
          </div>
          <div
            className="dropdown-item"
            onClick={() => handleSelect("webcam", "Webcam")}
          >
            Webcam
          </div>
        </div>
      )}
    </div>
  );
}
