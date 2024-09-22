// gameManager.js
import { Ship } from './ship.js';
import { Enemy, FastEnemy, TankEnemy } from './enemies.js';

/* --- Game Variables and Initialization --- */

const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

function resizeCanvas() {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
}
window.addEventListener('resize', resizeCanvas);
resizeCanvas();

const camera = {
    x: 0,
    y: 0
};

const keys = {};

window.addEventListener('keydown', function(e) {
    keys[e.key.toLowerCase()] = true;

    // Start the game on spacebar press
    if (e.key === ' ' || e.code === 'Space') {
        if (gameState === 'start') {
            startGame();
        } else if (gameState === 'gameover') {
            restartGame();
        }
    }

    // Open Skill Menu with 'T' key
    if (e.key.toLowerCase() === 't') {
        toggleSkillMenu();
    }

    // Prevent default Tab behavior
    if (e.key === 'Tab') {
        e.preventDefault();
    }

    // Pass input to ship if game is playing
    if (gameState === 'playing') {
        ship.handleInput(e.key.toLowerCase(), true, skillAssignments, enemies, bullets, missiles, aoeEffects, killCount, gameManager);
    }
});

window.addEventListener('keyup', function(e) {
    keys[e.key.toLowerCase()] = false;

    // Pass input to ship if game is playing
    if (gameState === 'playing') {
        ship.handleInput(e.key.toLowerCase(), false, skillAssignments, enemies, bullets, missiles, aoeEffects, killCount, gameManager);
    }
});

/* --- Game State Management --- */

let gameState = 'start';
let gameStateBeforeMenu = 'playing';

/* --- Game Entities --- */

let enemies = [];
const bullets = [];
const missiles = [];
const explosions = [];
const aoeEffects = []; // For visualizing AoE attacks

/* --- Game Variables --- */

let deathCount = 0;
let killCountValue = 0;

let gameOverTimer = null;
let countdownTimer = null;
let countdownTime = 5; // Countdown time in seconds
let countdownCurrentTime = countdownTime;

const missileExplosionRadius = 100; // Area of Effect radius for missile explosion (editable)

let roundNumber = 1;

/* --- Skill Assignment Variables --- */

const availableSkills = ['Missile Attack', 'AoE Attack', 'Shield', 'Dash'];
let skillAssignments = ['Missile Attack', 'Dash', 'Shield']; // Default assignments

/* --- Instantiate the Ship --- */

const ship = new Ship();

/* --- Functions --- */

export let killCount = 0; // Exported to be used in ship.js

export function getDistance(x1, y1, x2, y2) {
    let dx = x1 - x2;
    let dy = y1 - y2;
    return Math.sqrt(dx * dx + dy * dy);
}

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

