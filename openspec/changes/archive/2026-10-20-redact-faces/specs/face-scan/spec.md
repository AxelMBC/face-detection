## ADDED Requirements

### Requirement: Detection detail is selectable
The system SHALL offer a STANDARD and a HIGH detection detail level, SHALL use STANDARD until the user changes it, and SHALL re-run detection on the already loaded image when the level changes, without fetching the image again.

#### Scenario: Switch to HIGH after a scan
- **WHEN** a scan is complete and the user selects HIGH
- **THEN** the status goes through ANALYZING PIXELS to SCAN COMPLETE without FETCHING IMAGE, and the boxes, count and face list come from the new run

#### Scenario: Switch during analysis
- **WHEN** the user selects HIGH while a STANDARD run is still analysing
- **THEN** only the HIGH run's boxes, count and face list are shown, whatever order the runs finish in

#### Scenario: Switch before any image
- **WHEN** no image is loaded and the user selects HIGH
- **THEN** nothing is scanned, and the next scan the user starts runs at HIGH

#### Scenario: Failed image load
- **WHEN** the image failed to load and the user changes the detail level
- **THEN** no detection runs and the status stays SCAN FAILED
