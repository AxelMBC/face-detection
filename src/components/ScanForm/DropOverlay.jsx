import Corners from "../Corners";

export default function DropOverlay() {
  return (
    <div className="drop-overlay" aria-hidden="true">
      <div className="drop-frame">
        <Corners />
        <p>DROP IMAGE TO SCAN</p>
      </div>
    </div>
  );
}
