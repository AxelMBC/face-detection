## Context

`src/App.jsx` (~390 lines) contains `useFaceApi`, `useFaceDetection`, `fitContain`, the formatters, `modelState`, the
`statusLabel` switch and seven visual blocks. `src/App.css` (~670 lines) is already sectioned one-to-one with those
blocks (header, hero, input row, workspace, stage, HUD, footer, signature). The repo is plain JS + React 19 + Vite, with
`react-hooks` and `react-refresh` lint rules and no tests, so `yarn lint` plus a browser pass is the whole safety net.

## Goals / Non-Goals

**Goals:** each file has one job; helpers live next to their only consumer; behaviour and visuals are unchanged except
for the new error-boundary fallback; the move is reviewable in two steps.

**Non-Goals:** visual or copy changes, a `features/` layer, Context, memoization, tests.

## Decisions

### 1. Target layout

```
src/
  main.jsx                     unchanged
  App.jsx                      composition only: useFaceApi + useFaceDetection, props down
  App.css                      .shell, .workspace and shared utilities only (.muted, .dot, .hud-error)
  detection/
    tfBackend.js               moved verbatim
    useFaceApi.js
    useFaceDetection.js        detectAllFaces + options (416 / 0.5) + stale-scan guard
  lib/
    format.js                  formatCount, formatIndex, formatScore, modelState (each has 2+ consumers)
  components/
    Corners.jsx                the four `corner tl/tr/bl/br` spans (FaceBox, Signature)
    Header.jsx  Header.css
    Hero.jsx    Hero.css
    ScanForm.jsx ScanForm.css  input row + input foot
    Footer.jsx  Footer.css
    Signature.jsx Signature.css
    WorkspaceBoundary.jsx WorkspaceBoundary.css   error boundary + full-width fallback (reuses shared .hud-error)
    Stage/
      Stage.jsx Stage.css FaceBox.jsx fitContain.js useRenderedSize.js
    Hud/
      Hud.jsx Hud.css FaceList.jsx hudLabels.js   (statusLabel)
```

Leaf components are flat files; `Stage` and `Hud` get folders because they carry private helpers. This follows the
"code lives next to its only consumer" rule: the audit's draft put `fitContain` and `statusLabel` in `lib/`, but each
has one consumer, so only the genuinely shared formatters go to `lib/format.js`. `.workspace` wraps both Stage and Hud
and is rendered by `App`, so its rules stay in `App.css`.

### 2. CSS split follows the existing sections

Each `/* ── section ── */` block moves to its component's stylesheet, imported by that component. Class names do not
change. `App.css` keeps only rules used by more than one component or rendered by `App` itself:

- `.shell`, `.workspace` and its media query (rendered by `App`).
- `.muted` (Stage empty state, Hud, FaceList), `.dot` (ScanForm, Footer), `.hud-error` (Hud, WorkspaceBoundary).

The combined `.hud-value.muted, .muted` rule is split: `.muted` to `App.css`, `.hud-value.muted` to `Hud.css` (it exists
to beat `.hud-value`'s colour on specificity). `.small` has one consumer and goes to `Hud.css`. The
`prefers-reduced-motion` block is split so each file disables its own animations (`.reticle`, `.face-box`, `.scanline`
in `Stage.css`; `.hud-value.pending` in `Hud.css`).

Vite emits CSS in import order. All selectors are class-based with no cross-section overrides except the generic
`.muted` vs `.stage-empty .muted` / `.hud-value.muted`, which win on specificity, so order changes are safe. `App.css`
is imported in `App.jsx` before the components, keeping shared utilities first.

### 3. State ownership

- `ScanForm` owns `url`. Props: `onScan(url)`, `model` (from `modelState`). It disables submit with
  `model.tone !== "good" || !url.trim()` and shows `model.action`.
- `useFaceDetection({ ready })` returns `{ imageUrl, scanId, status, error, detections, naturalSize, scan,
  handleImgLoad, handleImgError }`; `scan` returns early when `!ready`. `renderSize`, the `ResizeObserver` and `fit`
  leave the hook. Resetting `renderSize` in `scan` is unnecessary because `key={scanId}` remounts the `<img>`.
- `Stage` calls `useRenderedSize()` → `[observeRef, renderedSize]` (the current stable callback ref, with its
  identity comment), and computes `fitContain(naturalSize, renderedSize)`. The "must match `.canvas img`" comment now
  sits next to the rule it depends on, in the same folder as `Stage.css`.
- `App` keeps no state of its own beyond the two hooks.

Alternative considered: composing `useFaceApi` inside `useFaceDetection` (S5's second option). Rejected because `App`
also needs model state for `ScanForm` and `Hud`; passing `{ ready }` keeps one source.

### 4. Error boundary

A class component `WorkspaceBoundary` (React 19 still has no hook form) with `getDerivedStateFromError`. `App` renders
`<WorkspaceBoundary key={scanId}>` around `<section className="workspace">`, so a new scan remounts it and clears the
failure. Fallback: a `.hud-error` block reading `! Workspace failed to render. Submit a URL to retry.`, inside a
`.workspace`-sized container so the layout doesn't jump. It catches render errors only; async detection errors already
go through `status: "error"`.

### 5. Two reviewable steps in one change

Tasks group 1–3 are a pure move (S1, S2, S4, CSS split, boundary); group 4 redistributes hook responsibilities (S3,
S5). `yarn lint` and a commit checkpoint sit between them so each diff reviews on its own.

Outcome: the checkpoint was dropped. Groups 1–4 landed uncommitted and go in as one commit; the review covered the
combined diff.

## Risks / Trade-offs

- CSS cascade shifts after splitting → keep class names, check no selector crosses sections (grep each moved class in
  other files), browser pass over hover/focus states and the signature.
- `react-refresh/only-export-components` flags files mixing components and non-components → helpers live in `.js`
  files, components in `.jsx`, one default export each.
- Unstable ref callback re-introducing the ResizeObserver loop → `useRenderedSize` keeps `useCallback(…, [])`.
- No tests → manual checks in Verification cover every scenario in the spec.

## Open Questions

- none
