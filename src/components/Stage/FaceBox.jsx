import Corners from "../Corners";
import { formatIndex, formatScore } from "../../lib/format";

export default function FaceBox({ detection, index, fit }) {
  const { x, y, width, height } = detection.box;
  return (
    <div
      className="face-box"
      style={{
        left: fit.offsetX + x * fit.scale,
        top: fit.offsetY + y * fit.scale,
        width: width * fit.scale,
        height: height * fit.scale,
      }}
    >
      <Corners />
      <span className="tag">
        {formatIndex(index)} · {formatScore(detection.score)}
      </span>
    </div>
  );
}
