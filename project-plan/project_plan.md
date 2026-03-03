# Robot Simulation Project Plan (Updated)

> **Status**: Implementation Phase - Core Logic & UI Complete. Refining Visuals.

## 1. Project Overview
This project is a web-based simulation where autonomous robots explore an unknown environment (uploaded map) to locate and "save" survivors. It demonstrates pathfinding, sensor simulation (Lidar vs. Heat), and multi-agent coordination principles.

## 2. Technical Stack
-   **Frontend**: HTML5, CSS3, JavaScript (ES6+).
-   **Rendering**: HTML5 Canvas API (2D Context).
-   **Frameworks**: None (Vanilla JS implementation).

## 3. Implemented Architecture

### 3.1. Modules
1.  **`MapManager` (map.js)**:
    -   **Map Processing**: Loads user image, analyzes pixel brightness (threshold < 80 = obstacle), and generates a navigation grid (10px spacing).
    -   **Grid System**: A 1000x1000 logical grid where each cell tracks: `isObstacle`, `visited`, and `ownerId` (for robot coordination).
    -   **Line of Sight**: Implements Bresenham's Line Algorithm to check visibility through obstacles.
    -   **Raycasting**: Provides distance data for Lidar visualization.

2.  **`Simulation` (simulation.js)**:
    -   **Loop Control**: Manages the `requestAnimationFrame` loop with FPS throttling (User-controlled speed).
    -   **Batch Processing**: Executes `N` simulation steps per frame render to speed up simulation time.
    -   **Entity Management**: Handles spawning and resetting of robots.
    - **Stats Aggregation**: Calculates coverage %, active robots, free area %, and per-robot mapped point counts.
    - **Auto-Stop Logic**: Halts when coverage reaches 100%, all robots return to base (`FINISHED` state), or step limit is reached.
    - **Visual Feedback**: Triggers "Highlight Uncleaned" mode on map on stop.

3.  **`Robot` (robot.js)**:
    -   **State Machine**: `IDLE` → `SCANNING` → `ROTATING` → `MOVING` → `COMPLETE` (or `FINISHED` when done).
    -   **Sensors**:
        -   **Heat Sensor**: Detects survivors within a radius (ignoring walls). Marks them as **Located**.
        -   **Lidar Sensor**: Detects obstacles and survivors within a cone (requires line-of-sight). Marks them as **Saved**.
    -   **Navigation**: Greedy "Nearest Unvisited Node" strategy.
        -   Scans local area for unvisited, reachable grid points.
        -   Prioritizes "Located" survivors to rotate and face them.
        -   Backtracks using a history stack if stuck (Dead-end handling).

4.  **`Main` (main.js) & UI**:
    -   Handles DOM events, file uploads, and updates the "Live Stats" widget.
    -   **Interactive Controls**: Implements bidirectional sync between range sliders and numerical inputs for all settings.
    -   **Help HUD**: Integrated `help.html` accessible via a persistent UI trigger for user guidance.

### 3.2. Data Structures
-   **Survivor State**:
    -   `waiting`: Initial state (Red).
    -   `located`: Detected by Heat Sensor (Orange).
    -   `saved`: Confirmed by Lidar + Line of Sight (Green).
-   **Robot Config**:
    -   Adjustable Lidar Range & Angle.
    -   Adjustable Heat Sensor Radius.

## Implementation Details
- **Current Version**: 1.7 (Advanced Diagnostics & Layout)
- **Primary Tech**: HTML5, CSS3, Vanilla JavaScript
- **Core Methodology**: Pure procedural simulation with grid-based state synchronization.

## Features & Progress (v1.7)
- [x] **Coordinate Diagnostics**: Integrated mouse-follow tooltip for logical (0-1000) grid coordinates.
- [x] **Per-Robot Step Analysis**: Granular tracking of movement efficiency per agent ("pts / steps").
- [x] **Aggregate Performance**: Total "Team Steps" metric for holistic simulation analysis.
- [x] **Independent Columnar UI**: Restructured controls into separate columns to isolate widget scaling.
- [x] **Intelligent Auto-Stop**: Halts on 100% coverage, step limit, or all robots returning home.
- [x] **Interactive Settings**: Bidirectional sync between sliders and editable number inputs.
- [x] **Placement Optimization**: Reordered tools to prioritize Robots, with Robots active by default.
- [x] **Help System**: Professional documentation with integrated **Header Icon** HUD access.
- [x] **Expanded Fleet**: Support for up to 20 robots simultaneously.
- [x] **Missed Area Highlighting**: Uncleaned traversable areas highlighted in Orange on end.
- [x] **Collision Avoidance**: Line-of-sight checks prevent moving through walls.
- [x] Coordination: Shared "Visited" grid preventing robots from re-exploring the same tiles redundantly.
- [x] Backtracking: Robots retrace their steps when no new path is found.
- [x] **Auto-Return**: Robots automatically switch to FINISHED state upon returning to start point.

### Phase 4: Sensors & Visualization (Completed)
- [x] **Lidar Visualization**: Raycast cone drawn in yellow/transparent.
- [x] **Heat Sensor Visualization**: Orange circle around robot.
- [x] **Survivor Discovery**: Two-stage discovery (Located -> Saved).
- [x] **Grid Tooltip**: Cursor-position coordinates displayed relative to 1000x1000 grid.

### Phase 5: Dashboard & Controls (Completed)
- [x] **Live Stats Widget**:
    - Status (Idle/Running).
    - Active Robots count + Robot Start Position.
    - Free Area % (Static map openness).
    - Cleaned Area (Progress Bar).
    - Survivors Located vs Saved counts.
    - Global Simulation Steps vs Total Team Steps.
    - Per-Robot Mapped Points & Steps table.
- [x] **Simulation Controls**:
    - Speed (FPS) slider + manual number input.
    - Steps Per Update slider + manual number input.
    - Robot Count slider (1-20) + manual number input.
- [x] **Help System**: Professional integrated help guide (`help.html`).
- [x] **Sensor Config**: Toggle visibility, adjust ranges.

## 5. File Structure
-   `/index.html`: Main UI layout with Control Panel and Canvas.
-   `/help.html`: Integrated professional user guide.
-   `/css/style.css`: Dark-themed styling for controls and stats.
-   `/js/main.js`: Entry point and event listeners.
-   `/js/map.js`: Map processing, grid logic, rendering.
-   `/js/robot.js`: autonomous agent logic.
-   `/js/simulation.js`: Main loop and coordinator.
-   `/js/utils.js`: Helper functions (distance, angle, random colors).
