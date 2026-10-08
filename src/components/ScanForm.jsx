import { useState } from "react";
import "./ScanForm.css";

const SAMPLE_URL =
  "https://images.unsplash.com/photo-1529626455594-4ff0802cfb7e?w=800";

export default function ScanForm({ model, onScan }) {
  const [url, setUrl] = useState("");

  const handleSubmit = (e) => {
    e.preventDefault();
    const trimmed = url.trim();
    if (!trimmed) return;
    onScan(trimmed);
  };

  const handleSampleClick = () => {
    setUrl(SAMPLE_URL);
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
          disabled={model.tone !== "good" || !url.trim()}
        >
          {model.action}
        </button>
      </form>

      <div className="input-foot">
        <button type="button" className="link-btn" onClick={handleSampleClick}>
          ↳ try a sample
        </button>
        <span className="dot" />
        <span>images must allow CORS (Unsplash, Wikimedia, etc.)</span>
      </div>
    </>
  );
}
