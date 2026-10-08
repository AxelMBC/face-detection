# Split App.jsx into detection hooks, components and per-component styles

## 1. Detection and shared helpers (pure move)

- [x] 1.1 `git mv src/tfBackend.js src/detection/tfBackend.js`; move `useFaceApi` to `src/detection/useFaceApi.js` and `useFaceDetection` (unchanged for now) to `src/detection/useFaceDetection.js`
- [x] 1.2 Create `src/lib/format.js` with `formatIndex`, `formatScore`, `MODEL_STATES` + `modelState`
- [x] 1.3 Create `src/components/Stage/fitContain.js` (keep its "must match `.canvas img`" comment) and `src/components/Hud/hudLabels.js` with `statusLabel(status)` (the current switch); `formatCount(n)` (the SUBJECTS `padStart`) went to `src/lib/format.js` instead, since `formatIndex` reuses it
- [x] 1.4 `yarn lint` passes with `App.jsx` importing from the new paths

## 2. Components and per-component CSS (pure move)

- [x] 2.1 Create `src/components/Corners.jsx` rendering the four `corner tl/tr/bl/br` spans; use it in the face box and the signature
- [x] 2.2 Extract `Header`, `Hero`, `Footer`, `Signature` as flat `.jsx` + `.css` pairs, moving each CSS section verbatim
- [x] 2.3 Extract `ScanForm` owning the `url` state, with props `onScan(url)` and `model`; it shows `model.action` and disables submit when the model isn't ready or the URL is blank (S2)
- [x] 2.4 Extract `Stage/Stage.jsx` + `Stage/FaceBox.jsx` + `Stage/Stage.css` (stage, canvas, overlay, face boxes, scanline, reticle) and `Hud/Hud.jsx` + `Hud/FaceList.jsx` + `Hud/Hud.css`; split the reduced-motion block per file
- [x] 2.5 Reduce `App.css` to `.shell`, `.workspace` (+ media query), `.muted`, `.dot`, `.hud-error`; grep every moved class name to confirm no rule left behind references another component's markup
- [x] 2.6 Add `src/components/WorkspaceBoundary.jsx` (class component, `getDerivedStateFromError`, fallback `.hud-error` "! Workspace failed to render. Submit a URL to retry.") and render `<WorkspaceBoundary key={scanId}>` around the workspace in `App`
- [x] 2.7 `App.jsx` is composition only; `yarn lint` passes — checkpoint: stop and hand back so the user can review and commit the pure move before group 3 (skipped: groups 1–4 committed together, see design §5)

## 3. Hook responsibilities (S3, S5)

- [x] 3.1 Add `src/components/Stage/useRenderedSize.js` returning `[observeRef, renderedSize]` from the current stable `useCallback` ref (keep the identity comment); `Stage` computes `fitContain(naturalSize, renderedSize)`
- [x] 3.2 Remove `renderSize`, `observeImg`, `fit` and the `renderSize` reset from `useFaceDetection`
- [x] 3.3 Change the signature to `useFaceDetection({ ready })`; `scan` returns early when `!ready`; drop the `modelReady` check from `App`
- [x] 3.4 `yarn lint` passes

## 4. Docs

- [x] 4.1 Update `CLAUDE.md`: `tfBackend.js` path, and replace the "UI (`src/App.jsx`)" section with the new layout (detection/, lib/, components/, where `fitContain` and its CSS dependency live, the boundary)

## 5. Verification

- [x] 5.1 Run `/axl:verify`
- [x] 5.2 Load the page with the model loading: button reads `> LOADING`, disabled; once loaded HUD shows MODEL READY / BACKEND name and button reads `> SCAN`
- [x] 5.3 Rename `public/models/` temporarily and reload: HUD shows MODEL ERROR in red, button reads `> UNAVAILABLE`, disabled; restore the folder
- [x] 5.4 Scan the sample, then submit the same URL again: status goes FETCHING IMAGE → ANALYZING PIXELS → SCAN COMPLETE both times, boxes and list reappear
- [x] 5.5 Scan a portrait image taller than the viewport allows: boxes sit on faces; resize the window and the boxes follow
- [x] 5.6 Submit a second URL while the first is still ANALYZING PIXELS: only the second image's boxes, count and list remain
- [x] 5.7 Temporarily throw inside `FaceList` render: workspace shows the failure message, header/form/footer/signature still work; submit a URL and the workspace renders again; remove the throw
- [x] 5.8 Visual pass against the current build: header, hero, input focus and scan-button hover, empty-state reticle, HUD colours, signature hover lock-on, mobile width (<720px and <880px breakpoints); with OS reduced motion on, nothing pulses, sweeps or blinks
