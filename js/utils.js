const Utils = {
    // Calculate distance between two points
    distance: (p1, p2) => {
        return Math.sqrt(Math.pow(p2.x - p1.x, 2) + Math.pow(p2.y - p1.y, 2));
    },

    // Convert degrees to radians
    degToRad: (deg) => {
        return deg * (Math.PI / 180);
    },

    // Convert radians to degrees
    radToDeg: (rad) => {
        return rad * (180 / Math.PI);
    },

    // Get angle between two points in degrees
    angleTo: (from, to) => {
        const dy = to.y - from.y;
        const dx = to.x - from.x;
        let theta = Math.atan2(dy, dx); // range (-PI, PI]
        theta *= 180 / Math.PI; // rads to degs, range (-180, 180]
        //if (theta < 0) theta = 360 + theta; // range [0, 360)
        return theta;
    },

    // Check if point is within circle
    pointInsideCircle: (point, circleCenter, radius) => {
        return Utils.distance(point, circleCenter) <= radius;
    },

    // Clamp value
    clamp: (val, min, max) => Math.min(Math.max(val, min), max),

    // Generate random color
    randomColor: () => {
        const letters = '0123456789ABCDEF';
        let color = '#';
        for (let i = 0; i < 6; i++) {
            color += letters[Math.floor(Math.random() * 16)];
        }
        return color;
    }
};
