import { useRef, useState } from "react";
import DropOverlay from "./DropOverlay";
import { useWindowImageInput } from "./useWindowImageInput";
import "./ScanForm.css";

const SAMPLE_URL =
  "https://images.unsplash.com/photo-1529626455594-4ff0802cfb7e?w=800";

export default function ScanForm({ model, canScan, onScan, onScanFile }) {
  const [url, setUrl] = useState("");
  const fileInputRef = useRef(null);

  const scanFile = (file, source) => {
    if (!canScan) return;
    setUrl("");
    onScanFile(file, source);
  };

  const dragging = useWindowImageInput({ enabled: canScan, onFile: scanFile });

  const handleSubmit = (e) => {
    e.preventDefault();
    const trimmed = url.trim();
    if (!trimmed) return;
    onScan(trimmed);
  };

  const handleSampleClick = () => {
    setUrl(SAMPLE_URL);
  };

  const handleOpenFileClick = () => {
    fileInputRef.current.click();
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    // Reset so picking the same file again still fires `change`.
    e.target.value = "";
    if (file) scanFile(file, file.name);
  };

  return (
    <>
      <form className="input-row" onSubmit={handleSubmit}>
        <label htmlFor="url-input" className="input-prefix">
          URL
        </label>
        <input
          id="url-input"
          type="url"
          inputMode="url"
          placeholder="https://…"
          value={url}
          onChange={(e) => setUrl(e.target.value)}
          spellCheck={false}
          autoComplete="off"
          required
        />
        <button
          type="submit"
          className="scan-btn"
          disabled={!canScan || !url.trim()}
        >
          {model.action}
        </button>
      </form>

      <div className="input-foot">
        <button type="button" className="link-btn" onClick={handleSampleClick}>
          ↳ try a sample
        </button>
        <button
          type="button"
          className="link-btn"
          onClick={handleOpenFileClick}
          disabled={!canScan}
        >
          ↳ open a file
        </button>
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          onChange={handleFileChange}
          hidden
        />
        <span className="dot" />
        <span>URLs must allow CORS · or drop or paste an image file</span>
      </div>

      {dragging && canScan && <DropOverlay />}
    </>
  );
}
