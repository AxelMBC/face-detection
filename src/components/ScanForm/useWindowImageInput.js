import { useEffect, useEffectEvent, useState } from "react";

const isFileDrag = (e) => e.dataTransfer?.types.includes("Files") ?? false;
const leftWindow = (e) =>
  e.relatedTarget === null &&
  (e.clientX <= 0 ||
    e.clientY <= 0 ||
    e.clientX >= window.innerWidth ||
    e.clientY >= window.innerHeight);

export function useWindowImageInput({ enabled, onFile }) {
  const [dragging, setDragging] = useState(false);
  const isEnabled = useEffectEvent(() => enabled);
  const emitFile = useEffectEvent((file, source) => onFile(file, source));

  useEffect(() => {
    // dragenter/dragleave fire for every element crossed, so count the depth.
    let depth = 0;
    const setDepth = (next) => {
      depth = next;
      setDragging(depth > 0);
    };

    const handleDragEnter = (e) => {
      if (!isFileDrag(e)) return;
      setDepth(depth + 1);
    };

    const handleDragLeave = (e) => {
      if (!isFileDrag(e)) return;
      setDepth(leftWindow(e) ? 0 : Math.max(0, depth - 1));
    };

    const handleDragOver = (e) => {
      if (!isFileDrag(e)) return;
      e.preventDefault();
      if (!isEnabled()) e.dataTransfer.dropEffect = "none";
    };

    const handleDrop = (e) => {
      if (!isFileDrag(e)) return;
      e.preventDefault();
      setDepth(0);
      const file = e.dataTransfer.files[0];
      if (file && isEnabled()) emitFile(file, file.name);
    };

    const handlePaste = (e) => {
      const file = e.clipboardData?.files[0];
      if (!file) return;
      e.preventDefault();
      if (isEnabled()) emitFile(file, "CLIPBOARD");
    };

    window.addEventListener("dragenter", handleDragEnter);
    window.addEventListener("dragleave", handleDragLeave);
    window.addEventListener("dragover", handleDragOver);
    window.addEventListener("drop", handleDrop);
    window.addEventListener("paste", handlePaste);
    return () => {
      window.removeEventListener("dragenter", handleDragEnter);
      window.removeEventListener("dragleave", handleDragLeave);
      window.removeEventListener("dragover", handleDragOver);
      window.removeEventListener("drop", handleDrop);
      window.removeEventListener("paste", handlePaste);
    };
  }, []);

  return dragging;
}
