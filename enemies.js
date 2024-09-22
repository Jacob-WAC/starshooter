// enemies.js
import { getDistance, createExplosion } from './utils.js';

export let enemies = [];

export class Enemy {
    constructor(x, y) {
        this.x = x;
        this.y = y;
        this.radius = 10;
        this.speed = ship.maxSpeed * 0.75;
        this.health = 1;
        this.type = 'Basic'; // Type identifier
    }

    update(ship) {
        // Move towards the ship
        let dx = ship.x - this.x;
        let dy = ship.y - this.y;
        let dist = Math.sqrt(dx * dx + dy * dy);
        if (dist > 0) {
            dx /= dist;
            dy /= dist;
        }
        this.x += dx * this.speed;
        this.y += dy * this.speed;
    }

    draw(ctx, camera) {
        ctx.save();
        ctx.translate(this.x - camera.x, this.y - camera.y);
        ctx.fillStyle = 'green';
        ctx.beginPath();
        ctx.arc(0, 0, this.radius, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
    }
}

// Fast enemy type
export class FastEnemy extends Enemy {
    constructor(x, y) {
        super(x, y);
        this.speed = ship.maxSpeed * 1.2; // Faster than the ship
        this.radius = 8;
        this.type = 'Fast';
    }

    draw(ctx, camera) {
        ctx.save();
        ctx.translate(this.x - camera.x, this.y - camera.y);
        ctx.fillStyle = 'blue';
        ctx.beginPath();
        ctx.arc(0, 0, this.radius, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
    }
}

// Tank enemy type
export class TankEnemy extends Enemy {
    constructor(x, y) {
        super(x, y);
        this.speed = ship.maxSpeed * 0.5; // Slower than the ship
        this.radius = 15;
        this.health = 3; // Takes more hits
        this.type = 'Tank';
    }

    draw(ctx, camera) {
        ctx.save();
        ctx.translate(this.x - camera.x, this.y - camera.y);
        ctx.fillStyle = 'red';
        ctx.beginPath();
        ctx.arc(0, 0, this.radius, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
    }
}

export function createRandomEnemy(ship) {
    let x, y;
    const minDistance = 500; // Minimum distance from the ship
    do {
        x = ship.x + (Math.random() - 0.5) * 2000;
        y = ship.y + (Math.random() - 0.5) * 2000;
    } while (getDistance(ship.x, ship.y, x, y) < minDistance);

    // Randomly select an enemy type
    const enemyTypes = [Enemy, FastEnemy, TankEnemy];
    const EnemyClass = enemyTypes[Math.floor(Math.random() * enemyTypes.length)];
    return new EnemyClass(x, y);
}
