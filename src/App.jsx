import { useFaceApi } from "./detection/useFaceApi";
import { useFaceDetection } from "./detection/useFaceDetection";
import { modelState } from "./lib/format";
import "./App.css";
import Header from "./components/Header";
import Hero from "./components/Hero";
import ScanForm from "./components/ScanForm";
import WorkspaceBoundary from "./components/WorkspaceBoundary";
import Stage from "./components/Stage/Stage";
import Hud from "./components/Hud/Hud";
import Footer from "./components/Footer";
import Signature from "./components/Signature";

export default function App() {
  const { ready: modelReady, error: modelError, backend } = useFaceApi();
  const {
    imageUrl,
    scanId,
    status,
    error,
    detections,
    naturalSize,
    scan,
    handleImgLoad,
    handleImgError,
  } = useFaceDetection({ ready: modelReady });

  const model = modelState({ ready: modelReady, error: modelError });

  return (
    <div className="shell">
      <Header />
      <Hero />
      <ScanForm model={model} onScan={scan} />

      <WorkspaceBoundary key={scanId}>
        <section className="workspace">
          <Stage
            imageUrl={imageUrl}
            scanId={scanId}
            status={status}
            detections={detections}
            naturalSize={naturalSize}
            onImgLoad={handleImgLoad}
            onImgError={handleImgError}
          />
          <Hud
            model={model}
            modelError={modelError}
            backend={backend}
            status={status}
            error={error}
            detections={detections}
            naturalSize={naturalSize}
          />
        </section>
      </WorkspaceBoundary>

      <Footer />
      <Signature />
    </div>
  );
}
