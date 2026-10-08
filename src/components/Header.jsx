import "./Header.css";

export default function Header() {
  return (
    <header className="top">
      <div className="brand">
        <span className="brand-mark" aria-hidden="true" />
        <span className="brand-text">NEURAL//FACE.SCANNER</span>
      </div>
      <div className="meta">v0.1 · TINY_FACE_DETECTOR · CLIENT-SIDE</div>
    </header>
  );
}
