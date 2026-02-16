// Main Entry Point
// Assumes MapManager and Simulation are loaded globally

console.log("Initializing Robot Simulation...");

// Initialize Modules
const mapManager = new MapManager('simCanvas');

// UI Elements
// UI Elements
const mapUpload = document.getElementById('mapUpload');
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

// Initialize Simulation
const simulation = new Simulation(mapManager, {
    updateStats: (data) => {
        simStatus.textContent = data.status;
        activeRobotsEl.textContent = data.activeRobots;

        // Update Progress Bar
        const coverageVal = data.coverage;
        if (coverageBar) coverageBar.style.width = coverageVal + "%";
        if (coverageText) coverageText.textContent = coverageVal + "%";

        survivorsLocatedEl.textContent = data.survivorsLocated;
        survivorsSavedEl.textContent = data.survivorsSaved;
        stepCountEl.textContent = data.steps;
    }
});

// State
let currentTool = 'survivor'; // 'survivor' or 'robot'

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
            })
            .catch(err => console.error("Error loading map:", err));
    }
});

// Radio buttons for tools
document.querySelectorAll('input[name="placementTool"]').forEach(radio => {
    radio.addEventListener('change', (e) => {
        currentTool = e.target.value;
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
        }
    }
});

// Clear Button
clearBtn.addEventListener('click', () => {
    mapManager.clearEntities();
    simStatus.textContent = "Entities Cleared";
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



document.getElementById('robotCount').addEventListener('input', (e) => {
    document.getElementById('robotCountDisplay').textContent = e.target.value;
    // Don't restart, just update config for next spawn
});
document.getElementById('lidarRange').addEventListener('input', (e) => {
    document.getElementById('lidarRangeDisplay').textContent = e.target.value;
    updateConfig();
});
document.getElementById('lidarAngle').addEventListener('input', (e) => {
    document.getElementById('lidarAngleDisplay').textContent = e.target.value;
    updateConfig();
});
document.getElementById('heatRange').addEventListener('input', (e) => {
    document.getElementById('heatRangeDisplay').textContent = e.target.value;
    updateConfig();
});
document.getElementById('sensorsToggle').addEventListener('change', updateConfig);
document.getElementById('simSpeed').addEventListener('input', (e) => {
    document.getElementById('simSpeedDisplay').textContent = e.target.value;
    updateConfig();
});
document.getElementById('stepsPerUpdate').addEventListener('input', (e) => {
    document.getElementById('stepsPerUpdateDisplay').textContent = e.target.value;
    updateConfig();
});
document.getElementById('totalSteps').addEventListener('change', updateConfig);

// Sim Controls
document.getElementById('startSim').addEventListener('click', () => {
    const count = parseInt(document.getElementById('robotCount').value);
    // Safety: If count mismatches (e.g. user changed it but live update failed), respawn
    if (simulation.robots.length !== count || simulation.robots.length === 0) {
        simulation.robots = [];
        simulation.spawnRobots(count);
    }
    simulation.start();
    document.getElementById('startSim').disabled = true;
    document.getElementById('stopSim').disabled = false;
    document.getElementById('robotCount').disabled = true; // Lock Count

    // Lock Placement Tools
    document.querySelectorAll('input[name="placementTool"]').forEach(r => r.disabled = true);
    document.getElementById('clearEntities').disabled = true; // Lock Clear
    document.getElementById('mapUpload').disabled = true; // Lock Map Upload
});

document.getElementById('stopSim').addEventListener('click', () => {
    simulation.stop();
    document.getElementById('startSim').disabled = false;
    document.getElementById('stopSim').disabled = true;
    // Do NOT unlock robotCount here, as resume is possible without reset
    // Do NOT unlock placement tools here either
});

document.getElementById('resetSim').addEventListener('click', () => {
    const count = parseInt(document.getElementById('robotCount').value);
    simulation.reset(count);
    document.getElementById('startSim').disabled = false;
    document.getElementById('stopSim').disabled = true;
    document.getElementById('robotCount').disabled = false; // Unlock Count

    // Unlock Placement Tools
    document.querySelectorAll('input[name="placementTool"]').forEach(r => r.disabled = false);
    document.getElementById('clearEntities').disabled = false; // Unlock Clear
    document.getElementById('mapUpload').disabled = false; // Unlock Map Upload
});

// Initial Config
updateConfig();

// Initial Render
mapManager.render();
