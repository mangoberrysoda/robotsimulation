// Main Entry Point
// Assumes MapManager and Simulation are loaded globally

console.log("Initializing Robot Simulation...");

// Initialize Modules
const mapManager = new MapManager('simCanvas');

// UI Elements
// UI Elements
const mapUpload = document.getElementById('mapUpload');
const useDefaultMapBtn = document.getElementById('useDefaultMap');
const canvas = document.getElementById('simCanvas');
const clearBtn = document.getElementById('clearEntities');
const simStatus = document.getElementById('simStatus');
const activeRobotsEl = document.getElementById('activeRobots');
// New Progress Bar Elements
const coverageBar = document.getElementById('coverageBar');
const coverageText = document.getElementById('coverageText');

const survivorsLocatedEl = document.getElementById('survivorsLocated');
const survivorsSavedEl = document.getElementById('survivorsSaved');
const stepCountEl = document.getElementById('stepCount');
const freeAreaEl = document.getElementById('freeArea');
const robotMappedTableEl = document.getElementById('robotMappedTable');
const coordTooltip = document.getElementById('coordTooltip');
const startPosEl = document.getElementById('startPos');
const totalRobotStepsEl = document.getElementById('totalRobotSteps');

// Initialize Simulation
const simulation = new Simulation(mapManager, {
    updateStats: (data) => {
        simStatus.textContent = data.status;
        activeRobotsEl.textContent = data.activeRobots;

        // Update Progress Bar
        const coverageVal = data.coverage;
        if (coverageBar) coverageBar.style.width = coverageVal + "%";
        if (coverageText) coverageText.textContent = coverageVal + "%";

        if (freeAreaEl) freeAreaEl.textContent = data.freeArea + "%";

        survivorsLocatedEl.textContent = data.survivorsLocated;
        survivorsSavedEl.textContent = data.survivorsSaved;
        stepCountEl.textContent = data.steps;
        if (totalRobotStepsEl) totalRobotStepsEl.textContent = data.totalRobotSteps;

        // Per-robot mapped points table
        if (robotMappedTableEl && data.robotMappedPoints) {
            robotMappedTableEl.innerHTML = data.robotMappedPoints
                .map(r => `<div class="robot-mapped-row">
                    <span class="robot-dot" style="background:${r.color}"></span>
                    <span class="robot-label">R${r.id}:</span>
                    <span class="robot-count">${r.count} pts / ${r.steps} steps</span>
                </div>`)
                .join('');
        }
    },
    onComplete: (_reason) => {
        // Reset toggle button to "Start" state
        toggleSimBtn.textContent = "Start";
        toggleSimBtn.classList.remove('btn-stop');
        toggleSimBtn.classList.add('btn-start');

        // Unlock UI controls
        document.getElementById('robotCount').disabled = false;
        document.querySelectorAll('.toggle-btn').forEach(btn => btn.disabled = false);
        document.getElementById('clearEntities').disabled = false;
        document.getElementById('mapUpload').disabled = false;
        useDefaultMapBtn.disabled = false;
    }
});

// State
let currentTool = 'robot'; // 'survivor' or 'robot'

// Event Listeners
mapUpload.addEventListener('change', (e) => {
    if (e.target.files && e.target.files[0]) {
        mapManager.loadImage(e.target.files[0])
            .then(() => {
                simStatus.textContent = "Map Loaded";
                console.log("Map loaded successfully");

                // Requirement: Clear all entities on new map
                mapManager.clearEntities();
                simulation.reset(); // Effectively clears robots and resets steps
                simulation.robots = []; // Double check clear
                if (startPosEl) startPosEl.textContent = "—";
            })
            .catch(err => console.error("Error loading map:", err));
    }
});

useDefaultMapBtn.addEventListener('click', () => {
    mapUpload.value = null; // Immediate reset for UI consistency

    mapManager.loadFromUrl('maps/obstacle-map.png')
        .then(() => {
            simStatus.textContent = "Default Map Loaded";
            console.log("Default map loaded successfully");
            mapManager.clearEntities();
            simulation.reset();
            simulation.robots = [];
            if (startPosEl) startPosEl.textContent = "—";
        })
        .catch(err => alert("Failed to load default map."));
});

// Toggle buttons for tools
const toolBtns = document.querySelectorAll('.toggle-btn');
toolBtns.forEach(btn => {
    btn.addEventListener('click', () => {
        currentTool = btn.dataset.tool;
        toolBtns.forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        console.log("Tool switched to:", currentTool);
    });
});

// Canvas Click Handling
canvas.addEventListener('mousedown', (e) => {
    const rect = canvas.getBoundingClientRect();

    // Requirement: Prevent placement if no map uploaded
    if (!mapManager.bgImage) {
        alert("Please upload an obstacle map first!");
        return;
    }

    // Requirement: Prevent placement if simulation is running
    if (simulation.isRunning) {
        alert("Please stop or reset the simulation to place entities.");
        return;
    }

    // Calculate scale factors (internal res / display size)
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;

    // Apply scaling
    const x = (e.clientX - rect.left) * scaleX;
    const y = (e.clientY - rect.top) * scaleY;

    if (currentTool === 'survivor') {
        mapManager.addSurvivor(x, y);
    } else if (currentTool === 'robot') {
        const success = mapManager.setRobotStart(x, y);
        if (success) {
            simStatus.textContent = "Start Point Set";
            if (startPosEl) startPosEl.textContent = `(${Math.round(x)}, ${Math.round(y)})`;
        }
    }
});

