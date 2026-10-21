import { useEffect, useRef } from "react";
import Corners from "../Corners";
import { formatIndex, formatScore } from "../../lib/format";
import { drawMosaicCells, mosaicGrid, mosaicRegion } from "../../lib/mosaic";

function placement({ x, y, width, height }, fit) {
  return {
    left: fit.offsetX + x * fit.scale,
    top: fit.offsetY + y * fit.scale,
    width: width * fit.scale,
    height: height * fit.scale,
  };
}

function MosaicPatch({ image, region, fit }) {
  const canvasRef = useRef(null);
  const { cols, rows } = mosaicGrid(region);
  const { x, y, width, height } = region;

  useEffect(() => {
    if (!image) return;
    drawMosaicCells(
      canvasRef.current.getContext("2d"),
      image,
      { x, y, width, height },
      { cols, rows },
    );
  }, [image, x, y, width, height, cols, rows]);

  return (
    <canvas
      ref={canvasRef}
      className="mosaic"
      width={cols}
      height={rows}
      style={placement(region, fit)}
    />
  );
}

export default function FaceBox({
  detection,
  index,
  fit,
  mode = "box",
  image,
  imageSize,
}) {
  if (mode === "redacted") {
    return (
      <MosaicPatch
        image={image}
        region={mosaicRegion(detection.box, imageSize)}
        fit={fit}
      />
    );
  }

  return (
    <div
      className={`face-box${mode === "excluded" ? " excluded" : ""}`}
      style={placement(detection.box, fit)}
    >
      {mode === "box" && <Corners />}
      <span className="tag">
        {formatIndex(index)} · {formatScore(detection.score)}
      </span>
    </div>
  );
}