export function shootBullet(ship) {
    // Calculate the ship's forward velocity component
    const shipSpeedForward = ship.vx * Math.cos(ship.angle) + ship.vy * Math.sin(ship.angle);

    // Bullet speed relative to the ship
    const bulletSpeed = 10;

    // Total bullet speed
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

export function shootSpreadShot(ship) {
    // Angles for the spread shot
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

export function gameOver() {
    gameState = 'gameover';
    deathCount++;
    document.getElementById('deathCount').textContent = deathCount;
    document.getElementById('gameOverScreen').style.display = 'block';
    gameOverTimer = setTimeout(() => {
        restartGame();
    }, 5000); // Wait for 5 seconds before restarting
}

export function startBetweenRounds() {
    gameState = 'betweenRounds';
    countdownCurrentTime = countdownTime;
    document.getElementById('countdown').style.display = 'block';
    document.getElementById('countdown').textContent = countdownCurrentTime;
    countdownTimer = null;
}

export const gameManager = {
    getDistance,
    createExplosion,
    shootBullet,
    shootSpreadShot,
    gameOver,
    startBetweenRounds
};

/* --- Update Function --- */

function update() {
    if (gameState === 'playing' || gameState === 'betweenRounds') {
        ship.update(keys, gameState, skillAssignments, enemies, bullets, missiles, aoeEffects, killCountValue, gameManager);

        // Update bullets
        for (let i = bullets.length - 1; i >= 0; i--) {
            let bullet = bullets[i];
            bullet.x += bullet.vx;
            bullet.y += bullet.vy;
            bullet.distance += bullet.speed;

            // Remove bullet if it has traveled its max distance
            if (bullet.distance > bullet.maxDistance) {
                bullets.splice(i, 1);
            }
        }

        // Update missiles
        for (let i = missiles.length - 1; i >= 0; i--) {
            let missile = missiles[i];
            if (missile.target && enemies.includes(missile.target)) {
                // Adjust missile velocity towards the target
                const dx = missile.target.x - missile.x;
                const dy = missile.target.y - missile.y;
                const dist = Math.sqrt(dx * dx + dy * dy);
                const speed = missile.speed;
                missile.vx = (dx / dist) * speed;
                missile.vy = (dy / dist) * speed;
            } else {
                // Target is gone
                missiles.splice(i, 1);
                continue;
            }

            // Update missile position
            missile.x += missile.vx;
            missile.y += missile.vy;

            // Check collision with target
            if (getDistance(missile.x, missile.y, missile.target.x, missile.target.y) < missile.radius + missile.target.radius) {
                // Create explosion at the missile's position
                createExplosion(missile.x, missile.y);

                // Remove missile
                missiles.splice(i, 1);

                // Area of Effect damage
                for (let j = enemies.length - 1; j >= 0; j--) {
                    let enemy = enemies[j];
                    let distance = getDistance(missile.x, missile.y, enemy.x, enemy.y);
                    if (distance < missileExplosionRadius) {
                        // Enemy is within AoE, destroy it
                        createExplosion(enemy.x, enemy.y);
                        enemies.splice(j, 1);
                        killCountValue++;
                        document.getElementById('killCount').textContent = killCountValue;
                    }
                }

                // Check for round completion
                if (enemies.length === 0) {
                    startBetweenRounds();
                }
            }
        }

        // Update AoE effects
        for (let i = aoeEffects.length - 1; i >= 0; i--) {
            let aoe = aoeEffects[i];
            aoe.radius += 10; // Adjust expansion speed as needed
            aoe.alpha -= 0.05; // Fade out effect
            if (aoe.alpha <= 0) {
                aoeEffects.splice(i, 1);
            }
        }

        // Update enemies
        for (let index = enemies.length - 1; index >= 0; index--) {
            let enemy = enemies[index];

            // Only move enemies if the game is in 'playing' state
            if (gameState === 'playing') {
                enemy.update(ship);
            }

            // Collision with ship
            let collisionDist = ship.radius + enemy.radius;
            if (getDistance(ship.x, ship.y, enemy.x, enemy.y) < collisionDist) {
                // Ship takes damage
                ship.takeDamage(1);
                // Destroy enemy
                createExplosion(enemy.x, enemy.y);
                enemies.splice(index, 1);
                killCountValue++;
                document.getElementById('killCount').textContent = killCountValue;

                // Check if all enemies are defeated
                if (enemies.length === 0) {
                    // Start countdown to next round
                    startBetweenRounds();
                }
                continue;
            }

            // Collision with bullets
            for (let bIndex = bullets.length - 1; bIndex >= 0; bIndex--) {
                let bullet = bullets[bIndex];
                let collisionDist = enemy.radius + bullet.radius;
                if (getDistance(bullet.x, bullet.y, enemy.x, enemy.y) < collisionDist) {
                    // Reduce enemy health
                    enemy.health -= 1;
                    bullets.splice(bIndex, 1);

                    if (enemy.health <= 0) {
                        // Enemy dies
                        createExplosion(enemy.x, enemy.y);
                        enemies.splice(index, 1);
                        killCountValue++;
                        document.getElementById('killCount').textContent = killCountValue;

                        // Check if all enemies are defeated
                        if (enemies.length === 0) {
                            // Start countdown to next round
                            startBetweenRounds();
                        }
                    }
                    break; // Exit the bullet loop since bullet is removed
                }
            }

            // Collision with other enemies
            for (let i = 0; i < enemies.length; i++) {
                if (i !== index) {
                    let other = enemies[i];
                    let distance = getDistance(enemy.x, enemy.y, other.x, other.y);
                    let minDist = enemy.radius + other.radius;
                    if (distance < minDist) {
                        // Simple collision response: adjust positions to prevent overlap
                        let overlap = minDist - distance;
                        let angle = Math.atan2(enemy.y - other.y, enemy.x - other.x);
                        enemy.x += Math.cos(angle) * overlap / 2;
                        enemy.y += Math.sin(angle) * overlap / 2;
                        other.x -= Math.cos(angle) * overlap / 2;
                        other.y -= Math.sin(angle) * overlap / 2;
                    }
                }
            }
        }

        // Update explosions
        for (let i = explosions.length - 1; i >= 0; i--) {
            let explosion = explosions[i];
            explosion.lifetime -= 1;
            explosion.particles.forEach(particle => {
                particle.x += particle.vx;
                particle.y += particle.vy;
            });
            if (explosion.lifetime <= 0) {
                explosions.splice(i, 1);
            }
        }

        // Countdown handling
        if (gameState === 'betweenRounds') {
            if (countdownCurrentTime > 0) {
                // Update countdown every second
                let now = Date.now();
                if (!countdownTimer) {
                    countdownTimer = now;
                }
                if (now - countdownTimer >= 1000) {
                    countdownCurrentTime--;
                    document.getElementById('countdown').textContent = countdownCurrentTime;
                    countdownTimer = now;
                }
            } else {
                // Start next round
                document.getElementById('countdown').style.display = 'none';
                gameState = 'playing';
                roundNumber++;
                initEnemies();
            }
        }
    }

/* --- Drawing Functions --- */

function drawPlayer() {
    ship.draw(ctx, camera);
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

function drawEnemiesFunc() {
    enemies.forEach(enemy => {
        enemy.draw(ctx, camera);
    });
}

function drawMissiles() {
    missiles.forEach(missile => {
        ctx.save();
        ctx.translate(missile.x - camera.x, missile.y - camera.y);
        ctx.rotate(Math.atan2(missile.vy, missile.vx));

        // Draw missile body
        ctx.fillStyle = 'white';
        ctx.beginPath();
        ctx.rect(-10, -2, 20, 4);
        ctx.fill();

        // Draw missile thruster
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

function drawAoEEffectsFunc() {
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
    const starDensity = 0.0005; // Adjust the density as needed

    const startX = camera.x;
    const startY = camera.y;

    const endX = camera.x + canvas.width;
    const endY = camera.y + canvas.height;

    // Draw stars
    const cellSize = 50; // Adjust cell size as needed
    for (let x = Math.floor(startX / cellSize) * cellSize; x < endX; x += cellSize) {
        for (let y = Math.floor(startY / cellSize) * cellSize; y < endY; y += cellSize) {
            // Use a pseudo-random function with fixed seed to ensure stars stay in place
            const rand = pseudoRandom(x, y);
            if (rand < starDensity * cellSize * cellSize) {
                const starX = x - camera.x + rand * cellSize;
                const starY = y - camera.y + rand * cellSize;
                ctx.fillStyle = '#FFF';
                ctx.fillRect(starX, starY, starSize, starSize);
            }
        }
    }

    // Draw planets, asteroids, and nebulas
    drawCelestialObjects();
}

function pseudoRandom(x, y) {
    // Use a hash function to generate a pseudo-random number based on x and y
    x = x | 0; // Ensure x is an integer
    y = y | 0; // Ensure y is an integer
    let seed = x * 374761393 + y * 668265263; // Large primes
    seed = (seed ^ (seed >> 13)) * 1274126177;
    return ((seed & 0x7fffffff) % 1000) / 1000;
}

function drawCelestialObjects() {
    const cellSize = 1000; // Larger cells for less frequent objects
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
                    // Draw a planet
                    drawPlanet(posX, posY, rand);
                } else if (typeRand < 0.66) {
                    // Draw an asteroid
                    drawAsteroid(posX, posY, rand);
                } else {
                    // Draw a nebula
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
        drawMissiles(); // Draw missiles
        drawEnemiesFunc();
        drawExplosions();
        drawAoEEffectsFunc();
    } else if (gameState === 'start' || gameState === 'gameover') {
        // Draw background stars on the start and game over screens
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        camera.x = 0;
        camera.y = 0;
        drawBackground();
    }
}

/* --- Utility Functions --- */

/* Already defined getDistance and createExplosion above */

/* --- Game State Functions --- */

function startGame() {
    document.getElementById('startScreen').style.display = 'none';
    document.getElementById('ui').style.display = 'block';
    document.getElementById('roundDisplay').style.display = 'block';
    document.getElementById('healthDisplay').style.display = 'block';
    gameState = 'playing';
    initGame();
}

function initGame() {
    // Reset ship position and velocity
    ship.x = 0;
    ship.y = 0;
    ship.vx = 0;
    ship.vy = 0;
    ship.angle = 0;
    ship.thrusterIntensity = 0; // Reset thruster intensity
    ship.health = ship.maxHealth; // Reset health
    ship.shieldActive = false;
    ship.shieldCooldown = 0;
    ship.dashCooldown = 0;
    ship.aoeCooldown = 0;

    // Reset round and kills
    roundNumber = 1;
    killCountValue = 0;
    document.getElementById('killCount').textContent = killCountValue;
    document.getElementById('roundNumber').textContent = roundNumber;

    // Clear bullets, missiles, explosions, and AoE effects
    bullets.length = 0;
    missiles.length = 0;
    explosions.length = 0;
    aoeEffects.length = 0;

    // Initialize enemies
    initEnemies();
}

function initEnemies() {
    enemies = [];
    const numEnemies = 5 + (roundNumber - 1) * 2; // Increase enemies each round
    for (let i = 0; i < numEnemies; i++) {
        enemies.push(createRandomEnemy());
    }
    document.getElementById('roundNumber').textContent = roundNumber;
}

function createRandomEnemy() {
    let x, y;
    const minDistance = 500; // Minimum distance from the ship
    do {
        x = ship.x + (Math.random() - 0.5) * 2000;
        y = ship.y + (Math.random() - 0.5) * 2000;
    } while (getDistance(ship.x, ship.y, x, y) < minDistance);

    // Randomly select an enemy type
    const enemyTypes = [Enemy, FastEnemy, TankEnemy];
    const EnemyClass = enemyTypes[Math.floor(Math.random() * enemyTypes.length)];
    return new EnemyClass(x, y, ship.maxSpeed);
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

/* --- Skill Menu Functions --- */

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

    // Ensure no duplicate skills
    const selectedSkills = [slot1, slot2, slot3];
    const uniqueSkills = new Set(selectedSkills);
    if (uniqueSkills.size < selectedSkills.length) {
        alert('Please select different skills for each slot.');
        return;
    }

    skillAssignments = selectedSkills;
    closeSkillMenu();
});

/* --- Game Loop --- */

function gameLoop() {
    if (gameState !== 'paused') {
        update();
        render();
    }
    requestAnimationFrame(gameLoop);
}

// Initialize skill menu display
document.getElementById('skillMenu').style.display = 'none';

// Start the game loop
gameLoop();
}