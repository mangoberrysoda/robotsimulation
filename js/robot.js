class Robot {
    constructor(id, x, y, mapManager, config) {
        this.id = id;
        this.x = x;
        this.y = y;
        this.mapManager = mapManager;
        this.config = config; // { lidarRange, lidarAngle, showSensors }

        this.angle = 0; // Degrees
        this.radius = 5;
        this.color = Utils.randomColor();

        // State
        this.state = 'IDLE'; // IDLE, SCANNING, ROTATING, MOVING, COMPLETE
        this.targetPoint = null; // {x, y}
        this.path = [];

        // Memory
        this.visitedPoints = new Set(); // Strings "x,y"
        this.history = []; // Stack of {x,y} for backtracking
        this.foundSurvivors = new Set(); // Ids
        this.mappedGrid = new Map(); // Global map knowledge shared via wifi
    }

    update(stepCount) {
        if (this.state === 'IDLE' || this.state === 'COMPLETE') {
            this.decideNextMove();
        } else if (this.state === 'ROTATING') {
            this.rotateTowardsTarget();
        } else if (this.state === 'MOVING') {
            this.moveTowardsTarget();
        }

        // Always scan sensors
        this.scanSensors();

        // Broadcast Data (Requirement 15)
        // Optimization: Only log comfortably, e.g., on change or low frequency
        // console.log(`Robot ${this.id} Broadcast:`, JSON.stringify(this.getPacket())); 
    }

    decideNextMove() {
        // Priority 0: Check if we need to face a "Located" survivor (User Request)
        // "robot should rotate on its axis till it points towards the survior"
        const locatedSurvivor = this.findNearbyLocatedSurvivor();
        if (locatedSurvivor) {
            const angleTo = Utils.angleTo(this, locatedSurvivor);
            const diff = Math.abs(this.angle - angleTo);
            const normalizedDiff = ((diff + 180) % 360) - 180;

            // If not facing it, rotate.
            if (Math.abs(normalizedDiff) > 5) {
                this.targetPoint = { x: locatedSurvivor.x, y: locatedSurvivor.y, isSurvivor: true };
                this.state = 'ROTATING';
                console.log(`Robot ${this.id} rotating towards Located Survivor ${locatedSurvivor.id}`);
                return;
            }
        }

        // 1. Scan for nearest unvisited point
        const target = this.scanForTarget();

        if (target) {
            this.targetPoint = target;
            target.ownerId = this.id; // Claim
            this.state = 'ROTATING';

            // Push current position to history before moving to new one?
            // Actually, we want to trace back to where we came from.
            // So when we arrive at a point, we push it. 
            // Here we are at (this.x, this.y).
            this.history.push({ x: this.x, y: this.y });
        } else {
            // Requirement 13: Retrace
            if (this.history.length > 0) {
                const prev = this.history.pop();
                // Check if we are already there (could happen with logic loops), but generally prev is distinct.
                // We need to move there. 
                // But wait, 'prev' is a coordinate, we need it to be a target point.
                this.targetPoint = { x: prev.x, y: prev.y, retrace: true };
                this.state = 'ROTATING';
            } else {
                // Back at start, stop.
                console.log(`Robot ${this.id} returned to start and finished.`);
                this.state = 'FINISHED'; // New state
            }
        }
    }

    scanForTarget() {
        // Simple Logic: Find nearest unvisited grid point that is not on obstacle
        // Optimization: Search in expanding rings or use mapManager's grid directly

        let nearest = null;
        let minDist = Infinity;

        // We need to access the global grid from mapManager
        const grid = this.mapManager.grid;

        // Search limit to avoid scanning entire 1000x1000 grid every frame
        // Scan within 2x Lidar range
        const range = this.config.lidarRange * 2;
        const startCol = Math.max(0, Math.floor((this.x - range) / 10));
        const endCol = Math.min(grid[0].length, Math.ceil((this.x + range) / 10));
        const startRow = Math.max(0, Math.floor((this.y - range) / 10));
        const endRow = Math.min(grid.length, Math.ceil((this.y + range) / 10));

        for (let r = startRow; r < endRow; r++) {
            for (let c = startCol; c < endCol; c++) {
                const p = grid[r][c];

                // Skip if obstacle, visited, or claimed by another robot
                if (p.isObstacle || p.visited) continue;
                if (p.ownerId !== null && p.ownerId !== this.id) continue;

                const d = Utils.distance(this, p);

                // Check if within lidar range (requirement 10)
                // "Robot should move to the nearest grid point ... within its lidar sensor range"
                if (d > this.config.lidarRange) continue;

                // Fix: Check Line of Sight to prevent going through walls
                if (!this.mapManager.checkLineOfSight(this, p)) continue;

                if (d < minDist) {
                    minDist = d;
                    nearest = p;
                }
            }
        }
        return nearest;
    }
    findNearbyLocatedSurvivor() {
        const heatRange = this.config.heatSensorRange;
        for (const s of this.mapManager.survivors) {
            if (s.status === 'located') { // Only care about those not yet saved
                const dist = Utils.distance(this, s);
                if (dist <= heatRange) {
                    return s;
                }
            }
        }
        return null;
    }

    rotateTowardsTarget() {
        if (!this.targetPoint) {
            this.state = 'IDLE';
            return;
        }

        const desiredAngle = Utils.angleTo(this, this.targetPoint);
        const diff = desiredAngle - this.angle;

        // Normalize diff to -180 to 180
        let d = (diff + 180) % 360 - 180;
        if (d < -180) d += 360;

        const turnSpeed = 10; // degrees per step

        if (Math.abs(d) < turnSpeed) {
            this.angle = desiredAngle;

            if (this.targetPoint.isSurvivor) {
                // We were rotating towards a survivor.
                // Check if they are now saved? If so, we can resume.
                // If not (maybe wall blocked?), we sit here for a bit?
                // For simplicity, let's go back to IDLE so decideNextMove can re-evaluate.
                this.state = 'IDLE';
                this.targetPoint = null;
            } else {
                this.state = 'MOVING';
            }
        } else {
            this.angle += Math.sign(d) * turnSpeed;
        }
    }

    moveTowardsTarget() {
        if (!this.targetPoint) {
            this.state = 'IDLE';
            return;
        }

        const dist = Utils.distance(this, this.targetPoint);
        const speed = 2; // Pixels per step

        if (dist <= speed) {
            // Arrived

            // If this was just a rotation target (survivor), we don't 'arrive' and consume it.
            // Actually, if we are in MOVING state, it means we finished rotating.
            // But for survivor look-at, we shouldn't have entered MOVING state if we only wanted to rotate?

            // Fix: rotateTowardsTarget sets state to MOVING when done.
            // We should intercept that.

            this.x = this.targetPoint.x;
            this.y = this.targetPoint.y;

            if (this.targetPoint.isSurvivor) {
                // We shouldn't actually move TO the survivor if we just wanted to look.
                // But current logic: decideNextMove -> ROTATING -> (done) -> MOVING.
                // If we want to STOP after rotating, we need to handle that in rotateTowardsTarget.
            }

            if (!this.targetPoint.retrace && !this.targetPoint.isSurvivor) {
                // If this was a new point (not backtracking), mark visited
                this.targetPoint.visited = true;
                this.targetPoint.ownerId = null;
                this.visitedPoints.add(`${this.targetPoint.x},${this.targetPoint.y}`);

                // Broadcast change
                // Requirement 15
                console.log(`Robot ${this.id} reached ${this.x},${this.y}. Broadcasting...`);
            }

            this.state = 'COMPLETE';
            this.targetPoint = null;
        } else {
            // Move forward
            const rad = Utils.degToRad(this.angle);
            this.x += Math.cos(rad) * speed;
            this.y += Math.sin(rad) * speed;
        }
    }

    scanSensors() {
        // Feature 3 & 5: Heat (Located) vs Lidar (Saved)
        const heatRange = this.config.heatSensorRange;
        const lidarRange = this.config.lidarRange;
        const lidarAngleHalf = Utils.degToRad(this.config.lidarAngle / 2);

        for (const s of this.mapManager.survivors) {
            if (s.status === 'saved') continue;

            const dist = Utils.distance(this, s);

            // 1. Check Heat (Locating) - Wall penetrating
            // If waiting and within heat range, mark as located
            if (s.status === 'waiting' && dist <= heatRange) {
                s.status = 'located';
                console.log(`Survivor ${s.id} LOCATED by Robot ${this.id}`);
            }

            // 2. Check Lidar (Saving) - Requires line of sight AND being in the Lidar cone
            if (s.status === 'located' && dist <= lidarRange) {
                // Check if survivor is within the Lidar FOV (cone)
                const angleToSurvivor = Utils.angleTo(this, s);
                const diff = Utils.degToRad(angleToSurvivor - this.angle);

                // Normalize angle diff to [-PI, PI]
                let normalizedDiff = (diff + Math.PI) % (2 * Math.PI) - Math.PI;
                if (normalizedDiff < -Math.PI) normalizedDiff += 2 * Math.PI;

                if (Math.abs(normalizedDiff) <= lidarAngleHalf) {
                    const hasLineOfSight = this.mapManager.checkLineOfSight(this, s);
                    if (hasLineOfSight) {
                        s.status = 'saved';
                        this.foundSurvivors.add(s.id);
                        console.log(`Survivor ${s.id} SAVED by Robot ${this.id}`);
                    }
                }
            }
        }
    }

    getPacket() {
        return {
            id: this.id,
            x: this.x,
            y: this.y,
            visited: Array.from(this.visitedPoints),
            found: Array.from(this.foundSurvivors)
        };
    }

    receivePacket(packet) {
        if (packet.id === this.id) return;

        // Reconcile data
        // For simplicity, we update the global mapManager grid directly in Simulation
        // But strictly, robots "share" this. 
        // We will simulate the reconcilliation by aggregating stats in Sim.
    }

    draw(ctx) {
        ctx.save();
        ctx.translate(this.x, this.y);
        ctx.rotate(Utils.degToRad(this.angle)); // Rotate entire local space

        // Draw Sensors
        if (this.config.showSensors) {
            // 1. Heat Sensor Circle (Omni-directional usually)
            // Feature: Darker shade, visible circle
            ctx.beginPath();
            ctx.arc(0, 0, this.config.heatSensorRange, 0, Math.PI * 2);
            ctx.fillStyle = 'rgba(255, 165, 0, 0.15)'; // Orange tint, slightly more opaque
            ctx.fill();
            ctx.strokeStyle = 'rgba(255, 140, 0, 0.6)'; // Dark orange border
            ctx.lineWidth = 1;
            ctx.stroke();

            // 2. Lidar/View Cone (Raycast Visualization)
            const lidarSteps = 30; // Resolution of cone
            const angleRad = Utils.degToRad(this.config.lidarAngle);
            const startAngle = Utils.degToRad(this.angle) - angleRad / 2;
            const stepAngle = angleRad / lidarSteps;

            ctx.beginPath();
            ctx.moveTo(0, 0);

            for (let i = 0; i <= lidarSteps; i++) {
                const rayAngle = startAngle + stepAngle * i;

                // Get distance to obstacle using mapManager
                // Need to convert relative angle to absolute for raycasting
                // rayAngle is absolute (this.angle is absolute)

                // We need a helper function in mapManager or here. 
                // Let's rely on mapManager.getRayDistance which we need to add.
                // Assuming it exists or implementing inline here is hard because we need grid access.
                // Let's call mapManager.getRayDistance(startPos, angleRad, maxDist)

                const rayDist = this.mapManager.getRayDistance(this, rayAngle, this.config.lidarRange);

                // Convert back to local coordinates for drawing (since we translated/rotated?)
                // Wait, ctx is translated to (this.x, this.y) but NOT rotated yet in this block.
                // The body draw below rotates.

                const drawX = Math.cos(rayAngle - Utils.degToRad(this.angle)) * rayDist; // Adjust for body rotation?
                // Actually, let's draw sensors in WORLD space or relative?
                // The original code: ctx.translate(this.x, this.y).
                // It draws sensors assuming 0 rotation?
                // No, ctx.arc(..., -angleRad/2, angleRad/2) implies it's drawing aligned with X axis?
                // But then robot body rotates.

                // Let's match the coordinate system.
                // Previous code: ctx.arc(0, 0, r, -angleRad/2, +angleRad/2).
                // Then Robot Body: ctx.rotate(this.angle). 
                // This means the sensors were NOT rotating with the body in the previous code?
                // "ctx.rotate" affects subsequent calls.
                // So the arc was static? Ah, wait.
                // If previous code was: translate, draw sensors, rotate, draw body.
                // Then sensors were ALWAYS pointing right (0 radians) while body rotated. 
                // THAT WAS A BUG in previous visualization too! Lidar should rotate with body.

                // FIX: Rotate context FIRST before drawing sensors.
                // But raycasting needs absolute world angles.

                // Strategy:
                // 1. Calculate ray distances in World Space.
                // 2. Draw polygon in Local Space (rotated).

                // If we are in Local Space (rotated by this.angle):
                // Ray 0 is at -FOV/2. Ray i is at -FOV/2 + step*i.
                // World Angle = this.angle + Local Angle.

                const localRayAngle = -angleRad / 2 + stepAngle * i;
                const worldRayAngle = Utils.degToRad(this.angle) + localRayAngle;

                const dist = this.mapManager.getRayDistance(this, worldRayAngle, this.config.lidarRange);

                ctx.lineTo(Math.cos(localRayAngle) * dist, Math.sin(localRayAngle) * dist);
            }

            ctx.closePath(); // Connect back to 0,0
            ctx.fillStyle = 'rgba(255, 255, 0, 0.25)';
            ctx.fill();
            ctx.strokeStyle = 'rgba(255, 255, 0, 0.8)';
            ctx.lineWidth = 1;
            ctx.stroke();
        }

        // Draw Robot Body
        // ctx.rotate is already applied
        ctx.beginPath();
        ctx.arc(0, 0, this.radius, 0, Math.PI * 2);
        ctx.fillStyle = this.color;
        ctx.fill();
        ctx.strokeStyle = '#FFF';
        ctx.lineWidth = 1;
        ctx.stroke();

        // Direction Indicator
        ctx.beginPath();
        ctx.moveTo(0, 0);
        ctx.lineTo(this.radius + 5, 0);
        ctx.strokeStyle = '#FFF';
        ctx.stroke();

        ctx.restore();
    }
}
