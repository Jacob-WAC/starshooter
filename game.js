// Game Variables and Initialization
const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');
const missileExplosionRadius = 100;
function resizeCanvas() {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
}
window.addEventListener('resize', resizeCanvas);
resizeCanvas();

const camera = { x: 0, y: 0 };
const keys = {};
window.addEventListener('keydown', function(e) {
    keys[e.key.toLowerCase()] = true;

    if (e.key === ' ' || e.code === 'Space') {
        if (gameState === 'start') {
            startGame();
        } else if (gameState === 'gameover') {
            restartGame();
        }
    }

    if (e.key.toLowerCase() === 't') {
        toggleSkillMenu();
    }

    if (e.key === 'Tab') {
        e.preventDefault();
    }

    if (gameState === 'playing') {
        ship.handleInput(e.key.toLowerCase(), true);
    }
});

window.addEventListener('keyup', function(e) {
    keys[e.key.toLowerCase()] = false;

    if (gameState === 'playing') {
        ship.handleInput(e.key.toLowerCase(), false);
    }
});

// Game State Management
let gameState = 'start';
let gameOverTimer = null;
let countdownTimer = null;
let countdownTime = 5;
let countdownCurrentTime = countdownTime;
let gameStateBeforeMenu = 'playing';

// Game Entities
let enemies = [];
const bullets = [];
const missiles = [];
const explosions = [];
const aoeEffects = [];

// Game Variables
let deathCount = 0;
let killCount = 0;
let roundNumber = 1;

// Skill Assignment Variables
const availableSkills = ['Missile Attack', 'AoE Attack', 'Shield', 'Dash'];
let skillAssignments = ['Missile Attack', 'Dash', 'Shield'];

// Class Definitions
class Ship {
    constructor() {
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

        this.health = 3;
        this.maxHealth = 3;

        this.dashCooldown = 0;
        this.dashCooldownTime = 1000;
        this.dashSpeed = 15;
        this.isDashing = false;

        this.shieldActive = false;
        this.shieldDuration = 3000;
        this.shieldCooldown = 0;
        this.shieldCooldownTime = 5000;
        this.shieldStartTime = 0;

        this.aoeCooldown = 0;
        this.aoeCooldownTime = 5000;
        this.aoeRadius = 200;

        this.weapons = [new BasicWeapon(this), new RapidFireWeapon(this), new SpreadWeapon(this)];
        this.currentWeaponIndex = 0;
        document.getElementById('weaponName').textContent = this.weapons[this.currentWeaponIndex].name;
    }

    update() {
        if (keys['a'] || keys['arrowleft']) {
            this.angle -= this.rotationSpeed;
        }
        if (keys['d'] || keys['arrowright']) {
            this.angle += this.rotationSpeed;
        }

        let ax = 0;
        let ay = 0;
        let isAccelerating = false;

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
        if (keys['q']) {
            ax += Math.sin(this.angle) * this.acceleration;
            ay += -Math.cos(this.angle) * this.acceleration;
            isAccelerating = true;
        }
        if (keys['e']) {
            ax += -Math.sin(this.angle) * this.acceleration;
            ay += Math.cos(this.angle) * this.acceleration;
            isAccelerating = true;
        }

        this.vx += ax;
        this.vy += ay;

        let speed = Math.sqrt(this.vx * this.vx + this.vy * this.vy);
        if (speed > this.maxSpeed) {
            this.vx = (this.vx / speed) * this.maxSpeed;
            this.vy = (this.vy / speed) * this.maxSpeed;
        }

        this.x += this.vx;
        this.y += this.vy;

        if (isAccelerating) {
            this.thrusterIntensity = 1.0;
        } else {
            this.thrusterIntensity -= 0.02;
            if (this.thrusterIntensity < 0) {
                this.thrusterIntensity = 0;
            }
        }

        if (this.dashCooldown > 0) {
            this.dashCooldown -= 16.67;
        }
        if (this.shieldCooldown > 0) {
            this.shieldCooldown -= 16.67;
        }
        if (this.aoeCooldown > 0) {
            this.aoeCooldown -= 16.67;
        }
        if (this.shieldActive) {
            if (Date.now() - this.shieldStartTime > this.shieldDuration) {
                this.shieldActive = false;
            }
        }

        this.weapons[this.currentWeaponIndex].update();

        document.getElementById('health').textContent = this.health;
        document.getElementById('maxHealth').textContent = this.maxHealth;
    }

