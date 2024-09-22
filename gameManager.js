// gameManager.js
import { Ship } from './ship.js';
import { Enemy, FastEnemy, TankEnemy } from './enemies.js';
import { logger } from './logger.js';

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

/* --- Instantiate the Ship --- */

const ship = new Ship();

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
const countdownTime = 5; // Countdown time in seconds
let countdownCurrentTime = countdownTime;

const missileExplosionRadius = 100; // Area of Effect radius for missile explosion (editable)

let roundNumber = 1;

/* --- Skill Assignment Variables --- */

const availableSkills = ['Missile Attack', 'AoE Attack', 'Shield', 'Dash'];
let skillAssignments = ['Missile Attack', 'Dash', 'Shield']; // Default assignments

/* --- Functions --- */

/**
 * Calculates the distance between two points.
 * @param {number} x1 - X-coordinate of first point.
 * @param {number} y1 - Y-coordinate of first point.
 * @param {number} x2 - X-coordinate of second point.
 * @param {number} y2 - Y-coordinate of second point.
 * @returns {number} Distance between the two points.
 */
export function getDistance(x1, y1, x2, y2) {
    let dx = x1 - x2;
    let dy = y1 - y2;
    return Math.sqrt(dx * dx + dy * dy);
}

/**
 * Creates an explosion effect at the specified coordinates.
 * @param {number} x - X-coordinate of explosion.
 * @param {number} y - Y-coordinate of explosion.
 */
export function createExplosion(x, y) {
    try {
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
        logger.log(`Explosion created at (${x}, ${y}).`);
    } catch (err) {
        logger.error('Error in createExplosion:', err);
    }
}

/**
 * Shoots a bullet from the ship.
 * @param {Ship} ship - The ship instance.
 */
export function shootBullet(ship) {
    try {
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
        logger.log(`Bullet shot at angle ${ship.angle.toFixed(2)} radians.`);
    } catch (err) {
        logger.error('Error in shootBullet:', err);
    }
}

/**
 * Shoots a spread shot from the ship.
 * @param {Ship} ship - The ship instance.
 */
export function shootSpreadShot(ship) {
    try {
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
            logger.log(`Spread shot bullet at angle ${angle.toFixed(2)} radians.`);
        });
    } catch (err) {
        logger.error('Error in shootSpreadShot:', err);
    }
}

/**
 * Handles game over state by updating UI and resetting the game after a delay.
 */
export function gameOver() {
    try {
        gameState = 'gameover';
        deathCount++;
        const deathCountElement = document.getElementById('deathCount');
        if (deathCountElement) {
            deathCountElement.textContent = deathCount;
            logger.log(`Death count incremented to ${deathCount}.`);
        } else {
            logger.warn('deathCount element not found in the DOM.');
        }

        const gameOverScreen = document.getElementById('gameOverScreen');
        if (gameOverScreen) {
            gameOverScreen.style.display = 'block';
            logger.log('Game over screen displayed.');
        } else {
            logger.warn('gameOverScreen element not found in the DOM.');
        }

        gameOverTimer = setTimeout(() => {
            restartGame();
        }, 5000); // Wait for 5 seconds before restarting
        logger.log('Game will restart after 5 seconds.');
    } catch (err) {
        logger.error('Error in gameOver:', err);
    }
}

/**
 * Initiates the countdown between rounds.
 */
export function startBetweenRounds() {
    try {
        gameState = 'betweenRounds';
        countdownCurrentTime = countdownTime;
        const countdownElement = document.getElementById('countdown');
        if (countdownElement) {
            countdownElement.style.display = 'block';
            countdownElement.textContent = countdownCurrentTime;
            logger.log('Between rounds started. Countdown initiated.');
        } else {
            logger.warn('countdown element not found in the DOM.');
        }
        countdownTimer = null;
    } catch (err) {
        logger.error('Error in startBetweenRounds:', err);
    }
}

/**
 * Restarts the game by reinitializing game elements.
 */
