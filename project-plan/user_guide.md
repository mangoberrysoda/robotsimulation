# User Guide: Robot Search & Rescue Simulation

Welcome to the Robot Search & Rescue Simulation. This guide will help you understand how to use the application to simulate autonomous robots exploring environments.

## 1. Getting Started

### 1.1. Uploading a Map
The simulation requires an environment map to operate.
*   **Custom Map**: Click **"Choose File"** to upload any image. The simulation treats **dark pixels** (brightness < 160) as obstacles and **light pixels** as traversable space.
*   **Default Map**: Click **"Use Default"** to load the built-in obstacle map.

#Use the **Placement** section to choose your tool:
*   **Survivors**: Click on the map to add survivors (Red dots). These are the targets the robots need to find.
*   **Robots (Start)**: Click on the map to set the starting point for all robots.

> [!TIP]
> The active tool is highlighted with a blue glow. You cannot place entities inside obstacles (dark areas).

## 2. Simulation Controls

### 2.1. Adjusting Robot Count
Use the **Count** slider (or type a number) to set how many robots will participate (1 to 20).

### 2.2. Running the Simulation
*   **Start/Stop**: Click the **Start** button to begin. The button will turn red and say **Stop** while the simulation is running.
*   **Reset**: Click **Reset** to return all robots to the starting point and clear the "visited" history of the map. This does *not* remove placed survivors.
*   **Clear All**: Removes all survivors and the robot start point.

### 2.3. Speed & Performance
*   **Speed (FPS)**: Controls the rendering frequency. Higher is smoother but more CPU-intensive.
*   **Steps/Update**: Controls how many logic steps happen per frame. Increase this to make the simulation "run faster" without increasing FPS.

## 3. Sensor Settings
*   **Lidar Range**: How far the robot can see obstacles and survivors in a straight line.
*   **Lidar Angle**: The width of the robot's vision cone.
*   **Heat Radius**: The range at which the robot can "sense" survivors through walls.
*   **Show Sensors**: Toggle the visualization of sensor ranges on the canvas.

## 4. Understanding Live Stats
*   **Free Area**: The percentage of the map that isn't covered by obstacles.
*   **Cleaned Area**: The percentage of the "Free Area" that has been successfully visited by robots.
*   **Survivors Located**: Survivors detected by a heat sensor (Orange).
*   **Survivors Saved**: Survivors confirmed by a Lidar sensor with a clear line-of-sight (Green).
*   **Mapped Points / Robot**: A live table showing how many unique points each individual robot has contributed to the total coverage.

## 5. Completion Triggers
The simulation will automatically stop and alert you if:
1.  **100% Coverage** is reached.
2.  **All Robots Return** to the starting point after exploring all reachable areas.
3.  The **Total Steps** limit (default 10,000) is reached.

> [!NOTE]
> Upon automatic stop, any traversable areas that remain **unvisited** will be highlighted in **Bright Orange** to show you what the robots missed.
