// TinyFaceDetector boxes are tight; this share of the box on each side covers hairline, ears and chin.
const FACE_PADDING = 0.15;
// Cells across the region's longer side: coarse enough that the face can't be read on screen.
const MOSAIC_CELLS = 8;

// Whole pixels, so the export's nearest-neighbour upscale has no blended edges.
export function mosaicRegion(box, imageSize) {
  const padX = box.width * FACE_PADDING;
  const padY = box.height * FACE_PADDING;
  const x = Math.max(0, Math.floor(box.x - padX));
  const y = Math.max(0, Math.floor(box.y - padY));
  const right = Math.min(imageSize.w, Math.ceil(box.x + box.width + padX));
  const bottom = Math.min(imageSize.h, Math.ceil(box.y + box.height + padY));
  return { x, y, width: right - x, height: bottom - y };
}

export function mosaicGrid(region) {
  const cell = Math.max(region.width, region.height) / MOSAIC_CELLS;
  return {
    cols: Math.max(1, Math.round(region.width / cell)),
    rows: Math.max(1, Math.round(region.height / cell)),
  };
}

export function drawMosaicCells(ctx, image, region, grid) {
  ctx.imageSmoothingEnabled = true;
  // "high" averages each cell's pixels; the default samples only a few of them.
  ctx.imageSmoothingQuality = "high";
  ctx.drawImage(
    image,
    region.x,
    region.y,
    region.width,
    region.height,
    0,
    0,
    grid.cols,
    grid.rows,
  );
}