function restartGame() {
    try {
        if (gameOverTimer) {
            clearTimeout(gameOverTimer);
            gameOverTimer = null;
            logger.log('Cleared game over timer.');
        }

        const gameOverScreen = document.getElementById('gameOverScreen');
        if (gameOverScreen) {
            gameOverScreen.style.display = 'none';
            logger.log('Game over screen hidden.');
        } else {
            logger.warn('gameOverScreen element not found in the DOM.');
        }

        gameState = 'playing';
        initGame();
        logger.log('Game restarted.');
    } catch (err) {
        logger.error('Error in restartGame:', err);
    }
}

/**
 * Toggles the skill menu display.
 */
function toggleSkillMenu() {
    try {
        const skillMenu = document.getElementById('skillMenu');
        if (skillMenu.style.display === 'none' || skillMenu.style.display === '') {
            openSkillMenu();
        } else {
            closeSkillMenu();
        }
    } catch (err) {
        logger.error('Error in toggleSkillMenu:', err);
    }
}

/**
 * Opens the skill menu and pauses the game.
 */
function openSkillMenu() {
    try {
        gameStateBeforeMenu = gameState;
        gameState = 'paused';
        const skillMenu = document.getElementById('skillMenu');
        if (skillMenu) {
            skillMenu.style.display = 'block';
            logger.log('Skill menu opened.');
        } else {
            logger.warn('skillMenu element not found in the DOM.');
        }
        populateSkillMenu();
    } catch (err) {
        logger.error('Error in openSkillMenu:', err);
    }
}

/**
 * Closes the skill menu and resumes the game.
 */
function closeSkillMenu() {
    try {
        const skillMenu = document.getElementById('skillMenu');
        if (skillMenu) {
            skillMenu.style.display = 'none';
            logger.log('Skill menu closed.');
        } else {
            logger.warn('skillMenu element not found in the DOM.');
        }
        gameState = gameStateBeforeMenu;
    } catch (err) {
        logger.error('Error in closeSkillMenu:', err);
    }
}

/**
 * Populates the skill menu with available skills.
 */
