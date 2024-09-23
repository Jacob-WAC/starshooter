// Utility Functions

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

export function getDistance(x1, y1, x2, y2) {
    let dx = x1 - x2;
    let dy = y1 - y2;
    
    return Math.sqrt(dx * dx + dy * dy);
}

// Other utility functions can be added here as needed
