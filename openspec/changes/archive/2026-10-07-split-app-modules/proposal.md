## Why

`src/App.jsx` holds both hooks, the box geometry, every formatter and all seven visual blocks, so every change to the
HUD, stage or detection lands in the same 390-line file. A render exception anywhere also blanks the whole page,
signature included. The audit (findings 2, S1–S5) asks to split it before more features land.

## What Changes

- Move `tfBackend.js`, `useFaceApi` and `useFaceDetection` into `src/detection/`.
- Split the JSX into components (`Header`, `Hero`, `ScanForm`, `Stage` + `FaceBox`, `Hud` + `FaceList`, `Footer`,
  `Signature`, shared `Corners`); `App.jsx` only composes hooks and passes props.
- Split `App.css` by its existing sections into one stylesheet per component; shared utility classes stay in `App.css`.
- Move formatters shared by two components (`formatCount`, `formatIndex`, `formatScore`, `modelState`) to `src/lib/format.js`; helpers
  with one consumer (`fitContain`, `statusLabel`) live beside it.
- `ScanForm` owns the URL text (S2), so typing no longer re-renders the stage and HUD.
- `useFaceDetection` drops layout concerns: `Stage` measures the image with `useRenderedSize` and computes the fit
  itself (S3).
- `useFaceDetection({ ready })` ignores `scan()` until the model is ready, instead of relying on `App` to check (S5).
- Wrap the workspace (stage + HUD) in an error boundary with a HUD-styled fallback; a new scan resets it.
- Update the UI section and `tfBackend.js` path in `CLAUDE.md`.

## Capabilities

### New Capabilities

- `face-scan`: scanning an image URL — model readiness, scan lifecycle, box placement and failure containment.

## Out of Scope

- Any visual or copy change; the page must look and behave as it does today, apart from the error-boundary fallback.
- A `features/` folder, Context, `memo`/`useMemo` (one feature, no prop drilling, no measured perf problem).
- Tests or new tooling (stylelint, jsx-a11y).
- The remaining raw colours in `index.css` background gradients.

## Impact

- `src/App.jsx`, `src/App.css`, `src/tfBackend.js` (moved), `src/main.jsx` unchanged.
- New: `src/detection/`, `src/lib/format.js`, `src/components/**`.
- `CLAUDE.md` UI and backend sections.
- No dependency changes.
