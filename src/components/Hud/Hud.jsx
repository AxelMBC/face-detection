import FaceList from "./FaceList";
import { formatCount } from "../../lib/format";
import { statusLabel } from "./hudLabels";
import "./Hud.css";

const DETAIL_LEVELS = ["standard", "high"];

export default function Hud({
  model,
  modelError,
  backend,
  source,
  status,
  error,
  detections,
  naturalSize,
  detail,
  onDetailChange,
  redaction,
}) {
  return (
    <aside className="hud">
      <div className="hud-row">
        <span className="hud-label">▸ MODEL</span>
        <span className={`hud-value ${model.tone}`}>{model.label}</span>
      </div>
      <div className="hud-row">
        <span className="hud-label">▸ BACKEND</span>
        <span className={`hud-value ${backend ? "good" : "pending"}`}>
          {backend ? backend.toUpperCase() : "…"}
        </span>
      </div>
      {source && (
        <div className="hud-row">
          <span className="hud-label">▸ SOURCE</span>
          <span className="hud-value source" title={source}>
            {source}
          </span>
        </div>
      )}
      <div className="hud-row">
        <span className="hud-label">▸ STATUS</span>
        <span className={`hud-value ${status === "error" ? "bad" : ""}`}>
          {statusLabel(status)}
        </span>
      </div>
      <div className="hud-row">
        <span className="hud-label">▸ SUBJECTS</span>
        <span className="hud-value">
          {status === "done" ? formatCount(detections.length) : "--"}
        </span>
      </div>
      {naturalSize.w > 0 && (
        <div className="hud-row">
          <span className="hud-label">▸ RESOLUTION</span>
          <span className="hud-value muted">
            {naturalSize.w}×{naturalSize.h}
          </span>
        </div>
      )}

      <div className="hud-row">
        <span className="hud-label">▸ DETAIL</span>
        <div className="hud-segment" role="group" aria-label="Detection detail">
          {DETAIL_LEVELS.map((level) => (
            <button
              key={level}
              type="button"
              aria-pressed={detail === level}
              onClick={() => onDetailChange(level)}
            >
              {level}
            </button>
          ))}
        </div>
      </div>
      <div className="hud-row">
        <span className="hud-label">▸ REDACT</span>
        <button
          type="button"
          className="hud-toggle"
          aria-pressed={redaction.redacting}
          aria-label="Redact faces"
          onClick={redaction.toggleRedacting}
        >
          {redaction.redacting ? "ON" : "OFF"}
        </button>
      </div>

      <div className="hud-divider" />

      {error && <div className="hud-error">! {error}</div>}
      {modelError && !error && (
        <div className="hud-error">! Failed to load detection model.</div>
      )}

      {status === "done" && detections.length > 0 && (
        <FaceList
          detections={detections}
          redacting={redaction.redacting}
          isRedacted={redaction.isRedacted}
          onToggleFace={redaction.toggleFace}
        />
      )}

      {status === "done" && detections.length === 0 && (
        <div className="muted small">
          No faces detected. Try another image or one with clearer faces.
        </div>
      )}

      {redaction.redacting && (
        <>
          <button
            type="button"
            className="scan-btn download-btn"
            disabled={!redaction.canDownload}
            onClick={redaction.download}
          >
            {redaction.exporting ? "> EXPORTING" : "> DOWNLOAD"}
          </button>
          {status === "done" && (
            <div className="muted small">
              REDACTING {formatCount(redaction.redactedCount)} OF{" "}
              {formatCount(detections.length)}. Check the preview for missed
              faces before sharing.
            </div>
          )}
          {redaction.exportError && (
            <div className="hud-error">! {redaction.exportError}</div>
          )}
        </>
      )}
    </aside>
  );
}
