# Robotics Simulation: Implementation Plan

## 1. Project Goal
Build a high-performance web-based simulation environment for multi-robot search and rescue operations. The system must handle large maps (1000x1000), simulate complex sensor data (Lidar/Heat), and coordinate autonomous agents in real-time.

## 2. Technical Architecture

### Core Components
| Component | Responsibility |
| :--- | :--- |
| **Map Engine** | Image processing, obstacle thresholding, and grid generation. |
| **Logic Engine** | Main simulation loop, FPS control, and batch step execution. |
| **Agent Controller** | Robot state machine, sensor raycasting, and path selection. |
| **UI Dashboard** | Real-time stats visualization and configuration management. |

### Data Model
- **Grid Cell**: `{ x, y, isObstacle, visited, ownerId }`
- **Survivor**: `{ id, x, y, status: ['waiting', 'located', 'saved'] }`
- **Robot Config**: `{ lidarRange, lidarAngle, heatRadius, showSensors }`

## 3. Implementation Phases

### Phase 1: Environment Setup
1. Initialize HTML5 Canvas at 1000x1000 pixels.
2. Implement `FileReader` for map image uploads.
3. **Obstacle Processing**: Scan pixel data and generate a bitmask grid where brightness < 80 designates an obstacle.

### Phase 2: Agent Dynamics
1. Implement a 5-state automaton for robots:
   - `IDLE`: Decision making.
   - `ROTATING`: Orientation adjustment.
   - `MOVING`: Pixel-based translation.
   - `SCANNING`: Sensor data refresh.
   - `COMPLETE`: Arrived at destination.
2. Implement "Greedy Nearest" search restricted to reachable grid points within sensor range.

### Phase 3: Advanced Sensors
1. **Heat Sensor**: Circle-based collision-agnostic detection for "Locating" survivors.
2. **Lidar Sensor**: Raycast-based cone detection (LoS) for "Saving" survivors.
3. Implement Bresenham's Line Algorithm for visibility checks between entities.

### Phase 4: Coordination & UI
1. Implement shared `visited` memory to prevent redundant exploration.
2. Build a responsive "Live Stats" widget using Flexbox.
3. Add simulation speed controls (1-60 FPS) and intensity scalers (Steps/Update).

## 4. Verification Plan

### Automated/Logic Testing
- [ ] Verify LoS logic returns `false` when a ray hits an `isObstacle` cell.
- [ ] Ensure `coverage %` increases correctly as robots move.
- [ ] Validate that "Saved" count can never exceed "Located" count.

### Visual Verification
- [ ] Observe Lidar cone clipping against obstacles.
- [ ] Verify robot rotation aligns perfectly with the target heading before movement starts.
- [ ] Monitor UI responsiveness under 60FPS / 50 steps-per-update load.