canvas.addEventListener('mousemove', (e) => {
    if (simulation.isRunning) {
        coordTooltip.style.display = 'none';
        return;
    }

    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;

    const x = Math.round((e.clientX - rect.left) * scaleX);
    const y = Math.round((e.clientY - rect.top) * scaleY);

    if (x >= 0 && x <= canvas.width && y >= 0 && y <= canvas.height) {
        coordTooltip.textContent = `X: ${x}, Y: ${y}`;
        coordTooltip.style.left = `${e.clientX}px`;
        coordTooltip.style.top = `${e.clientY}px`;
        coordTooltip.style.display = 'block';
    } else {
        coordTooltip.style.display = 'none';
    }
});

canvas.addEventListener('mouseleave', () => {
    coordTooltip.style.display = 'none';
});

// Clear Button
clearBtn.addEventListener('click', () => {
    mapManager.clearEntities();
    simStatus.textContent = "Entities Cleared";
    if (startPosEl) startPosEl.textContent = "—";
});

// Sliders (Update Config)
const updateConfig = () => {
    simulation.setConfig({
        lidarRange: parseInt(document.getElementById('lidarRange').value),
        lidarAngle: parseInt(document.getElementById('lidarAngle').value),
        heatSensorRange: parseInt(document.getElementById('heatRange').value),
        showSensors: document.getElementById('sensorsToggle').checked,
        simSpeed: parseInt(document.getElementById('simSpeed').value),
        stepsPerUpdate: parseInt(document.getElementById('stepsPerUpdate').value),
        totalSteps: parseInt(document.getElementById('totalSteps').value),
    });
};



// Helper: wire a number-input display ↔ range slider pair
function linkSliderNum(sliderId, numId, onChange) {
    const slider = document.getElementById(sliderId);
    const num = document.getElementById(numId);

    // slider → number
    slider.addEventListener('input', () => {
        num.value = slider.value;
        if (onChange) onChange();
    });

    // number → slider (on change/blur, clamp to min/max)
    const syncFromNum = () => {
        let v = parseInt(num.value);
        const lo = parseInt(num.min), hi = parseInt(num.max);
        if (isNaN(v)) v = parseInt(slider.value);
        v = Math.max(lo, Math.min(hi, v));
        num.value = v;
        slider.value = v;
        if (onChange) onChange();
    };
    num.addEventListener('change', syncFromNum);
    num.addEventListener('blur', syncFromNum);
}

document.getElementById('robotCount').addEventListener('input', (e) => {
    document.getElementById('robotCountDisplay').value = e.target.value;
});
// Reverse: robotCountDisplay → robotCount
(function () {
    const num = document.getElementById('robotCountDisplay');
    const slider = document.getElementById('robotCount');
    const sync = () => {
        let v = parseInt(num.value);
        const lo = parseInt(num.min), hi = parseInt(num.max);
        if (isNaN(v)) v = parseInt(slider.value);
        v = Math.max(lo, Math.min(hi, v));
        num.value = v;
        slider.value = v;
    };
    num.addEventListener('change', sync);
    num.addEventListener('blur', sync);
})();

linkSliderNum('lidarRange', 'lidarRangeDisplay', updateConfig);
linkSliderNum('lidarAngle', 'lidarAngleDisplay', updateConfig);
linkSliderNum('heatRange', 'heatRangeDisplay', updateConfig);
linkSliderNum('simSpeed', 'simSpeedDisplay', updateConfig);
linkSliderNum('stepsPerUpdate', 'stepsPerUpdateDisplay', updateConfig);

document.getElementById('sensorsToggle').addEventListener('change', updateConfig);
document.getElementById('totalSteps').addEventListener('change', updateConfig);

// Sim Controls
const toggleSimBtn = document.getElementById('toggleSim');

toggleSimBtn.addEventListener('click', () => {
    if (simulation.isRunning) {
        // STOP
        simulation.stop();
        toggleSimBtn.textContent = "Start";
        toggleSimBtn.classList.remove('btn-stop');
        toggleSimBtn.classList.add('btn-start');
    } else {
        // Hide tooltip when starting
        coordTooltip.style.display = 'none';
        // START
        const count = parseInt(document.getElementById('robotCount').value);
        if (simulation.robots.length !== count || simulation.robots.length === 0) {
            simulation.robots = [];
            const success = simulation.spawnRobots(count);
            if (!success) {
                alert("Please set a robot start point first!");
                return;
            }
        }
        simulation.start();
        toggleSimBtn.textContent = "Stop";
        toggleSimBtn.classList.remove('btn-start');
        toggleSimBtn.classList.add('btn-stop');

        // Lock UI
        document.getElementById('robotCount').disabled = true;
        document.querySelectorAll('.toggle-btn').forEach(btn => btn.disabled = true);
        document.getElementById('clearEntities').disabled = true;
        document.getElementById('mapUpload').disabled = true;
        useDefaultMapBtn.disabled = true;
    }
});

document.getElementById('resetSim').addEventListener('click', () => {
    const count = parseInt(document.getElementById('robotCount').value);
    simulation.reset(count);

    // Reset Toggle Button
    toggleSimBtn.textContent = "Start";
    toggleSimBtn.classList.remove('btn-stop');
    toggleSimBtn.classList.add('btn-start');

    // Unlock UI
    document.getElementById('robotCount').disabled = false;
    document.querySelectorAll('.toggle-btn').forEach(btn => btn.disabled = false);
    document.getElementById('clearEntities').disabled = false;
    document.getElementById('mapUpload').disabled = false;
    useDefaultMapBtn.disabled = false;
});

// Initial Config
updateConfig();

// Initial Render
mapManager.render();
