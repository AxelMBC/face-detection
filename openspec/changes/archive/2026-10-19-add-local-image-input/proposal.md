## Why

Only images from CORS-enabled hosts can be scanned (`<img crossOrigin="anonymous">`), so most URLs people paste fail
with a generic load error while the hero promises "any image". A local file turned into a `blob:` object URL is
same-origin, so it goes through the existing `scan(url)` pipeline with no CORS dependency.

## What Changes

- A file picker link (`↳ open a file`) next to `↳ try a sample` scans the chosen image immediately.
- Dropping an image file anywhere on the page scans it immediately; a full-page HUD overlay shows while a file is
  dragged over the page.
- Pasting an image (e.g. a copied screenshot) anywhere on the page scans it immediately. Pasting text into the URL
  input keeps working as today.
- Files whose type is not `image/*` are rejected with a HUD error and no image load.
- A new HUD `SOURCE` row shows where the current image came from: the URL's host, the file name, or `CLIPBOARD`.
- A file scan clears the URL input; a `blob:` URL never appears in it.
- The previous object URL is revoked when the next scan starts and when the app unmounts.
- `useFaceDetection` gains `scanFile(file, label)` and returns `source`; `scan(url)` is unchanged for callers.
- `ScanForm` takes a `canScan` boolean instead of reading `model.tone` to decide whether submitting is allowed.
- The HUD `SUBJECTS` count reads `--` until a scan completes, instead of `00` while analysing.
- Hero lede and input foot copy mention files, drop and paste.

## Capabilities

### New Capabilities

- `local-image-input`: scanning an image file chosen with a picker, dropped on the page or pasted from the clipboard.

### Modified Capabilities

- `face-scan`: adds a requirement that the subject count only reflects a finished scan.

## Out of Scope

- Multiple files per scan or a queue; only the first file of a drop or paste is used.
- File size limits, image downscaling or EXIF orientation handling.
- Distinguishing CORS, 404 and non-image failures for URL scans.
- Remembering the last file or URL across reloads.
- Touch/mobile drag-and-drop beyond what the browser's file picker already provides.

## Impact

- `src/detection/useFaceDetection.js`: `scanFile`, `source`, object URL lifecycle.
- `src/components/ScanForm.jsx` + `ScanForm.css` → `src/components/ScanForm/` folder with a window-level drop/paste
  hook and a drop overlay component.
- `src/components/Hud/Hud.jsx`: `SOURCE` row, `SUBJECTS` change.
- `src/App.jsx`: passes `canScan`, `onScanFile`, `source`.
- `src/components/Hero.jsx`: copy.
- `CLAUDE.md`: architecture notes for the new input paths.
- No new dependencies.
