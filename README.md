# Robot Search & Rescue Simulation (v1.6)

A high-performance, web-based simulation where autonomous robots explore an unknown environment to locate and save survivors. 

![Project Version](https://img.shields.io/badge/Version-1.6-blue)
![Tech Stack](https://img.shields.io/badge/Stack-HTML5%20|%20CSS3%20|%20JS-orange)

## 🚀 Overview
This simulation demonstrates autonomous exploration principles using shared memory coordination. Multiple robots collaborate to map a traversable area using Lidar and Heat sensors, prioritizing survival rescue while avoiding obstacles.

## ✨ Key Features
- **Multi-Agent Coordination**: Shared "visited" grid ensures efficient area coverage across up to 20 robots.
- **Dual Sensing System**: 
  - **Heat Sensors**: Detect survivors through walls/obstacles (Stage 1: Located).
  - **Lidar Sensors**: High-precision line-of-sight confirmation (Stage 2: Saved).
- **Intelligent Auto-Stop**: Simulation halts automatically on 100% coverage or exploration completion.
- **Professional Dashboard**: Real-time analytics, per-robot efficiency tracking, and interactive configuration sliders.
- **Integrated Help HUD**: Instant access to a comprehensive user guide directly from the UI.

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
*Created by Vaibhav Vinod | v1.6 Final Release*
