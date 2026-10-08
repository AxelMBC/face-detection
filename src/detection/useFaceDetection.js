import { useRef, useState } from "react";
import * as faceapi from "@vladmandic/face-api";

const EMPTY_SIZE = { w: 0, h: 0 };

export function useFaceDetection({ ready }) {
  const [imageUrl, setImageUrl] = useState("");
  const [scanId, setScanId] = useState(0);
  const [status, setStatus] = useState("idle");
  const [error, setError] = useState(null);
  const [detections, setDetections] = useState([]);
  const [naturalSize, setNaturalSize] = useState(EMPTY_SIZE);
  const latestScanRef = useRef(0);

  const scan = (url) => {
    if (!ready) return;
    latestScanRef.current += 1;
    setScanId(latestScanRef.current);
    setError(null);
    setDetections([]);
    setNaturalSize(EMPTY_SIZE);
    setStatus("loading");
    setImageUrl(url);
  };

  const handleImgLoad = async (e) => {
    const img = e.currentTarget;
    const scan = latestScanRef.current;
    setNaturalSize({ w: img.naturalWidth, h: img.naturalHeight });
    setStatus("detecting");
    try {
      const opts = new faceapi.TinyFaceDetectorOptions({
        inputSize: 416,
        scoreThreshold: 0.5,
      });
      const results = await faceapi.detectAllFaces(img, opts);
      if (scan !== latestScanRef.current) return;
      setDetections(results);
      setStatus("done");
    } catch (err) {
      if (scan !== latestScanRef.current) return;
      setError(err?.message ?? "Detection failed");
      setStatus("error");
    }
  };

  const handleImgError = () => {
    setError("Could not load image. Check the URL or its CORS policy.");
    setStatus("error");
  };

  return {
    imageUrl,
    scanId,
    status,
    error,
    detections,
    naturalSize,
    scan,
    handleImgLoad,
    handleImgError,
  };
}
