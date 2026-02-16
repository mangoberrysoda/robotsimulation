class MapManager {
    constructor(canvasId) {
        this.canvas = document.getElementById(canvasId);
        this.ctx = this.canvas.getContext('2d', { willReadFrequently: true });
        this.width = 1000;
        this.height = 1000;

        // Internal state
        this.bgImage = null; // The uploaded map image
        this.grid = []; // 2D array of grid points: { x, y, isObstacle, visited, ownerId }
        this.gridSpacing = 10;

        // Survivors (List of {x, y, id, found})
        this.survivors = [];

        // Robot Start Point {x, y}
        this.robotStartPoint = null;

        // Init grid
        this.initGrid();
    }

    initGrid() {
        this.grid = [];
        const cols = this.width / this.gridSpacing;
        const rows = this.height / this.gridSpacing;
        const padding = 2; // Skip first/last 2 rows/cols (20px edge)

        for (let y = 0; y < rows; y++) {
            let row = [];
            for (let x = 0; x < cols; x++) {
                // Feature 1: Do not consider edge points
                let isEdge = (x < padding || x >= cols - padding || y < padding || y >= rows - padding);

                row.push({
                    x: x * this.gridSpacing + this.gridSpacing / 2, // center of cell
                    y: y * this.gridSpacing + this.gridSpacing / 2,
                    isObstacle: isEdge, // Mark edges as obstacles effectively
                    visited: false,
                    ownerId: null // ID of robot heading here
                });
            }
            this.grid.push(row);
        }
    }

    // Load image and process obstacles
    loadImage(file) {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = (event) => {
                const img = new Image();
                img.onload = () => {
                    this.bgImage = img;
                    this.processMapData();
                    this.render();
                    resolve();
                };
                img.onerror = reject;
                img.src = event.target.result;
            };
            reader.readAsDataURL(file);
        });
    }

    // Analyze pixel data to mark obstacles
    processMapData() {
        // Draw image to canvas temporarily to read pixels
        this.ctx.clearRect(0, 0, this.width, this.height);
        this.ctx.drawImage(this.bgImage, 0, 0, this.width, this.height);

        const imageData = this.ctx.getImageData(0, 0, this.width, this.height);
        const data = imageData.data;

        const padding = 2;
        const cols = this.width / this.gridSpacing;
        const rows = this.height / this.gridSpacing;

        // Reset grid obstacles
        for (let r = 0; r < this.grid.length; r++) {
            for (let c = 0; c < this.grid[r].length; c++) {
                // Skip if already marked as edge obstacle
                if (c < padding || c >= cols - padding || r < padding || r >= rows - padding) {
                    this.grid[r][c].isObstacle = true;
                    continue;
                }

                const point = this.grid[r][c];
                // Check pixel at point coordinates
                // Index = (y * width + x) * 4
                const pxIndex = (Math.floor(point.y) * this.width + Math.floor(point.x)) * 4;

                // Simple brightness check: (R+G+B)/3 < threshold
                // Dark = Obstacle
                const avg = (data[pxIndex] + data[pxIndex + 1] + data[pxIndex + 2]) / 3;

                // Threshold 50 (very dark) is obstacle
                if (avg < 80) {
                    point.isObstacle = true;
                } else {
                    point.isObstacle = false;
                }
            }
        }

        // Clear canvas after processing (will be redrawn in render loop)
        this.ctx.clearRect(0, 0, this.width, this.height);
    }

    addSurvivor(x, y) {
        if (x < 0 || x > this.width || y < 0 || y > this.height) return;

        // Feature 4: Numbering
        const id = this.survivors.length + 1;
        // Status: 'waiting', 'located', 'saved'
        this.survivors.push({ x, y, id, status: 'waiting' });
        this.render();
    }

    setRobotStart(x, y) {
        // Check if on obstacle
        if (this.isObstacleAt(x, y)) {
            alert("Cannot place robot on an obstacle!");
            return false;
        }
        this.robotStartPoint = { x, y };
        this.render();
        return true;
    }

    isObstacleAt(x, y) {
        // Find grid cell
        const c = Math.floor(x / this.gridSpacing);
        const r = Math.floor(y / this.gridSpacing);

        if (r >= 0 && r < this.grid.length && c >= 0 && c < this.grid[0].length) {
            return this.grid[r][c].isObstacle;
        }
        return true; // Out of bounds is obstacle
    }

    // Feature: Line of Sight (Bresenham's Line Algorithm)
    // Returns true if there is a clear line between p1 and p2
    checkLineOfSight(p1, p2) {
        let x0 = Math.floor(p1.x / this.gridSpacing);
        let y0 = Math.floor(p1.y / this.gridSpacing);
        let x1 = Math.floor(p2.x / this.gridSpacing);
        let y1 = Math.floor(p2.y / this.gridSpacing);

        const dx = Math.abs(x1 - x0);
        const dy = Math.abs(y1 - y0);
        const sx = (x0 < x1) ? 1 : -1;
        const sy = (y0 < y1) ? 1 : -1;
        let err = dx - dy;

        while (true) {
            // Check current cell for obstacle
            if (y0 >= 0 && y0 < this.grid.length && x0 >= 0 && x0 < this.grid[0].length) {
                if (this.grid[y0][x0].isObstacle) {
                    return false; // Header blocked
                }
            } else {
                return false; // Out of bounds
            }

            if ((x0 === x1) && (y0 === y1)) break;
            const e2 = 2 * err;
            if (e2 > -dy) { err -= dy; x0 += sx; }
            if (e2 < dx) { err += dx; y0 += sy; }
        }
        return true;
    }

    // Feature: Raycast for Lidar Visualization
    getRayDistance(origin, angleRad, maxDist) {
        const stepSize = this.gridSpacing / 2; // Step size for ray marching
        let dist = 0;

        const cos = Math.cos(angleRad);
        const sin = Math.sin(angleRad);

        while (dist < maxDist) {
            dist += stepSize;
            if (dist > maxDist) dist = maxDist;

            const cx = origin.x + cos * dist;
            const cy = origin.y + sin * dist;

            // check if obstacle
            if (this.isObstacleAt(cx, cy)) {
                return dist;
            }

            if (dist >= maxDist) return maxDist;
        }
        return maxDist;
    }

    clearEntities() {
        this.survivors = [];
        this.robotStartPoint = null;
        this.initGrid(); // Resets visited state too (if re-processing image is overkill)
        if (this.bgImage) this.processMapData(); // Re-apply obstacles if map exists
        this.render();
    }

    // Feature 2: Reset Map State Only (keep entities)
    resetMapState() {
        // Reset grid visited/owner flags
        for (let row of this.grid) {
            for (let p of row) {
                p.visited = false;
                p.ownerId = null;
            }
        }
        // Reset survivors found status
        for (let s of this.survivors) {
            s.status = 'waiting';
        }
        this.render();
    }

    render() {
        this.ctx.clearRect(0, 0, this.width, this.height);

        // 1. Draw Background Map
        if (this.bgImage) {
            this.ctx.drawImage(this.bgImage, 0, 0, this.width, this.height);
        } else {
            // Default background
            this.ctx.fillStyle = '#111';
            this.ctx.fillRect(0, 0, this.width, this.height);
        }

        // 2. Draw Grid (Optional: only draw dots to reduce clutter)
        this.ctx.fillStyle = 'rgba(255, 255, 255, 0.2)';
        for (let r = 0; r < this.grid.length; r++) {
            for (let c = 0; c < this.grid[r].length; c++) {
                const p = this.grid[r][c];
                if (p.isObstacle) {
                    // Start/End edges might be invisible if we want cleaner look, 
                    // but for debug let's keep red obstacles visible or make them subtle
                    // this.ctx.fillStyle = 'rgba(200, 0, 0, 0.3)'; // Red tint for obstacles debug
                    // this.ctx.fillRect(p.x - 2, p.y - 2, 4, 4);
                } else if (p.visited) {
                    this.ctx.fillStyle = 'rgba(0, 255, 0, 0.3)'; // Green for visited
                    this.ctx.fillRect(p.x - 1, p.y - 1, 2, 2);
                } else {
                    this.ctx.fillStyle = 'rgba(255, 255, 255, 0.1)';
                    this.ctx.fillRect(p.x - 1, p.y - 1, 2, 2);
                }
            }
        }

        // 3. Draw Survivors (Feature 4, 5: 3-States)
        for (const s of this.survivors) {
            this.ctx.beginPath();
            this.ctx.arc(s.x, s.y, 8, 0, Math.PI * 2);

            // Color based on status
            if (s.status === 'saved') {
                this.ctx.fillStyle = '#00FF00'; // Green
            } else if (s.status === 'located') {
                this.ctx.fillStyle = '#FF9800'; // Orange
            } else {
                this.ctx.fillStyle = '#FF0000'; // Red
            }

            this.ctx.fill();
            this.ctx.strokeStyle = '#FFF';
            this.ctx.stroke();

            // ID Number
            this.ctx.font = 'bold 12px Arial';
            this.ctx.textAlign = 'center';
            this.ctx.textBaseline = 'middle';

            // Text Outline for visibility
            this.ctx.lineWidth = 3;
            this.ctx.strokeStyle = '#000';
            this.ctx.strokeText(s.id, s.x, s.y);

            this.ctx.fillStyle = '#FFF';
            this.ctx.fillText(s.id, s.x, s.y);

            // Label status
            if (s.status === 'saved') {
                this.ctx.strokeText("SAVED", s.x, s.y - 12);
                this.ctx.fillText("SAVED", s.x, s.y - 12);
            } else if (s.status === 'located') {
                this.ctx.strokeText("LOCATED", s.x, s.y - 12);
                this.ctx.fillText("LOCATED", s.x, s.y - 12);
            }
        }

        // 4. Draw Robot Start Point
        if (this.robotStartPoint) {
            this.ctx.beginPath();
            this.ctx.arc(this.robotStartPoint.x, this.robotStartPoint.y, 10, 0, Math.PI * 2);
            this.ctx.strokeStyle = '#00FFFF';
            this.ctx.lineWidth = 2;
            this.ctx.stroke();
            this.ctx.fillStyle = '#00FFFF';
            this.ctx.fillText("START", this.robotStartPoint.x - 15, this.robotStartPoint.y - 15);
        }
    }
}
