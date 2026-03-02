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
        this.highlightUncleaned = false; // When true, unvisited free cells are shown in yellow

        // Survivors (List of {x, y, id, status})
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
        const padding = 1; // Fixed padding (10px)

        for (let y = 0; y < rows; y++) {
            let row = [];
            for (let x = 0; x < cols; x++) {
                let isEdge = (x < padding || x >= cols - padding || y < padding || y >= rows - padding);
                row.push({
                    x: x * this.gridSpacing + this.gridSpacing / 2,
                    y: y * this.gridSpacing + this.gridSpacing / 2,
                    isObstacle: isEdge,
                    visited: false,
                    ownerId: null
                });
            }
            this.grid.push(row);
        }
    }

    // Load image and process obstacles
    loadImage(fileOrBlob) {
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
            reader.readAsDataURL(fileOrBlob);
        });
    }

    // Load image from URL
    loadFromUrl(url) {
        return new Promise((resolve, reject) => {
            // Check if we have a Base64 version of this map to avoid CORS/Taint
            if (typeof DEFAULT_MAP_B64 !== 'undefined' && url.includes('obstacle-map.png')) {
                const img = new Image();
                img.onload = () => {
                    this.bgImage = img;
                    this.processMapData();
                    this.render();
                    resolve();
                };
                img.onerror = reject;
                img.src = DEFAULT_MAP_B64;
                return;
            }

            fetch(url)
                .then(r => r.blob())
                .then(blob => this.loadImage(blob))
                .then(resolve)
                .catch(err => {
                    console.warn("Direct file loading fallback", err);
                    const img = new Image();
                    img.onload = () => {
                        this.bgImage = img;
                        this.processMapData();
                        this.render();
                        resolve();
                    };
                    img.onerror = reject;
                    img.src = url;
                });
        });
    }

    // Analyze pixel data to mark obstacles
    processMapData() {
        if (!this.bgImage) return;

        // Draw image to canvas temporarily to read pixels
        this.ctx.clearRect(0, 0, this.width, this.height);
        this.ctx.drawImage(this.bgImage, 0, 0, this.width, this.height);

        let imageData;
        try {
            imageData = this.ctx.getImageData(0, 0, this.width, this.height);
        } catch (e) {
            console.error("Canvas Tainted: Lidar will not see walls.", e);
            alert("Security Alert: Browser blocked reading pixels. \n\nIf you see this, PLEASE RELOAD THE PAGE.\nTo avoid this, use 'Choose File' to upload map manually.");
            return;
        }

        const data = imageData.data;
        const padding = 1; // skip edge points
        const cols = this.width / this.gridSpacing;
        const rows = this.height / this.gridSpacing;

        // Sampling offsets (Center + 4 corners) to catch thin lines in a 10x10 cell
        const offsets = [
            { dx: 0, dy: 0 },
            { dx: -3, dy: -3 },
            { dx: 3, dy: -3 },
            { dx: -3, dy: 3 },
            { dx: 3, dy: 3 }
        ];

        for (let r = 0; r < rows; r++) {
            for (let c = 0; c < cols; c++) {
                if (c < padding || c >= cols - padding || r < padding || r >= rows - padding) {
                    this.grid[r][c].isObstacle = true;
                    continue;
                }

                const point = this.grid[r][c];
                let wallDetected = false;

                // Check multiple points in the cell
                for (let off of offsets) {
                    const sx = Math.floor(point.x + off.dx);
                    const sy = Math.floor(point.y + off.dy);

                    if (sx >= 0 && sx < this.width && sy >= 0 && sy < this.height) {
                        const pxIndex = (sy * this.width + sx) * 4;
                        const brightness = (data[pxIndex] + data[pxIndex + 1] + data[pxIndex + 2]) / 3;
                        if (brightness < 160) { // Catch gray/thin lines
                            wallDetected = true;
                            break;
                        }
                    }
                }

                this.grid[r][c].isObstacle = wallDetected;
            }
        }
        // Clear canvas after processing
        this.ctx.clearRect(0, 0, this.width, this.height);
    }

    addSurvivor(x, y) {
        if (x < 0 || x > this.width || y < 0 || y > this.height) return;
        const id = this.survivors.length + 1;
        this.survivors.push({ x, y, id, status: 'waiting' });
        this.render();
    }

    setRobotStart(x, y) {
        if (this.isObstacleAt(x, y)) {
            alert("Cannot place robot on an obstacle!");
            return false;
        }
        this.robotStartPoint = { x, y };
        this.render();
        return true;
    }

    isObstacleAt(x, y) {
        const c = Math.floor(x / this.gridSpacing);
        const r = Math.floor(y / this.gridSpacing);
        if (r >= 0 && r < this.grid.length && c >= 0 && c < this.grid[0].length) {
            return this.grid[r][c].isObstacle;
        }
        return true;
    }

    // Returns true if there is a clear line between p1 and p2
    checkLineOfSight(p1, p2) {
        // Simple Raymarching for LoS (more robust than Bresenham for survivors)
        const dist = Math.sqrt((p2.x - p1.x) ** 2 + (p2.y - p1.y) ** 2);
        const steps = Math.ceil(dist / 5);
        const dx = (p2.x - p1.x) / steps;
        const dy = (p2.y - p1.y) / steps;

        for (let i = 1; i < steps; i++) {
            const cx = p1.x + dx * i;
            const cy = p1.y + dy * i;

            if (this.isObstacleAt(cx, cy)) return false;

            // Check if current grid point hits any survivor (except target)
            for (const s of this.survivors) {
                if (Math.abs(p2.x - s.x) < 1 && Math.abs(p2.y - s.y) < 1) continue;
                const dToS = Math.sqrt((cx - s.x) ** 2 + (cy - s.y) ** 2);
                if (dToS < 8) return false;
            }
        }
        return true;
    }

    // Raycast for Lidar
    getRayDistance(origin, angleRad, maxDist) {
        const stepSize = 4;
        const cos = Math.cos(angleRad);
        const sin = Math.sin(angleRad);
        const survivorRadiusSq = 64;

        for (let dist = 0; dist < maxDist; dist += stepSize) {
            const cx = origin.x + cos * dist;
            const cy = origin.y + sin * dist;

            // 1. Check Walls (Primary)
            if (this.isObstacleAt(cx, cy)) return dist;

            // 2. Check Survivors (Only if dist > 15 to avoid self-blocking)
            if (dist > 15) {
                for (const s of this.survivors) {
                    const dx = cx - s.x;
                    const dy = cy - s.y;
                    if (dx * dx + dy * dy < survivorRadiusSq) return dist;
                }
            }
        }
        return maxDist;
    }

    clearEntities() {
        this.survivors = [];
        this.robotStartPoint = null;
        this.initGrid();
        if (this.bgImage) this.processMapData();
        this.render();
    }

    resetMapState() {
        this.highlightUncleaned = false;
        for (let row of this.grid) {
            for (let p of row) {
                p.visited = false;
                p.ownerId = null;
            }
        }
        for (let s of this.survivors) s.status = 'waiting';
        this.render();
    }

    render() {
        this.ctx.clearRect(0, 0, this.width, this.height);
        if (this.bgImage) {
            this.ctx.drawImage(this.bgImage, 0, 0, this.width, this.height);
        } else {
            this.ctx.fillStyle = '#111';
            this.ctx.fillRect(0, 0, this.width, this.height);
        }

        // Project debug obstacles
        for (let r = 0; r < this.grid.length; r++) {
            for (let c = 0; c < this.grid[r].length; c++) {
                const p = this.grid[r][c];
                if (p.isObstacle) {
                    this.ctx.fillStyle = 'rgba(255, 0, 0, 0.4)';
                    this.ctx.fillRect(p.x - 2, p.y - 2, 4, 4);
                } else if (p.visited) {
                    this.ctx.fillStyle = 'rgba(0, 255, 0, 0.2)';
                    this.ctx.fillRect(p.x - 5, p.y - 5, 10, 10);
                } else if (this.highlightUncleaned) {
                    // Highlight uncleaned reachable cells in bright yellow
                    this.ctx.fillStyle = 'rgba(255, 140, 0, 1.0)';
                    this.ctx.fillRect(p.x - 5, p.y - 5, 10, 10);
                }
            }
        }

        // Draw Survivors
        for (const s of this.survivors) {
            this.ctx.beginPath();
            this.ctx.arc(s.x, s.y, 8, 0, Math.PI * 2);
            this.ctx.fillStyle = s.status === 'saved' ? '#00FF00' : (s.status === 'located' ? '#FF9800' : '#FF0000');
            this.ctx.fill();
            this.ctx.strokeStyle = '#FFF';
            this.ctx.stroke();

            this.ctx.font = 'bold 12px Arial';
            this.ctx.fillStyle = '#FFF';
            this.ctx.textAlign = 'center';
            this.ctx.strokeText(s.id, s.x, s.y + 4);
            this.ctx.fillText(s.id, s.x, s.y + 4);
        }

        if (this.robotStartPoint) {
            this.ctx.beginPath();
            this.ctx.arc(this.robotStartPoint.x, this.robotStartPoint.y, 10, 0, Math.PI * 2);
            this.ctx.strokeStyle = '#00FFFF';
            this.ctx.stroke();
        }
    }
}
