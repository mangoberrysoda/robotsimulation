# Roadmap: Robot Simulation Future Development

This document outlines the planned future features and long-term vision for the Robot Search & Rescue simulation.

## Short-Term Goals (v1.4 - v1.5)
*   **[ ] Export Analytics**: Add a button to download simulation stats (coverage over time, robot efficiency) as a CSV or JSON file.
*   **[ ] Path Visualization**: Option to toggle "trails" behind robots to see their exact path history on the canvas.
*   **[ ] Diverse Obstacle Types**: Introduce "slow zones" (e.g., rough terrain) that reduce robot speed without being solid walls.

## Mid-Term Goals (v2.0)
*   **[ ] Advanced Pathfinding**: Implement A* or RRT* algorithms for more efficient navigation compared to the current greedy "nearest-neighbor" approach.
*   **[ ] Battery/Energy Constraints**: Add a "Fuel/Battery" stat for robots, requiring them to return to base to recharge.
*   **[ ] Collision Physics**: Enable physical collisions between robots so they must actively avoid each other, not just share a map.

## Long-Term Vision (v3.0+)
*   **[ ] 3D Visualization Layer**: Integrate Three.js to provide a 3D view of the simulation environment.
*   **[ ] Genetic Algorithm Learning**: Allow robots to "evolve" their sensor parameters (range/angle) over multiple runs to find the optimal configuration for a specific map.
*   **[ ] Swarm Intelligence**: Implement flocking behaviors or decentralized task allocation where robots "negotiate" who explores which sector.

---
*Last Updated: 2026-03-02 (v1.6)*
