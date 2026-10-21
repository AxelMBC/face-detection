# face-redaction

## Purpose

Pixelating the faces found by a scan and saving a redacted copy of the image, entirely in the browser. It covers the REDACT preview (a coarse mosaic over a padded region around each face, in place of the detection boxes), excluding and re-including individual faces, with every new detection run including all faces again, and downloading the image at its natural resolution with the included faces pixelated exactly as previewed and no source metadata. It also covers choosing the download's format and name from the source and reporting an export the browser cannot encode.

## Requirements

### Requirement: Redaction preview
The system SHALL offer a REDACT toggle, off by default and kept across scans in the same session, that switches the stage from detection boxes to a pixelated preview of every face selected for redaction, covering a region padded beyond the detection box.

#### Scenario: Turn REDACT on after a scan
- **WHEN** a scan has completed with faces and the user turns REDACT on
- **THEN** each face is covered by a coarse mosaic slightly larger than its detection box, with no box border or score tag

#### Scenario: Turn REDACT off
- **WHEN** REDACT is on and the user turns it off
- **THEN** the stage shows the detection boxes with their tags again

#### Scenario: Next scan with REDACT on
- **WHEN** REDACT is on and the user scans another image
- **THEN** the new image's faces are shown as mosaics once its scan completes

### Requirement: Faces can be excluded from redaction
The system SHALL let the user exclude and re-include each detected face from redaction while REDACT is on, and SHALL include every face again after each detection run.

#### Scenario: Exclude a false positive
- **WHEN** REDACT is on and the user activates face #02 in the HUD face list
- **THEN** that face is shown unpixelated with a dashed outline and its tag, its list row reads as excluded, and activating it again pixelates it

#### Scenario: New detection run
- **WHEN** a face is excluded and the user changes the detail level or scans another image
- **THEN** every face found by the new run is included

### Requirement: Download the redacted image
The system SHALL offer a download, while REDACT is on and a scan is complete with at least one face included, of the image at its natural resolution with every included face pixelated as in the preview and no metadata carried over from the source.

#### Scenario: Download
- **WHEN** REDACT is on, a scan found three faces, one is excluded, and the user clicks DOWNLOAD
- **THEN** a file at the image's natural resolution is saved in which the two included faces are pixelated as previewed and the excluded one is untouched

#### Scenario: Nothing to redact
- **WHEN** REDACT is on and the scan found no faces, or every face is excluded
- **THEN** DOWNLOAD is disabled

#### Scenario: During analysis
- **WHEN** REDACT is on and detection is running
- **THEN** DOWNLOAD is disabled

#### Scenario: Source metadata
- **WHEN** the user downloads a redacted phone photo that carried EXIF location data
- **THEN** the downloaded file contains no EXIF or GPS metadata

### Requirement: Download format follows the source
The system SHALL encode the download as JPEG when the source is a JPEG or its type is unknown and as PNG otherwise, and SHALL name it after the source with a `-redacted` suffix and the matching extension.

#### Scenario: JPEG file
- **WHEN** the user redacts and downloads a picked file `team-photo.jpg`
- **THEN** the download is a JPEG named `team-photo-redacted.jpg`

#### Scenario: Pasted screenshot
- **WHEN** the user redacts and downloads a pasted PNG screenshot
- **THEN** the download is a PNG named after the clipboard file's name with `-redacted.png`

#### Scenario: URL without an extension
- **WHEN** the user redacts and downloads `https://images.unsplash.com/photo-1529626455594-4ff0802cfb7e?w=800`
- **THEN** the download is a JPEG named `photo-1529626455594-4ff0802cfb7e-redacted.jpg`

### Requirement: Export failures are reported
The system SHALL show a HUD error and save nothing when the browser cannot encode the redacted image, and SHALL leave the preview unchanged.

#### Scenario: Image too large to encode
- **WHEN** the user clicks DOWNLOAD and the browser fails to encode the image
- **THEN** the HUD shows "Could not export this image." and no file is saved
