class Simulation {
    constructor(mapManager, uiCallbacks) {
        this.mapManager = mapManager;
        this.uiCallbacks = uiCallbacks; // { updateStats: (data) => {}, onComplete: (reason) => {} }

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
        this.metersPer10Px = 1.0;
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
        this.metersPer10Px = config.metersPer10Px !== undefined ? config.metersPer10Px : this.metersPer10Px;
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
                    this.mapManager.highlightUncleaned = true;
                    this.draw();
                    this.updateStats();
                    if (this.uiCallbacks.onComplete) this.uiCallbacks.onComplete("Total Steps Reached");
                    setTimeout(() => alert("Simulation Complete: Total Steps Reached"), 0);
                    return;
                }

                this.step();
            }

            // Check for 100% map coverage (round to 1dp to match what the display shows)
            const coverage = parseFloat(this.computeCoverage().toFixed(1));
            if (coverage >= 100) {
                this.stop();
                this.mapManager.highlightUncleaned = true;
                this.draw();
                this.updateStats();
                if (this.uiCallbacks.onComplete) this.uiCallbacks.onComplete("100% Coverage Reached");
                setTimeout(() => alert("Simulation Complete: 100% Map Coverage Achieved!"), 0);
                return;
            }

            // Check if all robots have returned to start (FINISHED state)
            if (this.robots.length > 0 && this.robots.every(r => r.state === 'FINISHED')) {
                this.stop();
                this.mapManager.highlightUncleaned = true;
                this.draw();
                this.updateStats();
                if (this.uiCallbacks.onComplete) this.uiCallbacks.onComplete("All Robots Returned");
                setTimeout(() => alert("Simulation Complete: All Robots Have Returned to Start!"), 0);
                return;
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

    computeCoverage() {
        let visitedCount = 0;
        let totalCount = 0;
        for (let row of this.mapManager.grid) {
            for (let p of row) {
                if (!p.isObstacle) {
                    totalCount++;
                    if (p.visited) visitedCount++;
                }
            }
        }
        return totalCount > 0 ? (visitedCount / totalCount) * 100 : 0;
    }

    computeFreeAreaPercent() {
        let freeCount = 0;
        let totalCount = 0;
        for (let row of this.mapManager.grid) {
            for (let p of row) {
                totalCount++;
                if (!p.isObstacle) freeCount++;
            }
        }
        return totalCount > 0 ? ((freeCount / totalCount) * 100).toFixed(1) : '0.0';
    }

    updateStats() {
        const coverage = this.computeCoverage().toFixed(1);
        const freeArea = this.computeFreeAreaPercent();

        const survivorsSaved = this.mapManager.survivors.filter(s => s.status === 'saved').length;
        // User Request: "The count of 'saved' should be a subset of 'located'"
        // So Located = (status 'located') + (status 'saved')
        const survivorsLocatedCount = this.mapManager.survivors.filter(s => s.status === 'located').length;
        const totalLocated = survivorsLocatedCount + survivorsSaved;

        const robotMappedPoints = this.robots.map(r => ({
            id: r.id,
            color: r.color,
            count: r.visitedPoints.size,
            steps: r.steps,
            distance: ((r.distancePixels / 10) * this.metersPer10Px).toFixed(2)
        }));

        const totalRobotSteps = this.robots.reduce((acc, r) => acc + r.steps, 0);
        const totalDistancePixels = this.robots.reduce((acc, r) => acc + r.distancePixels, 0);
        const totalDistanceMeters = ((totalDistancePixels / 10) * this.metersPer10Px).toFixed(2);

        this.uiCallbacks.updateStats({
            status: this.isRunning ? "Running" : "Idle",
            activeRobots: this.robots.length,
            coverage: coverage,
            freeArea: freeArea,
            survivorsSaved: `${survivorsSaved} / ${this.mapManager.survivors.length}`,
            survivorsLocated: `${totalLocated} / ${this.mapManager.survivors.length}`,
            steps: this.stepCount,
            totalRobotSteps: totalRobotSteps,
            totalDistanceMeters: totalDistanceMeters,
            robotMappedPoints
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
