import { useFaceApi } from "./detection/useFaceApi";
import { useFaceDetection } from "./detection/useFaceDetection";
import { useRedaction } from "./redaction/useRedaction";
import { modelState } from "./lib/format";
import "./App.css";
import Header from "./components/Header";
import Hero from "./components/Hero";
import ScanForm from "./components/ScanForm/ScanForm";
import WorkspaceBoundary from "./components/WorkspaceBoundary";
import Stage from "./components/Stage/Stage";
import Hud from "./components/Hud/Hud";
import Footer from "./components/Footer";
import Signature from "./components/Signature";

export default function App() {
  const { ready: modelReady, error: modelError, backend } = useFaceApi();
  const {
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
  } = useFaceDetection({ ready: modelReady });
  const redaction = useRedaction({ status, image, detections, origin });

  const model = modelState({ ready: modelReady, error: modelError });

  return (
    <div className="shell">
      <Header />
      <Hero />
      <ScanForm
        model={model}
        canScan={modelReady}
        onScan={scan}
        onScanFile={scanFile}
      />

      <WorkspaceBoundary key={scanId}>
        <section className="workspace">
          <Stage
            imageUrl={imageUrl}
            scanId={scanId}
            status={status}
            detections={detections}
            naturalSize={naturalSize}
            image={image}
            redaction={redaction}
            onImgLoad={handleImgLoad}
            onImgError={handleImgError}
          />
          <Hud
            model={model}
            modelError={modelError}
            backend={backend}
            source={source}
            status={status}
            error={error}
            detections={detections}
            naturalSize={naturalSize}
            detail={detail}
            onDetailChange={selectDetail}
            redaction={redaction}
          />
        </section>
      </WorkspaceBoundary>

      <Footer />
      <Signature />
    </div>
  );
}
