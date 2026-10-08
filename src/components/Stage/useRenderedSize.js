import { useCallback, useState } from "react";

export function useRenderedSize() {
  const [renderedSize, setRenderedSize] = useState({ w: 0, h: 0 });

  // Unstable identity loops: React re-runs the ref, the observer re-fires setState.
  const observeRef = useCallback((el) => {
    if (!el) return;
    const ro = new ResizeObserver(() => {
      setRenderedSize({ w: el.clientWidth, h: el.clientHeight });
    });
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  return [observeRef, renderedSize];
}
