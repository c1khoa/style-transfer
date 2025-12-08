import { useState } from "react";

export default function ModelSelector({ onSelect }) {
  const [open, setOpen] = useState(false);
  const [selectedModel, setSelectedModel] = useState("Adain");

  const handleSelect = (value, label) => {
    setSelectedModel(label);
    onSelect(value);
    setOpen(false);
  };

  return (
    <div className="dropdown-container">
      {/* Button */}
      <button className="dropdown-btn" onClick={() => setOpen(!open)}>
        {selectedModel} ▼
      </button>

      {/* Dropdown menu */}
      {open && (
        <div className="dropdown-menu">
          <div
            className="dropdown-item"
            onClick={() => handleSelect("adain", "Adain")}
          >
            Adain
          </div>
          <div
            className="dropdown-item"
            onClick={() => handleSelect("sanet", "Sanet")}
          >
            Sanet
          </div>
        </div>
      )}
    </div>
  );
}
