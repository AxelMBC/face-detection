import { formatIndex, formatScore } from "../../lib/format";

export default function FaceList({
  detections,
  redacting,
  isRedacted,
  onToggleFace,
}) {
  return (
    <ol className="face-list">
      {detections.map((d, i) => {
        const content = (
          <>
            <span className="face-list-id">{formatIndex(i)}</span>
            <span className="face-list-score">{formatScore(d.score)}</span>
            <span className="face-list-dim muted">
              {Math.round(d.box.width)}×{Math.round(d.box.height)}
            </span>
          </>
        );
        return (
          <li
            key={i}
            className={redacting && !isRedacted(i) ? "excluded" : undefined}
          >
            {redacting ? (
              <button
                type="button"
                className="face-list-row"
                aria-pressed={isRedacted(i)}
                aria-label={`Redact face ${formatIndex(i)}`}
                onClick={() => onToggleFace(i)}
              >
                {content}
              </button>
            ) : (
              <div className="face-list-row">{content}</div>
            )}
          </li>
        );
      })}
    </ol>
  );
}
