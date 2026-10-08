export function formatCount(n) {
  return String(n).padStart(2, "0");
}

export function formatIndex(i) {
  return `#${formatCount(i + 1)}`;
}

export function formatScore(score) {
  return `${(score * 100).toFixed(1)}%`;
}

const MODEL_STATES = {
  loading: { label: "LOADING…", tone: "pending", action: "> LOADING" },
  ready: { label: "READY", tone: "good", action: "> SCAN" },
  error: { label: "ERROR", tone: "bad", action: "> UNAVAILABLE" },
};

export function modelState({ ready, error }) {
  if (error) return MODEL_STATES.error;
  return ready ? MODEL_STATES.ready : MODEL_STATES.loading;
}
