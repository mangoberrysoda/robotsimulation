# Changelog: Robot Simulation

All notable changes to this project will be documented in this file.

## [1.6] - 2026-03-02
### Added
- **Placement Toggle Buttons**: Replaced radio buttons with modern, side-by-side toggle buttons with active state highlighting.
- **Refined 2-Column Sidebar**: Reordered widgets for better vertical flow (Map/Placement top, Simulation under Settings).
### Changed
- **UI Performance**: Switched header to semantic `<header>` tag to resolve CSS `nth-of-type` indexing conflicts.
- **Visual Polish**: Reduced button padding (3px/12px) and adjusted canvas scaling/viewport alignment.
- **Header Housing**: Help HUD icon relocated next to the title with stable flex positioning.

## [1.5] - 2026-03-02
### Added
- **Integrated Help System**: Professional HTML-based guide (`help.html`) with premium styling.
- **Professional Documentation Suite**: Added `Roadmap.md`, `Troubleshooting.md`, and `Architecture_Deep_Dive.md`.

## [1.3] - 2026-03-02
### Added
- **Intelligent Auto-Stop**: Simulation now halts on 100% coverage, all robots returning to base, or step limit.
- **Bidirectional UI Controls**: Link range sliders to editable number inputs for all settings.
- **Orange Missed-Area Highlight**: Highlights uncleaned traversable areas in bright orange on stop.
- **Expanded Robot Fleet**: Support for up to 20 robots simultaneously.
- **Advanced Performance Dashboard**:
    - **Free Area %**: Static map openness metric.
    - **Mapped Points / Robot**: Live per-agent efficiency tracking.
### Changed
- **Boundary Optimization**: Map boundary padding reduced from 2 cells (20px) to 1 cell (10px) for better area usage.

## [1.2] - 2026-02-15
### Added
- **Speed Control**: FPS throttling (1-60) and logic intensity (Steps/Update) sliders.
- **UI State Locking**: Controls now lock during active simulation to prevent configuration errors.
- **"Locate -> Rotate -> Save" Workflow**: Improved Heat vs Lidar sensor logic.
### Fixed
- **Lidar Detection**: Resolved "Canvas Tainted" security error by embedding default map as Base64.
- **Thin Walls**: Multi-point sampling (5 points per cell) for 100% obstacle accuracy.
- **Robot Count Sync**: Fixed initialization bug where robot count wasn't properly resetting.

## [1.1] - 2024-02-14
### Added
- **Core Infrastructure**: Basic map upload, grid generation, and multi-robot (1-10) deployment.
- **Shared Visualization**: Synchronized "Visited" grid across all active robots.
- **Live Stats**: Basic coverage % and survivor status tracking.
- **Backtracking**: Basic history stack for robots in dead-ends.

---
*Documentation Version: 1.6*
# Last updated: 2026-03-02
