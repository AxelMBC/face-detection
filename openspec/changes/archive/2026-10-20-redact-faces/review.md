# Review: redact-faces

Snapshot: 2609cc117e14eca49097ce3cf037b4ee1d7d436a

1. [defect] src/redaction/useRedaction.js:40 — `download()` has no in-flight guard: `canDownload` stays true during the async `toBlob`, so a double click saves two files and holds two full-size canvases at once (can fail under iOS Safari's canvas memory cap and show the export error although a file was saved) · fixed
   Fix: add an `exporting` state set before `renderRedacted` and cleared in the `toBlob` callback and the `catch`; fold `!exporting` into `canDownload` so the button is disabled and `download()` returns early meanwhile (optionally label it `> EXPORTING`).
2. [defect] src/redaction/redactedFile.js:19 — `redactedName` strips whatever follows the last dot, image extension or not: a host-only URL `https://example.com/` downloads as `example-redacted.jpg`, a segment `photo.2024` as `photo-redacted.jpg` · fixed
   Fix: strip only known image extensions (JPEG ones plus `NON_JPEG_EXTENSIONS`), e.g. `IMAGE_EXTENSIONS.includes(ext) ? name.slice(0, -ext.length - 1) : name`.
3. [duplicate] src/detection/useFaceDetection.js:17 — `urlOrigin` re-parses the URL and repeats `hostOf`'s hostname fallback; `scan()` parses the same string twice with two catch fallbacks (`"URL"` vs `"image"`) · fixed
   Fix: one private `describeUrl(url)` that parses once and returns `{ source, origin }` with a single catch; `scan` destructures it.
