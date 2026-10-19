import "./Hero.css";

export default function Hero() {
  return (
    <section className="hero-block">
      <h1>
        Detect faces in <span className="accent">any image</span>.
      </h1>
      <p className="lede">
        Paste a public image URL, or drop or paste an image file. The model
        loads in your browser, runs locally, and overlays bounding boxes on
        every face it finds. No uploads, no servers.
      </p>
    </section>
  );
}
