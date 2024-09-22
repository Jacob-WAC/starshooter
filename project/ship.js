// ship.js
export class Ship {
    constructor() {
        // Initialize ship properties
        this.x = 0;
        this.y = 0;
        this.vx = 0;
        this.vy = 0;
        this.angle = 0;
        this.radius = 15;
        this.acceleration = 0.2;
        this.maxSpeed = 5;
        this.rotationSpeed = 0.05;
        this.thrusterIntensity = 0;

        this.health = 3; // Armor level or health points
        this.maxHealth = 3; // Maximum health

        this.dashCooldown = 0;
        this.dashCooldownTime = 1000; // milliseconds
        this.dashSpeed = 15;
        this.isDashing = false;

        this.shieldActive = false;
        this.shieldDuration = 3000; // milliseconds
        this.shieldCooldown = 0;
        this.shieldCooldownTime = 5000; // milliseconds
        this.shieldStartTime = 0;

        this.aoeCooldown = 0;
        this.aoeCooldownTime = 5000; // milliseconds
        this.aoeRadius = 200; // Radius of the AoE attack

        this.weapons = [new BasicWeapon(this), new RapidFireWeapon(this), new SpreadWeapon(this)];
        this.currentWeaponIndex = 0;
        document.getElementById('weaponName').textContent = this.weapons[this.currentWeaponIndex].name;
    }

    update(keys, gameState, skillAssignments, enemies, bullets, missiles, aoeEffects, killCount, gameManager) {
        // Rotation
        if (keys['a'] || keys['arrowleft']) {
            this.angle -= this.rotationSpeed;
        }
        if (keys['d'] || keys['arrowright']) {
            this.angle += this.rotationSpeed;
        }

        // Acceleration
        let ax = 0;
        let ay = 0;
        let isAccelerating = false; // Track if any movement key is pressed

        if (keys['w'] || keys['arrowup']) {
            ax += Math.cos(this.angle) * this.acceleration;
            ay += Math.sin(this.angle) * this.acceleration;
            isAccelerating = true;
        }
        if (keys['s'] || keys['arrowdown']) {
            ax -= Math.cos(this.angle) * this.acceleration;
            ay -= Math.sin(this.angle) * this.acceleration;
            isAccelerating = true;
        }
        // Strafing (Reversed Q and E controls)
        if (keys['q']) {
            // Now strafes right
            ax += Math.sin(this.angle) * this.acceleration;
            ay += -Math.cos(this.angle) * this.acceleration;
            isAccelerating = true;
        }
        if (keys['e']) {
            // Now strafes left
            ax += -Math.sin(this.angle) * this.acceleration;
            ay += Math.cos(this.angle) * this.acceleration;
            isAccelerating = true;
        }

        // Update ship velocity
        this.vx += ax;
        this.vy += ay;

        // Cap the ship's speed
        let speed = Math.sqrt(this.vx * this.vx + this.vy * this.vy);
        if (speed > this.maxSpeed) {
            this.vx = (this.vx / speed) * this.maxSpeed;
            this.vy = (this.vy / speed) * this.maxSpeed;
        }

        // Update ship position
        this.x += this.vx;
        this.y += this.vy;

        // Update thruster intensity
        if (isAccelerating) {
            this.thrusterIntensity = 1.0; // Full intensity when accelerating
        } else {
            // Gradually decrease thruster intensity
            this.thrusterIntensity -= 0.02; // Adjust fade speed as needed
            if (this.thrusterIntensity < 0) {
                this.thrusterIntensity = 0;
            }
        }

        // Update abilities cooldowns
        const deltaTime = 16.67; // Approximate time per frame at 60fps
        if (this.dashCooldown > 0) {
            this.dashCooldown -= deltaTime;
        }
        if (this.shieldCooldown > 0) {
            this.shieldCooldown -= deltaTime;
        }
        if (this.aoeCooldown > 0) {
            this.aoeCooldown -= deltaTime;
        }
        if (this.shieldActive) {
            if (Date.now() - this.shieldStartTime > this.shieldDuration) {
                this.shieldActive = false;
            }
        }

        // Shooting bullets
        this.weapons[this.currentWeaponIndex].update();

        // Update health display
        document.getElementById('health').textContent = this.health;
        document.getElementById('maxHealth').textContent = this.maxHealth;
    }

