import Corners from "./Corners";
import "./Signature.css";

export default function Signature() {
  return (
    <a
      className="sig"
      href="https://axelbarraza.com"
      target="_blank"
      rel="author noopener"
      title="Axel Barraza — Web Developer & Software Engineer"
      aria-label="Built by Axel Barraza — axelbarraza.com"
    >
      <span className="sig-frame" aria-hidden="true">
        <Corners />
      </span>
      <span className="sig-tag">SUBJECT IDENTIFIED · 100.0%</span>
      <span className="sig-body">
        <span className="sig-label">BUILT BY</span>
        <span className="sig-name">AXEL BARRAZA</span>
        <span className="sig-url">↳ axelbarraza.com</span>
      </span>
    </a>
  );
}
