import { drawMosaicCells, mosaicGrid } from "../lib/mosaic";

const NON_JPEG_EXTENSIONS = ["png", "gif", "webp", "avif", "svg", "bmp"];
const IMAGE_EXTENSIONS = ["jpg", "jpeg", "jfif", ...NON_JPEG_EXTENSIONS];
const EXTENSION = /\.([^./]+)$/;

function extensionOf(name) {
  return EXTENSION.exec(name)?.[1].toLowerCase() ?? "";
}

export function outputFormat(origin) {
  const isJpeg = origin.type
    ? origin.type === "image/jpeg"
    : !NON_JPEG_EXTENSIONS.includes(extensionOf(origin.name));
  return isJpeg
    ? { type: "image/jpeg", ext: "jpg", quality: 0.92 }
    : { type: "image/png", ext: "png" };
}

export function redactedName(origin, ext) {
  const nameExt = extensionOf(origin.name);
  const base = IMAGE_EXTENSIONS.includes(nameExt)
    ? origin.name.slice(0, -nameExt.length - 1)
    : origin.name;
  return `${base || "image"}-redacted.${ext}`;
}

export function renderRedacted(image, regions) {
  const canvas = document.createElement("canvas");
  canvas.width = image.naturalWidth;
  canvas.height = image.naturalHeight;
  const ctx = canvas.getContext("2d");
  ctx.drawImage(image, 0, 0);
  ctx.imageSmoothingEnabled = false;

  const cells = document.createElement("canvas");
  const cellsCtx = cells.getContext("2d");
  for (const region of regions) {
    const grid = mosaicGrid(region);
    cells.width = grid.cols;
    cells.height = grid.rows;
    drawMosaicCells(cellsCtx, image, region, grid);
    ctx.drawImage(cells, region.x, region.y, region.width, region.height);
  }
  return canvas;
}

export function releaseCanvas(canvas) {
  canvas.width = 0;
  canvas.height = 0;
}

export function saveBlob(blob, name) {
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = name;
  link.click();
  // Safari cancels the download if the URL is revoked in the same tick.
  setTimeout(() => URL.revokeObjectURL(url));
}
