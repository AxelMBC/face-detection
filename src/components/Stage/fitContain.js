// Must match `.canvas img` in Stage.css (object-fit: contain, centred).
export function fitContain(natural, rendered) {
  if (!natural.w || !natural.h) return { scale: 1, offsetX: 0, offsetY: 0 };
  const scale = Math.min(rendered.w / natural.w, rendered.h / natural.h);
  return {
    scale,
    offsetX: (rendered.w - natural.w * scale) / 2,
    offsetY: (rendered.h - natural.h * scale) / 2,
  };
}
