# Multi-Agent Robot Search & Rescue Simulation

[![Version](https://img.shields.io/badge/version-1.7-blue.svg)](./project-plan/changelog.md)
[![Status](https://img.shields.io/badge/status-active-green.svg)](./project-plan/project_plan.md)

An advanced web-based multi-agent simulation where robots explore unknown terrain to locate and save survivors using Lidar and Heat sensors. Developed with modern web technologies for high-performance procedural animation and coordination logic.

---

### 🚀 Key Features (v1.7)
- **Advanced Diagnostics**: Dynamic grid coordinate tooltip (0-1000) for surgical robot placement.
- **Efficiency Analytics**: Individual robot step tracking ("pts vs steps") and team-wide aggregate metrics.
- **Intelligent Navigation**: Greedy pathfinding with backtracking and shared map knowledge.
- **Visual Feedback**: Heat sensor (Radius) and Lidar (Cone) visualization with line-of-sight collision checks.
- **Professional Layout**: Optimized side-by-side columnar interface for maximum stability on large screens.

---

### 🛠️ Technology
- **Engine**: Vanilla JavaScript (ES6)
- **Graphics**: HTML5 Canvas (2D)
- **Logic**: Grid-based procedural simulation
- **Author**: Vaibhav Vinod

## 🛠️ Getting Started
1. Open `index.html` in any modern web browser (Chrome/Edge recommended).
2. Upload an **Obstacle Map** (or use the provided Default Map).
3. Place **Survivors** and a **Robot Start Point**.
4. Set your robot count and hit **Start**.

## 📂 Documentation Suite
Detailed project information is available in the `project-plan/` directory:
- **[User Guide](project-plan/user_guide.md)**: Full instructions for simulation operators.
- **[Architecture Deep Dive](project-plan/architecture_deep_dive.md)**: Technical explanation of the grid logic and sensors.
- **[Changelog](project-plan/changelog.md)**: History of version refinements (v1.1 to v1.6).
- **[Roadmap](project-plan/roadmap.md)**: Future development goals and vision.
- **[Troubleshooting](project-plan/troubleshooting.md)**: Solutions for common performance and security questions.

---
*Created by Vaibhav Vinod | v1.7 Final Release*
