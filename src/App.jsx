import { useCallback, useEffect, useRef, useState } from "react";
import * as faceapi from "@vladmandic/face-api";
import { initBackend } from "./tfBackend";
import "./App.css";

const MODEL_URL = "/models";

function useFaceApi() {
  const [ready, setReady] = useState(false);
  const [error, setError] = useState(null);
  const [backend, setBackend] = useState(null);

  useEffect(() => {
    let cancelled = false;
    initBackend()
      .then((name) => {
        if (cancelled) return;
        setBackend(name);
        return faceapi.nets.tinyFaceDetector.loadFromUri(MODEL_URL);
      })
      .then(() => {
        if (!cancelled) setReady(true);
      })
      .catch((e) => {
        if (!cancelled) setError(e);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  return { ready, error, backend };
}

const SAMPLE_URL =
  "https://images.unsplash.com/photo-1529626455594-4ff0802cfb7e?w=800";

const EMPTY_SIZE = { w: 0, h: 0 };

// Must match `.canvas img` in App.css (object-fit: contain, centred).
function fitContain(natural, rendered) {
  if (!natural.w || !natural.h) return { scale: 1, offsetX: 0, offsetY: 0 };
  const scale = Math.min(rendered.w / natural.w, rendered.h / natural.h);
  return {
    scale,
    offsetX: (rendered.w - natural.w * scale) / 2,
    offsetY: (rendered.h - natural.h * scale) / 2,
  };
}

function formatIndex(i) {
  return `#${String(i + 1).padStart(2, "0")}`;
}

function formatScore(score) {
  return `${(score * 100).toFixed(1)}%`;
}

const MODEL_STATES = {
  loading: { label: "LOADING…", tone: "pending", action: "> LOADING" },
  ready: { label: "READY", tone: "good", action: "> SCAN" },
  error: { label: "ERROR", tone: "bad", action: "> UNAVAILABLE" },
};

function modelState({ ready, error }) {
  if (error) return MODEL_STATES.error;
  return ready ? MODEL_STATES.ready : MODEL_STATES.loading;
}

function useFaceDetection() {
  const [imageUrl, setImageUrl] = useState("");
  const [scanId, setScanId] = useState(0);
  const [status, setStatus] = useState("idle");
  const [error, setError] = useState(null);
  const [detections, setDetections] = useState([]);
  const [naturalSize, setNaturalSize] = useState(EMPTY_SIZE);
  const [renderSize, setRenderSize] = useState(EMPTY_SIZE);
  const latestScanRef = useRef(0);

  // Unstable identity loops: React re-runs the ref, the observer re-fires setState.
  const observeImg = useCallback((img) => {
    if (!img) return;
    const ro = new ResizeObserver(() => {
      setRenderSize({ w: img.clientWidth, h: img.clientHeight });
    });
    ro.observe(img);
    return () => ro.disconnect();
  }, []);

  const scan = (url) => {
    latestScanRef.current += 1;
    setScanId(latestScanRef.current);
    setError(null);
    setDetections([]);
    setNaturalSize(EMPTY_SIZE);
    setRenderSize(EMPTY_SIZE);
    setStatus("loading");
    setImageUrl(url);
  };

  const handleImgLoad = async (e) => {
    const img = e.currentTarget;
    const scan = latestScanRef.current;
    setNaturalSize({ w: img.naturalWidth, h: img.naturalHeight });
    setRenderSize({ w: img.clientWidth, h: img.clientHeight });
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
    fit: fitContain(naturalSize, renderSize),
    observeImg,
    handleImgLoad,
    handleImgError,
    scan,
  };
}

export default function App() {
  const { ready: modelReady, error: modelError, backend } = useFaceApi();
  const {
    imageUrl,
    scanId,
    status,
    error,
    detections,
    naturalSize,
    fit,
    observeImg,
    handleImgLoad,
    handleImgError,
    scan,
  } = useFaceDetection();
  const [url, setUrl] = useState("");

  const handleSubmit = (e) => {
    e.preventDefault();
    const trimmed = url.trim();
    if (!trimmed || !modelReady) return;
    scan(trimmed);
  };

  const handleSampleClick = () => {
    setUrl(SAMPLE_URL);
  };

  const model = modelState({ ready: modelReady, error: modelError });

  const statusLabel = (() => {
    switch (status) {
      case "idle":
        return "AWAITING INPUT";
      case "loading":
        return "FETCHING IMAGE";
      case "detecting":
        return "ANALYZING PIXELS";
      case "done":
        return "SCAN COMPLETE";
      case "error":
        return "SCAN FAILED";
      default:
        return "";
    }
  })();

  return (
    <div className="shell">
      <header className="top">
        <div className="brand">
          <span className="brand-mark" aria-hidden="true" />
          <span className="brand-text">NEURAL//FACE.SCANNER</span>
        </div>
        <div className="meta">v0.1 · TINY_FACE_DETECTOR · CLIENT-SIDE</div>
      </header>

      <section className="hero-block">
        <h1>
          Detect faces in <span className="accent">any image</span>.
        </h1>
        <p className="lede">
          Paste a public image URL. The model loads in your browser, runs
          locally, and overlays bounding boxes on every face it finds. No
          uploads, no servers.
        </p>
      </section>

      <form className="input-row" onSubmit={handleSubmit}>
        <label htmlFor="url-input" className="input-prefix">
          URL
        </label>
        <input
          id="url-input"
          type="url"
          inputMode="url"
          placeholder="https://…"
          value={url}
          onChange={(e) => setUrl(e.target.value)}
          spellCheck={false}
          autoComplete="off"
          required
        />
        <button
          type="submit"
          className="scan-btn"
          disabled={!modelReady || !url.trim()}
        >
          {model.action}
        </button>
      </form>

      <div className="input-foot">
        <button type="button" className="link-btn" onClick={handleSampleClick}>
          ↳ try a sample
        </button>
        <span className="dot" />
        <span>images must allow CORS (Unsplash, Wikimedia, etc.)</span>
      </div>

      <section className="workspace">
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
                ref={observeImg}
                src={imageUrl}
                alt=""
                crossOrigin="anonymous"
                onLoad={handleImgLoad}
                onError={handleImgError}
                draggable={false}
              />
              <div className="overlay" aria-hidden="true">
                {detections.map((det, i) => {
                  const { x, y, width, height } = det.box;
                  return (
                    <div
                      key={i}
                      className="face-box"
                      style={{
                        left: fit.offsetX + x * fit.scale,
                        top: fit.offsetY + y * fit.scale,
                        width: width * fit.scale,
                        height: height * fit.scale,
                      }}
                    >
                      <span className="corner tl" />
                      <span className="corner tr" />
                      <span className="corner bl" />
                      <span className="corner br" />
                      <span className="tag">
                        {formatIndex(i)} · {formatScore(det.score)}
                      </span>
                    </div>
                  );
                })}
              </div>
              {status === "detecting" && (
                <div className="scanline" aria-hidden="true" />
              )}
            </div>
          )}
        </div>

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
              {statusLabel}
            </span>
          </div>
          <div className="hud-row">
            <span className="hud-label">▸ SUBJECTS</span>
            <span className="hud-value">
              {status === "done" || status === "detecting"
                ? String(detections.length).padStart(2, "0")
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
            <ol className="face-list">
              {detections.map((d, i) => (
                <li key={i}>
                  <span className="face-list-id">{formatIndex(i)}</span>
                  <span className="face-list-score">
                    {formatScore(d.score)}
                  </span>
                  <span className="face-list-dim muted">
                    {Math.round(d.box.width)}×{Math.round(d.box.height)}
                  </span>
                </li>
              ))}
            </ol>
          )}

          {status === "done" && detections.length === 0 && (
            <div className="muted small">
              No faces detected. Try another image or one with clearer faces.
            </div>
          )}
        </aside>
      </section>

      <footer className="bottom">
        <span>RUNNING LOCALLY</span>
        <span className="dot" />
        <span>POWERED BY @VLADMANDIC/FACE-API</span>
      </footer>

      <a
        className="sig"
        href="https://axelbarraza.com"
        target="_blank"
        rel="author noopener"
        title="Axel Barraza — Web Developer & Software Engineer"
        aria-label="Built by Axel Barraza — axelbarraza.com"
      >
        <span className="sig-frame" aria-hidden="true">
          <span className="corner tl" />
          <span className="corner tr" />
          <span className="corner bl" />
          <span className="corner br" />
        </span>
        <span className="sig-tag">SUBJECT IDENTIFIED · 100.0%</span>
        <span className="sig-body">
          <span className="sig-label">BUILT BY</span>
          <span className="sig-name">AXEL BARRAZA</span>
          <span className="sig-url">↳ axelbarraza.com</span>
        </span>
      </a>
    </div>
  );
}
