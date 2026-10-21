# Pixelate detected faces and download the redacted image, with a selectable detection detail level

## 1. Detection hook

- [x] 1.1 In `src/detection/useFaceDetection.js`, add `image` state (set in `handleImgLoad`, reset in `start` and `handleImgError`) and the `runRef` counter bumped by `start`
- [x] 1.2 Extract the detection body of `handleImgLoad` into a private `detect(img, detail)` that bumps `runRef`, clears detections, sets `detecting`, and drops stale results and errors by `runRef`; `latestScanRef` keeps producing `scanId` only
- [x] 1.3 Add `DETAIL_INPUT_SIZE`, `detail` state (default `"standard"`) and `selectDetail(next)` that stores it and re-runs `detect(image, next)` only when `image` is set
- [x] 1.4 Add `origin` (`{ name, type }`) set in `start`: file name and type for files, last URL path segment (or host) and `""` for URLs
- [x] 1.5 Return `image`, `detail`, `selectDetail` and `origin`

## 2. Mosaic and export

- [x] 2.1 Write `src/lib/mosaic.js`: `FACE_PADDING`, `MOSAIC_CELLS`, `mosaicRegion(box, imageSize)`, `mosaicGrid(region)`, `drawMosaicCells(ctx, image, region, grid)`
- [x] 2.2 Write `src/redaction/redactedFile.js`: `outputFormat(origin)` and `redactedName(origin, ext)` per design §3
- [x] 2.3 Write `src/redaction/useRedaction.js`: `redacting`/`toggleRedacting`, run-scoped exclusions without an effect, `isRedacted`, `toggleFace`, `redactedCount`, `canDownload`
- [x] 2.4 Add `download()` to `useRedaction`: full-size canvas, mosaic over each included face, `toBlob` in the output format, temporary `<a download>`, object URL revoked on the next tick, canvas released, `exportError` on failure

## 3. Stage preview

- [x] 3.1 Give `FaceBox` a `mode` prop (`box` / `redacted` / `excluded`) and, in `redacted`, a cell canvas over the mapped padded region drawn in an effect from `image`
- [x] 3.2 In `Stage`, take `image` and `redaction`, and derive each face's mode from `redaction.redacting` and `redaction.isRedacted(i)`
- [x] 3.3 In `Stage.css`, add the mosaic canvas (`image-rendering: pixelated`, no border or tag) and the dashed `excluded` outline; the box-in animation stays off under reduced motion

## 4. HUD

- [x] 4.1 Add the `▸ DETAIL` segmented control (`STANDARD` / `HIGH`, `aria-pressed`) calling `onDetailChange`
- [x] 4.2 Add the `▸ REDACT` toggle (`aria-pressed`, `ON` / `OFF`)
- [x] 4.3 In `FaceList`, while redacting, make each row a toggle button (`aria-pressed`) with the dimmed, struck-through excluded style
- [x] 4.4 While redacting, show `> DOWNLOAD` (disabled unless `canDownload`), the muted `REDACTING n OF m` line, and `exportError` as a `.hud-error`

## 5. App, copy and docs

- [x] 5.1 In `App.jsx`, call `useRedaction`, and pass `image`/`redaction` to `Stage` and `redaction`/`detail`/`onDetailChange` to `Hud`
- [x] 5.2 Update the hero lede in `Hero.jsx` to mention pixelating faces before sharing, keeping "No uploads, no servers"
- [x] 5.3 Update `CLAUDE.md`: per-run detection and `detail` in `useFaceDetection`, `src/redaction/`, `src/lib/mosaic.js` shared by preview and export

## 6. Verification

- [x] 6.1 Run `/axl:verify`
- [x] 6.2 Scan the sample URL, then select HIGH: status goes ANALYZING PIXELS → SCAN COMPLETE without FETCHING IMAGE, and the network panel shows no second image request
- [x] 6.3 Drop a large group photo where STANDARD misses small faces, switch to HIGH: more faces are boxed; switch back to STANDARD: the count returns to the first run's
- [x] 6.4 Select HIGH while STANDARD is still analysing a large image: only the HIGH result is shown
- [x] 6.5 Turn REDACT on after a scan: each face becomes a coarse mosaic slightly larger than its box, with no tag; turn it off: boxes and tags return
- [x] 6.6 With REDACT on, click face #02 in the HUD list: it shows unpixelated with a dashed outline and the count reads `REDACTING n-1 OF n`; click again: pixelated again
- [x] 6.7 Exclude one face, then click DOWNLOAD on a picked `.jpg`: a `<name>-redacted.jpg` at the original resolution is saved, with the same mosaics as the preview and the excluded face untouched
- [x] 6.8 Paste a PNG screenshot, redact and download: a `.png` named after the clipboard file with `-redacted` is saved
- [x] 6.9 Exclude every face: DOWNLOAD is disabled; scan an image without faces with REDACT on: DOWNLOAD is disabled
- [x] 6.10 Redact and download a portrait phone photo with GPS data: the mosaics sit on the faces in the right orientation, and an EXIF viewer shows no metadata in the downloaded file
- [x] 6.11 Download from a scanned images.unsplash.com URL: a `photo-…-redacted.jpg` is saved
