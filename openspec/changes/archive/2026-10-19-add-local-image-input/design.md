## Context

`useFaceDetection({ ready })` owns the scan flow: `scan(url)` bumps `scanId`, resets state and sets `imageUrl`; `Stage`
renders `<img key={scanId} src={imageUrl} crossOrigin="anonymous">` and detection runs in its `onLoad`
(`src/detection/useFaceDetection.js:15-45`). `ScanForm` owns the URL text and calls `onScan(trimmed)`
(`src/components/ScanForm.jsx:10-15`), and disables submit with `model.tone !== "good"` (`ScanForm.jsx:41`). `App` is
composition only. React is 19.2, so `useEffectEvent` is available and understood by `eslint-plugin-react-hooks` 7.

A `blob:` URL from `URL.createObjectURL(file)` is same-origin, so it loads under `crossOrigin="anonymous"` and leaves the
canvas untainted. Every step after `imageUrl` is set works unchanged.

## Goals / Non-Goals

**Goals:** files from picker, drop and paste go through the existing `imageUrl` → `<img>` → `detectAllFaces` path;
object URLs never leak; the input UI stays inside `ScanForm`; `App` stays composition only.

**Non-Goals:** a second rendering path (canvas, `createImageBitmap`), size limits, multi-file, new dependencies.

## Decisions

### 1. Object URL lifecycle lives in `useFaceDetection`

The hook owns `imageUrl`, so it is the only place that knows when an image is replaced. It keeps
`objectUrlRef` (the URL it created for the current scan, or `null`) and:

- a private `start(url, source)` used by both entry points: returns early if `!ready`, revokes `objectUrlRef.current`
  and sets it to `null`, then does exactly what `scan` does today plus `setSource(source)`.
- `scan(url)` → `start(url, hostOf(url))`. `hostOf` is a private helper in the same file:
  `new URL(url).hostname`, falling back to `"URL"` if parsing throws. Callers of `scan` don't change.
- `scanFile(file, source = file.name)`: returns early if `!ready`. If `!file.type.startsWith("image/")`, calls
  `start("", source)` and then sets `error` to `"Not an image file."` and `status` to `"error"` (so the old image and
  boxes clear and the stage shows its empty state). Otherwise `start(URL.createObjectURL(file), source)` and stores
  that URL in `objectUrlRef` after `start` returns.
- `useEffect(() => () => revoke(objectUrlRef.current), [])` releases the last one on unmount. Under StrictMode the
  first cleanup runs with `null`, which is a no-op.
- `handleImgError` picks its message from `objectUrlRef.current`: a file scan reads
  `"Could not decode this image file."` (e.g. HEIC in Chrome), a URL scan keeps the current CORS message.
- Returns `source` alongside the existing fields; reset to `""` only by being overwritten on the next `start`.

Revoking at the start of the next scan is safe: the old `<img>` has already decoded, and the same commit unmounts it
(its `key` and the `WorkspaceBoundary` key both change). Revoking in `onLoad` was rejected: anything that re-renders the
same `<img>` with that `src` (a boundary retry, a future feature) would then fail on a dead URL, for a saving of one
image's memory.

Alternative considered: a `useObjectUrl` hook inside `ScanForm` passing the blob URL to `onScan`. Rejected because
`ScanForm` can't know when the image it handed over is replaced, and `onScan` would need to tell file and URL scans
apart anyway for the source label and the error message.

### 2. Drop and paste listeners live in `ScanForm`, at window level

The input methods share one concern: turn user input into a scan and clear the URL text when it's a file. `ScanForm`
already owns that text, so the listeners go there instead of in `App` (which would then need to tell `ScanForm` to
clear its input — state syncing through props or an effect). `ScanForm` becomes a folder, per the "folder when a
component has private helpers" rule:

```
src/components/ScanForm/
  ScanForm.jsx          URL form, input foot (sample + open a file), hidden <input type="file">, renders DropOverlay
  ScanForm.css          moved from src/components/ScanForm.css, plus the overlay styles
  DropOverlay.jsx       full-page fixed overlay: "DROP IMAGE TO SCAN", Corners, aria-hidden
  useWindowImageInput.js
```

`useWindowImageInput({ enabled, onFile })` → `dragging`:

- Adds `dragenter`, `dragover`, `dragleave`, `drop` and `paste` listeners to `window` in one `useEffect` with no
  reactive deps; `onFile` and `enabled` are read through `useEffectEvent`, so listeners are attached once.
- Only drags whose `dataTransfer.types` includes `"Files"` count; text and link drags are left alone.
- `dragenter`/`dragleave` fire per element, so a depth counter tracks enter/leave and `dragging` is `depth > 0`.
  `drop` resets the counter to 0.
- `dragover` and `drop` always call `preventDefault()` for file drags, even when disabled, so the browser never
  navigates to the file. When disabled, `dragover` sets `dropEffect = "none"` and `drop` does nothing else.
- `drop` passes `dataTransfer.files[0]` with its `name`; `paste` passes `clipboardData.files[0]` with `"CLIPBOARD"`
  and calls `preventDefault()` only when a file is present, so text pastes into the input are untouched.

`ScanForm` wraps `onScanFile` as `scanFile(file, source)`: returns if `!canScan`, clears `url`, calls
`onScanFile(file, source)`. The picker, drop and paste all use it. The overlay renders when `dragging && canScan`.

The picker is a visually hidden `<input type="file" accept="image/*">` triggered from a `↳ open a file` link button
in `.input-foot`, disabled when `!canScan`. Its `onChange` reads `files[0]` and then sets `e.target.value = ""`, so
choosing the same file again fires `change` again.

### 3. `canScan` replaces `model.tone` in `ScanForm`

`App` passes `canScan={modelReady}`; `ScanForm` uses it for the submit button, the file link and the `scanFile` guard.
`model` stays a prop only for `model.action` (the button label). This removes the CSS tone name as a logic gate.

### 4. HUD

- New `SOURCE` row after `BACKEND`, rendered when `source` is non-empty. The value gets a `source` class with
  `text-transform: none` (file names keep their case), and `overflow: hidden; text-overflow: ellipsis;
  white-space: nowrap; min-width: 0` so long names don't break the row, with the full value in `title`.
- `SUBJECTS` shows `formatCount(detections.length)` only when `status === "done"`, otherwise `--`.

## Risks / Trade-offs

- Dropping onto the URL `<input>` inserts the file path in some browsers → the window `drop` handler calls
  `preventDefault()` for file drags before the default action; check in Chrome and Firefox.
- `dragleave` to outside the window can be missed on some platforms, leaving the overlay up → a `dragleave` whose `relatedTarget` is `null` and whose pointer is outside the viewport resets the counter to 0, as does `drop`;
  `dragend` is not used because it never fires for drags that start outside the page. A manual check covers dragging out of the window.
- Clipboard images have generic names (`image.png`) → the paste path always labels them `CLIPBOARD`.
- `file.type` is empty for some unknown extensions → treated as not an image, which is the safe side.

## Open Questions

- none
