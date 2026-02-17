# Walkthrough - Survivor Detection & Map Fixes

I've refined the search and rescue logic to be more realistic and resolved the critical Lidar detection issues.

## Key Improvements

### 1. Robust Map Loading
- **Base64 Bypass**: The default map is now embedded as Base64 data in `js/default-map.js`. This permanently eliminates "Canvas Tainted" security errors, allowing the Lidar to work instantly.
- **Improved Manual Upload**: Manual uploads now use multi-point sampling for 100% accuracy on thin walls.

### 2. Precise Lidar Detection
- **Multi-Point Sampling**: The robot now checks 5 points per grid cell (Center + 4 corners). This ensures that even the thinnest wall lines are detected as obstacles.
- **Physical Survivors**: Survivors now act as solid obstacles that block Lidar rays and cast shadows.
- **Self-Obstruction Fix**: Added a 15px 'safe zone' around the robot center to prevent sensor self-blocking.

### 3. "Locate -> Rotate -> Save" Workflow
- **Heat Mapping**: Robots locate survivors through walls using heat (orange status).
- **Target Rotation**: Robots prioritize rotating toward the located survivor before saving.
- **Lidar Verification**: A survivor is only "Saved" (green status) if the robot is facing them and has a clear Lidar line-of-sight.

## Verification
- **Debug Dots**: Red dots on the map confirm where the robot "sees" obstacles.
- **Sequence**: Robots correctly transition from searching to rotating to saving.
