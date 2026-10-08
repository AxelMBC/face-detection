import { formatIndex, formatScore } from "../../lib/format";

export default function FaceList({ detections }) {
  return (
    <ol className="face-list">
      {detections.map((d, i) => (
        <li key={i}>
          <span className="face-list-id">{formatIndex(i)}</span>
          <span className="face-list-score">{formatScore(d.score)}</span>
          <span className="face-list-dim muted">
            {Math.round(d.box.width)}×{Math.round(d.box.height)}
          </span>
        </li>
      ))}
    </ol>
  );
}
