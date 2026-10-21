## Context

`useFaceDetection` runs detection once, in the `<img>`'s `onLoad`, with a fixed `inputSize: 416`, then drops the
element (`src/detection/useFaceDetection.js:60-79`). Stale results are dropped by comparing against
`latestScanRef`, which also produces `scanId`, the `<img>` and `WorkspaceBoundary` key. Detection boxes are in the
image's natural pixel space; `Stage` maps them to the rendered image with `fitContain` and `FaceBox` positions them
(`src/components/Stage/FaceBox.jsx:4-21`). `FaceList` renders one `<li>` per detection, keyed by index
(`src/components/Hud/FaceList.jsx:6-7`). `App` is composition only.

Every image that reaches detection has readable pixels: URLs load with `crossOrigin="anonymous"` and files are
same-origin `blob:` URLs, and face-api itself reads the pixels. So a canvas drawn from the loaded `<img>` is never
tainted, and `toBlob` works for any image that scanned.

## Goals / Non-Goals

**Goals:** re-detect and export from the image already loaded, never a second fetch; preview and export pixelate with
the same function so the file matches the screen; no full-size canvas until the user clicks DOWNLOAD; `App` stays
composition only.

**Non-Goals:** other redaction styles, manual boxes, persistence, downscaling oversized images, new dependencies.

## Decisions

### 1. `useFaceDetection` keeps the loaded image and runs detection per run, not per scan

- New state `image`: the loaded `HTMLImageElement`, set in `handleImgLoad`, reset to `null` in `start` and in
  `handleImgError`. It is state, not a ref, because the stage preview draws from it and has to re-render when it
  arrives.
- New `runRef` counter, bumped by `start` and by every detection run. A private `detect(img, detail)` bumps it, clears
  detections, sets `status: "detecting"`, awaits `detectAllFaces` with `inputSize: DETAIL_INPUT_SIZE[detail]`, and
  drops the result or error if `runRef` moved on. `handleImgLoad` sets `image`/`naturalSize` and calls
  `detect(img, detail)`. `latestScanRef` keeps producing `scanId` only, so a re-run never remounts the `<img>` or the
  boundary.
- `detail` state (`"standard" | "high"`, default `"standard"`) and `selectDetail(next)`: sets it, and if `image` is
  set, calls `detect(image, next)` (passing `next`, since state hasn't updated yet). With no image (idle, loading,
  failed load) it only stores the level; `handleImgLoad` reads the current `detail`.
- `DETAIL_INPUT_SIZE = { standard: 416, high: 608 }`, private to the hook. Both are multiples of 32, as
  TinyFaceDetector requires. HIGH costs about (608/416)² ≈ 2.1× per run.
- New `origin` state, `{ name, type }`, set in `start`: for a file, `{ name: file.name, type: file.type }`; for a URL,
  `{ name: <last path segment, or the host when empty>, type: "" }`. It feeds the download's name and format only;
  the HUD keeps using `source`.

Alternative considered: re-run by calling `start(imageUrl, source)` again. Rejected: it refetches (or re-decodes) the
image, goes through FETCHING IMAGE, and `start` revokes the object URL it would be reloading.

### 2. One mosaic routine in `src/lib/mosaic.js`, used by the preview and the export

Two consumers (the stage preview and the export), so it lives in `lib/` per the repo rule.

- `mosaicRegion(box, imageSize)`: the detection box grown by `FACE_PADDING = 0.15` of its width/height on each side
  (TinyFaceDetector boxes are tight and leave hairline, ears and chin), clamped to the image.
- `mosaicGrid(region)`: `MOSAIC_CELLS = 8` cells across the region's longer side; returns `{ cols, rows }`.
- `drawMosaicCells(ctx, image, region, grid)`: draws the region of `image` into a `cols × rows` context.
- Preview: in redacted mode `FaceBox` positions a `<canvas width={cols} height={rows}>` over the mapped region and
  draws the cells once in an effect keyed on the image and region; CSS `image-rendering: pixelated` scales it up.
  Each face costs a canvas of ~64 pixels, not a full-size one.
