import { useEffect, useState } from "react";
import * as faceapi from "@vladmandic/face-api";
import { initBackend } from "./tfBackend";

const MODEL_URL = "/models";

export function useFaceApi() {
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