    takeDamage(amount) {
        if (this.shieldActive) {
            // Shield absorbs damage
            return;
        }
        this.health -= amount;
        if (this.health <= 0) {
            // Ship is destroyed
            gameOver();
        }
    }

    handleInput(key, isKeyDown, skillAssignments, enemies, bullets, missiles, aoeEffects, killCount, gameManager) {
        // Handle weapon switching
        if (key === 'tab' && isKeyDown) {
            this.switchWeapon();
        }

        // Handle skill activation
        if (isKeyDown) {
            if (key === 'shift') {
                this.activateSkill(skillAssignments[0], enemies, missiles, aoeEffects, killCount, gameManager);
            } else if (key === 'f') {
                this.activateSkill(skillAssignments[1], enemies, missiles, aoeEffects, killCount, gameManager);
            } else if (key === 'g') {
                this.activateSkill(skillAssignments[2], enemies, missiles, aoeEffects, killCount, gameManager);
            }
        }
    }

    activateSkill(skillName, enemies, missiles, aoeEffects, killCount, gameManager) {
        switch (skillName) {
            case 'Missile Attack':
                this.launchMissile(enemies, missiles, killCount, gameManager);
                break;
            case 'Dash':
                this.activateDash();
                break;
            case 'Shield':
                this.activateShield();
                break;
            case 'AoE Attack':
                this.activateAoEAttack(enemies, aoeEffects, killCount, gameManager);
                break;
            default:
                break;
        }
    }

    activateDash() {
        if (this.dashCooldown <= 0) {
            this.isDashing = true;
            this.dashCooldown = this.dashCooldownTime;
            // Apply dash velocity
            this.vx += Math.cos(this.angle) * this.dashSpeed;
            this.vy += Math.sin(this.angle) * this.dashSpeed;
        }
    }

    activateShield() {
        if (this.shieldCooldown <= 0) {
            this.shieldActive = true;
            this.shieldStartTime = Date.now();
            this.shieldCooldown = this.shieldCooldownTime;
        }
    }

    activateAoEAttack(enemies, aoeEffects, killCount, gameManager) {
        if (this.aoeCooldown <= 0) {
            this.aoeCooldown = this.aoeCooldownTime;

            // Damage enemies within the AoE radius
            for (let i = enemies.length - 1; i >= 0; i--) {
                let enemy = enemies[i];
                let distance = gameManager.getDistance(this.x, this.y, enemy.x, enemy.y);
                if (distance < this.aoeRadius) {
                    // Enemy takes damage or is destroyed
                    gameManager.createExplosion(enemy.x, enemy.y);
                    enemies.splice(i, 1);
                    killCount++;
                    document.getElementById('killCount').textContent = killCount;
                }
            }

            // Create a visual effect for the AoE attack
            aoeEffects.push({
                x: this.x,
                y: this.y,
                radius: 0,
                maxRadius: this.aoeRadius,
                alpha: 1
            });

            // Check if all enemies are defeated
            if (enemies.length === 0) {
                // Start countdown to next round
                gameManager.startBetweenRounds();
            }
        }
    }

    switchWeapon() {
        this.currentWeaponIndex = (this.currentWeaponIndex + 1) % this.weapons.length;
        document.getElementById('weaponName').textContent = this.weapons[this.currentWeaponIndex].name;
    }

