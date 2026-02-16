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
    -   **Stats Aggregation**: Calculates coverage %, active robots, and survivor statuses for the UI.

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

### 3.2. Data Structures
-   **Survivor State**:
    -   `waiting`: Initial state (Red).
    -   `located`: Detected by Heat Sensor (Orange).
    -   `saved`: Confirmed by Lidar + Line of Sight (Green).
-   **Robot Config**:
    -   Adjustable Lidar Range & Angle.
    -   Adjustable Heat Sensor Radius.

## 4. Current Features

### Phase 1: Map & Setup (Completed)
-   [x] Image Upload: Dark areas recognized as obstacles.
-   [x] Grid Overlay: 10px resolution.
-   [x] Edge Padding: Robots avoid the absolute edge of the map.

### Phase 2: Entity Placement (Completed)
-   [x] **Place Survivors**: User clicks to deploy survivors.
-   [x] **Place Robots**: User sets a single "Start Point" for all robots.
-   [x] **Clear/Reset**: Options to clear entities or just reset the simulation state.

### Phase 3: Robot Logic (Completed)
-   [x] **Movement**: Smooth rotation and pixel-based movement.
-   [x] **Collision Avoidance**: Line-of-sight checks prevent moving through walls.
-   [x] **Coordination**: Shared "Visited" grid preventing robots from re-exploring the same tiles redundantly.
-   [x] **Backtracking**: Robots retrace their steps when no new path is found.

### Phase 4: Sensors & Visualization (Completed)
-   [x] **Lidar Visualization**: Raycast cone drawn in yellow/transparent.
-   [x] **Heat Sensor Visualization**: Orange circle around robot.
-   [x] **Survivor Discovery**: Two-stage discovery (Located -> Saved).

### Phase 5: Dashboard & Controls (Completed)
-   [x] **Live Stats Widget**:
    -   Status (Idle/Running).
    -   Active Robots count.
    -   Cleaned Area (Progress Bar).
    -   Survivors Located vs Saved counts.
    -   Total Steps.
-   [x] **Simulation Controls**:
    -   Speed (FPS) slider (1-60).
    -   Steps Per Update slider (1-50).
    -   Robot Count slider (1-10).
-   [x] **Sensor Config**: Toggle visibility, adjust ranges.

## 5. File Structure
-   `/index.html`: Main UI layout with Control Panel and Canvas.
-   `/css/style.css`: Dark-themed styling for controls and stats.
-   `/js/main.js`: Entry point and event listeners.
-   `/js/map.js`: Map processing, grid logic, rendering.
-   `/js/robot.js`: autonomous agent logic.
-   `/js/simulation.js`: Main loop and coordinator.
-   `/js/utils.js`: Helper functions (distance, angle, random colors).
