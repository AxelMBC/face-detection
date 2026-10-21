import { useEffect, useRef, useState } from "react";
import * as faceapi from "@vladmandic/face-api";

const EMPTY_SIZE = { w: 0, h: 0 };

// TinyFaceDetector needs multiples of 32; HIGH costs about (608/416)² ≈ 2.1× per run.
const DETAIL_INPUT_SIZE = { standard: 416, high: 608 };

function lastPathSegment(pathname) {
  const segment = pathname.split("/").filter(Boolean).pop() ?? "";
  try {
    return decodeURIComponent(segment);
  } catch {
    return segment;
  }
}

function describeUrl(url) {
  try {
    const { pathname, hostname } = new URL(url);
    const name = lastPathSegment(pathname) || hostname;
    return { source: hostname, origin: { name, type: "" } };
  } catch {
    return { source: "URL", origin: { name: "image", type: "" } };
  }
}

function revokeObjectUrl(url) {
  if (url) URL.revokeObjectURL(url);
}

export function useFaceDetection({ ready }) {
  const [imageUrl, setImageUrl] = useState("");
  const [source, setSource] = useState("");
  const [origin, setOrigin] = useState(null);
  const [scanId, setScanId] = useState(0);
  const [status, setStatus] = useState("idle");
  const [error, setError] = useState(null);
  const [detections, setDetections] = useState([]);
  const [naturalSize, setNaturalSize] = useState(EMPTY_SIZE);
  const [image, setImage] = useState(null);
  const [detail, setDetail] = useState("standard");
  const latestScanRef = useRef(0);
  const runRef = useRef(0);
  const objectUrlRef = useRef(null);

  useEffect(() => () => revokeObjectUrl(objectUrlRef.current), []);

  const start = (url, source, origin) => {
    if (!ready) return;
    revokeObjectUrl(objectUrlRef.current);
    objectUrlRef.current = null;
    latestScanRef.current += 1;
    runRef.current += 1;
    setScanId(latestScanRef.current);
    setError(null);
    setDetections([]);
    setNaturalSize(EMPTY_SIZE);
    setImage(null);
    setStatus("loading");
    setImageUrl(url);
    setSource(source);
    setOrigin(origin);
  };

  const scan = (url) => {
    const { source, origin } = describeUrl(url);
    start(url, source, origin);
  };

  const scanFile = (file, source = file.name) => {
    if (!ready) return;
    const origin = { name: file.name, type: file.type };
    if (!file.type.startsWith("image/")) {
      start("", source, origin);
      setError("Not an image file.");
      setStatus("error");
      return;
    }
    const objectUrl = URL.createObjectURL(file);
    start(objectUrl, source, origin);
    objectUrlRef.current = objectUrl;
  };

  const detect = async (img, detail) => {
    runRef.current += 1;
    const run = runRef.current;
    setError(null);
    setDetections([]);
    setStatus("detecting");
    try {
      const opts = new faceapi.TinyFaceDetectorOptions({
        inputSize: DETAIL_INPUT_SIZE[detail],
        scoreThreshold: 0.5,
      });
      const results = await faceapi.detectAllFaces(img, opts);
      if (run !== runRef.current) return;
      setDetections(results);
      setStatus("done");
    } catch (err) {
      if (run !== runRef.current) return;
      setError(err?.message ?? "Detection failed");
      setStatus("error");
    }
  };

  const selectDetail = (next) => {
    if (next === detail) return;
    setDetail(next);
    if (image) detect(image, next);
  };

  const handleImgLoad = (e) => {
    const img = e.currentTarget;
    setImage(img);
    setNaturalSize({ w: img.naturalWidth, h: img.naturalHeight });
    detect(img, detail);
  };

  const handleImgError = () => {
    setImage(null);
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
    origin,
    scanId,
    status,
    error,
    detections,
    naturalSize,
    image,
    detail,
    selectDetail,
    scan,
    scanFile,
    handleImgLoad,
    handleImgError,
  };
}