    launchMissile(enemies, missiles, killCount, gameManager) {
        if (gameState !== 'playing' && gameState !== 'betweenRounds') return;
        if (missiles.length > 0) return; // Only one missile at a time

        // Find the nearest enemy
        if (enemies.length === 0) return;

        let nearestEnemy = null;
        let minDistance = Infinity;
        enemies.forEach(enemy => {
            const distance = gameManager.getDistance(this.x, this.y, enemy.x, enemy.y);
            if (distance < minDistance) {
                minDistance = distance;
                nearestEnemy = enemy;
            }
        });

        if (nearestEnemy) {
            const missileSpeed = 6;
            const dx = nearestEnemy.x - this.x;
            const dy = nearestEnemy.y - this.y;
            const dist = Math.sqrt(dx * dx + dy * dy);
            const vx = (dx / dist) * missileSpeed;
            const vy = (dy / dist) * missileSpeed;

            missiles.push({
                x: this.x,
                y: this.y,
                vx: vx,
                vy: vy,
                speed: missileSpeed,
                radius: 5,
                target: nearestEnemy
            });
        }
    }

    draw(ctx, camera) {
        ctx.save();
        ctx.translate(this.x - camera.x, this.y - camera.y);
        ctx.rotate(this.angle);
        ctx.fillStyle = 'red';

        // Draw the ship
        ctx.beginPath();
        ctx.moveTo(15, 0); // Nose of the jet
        ctx.lineTo(-10, -10); // Left wing
        ctx.lineTo(-5, 0); // Tail
        ctx.lineTo(-10, 10); // Right wing
        ctx.closePath();
        ctx.fill();

        // Draw the thruster
        if (this.thrusterIntensity > 0) {
            ctx.fillStyle = `rgba(255, 165, 0, ${this.thrusterIntensity})`;
            let thrusterLength = 20 * this.thrusterIntensity;
            ctx.beginPath();
            ctx.moveTo(-10, -5);
            ctx.lineTo(-10 - thrusterLength, 0);
            ctx.lineTo(-10, 5);
            ctx.closePath();
            ctx.fill();
        }

        // Draw the shield
        if (this.shieldActive) {
            ctx.strokeStyle = 'cyan';
            ctx.lineWidth = 3;
            ctx.beginPath();
            ctx.arc(0, 0, this.radius + 5, 0, Math.PI * 2);
            ctx.stroke();
        }

        ctx.restore();
    }
}

class Weapon {
    constructor(ship) {
        this.ship = ship;
        this.shootInterval = 500; // milliseconds
        this.lastShotTime = 0;
        this.name = 'Weapon';
    }

    update() {
        // Base weapon doesn't shoot automatically
    }

    shoot(bullets, gameManager) {
        // Base weapon doesn't shoot
    }
}

class BasicWeapon extends Weapon {
    constructor(ship) {
        super(ship);
        this.name = 'Basic';
    }

    update() {
        if (gameState !== 'playing') return;
        this.shoot(bullets, gameManager);
    }

    shoot(bullets, gameManager) {
        let currentTime = Date.now();
        if (currentTime - this.lastShotTime > this.shootInterval) {
            this.lastShotTime = currentTime;
            // Shoot a bullet
            gameManager.shootBullet(this.ship);
        }
    }
}

class RapidFireWeapon extends Weapon {
    constructor(ship) {
        super(ship);
        this.shootInterval = 200; // Faster shooting
        this.name = 'Rapid Fire';
    }

    update() {
        if (gameState !== 'playing') return;
        this.shoot(bullets, gameManager);
    }

    shoot(bullets, gameManager) {
        let currentTime = Date.now();
        if (currentTime - this.lastShotTime > this.shootInterval) {
            this.lastShotTime = currentTime;
            // Shoot a bullet
            gameManager.shootBullet(this.ship);
        }
    }
}

class SpreadWeapon extends Weapon {
    constructor(ship) {
        super(ship);
        this.shootInterval = 500; // Adjust as needed
        this.name = 'Spread Shot';
    }

    update() {
        if (gameState !== 'playing') return;
        this.shoot(bullets, gameManager);
    }

    shoot(bullets, gameManager) {
        let currentTime = Date.now();
        if (currentTime - this.lastShotTime > this.shootInterval) {
            this.lastShotTime = currentTime;
            // Shoot three bullets at slightly different angles
            gameManager.shootSpreadShot(this.ship);
        }
    }
}
