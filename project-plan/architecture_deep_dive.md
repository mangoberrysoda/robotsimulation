# Architecture Deep Dive: Robot Simulation Logic

This document explains the technical implementation of the key algorithms and systems within the Robot Search & Rescue simulation.

## 1. Grid-Based World Rendering
The simulation uses a dual-layer approach to the environment:
1.  **Visual Layer**: A 1000x1000 HTML5 Canvas where the map image is drawn once.
2.  **Logical Layer (`MapManager`)**: A 2D array (grid) with 10px spacing.
    *   **Obstacle Detection**: On map load, the `MapManager` scans the pixel data at each grid center. If the brightness (Average of RGB) is below 160, the cell is marked `isObstacle = true`. 
    *   **Multi-Point Sampling**: For high precision, each grid cell is sampled at 5 points (Center + 4 corners). This ensures even thin lines in the map are detected.

## 2. Lidar & Raycasting
The Lidar sensor uses a custom raycasting implementation:
*   **Ray Tracing**: For each degree within the Lidar cone, a ray is projected outward from the robot's center.
*   **Bresenham's Line Algorithm**: The ray is sampled at 10px intervals. At each step, the `MapManager` checks if that point intersects an `isObstacle` grid cell.
*   **Occlusion**: Once an obstacle is hit, the ray terminates. Any survivor *behind* an obstacle will not be detected by the Lidar.

## 3. Robot Decision Logic (`Robot.js`)
The robot follows a **Greedy Nearest-Neighbor** strategy with a state-driven machine:

### 3.1. Target Selection
1.  The robot scans its local sensor range for grid cells marked as `visited = false` and `isObstacle = false`.
2.  It filters these based on **Reachability** (direct 4-way or 8-way neighbors).
3.  It selects the **nearest** valid point. 
4.  **Priority**: If a "Located" survivor (Heat sensor) is within range, the robot ignores empty space and rotates to face the survivor first.

### 3.2. Dead-End Handling (Backtracking)
Each robot maintains a `history` stack of previously visited points.
*   If no new unvisited points are reachable within the sensor range, the robot pops the last point from its `history` and sets it as the next target.
*   This continues until a new unvisited area is found or the robot returns to the starting point (Empty stack).

### 3.3. Robot Model (`robot.js`)
- **State Machine**: Procedural state handling (`IDLE`, `SCANNING`, `ROTATING`, `MOVING`, `COMPLETE`).
- **Telemetry**: Each robot maintains a local `steps` counter, incremented only when active (State != `FINISHED`).
- **Pathing**: Greedy unvisited node selection with backtracking via a coordinate history stack.

## 4. Simulation Engine (`simulation.js`)
- **Loop**: `requestAnimationFrame` with variable logic steps per frame.
- **Aggregation**: Real-time summation of individual robot telemetry into global "Total Team Steps".
- **Auto-Stop**: Intelligent goal verification (Coverage == 100% OR all robots `FINISHED`).

## 5. Multi-Robot Coordination
Coordination is handled via **Shared Memory Simulation**:
*   All robots write to a single `globalGrid` within the `MapManager`.
*   When Robot A visits a cell, it marks it as `visited: true` and `ownerId: A`.
*   Robot B sees this cell as already "Cleaned" and will not select it as a target, effectively forcing robots to spread out.

## 6. Visualization & Interface
- **Coordinate System**: Mapping of physical CSS pixels to logical 1000x1000 grid coordinates via `MapManager` scaling logic.
- **Diagnostic HUD**: Real-time tooltip implementation using viewport-relative `fixed` positioning to avoid layout shifting.
- **Layout Architecture**: 2-Column modular flexbox design ensures independent scaling of the Live Stats widget.
*   **Semantic Indexing**: The control panel uses a `<header>` tag for the title to preserve CSS `nth-of-type` indexing for the simulation blocks. This ensures that adding UI elements like the Help HUD doesn't shift the 2-column grid layout.
*   **Toggle Logic**: Tool selection is managed via `data-tool` attributes on buttons, allowing for a more responsive and accessible alternative to traditional radio inputs.
