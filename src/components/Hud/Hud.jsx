import FaceList from "./FaceList";
import { formatCount } from "../../lib/format";
import { statusLabel } from "./hudLabels";
import "./Hud.css";

export default function Hud({
  model,
  modelError,
  backend,
  status,
  error,
  detections,
  naturalSize,
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
      <div className="hud-row">
        <span className="hud-label">▸ STATUS</span>
        <span className={`hud-value ${status === "error" ? "bad" : ""}`}>
          {statusLabel(status)}
        </span>
      </div>
      <div className="hud-row">
        <span className="hud-label">▸ SUBJECTS</span>
        <span className="hud-value">
          {status === "done" || status === "detecting"
            ? formatCount(detections.length)
            : "--"}
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

      <div className="hud-divider" />

      {error && <div className="hud-error">! {error}</div>}
      {modelError && !error && (
        <div className="hud-error">! Failed to load detection model.</div>
      )}

      {status === "done" && detections.length > 0 && (
        <FaceList detections={detections} />
      )}

      {status === "done" && detections.length === 0 && (
        <div className="muted small">
          No faces detected. Try another image or one with clearer faces.
        </div>
      )}
    </aside>
  );
}
