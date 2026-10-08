import FaceBox from "./FaceBox";
import { fitContain } from "./fitContain";
import { useRenderedSize } from "./useRenderedSize";
import "./Stage.css";

export default function Stage({
  imageUrl,
  scanId,
  status,
  detections,
  naturalSize,
  onImgLoad,
  onImgError,
}) {
  const [observeRef, renderedSize] = useRenderedSize();
  const fit = fitContain(naturalSize, renderedSize);

  return (
    <div className={`stage stage-${status}`} data-empty={!imageUrl}>
      {!imageUrl && (
        <div className="stage-empty">
          <div className="reticle" aria-hidden="true">
            <span />
            <span />
            <span />
            <span />
          </div>
          <p>NO TARGET LOADED</p>
          <p className="muted">submit a URL to begin scanning</p>
        </div>
      )}

      {imageUrl && (
        <div className="canvas">
          <img
            key={scanId}
            ref={observeRef}
            src={imageUrl}
            alt=""
            crossOrigin="anonymous"
            onLoad={onImgLoad}
            onError={onImgError}
            draggable={false}
          />
          <div className="overlay" aria-hidden="true">
            {detections.map((det, i) => (
              <FaceBox key={i} detection={det} index={i} fit={fit} />
            ))}
          </div>
          {status === "detecting" && (
            <div className="scanline" aria-hidden="true" />
          )}
        </div>
      )}
    </div>
  );
}
