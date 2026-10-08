## ADDED Requirements

### Requirement: Scan requires a ready model
The system SHALL ignore scan requests until the TinyFaceDetector model has loaded, and SHALL show one model state (loading, ready or error) consistently on the scan button and the HUD.

#### Scenario: Submit before the model loads
- **WHEN** the user submits a URL while the model is still loading
- **THEN** no image is fetched, the status stays unchanged and the scan button reads `> LOADING`, disabled

#### Scenario: Model fails to load
- **WHEN** backend selection or the model download fails
- **THEN** the HUD shows MODEL `ERROR` in the bad tone and the scan button reads `> UNAVAILABLE`, disabled

### Requirement: Every submit starts a fresh scan
The system SHALL treat each submit as a new scan that reloads the image and replaces the previous result, even when the URL is unchanged.

#### Scenario: Same URL submitted twice
- **WHEN** the user submits a URL, the scan completes, and the user submits the same URL again
- **THEN** the status goes through FETCHING IMAGE and ANALYZING PIXELS again and ends in SCAN COMPLETE

#### Scenario: Retry after a failed load
- **WHEN** an image fails to load and the user submits the same URL again
- **THEN** a new load is attempted and the status leaves SCAN FAILED

### Requirement: Stale results are discarded
The system SHALL drop detection results and errors that belong to a scan superseded by a newer submit.

#### Scenario: New submit during detection
- **WHEN** the user submits URL B while URL A is still being analysed
- **THEN** only B's boxes, count and face list are shown once B completes, whatever order the detections finish in

### Requirement: Boxes sit on the rendered picture
The system SHALL position each detection box over the face in the displayed image, accounting for the image's uniform scaling and letterboxing inside its frame.

#### Scenario: Portrait image capped by viewport height
- **WHEN** a portrait image is scanned that is taller than the stage allows at full width
- **THEN** each box sits on its face, neither stretched horizontally nor shifted into the letterbox bars

#### Scenario: Window resized after a scan
- **WHEN** the browser window is resized after a scan completes
- **THEN** the boxes follow the image to its new size and position

### Requirement: Render failures are contained to the workspace
The system SHALL keep the header, scan form, footer and signature usable when rendering the stage or HUD throws, and SHALL retry the workspace on the next scan.

#### Scenario: Workspace throws while rendering
- **WHEN** rendering the stage or HUD throws an exception
- **THEN** the workspace shows a HUD-styled failure message and the rest of the page stays visible and interactive

#### Scenario: Recover with a new scan
- **WHEN** the workspace is showing the failure message and the user submits a URL
- **THEN** the workspace renders again for the new scan
