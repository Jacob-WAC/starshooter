// enemies.js
import { gameOver, killCount, gameManager } from './gameManager.js';

export class Enemy {
    constructor(x, y, shipMaxSpeed) {
        this.x = x;
        this.y = y;
        this.radius = 10;
        this.speed = shipMaxSpeed * 0.75;
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
    constructor(x, y, shipMaxSpeed) {
        super(x, y, shipMaxSpeed);
        this.speed = shipMaxSpeed * 1.2; // Faster than the ship
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
    constructor(x, y, shipMaxSpeed) {
        super(x, y, shipMaxSpeed);
        this.speed = shipMaxSpeed * 0.5; // Slower than the ship
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
