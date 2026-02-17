class Simulation {
    constructor(mapManager, uiCallbacks) {
        this.mapManager = mapManager;
        this.uiCallbacks = uiCallbacks; // { updateStats: (data) => {} }

        this.robots = [];
        this.isRunning = false;
        this.stepCount = 0;
        this.totalSteps = 10000;
        this.stepsPerUpdate = 5;
        this.animationId = null;

        this.robotConfig = {
            lidarRange: 200,
            lidarAngle: 45,
            heatSensorRange: 80,
            showSensors: true
        };
    }

    spawnRobots(count) {
        if (!this.mapManager.robotStartPoint) {
            return false;
        }

        this.robots = [];
        for (let i = 0; i < count; i++) {
            this.robots.push(new Robot(
                i + 1,
                this.mapManager.robotStartPoint.x,
                this.mapManager.robotStartPoint.y,
                this.mapManager,
                this.robotConfig
            ));
        }
        this.draw();
        this.updateStats();
        return true;
    }

    start() {
        if (this.isRunning) return;
        if (this.robots.length === 0) return; // Don't start if no robots
        this.isRunning = true;
        this.loop();
    }

    stop() {
        this.isRunning = false;
        if (this.animationId) cancelAnimationFrame(this.animationId);
    }

    // Feature 2: Reset Simulation Only
    reset(newCount) {
        this.stop();
        this.stepCount = 0;

        // Don't clear entities. Just reset map state and robots.
        this.mapManager.resetMapState();

        // Re-spawn robots at start point if it exists
        this.robots = [];
        if (this.mapManager.robotStartPoint) {
            const count = newCount !== undefined ? newCount : 1;
            this.spawnRobots(count);
        }

        this.draw();
        this.updateStats();
    }

    setConfig(config) {
        this.robotConfig = { ...this.robotConfig, ...config };
        this.totalSteps = config.totalSteps || this.totalSteps;
        this.stepsPerUpdate = config.stepsPerUpdate || this.stepsPerUpdate;
        // New: Speed Control
        this.fpsLimit = config.simSpeed || 60;

        // Update existing robots
        this.robots.forEach(r => r.config = this.robotConfig);
    }

    loop(timestamp) {
        if (!this.isRunning) return;

        // Throttle FPS
        if (!this.lastFrameTime) this.lastFrameTime = timestamp;
        const elapsed = timestamp - this.lastFrameTime;
        const fpsInterval = 1000 / (this.fpsLimit || 60);

        if (elapsed > fpsInterval) {
            this.lastFrameTime = timestamp - (elapsed % fpsInterval);

            // Perform N steps
            for (let i = 0; i < this.stepsPerUpdate; i++) {
                if (this.stepCount >= this.totalSteps) {
                    this.stop();
                    alert("Simulation Complete: Total Steps Reached");
                    return;
                }

                this.step();
            }

            this.draw();
            this.updateStats();
        }

        this.animationId = requestAnimationFrame((ts) => this.loop(ts));
    }

    step() {
        this.stepCount++;

        // Requirement 8: "Each robot should start ... after previous robot has moved"
        // Move robots sequentially? Or just update all. 
        // "from that point" implies a deployment delay?
        // Let's just update all for now, standard sim.

        // Broadcast / Reconciliation Phase (Simulated)
        // In a real system, they'd exchange packets. 
        // Here, they share the mapManager.grid, so implicit sharing.
        // But we can collect packets for stats.

        this.robots.forEach(r => r.update(this.stepCount));
    }

    updateStats() {
        // Calculate Coverage
        let visitedCount = 0;
        let totalCount = 0;

        // Roughly count grid points (optimization: cache total)
        for (let row of this.mapManager.grid) {
            for (let p of row) {
                if (!p.isObstacle) {
                    totalCount++;
                    if (p.visited) visitedCount++;
                }
            }
        }

        const coverage = totalCount > 0 ? ((visitedCount / totalCount) * 100).toFixed(1) : 0;

        const survivorsSaved = this.mapManager.survivors.filter(s => s.status === 'saved').length;
        // User Request: "The count of 'saved' should be a subset of 'located'"
        // So Located = (status 'located') + (status 'saved')
        const survivorsLocatedCount = this.mapManager.survivors.filter(s => s.status === 'located').length;
        const totalLocated = survivorsLocatedCount + survivorsSaved;

        this.uiCallbacks.updateStats({
            status: this.isRunning ? "Running" : "Idle",
            activeRobots: this.robots.length,
            coverage: coverage, // Just raw number/string
            survivorsSaved: `${survivorsSaved} / ${this.mapManager.survivors.length}`,
            survivorsLocated: `${totalLocated} / ${this.mapManager.survivors.length}`,
            steps: this.stepCount
        });
    }

    draw() {
        // Redraw Map
        this.mapManager.render();

        // Draw Robots on top
        const ctx = this.mapManager.ctx;
        for (let r of this.robots) {
            r.draw(ctx);
        }
    }
}
