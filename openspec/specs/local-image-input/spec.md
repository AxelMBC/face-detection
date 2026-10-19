# local-image-input

## Purpose

Scanning an image file from the user's own machine, without needing a CORS-enabled host. It covers the three ways a file can come in (the `↳ open a file` picker, a drop anywhere on the page with a full-page overlay while dragging, and a paste from the clipboard), rejecting files that aren't images, showing where the current image came from in the HUD, clearing the URL input when a file scan starts, and releasing each file's object URL once the next scan replaces it.

## Requirements

### Requirement: Scan an image file from the picker
The system SHALL offer a file picker limited to images and SHALL start a scan as soon as the user chooses a file.

#### Scenario: Pick an image
- **WHEN** the model is ready and the user clicks `↳ open a file` and chooses a JPEG
- **THEN** the status goes through FETCHING IMAGE and ANALYZING PIXELS to SCAN COMPLETE and boxes appear over the faces, with no SCAN click

#### Scenario: Pick the same file twice
- **WHEN** a picked file has finished scanning and the user picks the same file again
- **THEN** a new scan runs and ends in SCAN COMPLETE

### Requirement: Scan an image dropped anywhere on the page
The system SHALL accept an image file dropped anywhere on the page, SHALL show a full-page drop overlay while a file is dragged over the page, and SHALL never let the browser navigate to a dropped file.

#### Scenario: Drag a file over the page
- **WHEN** the model is ready and the user drags an image file from the desktop over the hero text
- **THEN** a full-page overlay invites the drop, and it disappears when the drag leaves the window or is dropped

#### Scenario: Drop an image
- **WHEN** the model is ready and the user drops an image file anywhere on the page
- **THEN** that image is scanned immediately and the page stays on the app

#### Scenario: Drop before the model is ready
- **WHEN** the user drops an image file while the model is still loading
- **THEN** no scan starts, no overlay is shown and the browser does not open the file

#### Scenario: Drag text, not a file
- **WHEN** the user drags selected text over the page
- **THEN** no drop overlay appears

### Requirement: Scan an image pasted from the clipboard
The system SHALL start a scan when the user pastes clipboard content containing an image file anywhere on the page, and SHALL leave pastes without an image file to the browser's default behaviour.

#### Scenario: Paste a screenshot
- **WHEN** the model is ready and the user copies a screenshot and presses Ctrl+V on the page
- **THEN** the screenshot is scanned immediately

#### Scenario: Paste a URL into the input
- **WHEN** the user pastes text into the URL input
- **THEN** the text lands in the input and no scan starts until SCAN is pressed

### Requirement: Non-image files are rejected
The system SHALL reject a picked, dropped or pasted file whose type is not an image, replacing any previous result with a HUD error and loading nothing.

#### Scenario: Drop a PDF
- **WHEN** the user drops a PDF on the page after a completed scan
- **THEN** the previous image and boxes are cleared, the status reads SCAN FAILED and the HUD shows an error saying the file is not an image

### Requirement: The HUD shows the image source
The system SHALL show the source of the current scan in the HUD: the host for a URL, the file name for a picked or dropped file, and `CLIPBOARD` for a pasted image.

#### Scenario: Dropped file
- **WHEN** the user drops `team-photo.jpg`
- **THEN** the HUD SOURCE row reads `team-photo.jpg`

#### Scenario: URL scan
- **WHEN** the user scans `https://images.unsplash.com/photo-…`
- **THEN** the HUD SOURCE row reads `images.unsplash.com`

#### Scenario: Pasted image
- **WHEN** the user pastes a screenshot
- **THEN** the HUD SOURCE row reads `CLIPBOARD`

### Requirement: File scans clear the URL input
The system SHALL clear the URL input when a file scan starts and SHALL never put an object URL in the input.

#### Scenario: Drop after typing a URL
- **WHEN** the URL input holds text and the user drops an image
- **THEN** the input is empty and the SCAN button is disabled until a URL is typed

### Requirement: Object URLs are released
The system SHALL release the object URL of a file scan when the next scan starts and when the app unmounts.

#### Scenario: Several files in a row
- **WHEN** the user drops five images one after another
- **THEN** at most one object URL created by the app is alive at any time