function populateSkillMenu() {
    try {
        const slot1 = document.getElementById('skillSlot1');
        const slot2 = document.getElementById('skillSlot2');
        const slot3 = document.getElementById('skillSlot3');

        [slot1, slot2, slot3].forEach((slot, index) => {
            if (!slot) {
                logger.warn(`skillSlot${index + 1} element not found in the DOM.`);
                return;
            }
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
        logger.log('Skill menu populated.');
    } catch (err) {
        logger.error('Error in populateSkillMenu:', err);
    }
}

/**
 * Handles the "Save Skills" button click event.
 */
document.getElementById('saveSkillsButton').addEventListener('click', () => {
    try {
        const slot1 = document.getElementById('skillSlot1').value;
        const slot2 = document.getElementById('skillSlot2').value;
        const slot3 = document.getElementById('skillSlot3').value;

        // Ensure no duplicate skills
        const selectedSkills = [slot1, slot2, slot3];
        const uniqueSkills = new Set(selectedSkills);
        if (uniqueSkills.size < selectedSkills.length) {
            alert('Please select different skills for each slot.');
            logger.warn('Duplicate skills selected in skill menu.');
            return;
        }

        skillAssignments = selectedSkills;
        logger.log('Skill assignments updated:', skillAssignments);
        closeSkillMenu();
    } catch (err) {
        logger.error('Error in saveSkillsButton click handler:', err);
    }
});

/**
 * Initializes enemies based on the current round.
 */
function initEnemies() {
    try {
        enemies = [];
        const numEnemies = 5 + (roundNumber - 1) * 2; // Increase enemies each round
        for (let i = 0; i < numEnemies; i++) {
            const enemy = createRandomEnemy();
            if (enemy) enemies.push(enemy);
        }
        const roundNumberElement = document.getElementById('roundNumber');
        if (roundNumberElement) {
            roundNumberElement.textContent = roundNumber;
            logger.log(`Initialized ${numEnemies} enemies for round ${roundNumber}.`);
        } else {
            logger.warn('roundNumber element not found in the DOM.');
        }
    } catch (err) {
        logger.error('Error in initEnemies:', err);
    }
}

/**
 * Creates a random enemy ensuring it spawns at a valid distance from the ship.
 * @returns {Enemy|null} A new enemy instance or null if creation fails.
 */
function createRandomEnemy() {
    try {
        let x, y;
        const minDistance = 500; // Minimum distance from the ship
        let attempts = 0;
        do {
            x = ship.x + (Math.random() - 0.5) * 2000;
            y = ship.y + (Math.random() - 0.5) * 2000;
            attempts++;
            if (attempts > 100) {
                logger.warn('Failed to place enemy at a valid distance after 100 attempts.');
                break;
            }
        } while (getDistance(ship.x, ship.y, x, y) < minDistance);

        // Randomly select an enemy type
        const enemyTypes = [Enemy, FastEnemy, TankEnemy];
        const EnemyClass = enemyTypes[Math.floor(Math.random() * enemyTypes.length)];
        const enemy = new EnemyClass(x, y, ship.maxSpeed);
        return enemy;
    } catch (err) {
        logger.error('Error in createRandomEnemy:', err);
        return null;
    }
}

/**
 * Updates the game state, entities, and handles collisions.
 */
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
                    logger.log('Bullet removed after exceeding max distance.');
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
                    if (dist === 0) {
                        logger.warn('Missile target is exactly at missile position.');
                        missiles.splice(i, 1);
                        continue;
                    }
                    missile.vx = (dx / dist) * speed;
                    missile.vy = (dy / dist) * speed;
                } else {
                    // Target is gone
                    missiles.splice(i, 1);
                    logger.log('Missile removed because target is no longer present.');
                    continue;
                }

                // Update missile position
                missile.x += missile.vx;
                missile.y += missile.vy;

                // Check collision with target
                if (getDistance(missile.x, missile.y, missile.target.x, missile.target.y) < missile.radius + missile.target.radius) {
                    // Create explosion at the missile's position
                    createExplosion(missile.x, missile.y);
                    logger.log(`Missile collided with target at (${missile.target.x}, ${missile.target.y}).`);

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
                            const killCountElement = document.getElementById('killCount');
                            if (killCountElement) {
                                killCountElement.textContent = killCountValue;
                            }
                            logger.log(`Enemy at (${enemy.x}, ${enemy.y}) destroyed by missile AoE.`);
                        }
                    }

                    // Check for round completion
                    if (enemies.length === 0) {
                        startBetweenRounds();
                        logger.log('All enemies defeated after missile collision. Starting between rounds.');
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
                    logger.log('AoE effect faded out and removed.');
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
                    logger.log(`Ship collided with enemy at (${enemy.x}, ${enemy.y}).`);

                    // Destroy enemy
                    createExplosion(enemy.x, enemy.y);
                    enemies.splice(index, 1);
                    killCountValue++;
                    const killCountElement = document.getElementById('killCount');
                    if (killCountElement) {
                        killCountElement.textContent = killCountValue;
                    }
                    logger.log(`Enemy at (${enemy.x}, ${enemy.y}) destroyed by collision.`);

                    // Check if ship is destroyed
                    if (ship.health <= 0) {
                        gameOver();
                        logger.log('Ship health depleted. Game over.');
                        continue;
                    }

                    // Check if all enemies are defeated
                    if (enemies.length === 0) {
                        startBetweenRounds();
                        logger.log('All enemies defeated after collision. Starting between rounds.');
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
                        logger.log(`Enemy at (${enemy.x}, ${enemy.y}) hit by bullet. Remaining health: ${enemy.health}`);

                        if (enemy.health <= 0) {
                            // Enemy dies
                            createExplosion(enemy.x, enemy.y);
                            enemies.splice(index, 1);
                            killCountValue++;
                            const killCountElement = document.getElementById('killCount');
                            if (killCountElement) {
                                killCountElement.textContent = killCountValue;
                            }
                            logger.log(`Enemy at (${enemy.x}, ${enemy.y}) destroyed by bullet.`);

                            // Check if all enemies are defeated
                            if (enemies.length === 0) {
                                startBetweenRounds();
                                logger.log('All enemies defeated after bullet hits. Starting between rounds.');
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
                            logger.log(`Enemies at (${enemy.x}, ${enemy.y}) and (${other.x}, ${other.y}) collided and adjusted positions.`);
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
                    logger.log('Explosion removed after lifetime.');
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
                        const countdownElement = document.getElementById('countdown');
                        if (countdownElement) {
                            countdownElement.textContent = countdownCurrentTime;
                            logger.log(`Countdown: ${countdownCurrentTime} seconds remaining.`);
                        } else {
                            logger.warn('countdown element not found in the DOM.');
                        }
                        countdownTimer = now;
                    }
                } else {
                    // Start next round
                    const countdownElement = document.getElementById('countdown');
                    if (countdownElement) {
                        countdownElement.style.display = 'none';
                        logger.log('Countdown completed. Starting next round.');
                    }
                    gameState = 'playing';
                    roundNumber++;
                    initEnemies();
                }
            }
       
    }}