- Export: a full-size canvas gets `drawImage(image)`, then for each included face the cells are drawn into a small
  canvas and drawn back over the region with `imageSmoothingEnabled = false`, the same nearest-neighbour upscale the
  CSS does.

`MOSAIC_CELLS` and `FACE_PADDING` are tuned constants and get a one-line comment each.

Alternatives considered: a CSS `backdrop-filter: blur()` preview (blur isn't pixelation, and canvas `filter` support
differs across browsers, so preview and file would differ); one full-size preview canvas (48 MB for a 12 MP photo
for as long as REDACT is on).

### 3. `useRedaction` in `src/redaction/` owns the toggle, the exclusions and the download

`useRedaction({ status, image, detections, origin })` returns `{ redacting, toggleRedacting, isRedacted(i),
toggleFace(i), redactedCount, canDownload, download, exportError }`.

- `redacting`: session state, default `false`, untouched by scans.
- Exclusions reset with each run without an effect: state is `{ detections, excluded: Set }`, and the hook reads
  `excluded` only when `state.detections === detections`, otherwise treats it as empty. `toggleFace(i)` writes
  `{ detections, excluded: toggled }`.
- `canDownload`: `redacting && status === "done" && redactedCount > 0`.
- `download()`: builds the export canvas (decision 2), `toBlob` with the format from `redactedFile.js`, clicks a
  temporary `<a download>` with an object URL, revokes the URL on the next tick (Safari cancels the download if it's
  revoked synchronously), and sets the canvas size to 0 to release its memory. A `null` blob or a thrown error sets
  `exportError` to `"Could not export this image."`; the next `download` clears it.
- `redactedFile.js` (private to the folder): `outputFormat(origin)` returns `{ type, ext, quality }`: JPEG at 0.92
  when `origin.type` is `image/jpeg`, or when there is no type and the name has no known non-JPEG extension
  (`.png .gif .webp .avif .svg .bmp`); PNG otherwise. `redactedName(origin, ext)` strips the name's extension and
  appends `-redacted.<ext>`.

Alternative considered: putting all of this in `useFaceDetection`. Rejected: it would mix the scan flow with an
output feature, and the exclusions belong to the result, not to detection.

### 4. UI

- HUD, above the divider: a `▸ DETAIL` row with a two-button segmented control (`aria-pressed`), and a `▸ REDACT`
  row with a toggle button (`aria-pressed`, label `ON`/`OFF`). Below the face list, when `redacting`: a
  `> DOWNLOAD` button styled like `.scan-btn`, disabled unless `canDownload`, and a `REDACTING n OF m` muted line.
  `exportError` renders with the existing `.hud-error`.
- `FaceList`: while `redacting`, each row's content is wrapped in a `<button aria-pressed={isRedacted(i)}>`;
  excluded rows dim and strike their score. Rows keep their index keys, since the list never reorders.
- `FaceBox` takes `mode`: `"box"` (today), `"redacted"` (mosaic only, no border or tag) or `"excluded"` (dashed
  outline plus tag). `Stage` derives the mode from `redacting` and `isRedacted(i)`, and passes `image` through.
- `Hud` and `Stage` receive the hook's return as one `redaction` prop rather than eight separate ones; `App` passes
  `detail`/`onDetailChange` to `Hud` from `useFaceDetection`.

## Risks / Trade-offs

- The detector misses a face, and the user shares a photo believing it is fully redacted → the HIGH detail level,
  a visible `REDACTING n OF m` count, and copy that says to check the preview before sharing. Manual boxes are out of
  scope.
- Eight cells across a face may still leave a face recognisable to software → `MOSAIC_CELLS` is a named constant;
  coarser is a one-line change.
- Images beyond the browser's canvas limit (iOS Safari ≈ 16.7 MP) can fail to encode → `toBlob` returning `null`
  shows the export error; downscaling is out of scope.
- EXIF orientation: `drawImage` of an `<img>` honours `image-orientation: from-image`, which is the default in current
  browsers, and face-api reads the same element, so boxes and export agree → manual check with a portrait phone
  photo.
- A full-size canvas holds ~4 bytes per pixel (~48 MB for 12 MP) during an export → created per click and released
  right after.

## Open Questions

- none
