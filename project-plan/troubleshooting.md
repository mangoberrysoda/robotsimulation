# Troubleshooting Guide: Robot Simulation

## 1. Security & Loading Issues

### 1.1. "Canvas has been tainted by cross-origin data" Error
*   **Cause**: Historically caused by loading external map images without a local server.
*   **Solution**: The default map is now embedded as Base64 data in `js/default-map.js`, which bypasses this browser restriction entirely. If you encounter this with a *custom* image, ensure you are running the app through a local development server (like VS Code Live Server).

## 2. Rendering & Performance

### 2.1. The simulation is lagging or frame rate is low
*   **Check**: Are there 20 robots on a very complex map?
*   **Solution**: 
    1.  Decrease **"Steps Per Update"** (try 1-5).
    2.  Decrease **"FPS Limit"** to 30.
    3.  Close other high-CPU browser tabs.

### 2.2. Map looks blurry
*   **Cause**: CSS scaling of the canvas to fit the viewport.
*   **Note**: This is normal for the background image, but it does **not** affect simulation accuracy. The logical grid is always 1000x1000 internally.

## 3. Simulation Logic Issues

### 3.1. Robots are getting "stuck" in a small area
*   **Resolution**: This often happens if the map has very narrow 1-pixel passages.
*   **Fix**: 
    1.  Click **Reset** to clear the grid and restart.
    2.  Try increasing the **Lidar Angle** to 90 or 120 degrees so the robot "sees" more unvisited space.

### 3.2. Survivors are not being "Saved" (Green)
*   **Requirement**: A survivor is only saved if the robot is **facing** them within the **Lidar Range** and has a clear **Line-of-Sight**.
*   **Check**: Is there a wall or another survivor blocking the view? The Lidar is blocked by obstacles.

## 4. General Tips
*   **Browser Support**: Use **Chrome** or **Edge** for the best Canvas performance.
*   **Reset vs Clear**: Remember that **Reset** keeps your robots and survivors in place, while **Clear All** removes everything except the map.
