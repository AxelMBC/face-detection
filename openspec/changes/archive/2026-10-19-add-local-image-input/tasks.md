# Scan local images from a file picker, drag-and-drop or paste via object URLs

## 1. Detection hook

- [x] 1.1 In `src/detection/useFaceDetection.js`, add `source` state, `objectUrlRef` and the private `hostOf(url)` helper
- [x] 1.2 Extract the body of `scan` into a private `start(url, source)` that also revokes and clears `objectUrlRef`; make `scan(url)` call `start(url, hostOf(url))`
- [x] 1.3 Add `scanFile(file, source = file.name)`: `!ready` guard, non-image rejection (`start("", source)` then `"Not an image file."` + `status: "error"`), otherwise `start(URL.createObjectURL(file), source)` and store the URL in `objectUrlRef`
- [x] 1.4 Add the unmount cleanup effect that revokes `objectUrlRef.current`
- [x] 1.5 Make `handleImgError` use `"Could not decode this image file."` when `objectUrlRef.current` is set, the existing CORS message otherwise
- [x] 1.6 Return `source` and `scanFile` from the hook

## 2. ScanForm folder and input methods

- [x] 2.1 Move `src/components/ScanForm.jsx` and `ScanForm.css` into `src/components/ScanForm/` and update the import in `App.jsx`
- [x] 2.2 Replace the `model.tone !== "good"` check with a `canScan` prop; keep `model.action` as the button label
- [x] 2.3 Add the `scanFile(file, source)` wrapper (guard `canScan`, clear `url`, call `onScanFile`)
- [x] 2.4 Add the hidden `<input type="file" accept="image/*">` and the `↳ open a file` link button in `.input-foot`, disabled when `!canScan`; reset `value` after `change`
- [x] 2.5 Write `useWindowImageInput({ enabled, onFile })` per design §2: window listeners attached once via `useEffectEvent`, `"Files"`-only drags, depth counter reset on `drop` and on a `dragleave` with a null `relatedTarget` outside the viewport, `preventDefault` on file `dragover`/`drop` always and on `paste` only when a file is present
- [x] 2.6 Write `DropOverlay.jsx` (fixed full-page HUD panel with `Corners` and "DROP IMAGE TO SCAN", `aria-hidden`) and its styles in `ScanForm.css`, with its animation disabled under `prefers-reduced-motion`
- [x] 2.7 Render `DropOverlay` from `ScanForm` when `dragging && canScan`
- [x] 2.8 Update the input foot hint to say URLs need CORS and files can be dropped or pasted

## 3. HUD, App and copy

- [x] 3.1 In `Hud.jsx`, add the `SOURCE` row after `BACKEND` when `source` is set, with the full value in `title`; add `.hud-value.source` (no uppercase, single-line ellipsis) to `Hud.css`
- [x] 3.2 In `Hud.jsx`, show `SUBJECTS` count only when `status === "done"`, `--` otherwise
- [x] 3.3 In `App.jsx`, pass `canScan={modelReady}` and `onScanFile={scanFile}` to `ScanForm`, and `source` to `Hud`
- [x] 3.4 Update the hero lede in `Hero.jsx` to mention dropping or pasting an image file, keeping "No uploads, no servers"
- [x] 3.5 Update `CLAUDE.md`: `useFaceDetection` `scanFile`/object URL lifecycle, `ScanForm/` folder and window-level drop/paste

## 4. Verification

- [x] 4.1 Run `/axl:verify`
- [x] 4.2 With the model ready, click `↳ open a file` and pick a photo with faces: the scan runs without pressing SCAN, boxes sit on the faces and HUD SOURCE shows the file name in its original case
- [x] 4.3 Pick the same file again: status goes through FETCHING IMAGE and ANALYZING PIXELS again to SCAN COMPLETE
- [x] 4.4 Drag an image from the desktop over the hero: the full-page overlay appears; drag it back out of the window: the overlay disappears; drag again and drop on the URL input: the image is scanned, the input is empty and the tab stays on the app
- [x] 4.5 Type text in the URL input, then drop an image: the input is cleared and SCAN is disabled
- [x] 4.6 Drag selected page text over the stage: no overlay appears
- [x] 4.7 Copy a screenshot and press Ctrl+V with focus outside the input: it is scanned and SOURCE reads `CLIPBOARD`; then paste a URL into the input: the text appears and nothing is scanned until SCAN
- [x] 4.8 After a completed scan, drop a PDF: image and boxes clear, status reads SCAN FAILED, HUD shows "Not an image file."
- [x] 4.9 Reload with network throttled so the model is still loading, then drop an image: no overlay, no scan, the browser does not open the file
- [x] 4.10 During ANALYZING PIXELS the SUBJECTS row reads `--`; a scan of an image without faces ends with `00`
- [x] 4.11 Scan a URL from images.unsplash.com: SOURCE reads `images.unsplash.com` and existing URL behaviour is unchanged
- [x] 4.12 In Chrome, drop five images in a row, then open `chrome://blob-internals` in another tab: only one blob from the app's origin is listed