/* --- Drawing Functions --- */

function drawPlayer() {
    try {
        ship.draw(ctx, camera);
    } catch (err) {
        logger.error('Error in drawPlayer:', err);
    }
}

function drawBullets() {
    try {
        bullets.forEach(bullet => {
            ctx.save();
            ctx.translate(bullet.x - camera.x, bullet.y - camera.y);
            ctx.fillStyle = 'yellow';

            ctx.beginPath();
            ctx.arc(0, 0, bullet.radius, 0, Math.PI * 2);
            ctx.fill();

            ctx.restore();
        });
    } catch (err) {
        logger.error('Error in drawBullets:', err);
    }
}

function drawEnemiesFunc() {
    try {
        enemies.forEach(enemy => {
            enemy.draw(ctx, camera);
        });
    } catch (err) {
        logger.error('Error in drawEnemiesFunc:', err);
    }
}

function drawMissiles() {
    try {
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
    } catch (err) {
        logger.error('Error in drawMissiles:', err);
    }
}

function drawExplosions() {
    try {
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
    } catch (err) {
        logger.error('Error in drawExplosions:', err);
    }
}

function drawAoEEffectsFunc() {
    try {
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
    } catch (err) {
        logger.error('Error in drawAoEEffectsFunc:', err);
    }
}

function drawBackground() {
    try {
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
    } catch (err) {
        logger.error('Error in drawBackground:', err);
    }
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
    try {
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
    } catch (err) {
        logger.error('Error in drawCelestialObjects:', err);
    }
}

function drawPlanet(x, y, rand) {
    try {
        const radius = 50 + rand * 50;
        ctx.save();
        ctx.translate(x, y);
        ctx.fillStyle = `hsl(${rand * 360}, 50%, 50%)`;
        ctx.beginPath();
        ctx.arc(0, 0, radius, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
    } catch (err) {
        logger.error('Error in drawPlanet:', err);
    }
}

function drawAsteroid(x, y, rand) {
    try {
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
    } catch (err) {
        logger.error('Error in drawAsteroid:', err);
    }
}

function drawNebula(x, y, rand) {
    try {
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
    } catch (err) {
        logger.error('Error in drawNebula:', err);
    }
}

function render() {
    try {
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
    } catch (err) {
        logger.error('Error in render:', err);
    }
}

/* --- Game Loop --- */

function gameLoop() {
    try {
        if (gameState !== 'paused') {
            update();
            render();
        }
        requestAnimationFrame(gameLoop);
    } catch (err) {
        logger.error('Error in gameLoop:', err);
    }
}

// Initialize skill menu display
const skillMenu = document.getElementById('skillMenu');
if (skillMenu) {
    skillMenu.style.display = 'none';
} else {
    logger.warn('skillMenu element not found in the DOM.');
}

// Start the game loop
gameLoop();
