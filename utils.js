// utils.js
import './constants.js';

export function getDistance(x1, y1, x2, y2) {
    let dx = x1 - x2;
    let dy = y1 - y2;
    return Math.sqrt(dx * dx + dy * dy);
}

export function pseudoRandom(x, y) {
    // Use a hash function to generate a pseudo-random number based on x and y
    x = x | 0; // Ensure x is an integer
    y = y | 0; // Ensure y is an integer
    let seed = x * 374761393 + y * 668265263; // Large primes
    seed = (seed ^ (seed >>> 13)) * 1274126177;
    return ((seed & 0x7fffffff) % 1000) / 1000;
}

/* --- Utility Functions --- */
export function createExplosion(x, y) {
    const particles = [];
    for (let i = 0; i < 20; i++) {
        const angle = Math.random() * Math.PI * 2;
        const speed = Math.random() * 2 + 1;
        particles.push({
            x: x,
            y: y,
            vx: Math.cos(angle) * speed,
            vy: Math.sin(angle) * speed,
            lifetime: 30
        });
    }
    explosions.push({
        particles: particles,
        lifetime: 30
    });
}


