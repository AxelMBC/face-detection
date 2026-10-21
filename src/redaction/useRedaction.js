import { useState } from "react";
import { mosaicRegion } from "../lib/mosaic";
import {
  outputFormat,
  redactedName,
  releaseCanvas,
  renderRedacted,
  saveBlob,
} from "./redactedFile";

const NO_EXCLUSIONS = new Set();
const EXPORT_ERROR = "Could not export this image.";

export function useRedaction({ status, image, detections, origin }) {
  const [redacting, setRedacting] = useState(false);
  const [selection, setSelection] = useState({
    detections,
    excluded: NO_EXCLUSIONS,
  });
  const [failure, setFailure] = useState(null);
  const [exporting, setExporting] = useState(false);

  const excluded =
    selection.detections === detections ? selection.excluded : NO_EXCLUSIONS;
  const exportError =
    failure?.detections === detections ? failure.message : null;
  const redactedCount = detections.length - excluded.size;
  const canDownload =
    redacting && status === "done" && redactedCount > 0 && !exporting;

  const toggleRedacting = () => setRedacting((on) => !on);

  const isRedacted = (i) => !excluded.has(i);

  const toggleFace = (i) => {
    const next = new Set(excluded);
    if (next.has(i)) next.delete(i);
    else next.add(i);
    setSelection({ detections, excluded: next });
  };

  const download = () => {
    if (!canDownload) return;
    setFailure(null);
    const fail = () => setFailure({ detections, message: EXPORT_ERROR });
    const imageSize = { w: image.naturalWidth, h: image.naturalHeight };
    const regions = detections
      .filter((_, i) => isRedacted(i))
      .map((d) => mosaicRegion(d.box, imageSize));
    const { type, ext, quality } = outputFormat(origin);

    let canvas = null;
    setExporting(true);
    try {
      canvas = renderRedacted(image, regions);
      canvas.toBlob(
        (blob) => {
          releaseCanvas(canvas);
          setExporting(false);
          if (blob) saveBlob(blob, redactedName(origin, ext));
          else fail();
        },
        type,
        quality,
      );
    } catch {
      if (canvas) releaseCanvas(canvas);
      setExporting(false);
      fail();
    }
  };

  return {
    redacting,
    toggleRedacting,
    isRedacted,
    toggleFace,
    redactedCount,
    canDownload,
    exporting,
    download,
    exportError,
  };
}
