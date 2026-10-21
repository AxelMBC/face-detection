## Why

A scan ends at boxes on a screen: nothing can be done with the result. Pixelating faces before sharing a photo is the
one job where "no uploads, no servers" is the reason to use this app, and local files (the last change) now bring in
the phone photos people actually share. Those same photos expose a recall gap: detection always runs at input size 416
(`src/detection/useFaceDetection.js:67`), so faces in a 4000 px group shot shrink to ~12 px and are missed, which for a
redaction tool is a privacy leak, not a cosmetic miss.

## What Changes

- A HUD `DETAIL` control with `STANDARD` (416, today's behaviour, default) and `HIGH` (608). Changing it re-runs
  detection on the already loaded image without fetching it again.
- A HUD `REDACT` toggle, off by default. When on, the stage shows each face selected for redaction as a coarse mosaic
  over a padded region instead of the detection box.
- While `REDACT` is on, each row of the HUD face list toggles whether that face is redacted; excluded faces show a
  dashed outline on the stage. Every new detection run includes all faces again.
- A `DOWNLOAD` button (while `REDACT` is on and the scan is complete, with at least one face included) saves the image
  at its natural resolution with the included faces pixelated exactly as previewed.
- The download is JPEG when the source is JPEG or of unknown type, PNG otherwise, named `<source name>-redacted.<ext>`.
  Re-encoding through a canvas drops all source metadata (EXIF, GPS).
- `useFaceDetection` keeps the loaded `<img>` element, returns it with `detail`/`selectDetail` and the source's
  `origin` (`{ name, type }`), and drops stale results per detection run instead of per scan.
- Hero lede mentions pixelating faces before sharing.

## Capabilities

### New Capabilities

- `face-redaction`: previewing, selecting and downloading a pixelated copy of the scanned image.

### Modified Capabilities

- `face-scan`: adds a selectable detection detail level that re-runs detection on the loaded image.

## Out of Scope

- Blur or solid-fill styles; pixelation is the only style.
- Drawing or moving boxes by hand to cover faces the detector missed.
- Remembering `DETAIL` or `REDACT` across reloads.
- Batch redaction of several images.
- Downscaling images that exceed the browser's canvas size limit.

## Impact

- `src/detection/useFaceDetection.js`: loaded image, detail level, per-run stale check, `origin`.
- New `src/lib/mosaic.js` (padded region + mosaic drawing, shared by the stage preview and the export).
- New `src/redaction/` with `useRedaction.js` and `redactedFile.js` (output format, file name, export).
- `src/components/Stage/`: `FaceBox` gains redacted/excluded modes and a mosaic canvas.
- `src/components/Hud/`: detail control, redact toggle, face toggles in `FaceList`, download button and export error.
- `src/App.jsx`, `src/components/Hero.jsx`, `CLAUDE.md`.
- No new dependencies, no new model weights.
