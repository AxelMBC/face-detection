## ADDED Requirements

### Requirement: Subject count reflects a finished scan
The system SHALL show the HUD subject count only once a scan has completed, and SHALL show `--` while the image loads or is being analysed.

#### Scenario: During analysis
- **WHEN** a scan is in ANALYZING PIXELS
- **THEN** the HUD SUBJECTS row reads `--`, not `00`

#### Scenario: Scan finds no faces
- **WHEN** a scan completes with no faces detected
- **THEN** the HUD SUBJECTS row reads `00`
