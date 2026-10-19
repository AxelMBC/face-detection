import { useEffect, useRef, useState } from "react";
import * as faceapi from "@vladmandic/face-api";

const EMPTY_SIZE = { w: 0, h: 0 };

function hostOf(url) {
  try {
    return new URL(url).hostname;
  } catch {
    return "URL";
  }
}

function revokeObjectUrl(url) {
  if (url) URL.revokeObjectURL(url);
}

export function useFaceDetection({ ready }) {
  const [imageUrl, setImageUrl] = useState("");
  const [source, setSource] = useState("");
  const [scanId, setScanId] = useState(0);
  const [status, setStatus] = useState("idle");
  const [error, setError] = useState(null);
  const [detections, setDetections] = useState([]);
  const [naturalSize, setNaturalSize] = useState(EMPTY_SIZE);
  const latestScanRef = useRef(0);
  const objectUrlRef = useRef(null);

  useEffect(() => () => revokeObjectUrl(objectUrlRef.current), []);

  const start = (url, source) => {
    if (!ready) return;
    revokeObjectUrl(objectUrlRef.current);
    objectUrlRef.current = null;
    latestScanRef.current += 1;
    setScanId(latestScanRef.current);
    setError(null);
    setDetections([]);
    setNaturalSize(EMPTY_SIZE);
    setStatus("loading");
    setImageUrl(url);
    setSource(source);
  };

  const scan = (url) => start(url, hostOf(url));

  const scanFile = (file, source = file.name) => {
    if (!ready) return;
    if (!file.type.startsWith("image/")) {
      start("", source);
      setError("Not an image file.");
      setStatus("error");
      return;
    }
    const objectUrl = URL.createObjectURL(file);
    start(objectUrl, source);
    objectUrlRef.current = objectUrl;
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
    setError(
      objectUrlRef.current
        ? "Could not decode this image file."
        : "Could not load image. Check the URL or its CORS policy.",
    );
    setStatus("error");
  };

  return {
    imageUrl,
    source,
    scanId,
    status,
    error,
    detections,
    naturalSize,
    scan,
    scanFile,
    handleImgLoad,
    handleImgError,
  };
}