    takeDamage(amount) {
        if (this.shieldActive) {
            return;
        }
        this.health -= amount;
        if (this.health <= 0) {
            gameOver();
        }
    }

    handleInput(key, isKeyDown) {
        if (key === 'tab' && isKeyDown) {
            this.switchWeapon();
        }

        if (isKeyDown) {
            if (key === 'shift') {
                this.activateSkill(skillAssignments[0]);
            } else if (key === 'f') {
                this.activateSkill(skillAssignments[1]);
            } else if (key === 'g') {
                this.activateSkill(skillAssignments[2]);
            }
        }
    }

    activateSkill(skillName) {
        switch (skillName) {
            case 'Missile Attack':
                this.launchMissile();
                break;
            case 'Dash':
                this.activateDash();
                break;
            case 'Shield':
                this.activateShield();
                break;
            case 'AoE Attack':
                this.activateAoEAttack();
                break;
            default:
                break;
        }
    }

    activateDash() {
        if (this.dashCooldown <= 0) {
            this.isDashing = true;
            this.dashCooldown = this.dashCooldownTime;
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

    activateAoEAttack() {
        if (this.aoeCooldown <= 0) {
            this.aoeCooldown = this.aoeCooldownTime;

            for (let i = enemies.length - 1; i >= 0; i--) {
                let enemy = enemies[i];
                let distance = getDistance(this.x, this.y, enemy.x, enemy.y);
                if (distance < this.aoeRadius) {
                    createExplosion(enemy.x, enemy.y);
                    enemies.splice(i, 1);
                    killCount++;
                    document.getElementById('killCount').textContent = killCount;
                }
            }

            aoeEffects.push({
                x: this.x,
                y: this.y,
                radius: 0,
                maxRadius: this.aoeRadius,
                alpha: 1
            });

            if (enemies.length === 0) {
                startBetweenRounds();
            }
        }
    }

    switchWeapon() {
        this.currentWeaponIndex = (this.currentWeaponIndex + 1) % this.weapons.length;
        document.getElementById('weaponName').textContent = this.weapons[this.currentWeaponIndex].name;
    }

    launchMissile() {
        if (gameState !== 'playing' && gameState !== 'betweenRounds') return;
        if (missiles.length > 0) return;

        if (enemies.length === 0) return;

        let nearestEnemy = null;
        let minDistance = Infinity;
        enemies.forEach(enemy => {
            const distance = getDistance(this.x, this.y, enemy.x, enemy.y);
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

    draw() {
        ctx.save();
        ctx.translate(this.x - camera.x, this.y - camera.y);
        ctx.rotate(this.angle);
        ctx.fillStyle = 'red';

        ctx.beginPath();
        ctx.moveTo(15, 0);
        ctx.lineTo(-10, -10);
        ctx.lineTo(-5, 0);
        ctx.lineTo(-10, 10);
        ctx.closePath();
        ctx.fill();

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
        this.shootInterval = 500;
        this.lastShotTime = 0;
        this.name = 'Weapon';
    }

    update() {}

    shoot() {}
}

class BasicWeapon extends Weapon {
    constructor(ship) {
        super(ship);
        this.name = 'Basic';
    }

    update() {
        if (gameState !== 'playing') return;
        this.shoot();
    }

    shoot() {
        let currentTime = Date.now();
        if (currentTime - this.lastShotTime > this.shootInterval) {
            this.lastShotTime = currentTime;
            shootBullet(this.ship);
        }
    }
}

class RapidFireWeapon extends Weapon {
    constructor(ship) {
        super(ship);
        this.shootInterval = 200;
        this.name = 'Rapid Fire';
    }

    update() {
        if (gameState !== 'playing') return;
        this.shoot();
    }

    shoot() {
        let currentTime = Date.now();
        if (currentTime - this.lastShotTime > this.shootInterval) {
            this.lastShotTime = currentTime;
            shootBullet(this.ship);
        }
    }
}

class SpreadWeapon extends Weapon {
    constructor(ship) {
        super(ship);
        this.shootInterval = 500;
        this.name = 'Spread Shot';
    }

    update() {
        if (gameState !== 'playing') return;
        this.shoot();
    }

    shoot() {
        let currentTime = Date.now();
        if (currentTime - this.lastShotTime > this.shootInterval) {
            this.lastShotTime = currentTime;
            shootSpreadShot(this.ship);
        }
    }
}

const ship = new Ship();

function update() {
    if (gameState === 'playing' || gameState === 'betweenRounds') {
        ship.update();

        bullets.forEach((bullet, i) => {
            bullet.x += bullet.vx;
            bullet.y += bullet.vy;
            bullet.distance += bullet.speed;
            if (bullet.distance > bullet.maxDistance) {
                bullets.splice(i, 1);
            }
        });

        missiles.forEach((missile, i) => {
            if (missile.target && enemies.includes(missile.target)) {
                const dx = missile.target.x - missile.x;
                const dy = missile.target.y - missile.y;
                const dist = Math.sqrt(dx * dx + dy * dy);
                missile.vx = (dx / dist) * missile.speed;
                missile.vy = (dy / dist) * missile.speed;
            } else {
                missiles.splice(i, 1);
                return;
            }

            missile.x += missile.vx;
            missile.y += missile.vy;

            if (getDistance(missile.x, missile.y, missile.target.x, missile.target.y) < missile.radius + missile.target.radius) {
                createExplosion(missile.x, missile.y);
                missiles.splice(i, 1);

                for (let j = enemies.length - 1; j >= 0; j--) {
                    let enemy = enemies[j];
                    let distance = getDistance(missile.x, missile.y, enemy.x, enemy.y);
                    if (distance < missileExplosionRadius) {
                        createExplosion(enemy.x, enemy.y);
                        enemies.splice(j, 1);
                        killCount++;
                        document.getElementById('killCount').textContent = killCount;
                    }
                }

                if (enemies.length === 0) {
                    startBetweenRounds();
                }
            }
        });

        aoeEffects.forEach((aoe, i) => {
            aoe.radius += 10;
            aoe.alpha -= 0.05;
            if (aoe.alpha <= 0) {
                aoeEffects.splice(i, 1);
            }
        });

        enemies.forEach((enemy, index) => {
            if (gameState === 'playing') {
                enemy.update();
            }

            if (getDistance(ship.x, ship.y, enemy.x, enemy.y) < ship.radius + enemy.radius) {
                ship.takeDamage(1);
                createExplosion(enemy.x, enemy.y);
                enemies.splice(index, 1);
                killCount++;
                document.getElementById('killCount').textContent = killCount;

                if (enemies.length === 0) {
                    startBetweenRounds();
                }
                return;
            }

            bullets.forEach((bullet, bIndex) => {
                if (getDistance(bullet.x, bullet.y, enemy.x, enemy.y) < enemy.radius + bullet.radius) {
                    enemy.health -= 1;
                    bullets.splice(bIndex, 1);

                    if (enemy.health <= 0) {
                        createExplosion(enemy.x, enemy.y);
                        enemies.splice(index, 1);
                        killCount++;
                        document.getElementById('killCount').textContent = killCount;

                        if (enemies.length === 0) {
                            startBetweenRounds();
                        }
                    }
                }
            });
        });

        explosions.forEach((explosion, i) => {
            explosion.lifetime -= 1;
            explosion.particles.forEach(particle => {
                particle.x += particle.vx;
                particle.y += particle.vy;
            });
            if (explosion.lifetime <= 0) {
                explosions.splice(i, 1);
            }
        });

        if (gameState === 'betweenRounds' && countdownCurrentTime > 0) {
            let now = Date.now();
            if (!countdownTimer) {
                countdownTimer = now;
            }
            if (now - countdownTimer >= 1000) {
                countdownCurrentTime--;
                document.getElementById('countdown').textContent = countdownCurrentTime;
                countdownTimer = now;
            }
        } else if (countdownCurrentTime === 0) {
            document.getElementById('countdown').style.display = 'none';
            gameState = 'playing';
            roundNumber++;
            initEnemies();
        }
    }
}

function shootBullet(ship) {
    const shipSpeedForward = ship.vx * Math.cos(ship.angle) + ship.vy * Math.sin(ship.angle);
    const bulletSpeed = 10;
    const totalBulletSpeed = shipSpeedForward + bulletSpeed;

    bullets.push({
        x: ship.x,
        y: ship.y,
        angle: ship.angle,
        speed: totalBulletSpeed,
        vx: Math.cos(ship.angle) * totalBulletSpeed,
        vy: Math.sin(ship.angle) * totalBulletSpeed,
        radius: 5,
        distance: 0,
        maxDistance: 500
    });
}

function shootSpreadShot(ship) {
    const angles = [ship.angle - 0.1, ship.angle, ship.angle + 0.1];

    angles.forEach(angle => {
        const shipSpeedForward = ship.vx * Math.cos(angle) + ship.vy * Math.sin(angle);
        const bulletSpeed = 10;
        const totalBulletSpeed = shipSpeedForward + bulletSpeed;

        bullets.push({
            x: ship.x,
            y: ship.y,
            angle: angle,
            speed: totalBulletSpeed,
            vx: Math.cos(angle) * totalBulletSpeed,
            vy: Math.sin(angle) * totalBulletSpeed,
            radius: 5,
            distance: 0,
            maxDistance: 500
        });
    });
}

class Enemy {
    constructor(x, y) {
        this.x = x;
        this.y = y;
        this.radius = 10;
        this.speed = ship.maxSpeed * 0.75;
        this.health = 1;
        this.type = 'Basic';
    }

    update() {
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

    draw() {
        ctx.save();
        ctx.translate(this.x - camera.x, this.y - camera.y);
        ctx.fillStyle = 'green';
        ctx.beginPath();
        ctx.arc(0, 0, this.radius, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
    }
}

class FastEnemy extends Enemy {
    constructor(x, y) {
        super(x, y);
        this.speed = ship.maxSpeed * 1.2;
        this.radius = 8;
        this.type = 'Fast';
    }

    draw() {
        ctx.save();
        ctx.translate(this.x - camera.x, this.y - camera.y);
        ctx.fillStyle = 'blue';
        ctx.beginPath();
        ctx.arc(0, 0, this.radius, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
    }
}

class TankEnemy extends Enemy {
    constructor(x, y) {
        super(x, y);
        this.speed = ship.maxSpeed * 0.5;
        this.radius = 15;
        this.health = 3;
        this.type = 'Tank';
    }

    draw() {
        ctx.save();
        ctx.translate(this.x - camera.x, this.y - camera.y);
        ctx.fillStyle = 'red';
        ctx.beginPath();
        ctx.arc(0, 0, this.radius, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
    }
}

function drawPlayer() {
    ship.draw();
}

function drawBullets() {
    bullets.forEach(bullet => {
        ctx.save();
        ctx.translate(bullet.x - camera.x, bullet.y - camera.y);
        ctx.fillStyle = 'yellow';
        ctx.beginPath();
        ctx.arc(0, 0, bullet.radius, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
    });
}

function drawEnemies() {
    enemies.forEach(enemy => {
        enemy.draw();
    });
}

function drawMissiles() {
    missiles.forEach(missile => {
        ctx.save();
        ctx.translate(missile.x - camera.x, missile.y - camera.y);
        ctx.rotate(Math.atan2(missile.vy, missile.vx));
        ctx.fillStyle = 'white';
        ctx.beginPath();
        ctx.rect(-10, -2, 20, 4);
        ctx.fill();
        ctx.fillStyle = 'orange';
        ctx.beginPath();
        ctx.moveTo(-10, -2);
        ctx.lineTo(-15, 0);
        ctx.lineTo(-10, 2);
        ctx.closePath();
        ctx.fill();
        ctx.restore();
    });
}

function drawExplosions() {
    explosions.forEach(explosion => {
        explosion.particles.forEach(particle => {
            ctx.save();
            ctx.translate(particle.x - camera.x, particle.y - camera.y);
            ctx.fillStyle = 'orange';
            ctx.beginPath();
            ctx.arc(0, 0, 2, 0, Math.PI * 2);
            ctx.fill();
            ctx.restore();
        });
    });
}

function drawAoEEffects() {
    aoeEffects.forEach(aoe => {
        ctx.save();
        ctx.translate(aoe.x - camera.x, aoe.y - camera.y);
        ctx.strokeStyle = `rgba(255, 0, 0, ${aoe.alpha})`;
        ctx.lineWidth = 5;
        ctx.beginPath();
        ctx.arc(0, 0, aoe.radius, 0, Math.PI * 2);
        ctx.stroke();
        ctx.restore();
    });
}

function drawBackground() {
    ctx.fillStyle = '#000';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    const starSize = 2;
    const starDensity = 0.0005;

    const startX = camera.x;
    const startY = camera.y;
    const endX = camera.x + canvas.width;
    const endY = camera.y + canvas.height;

    const cellSize = 50;
    for (let x = Math.floor(startX / cellSize) * cellSize; x < endX; x += cellSize) {
        for (let y = Math.floor(startY / cellSize) * cellSize; y < endY; y += cellSize) {
            const rand = pseudoRandom(x, y);
            if (rand < starDensity * cellSize * cellSize) {
                const starX = x - camera.x + rand * cellSize;
                const starY = y - camera.y + rand * cellSize;
                ctx.fillStyle = '#FFF';
                ctx.fillRect(starX, starY, starSize, starSize);
            }
        }
    }

    drawCelestialObjects();
}

function pseudoRandom(x, y) {
    x = x | 0;
    y = y | 0;
    let seed = x * 374761393 + y * 668265263;
    seed = (seed ^ (seed >> 13)) * 1274126177;
    return ((seed & 0x7fffffff) % 1000) / 1000;
}

function drawCelestialObjects() {
    const cellSize = 1000;
    const startX = camera.x - canvas.width / 2;
    const startY = camera.y - canvas.height / 2;
    const endX = camera.x + canvas.width * 1.5;
    const endY = camera.y + canvas.height * 1.5;

    for (let i = Math.floor(startX / cellSize); i * cellSize < endX; i++) {
        for (let j = Math.floor(startY / cellSize); j * cellSize < endY; j++) {
            const x = i * cellSize;
            const y = j * cellSize;
            const rand = pseudoRandom(i, j);
            if (rand < 0.1) {
                const typeRand = pseudoRandom(i + 1000, j + 1000);
                const posX = x + cellSize / 2 - camera.x;
                const posY = y + cellSize / 2 - camera.y;

                if (typeRand < 0.33) {
                    drawPlanet(posX, posY, rand);
                } else if (typeRand < 0.66) {
                    drawAsteroid(posX, posY, rand);
                } else {
                    drawNebula(posX, posY, rand);
                }
            }
        }
    }
}

function drawPlanet(x, y, rand) {
    const radius = 50 + rand * 50;
    ctx.save();
    ctx.translate(x, y);
    ctx.fillStyle = `hsl(${rand * 360}, 50%, 50%)`;
    ctx.beginPath();
    ctx.arc(0, 0, radius, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
}

function drawAsteroid(x, y, rand) {
    const size = 20 + rand * 30;
    ctx.save();
    ctx.translate(x, y);
    ctx.fillStyle = 'gray';
    ctx.beginPath();
    for (let i = 0; i < 6; i++) {
        const angle = (i / 6) * Math.PI * 2;
        const radius = size * (0.7 + pseudoRandom(x + i, y + i) * 0.3);
        ctx.lineTo(Math.cos(angle) * radius, Math.sin(angle) * radius);
    }
    ctx.closePath();
    ctx.fill();
    ctx.restore();
}

function drawNebula(x, y, rand) {
    const size = 200 + rand * 200;
    ctx.save();
    ctx.translate(x, y);
    const gradient = ctx.createRadialGradient(0, 0, 0, 0, 0, size);
    gradient.addColorStop(0, `hsla(${rand * 360}, 100%, 50%, 0.5)`);
    gradient.addColorStop(1, 'transparent');
    ctx.fillStyle = gradient;
    ctx.beginPath();
    ctx.arc(0, 0, size, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
}

function render() {
    if (gameState === 'playing' || gameState === 'betweenRounds') {
        camera.x = ship.x - canvas.width / 2;
        camera.y = ship.y - canvas.height / 2;
        drawBackground();
        drawPlayer();
        drawBullets();
        drawMissiles();
        drawEnemies();
        drawExplosions();
        drawAoEEffects();
    } else if (gameState === 'start' || gameState === 'gameover') {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        camera.x = 0;
        camera.y = 0;
        drawBackground();
    }
}

function startGame() {
    document.getElementById('startScreen').style.display = 'none';
    document.getElementById('ui').style.display = 'block';
    document.getElementById('roundDisplay').style.display = 'block';
    document.getElementById('healthDisplay').style.display = 'block';
    gameState = 'playing';
    initGame();
}

function initGame() {
    ship.x = 0;
    ship.y = 0;
    ship.vx = 0;
    ship.vy = 0;
    ship.angle = 0;
    ship.thrusterIntensity = 0;
    ship.health = ship.maxHealth;
    ship.shieldActive = false;
    ship.shieldCooldown = 0;
    ship.dashCooldown = 0;
    ship.aoeCooldown = 0;

    roundNumber = 1;
    killCount = 0;
    document.getElementById('killCount').textContent = killCount;
    document.getElementById('roundNumber').textContent = roundNumber;

    bullets.length = 0;
    missiles.length = 0;
    explosions.length = 0;
    aoeEffects.length = 0;
    
    initEnemies();
}

function initEnemies() {
    enemies = [];
    const numEnemies = 5 + (roundNumber - 1) * 2;
    for (let i = 0; i < numEnemies; i++) {
        enemies.push(createRandomEnemy());
    }
    document.getElementById('roundNumber').textContent = roundNumber;
}

function createRandomEnemy() {
    let x, y;
    const minDistance = 500;
    do {
        x = ship.x + (Math.random() - 0.5) * 2000;
        y = ship.y + (Math.random() - 0.5) * 2000;
    } while (getDistance(ship.x, ship.y, x, y) < minDistance);

    const enemyTypes = [Enemy, FastEnemy, TankEnemy];
    const EnemyClass = enemyTypes[Math.floor(Math.random() * enemyTypes.length)];
    return new EnemyClass(x, y);
}

function startBetweenRounds() {
    gameState = 'betweenRounds';
    countdownCurrentTime = countdownTime;
    document.getElementById('countdown').style.display = 'block';
    document.getElementById('countdown').textContent = countdownCurrentTime;
    countdownTimer = null;
}

function gameOver() {
    gameState = 'gameover';
    deathCount++;
    document.getElementById('deathCount').textContent = deathCount;
    document.getElementById('gameOverScreen').style.display = 'block';
    gameOverTimer = setTimeout(() => {
        restartGame();
    }, 5000);
}

function restartGame() {
    if (gameOverTimer) {
        clearTimeout(gameOverTimer);
        gameOverTimer = null;
    }
    document.getElementById('gameOverScreen').style.display = 'none';
    gameState = 'playing';
    initGame();
}

function toggleSkillMenu() {
    const skillMenu = document.getElementById('skillMenu');
    if (skillMenu.style.display === 'none' || skillMenu.style.display === '') {
        openSkillMenu();
    } else {
        closeSkillMenu();
    }
}

function openSkillMenu() {
    gameStateBeforeMenu = gameState;
    gameState = 'paused';
    document.getElementById('skillMenu').style.display = 'block';
    populateSkillMenu();
}

function closeSkillMenu() {
    document.getElementById('skillMenu').style.display = 'none';
    gameState = gameStateBeforeMenu;
}

function populateSkillMenu() {
    const slot1 = document.getElementById('skillSlot1');
    const slot2 = document.getElementById('skillSlot2');
    const slot3 = document.getElementById('skillSlot3');

    [slot1, slot2, slot3].forEach((slot, index) => {
        slot.innerHTML = '';
        availableSkills.forEach(skill => {
            const option = document.createElement('option');
            option.value = skill;
            option.textContent = skill;
            if (skillAssignments[index] === skill) {
                option.selected = true;
            }
            slot.appendChild(option);
        });
    });
}

document.getElementById('saveSkillsButton').addEventListener('click', () => {
    const slot1 = document.getElementById('skillSlot1').value;
    const slot2 = document.getElementById('skillSlot2').value;
    const slot3 = document.getElementById('skillSlot3').value;

    const selectedSkills = [slot1, slot2, slot3];
    const uniqueSkills = new Set(selectedSkills);
    if (uniqueSkills.size < selectedSkills.length) {
        alert('Please select different skills for each slot.');
        return;
    }

    skillAssignments = selectedSkills;
    closeSkillMenu();
});

function gameLoop() {
    if (gameState !== 'paused') {
        update();
        render();
    }
    requestAnimationFrame(gameLoop);
}

document.getElementById('skillMenu').style.display = 'none';

gameLoop();
