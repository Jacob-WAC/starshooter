// controls.js
// This module handles all input-related logic for the game, including player controls.
// It is designed to be expandable for adding more controls in the future.

// A map to keep track of all active keys.
const keys = {};

// Initializes control listeners and links them with the ship instance.
export function initializeControls(ship, gameState, startGame, restartGame, toggleSkillMenu) {
    // Listener for keydown events to register key presses.
    window.addEventListener('keydown', (e) => handleKeyDown(e, ship, gameState, startGame, restartGame, toggleSkillMenu));

    // Listener for keyup events to register when keys are released.
    window.addEventListener('keyup', (e) => handleKeyUp(e, ship, gameState));
}

// Handles keydown events, used for actions like starting the game, using skills, and player movement.
function handleKeyDown(e, ship, gameState, startGame, restartGame, toggleSkillMenu) {
    const key = e.key.toLowerCase();
    keys[key] = true;

    // Game controls that affect the game state.
    switch (key) {
        case ' ':
            // Spacebar: Start or restart the game based on the current game state.
            if (gameState === 'start') {
                startGame();
            } else if (gameState === 'gameover') {
                restartGame();
            }
            break;
        case 't':
            // 'T' key: Toggle the skill menu.
            toggleSkillMenu();
            break;
        case 'tab':
            // Prevents the default behavior of the Tab key (like switching focus).
            e.preventDefault();
            break;
    }

    // Delegate movement and skill activation to the ship only if the game is in the playing state.
    if (gameState === 'playing') {
        ship.handleInput(key, true);
    }
}

// Handles keyup events to register when movement or action keys are released.
function handleKeyUp(e, ship, gameState) {
    const key = e.key.toLowerCase();
    keys[key] = false;

    // Handle input release for ship controls when in playing state.
    if (gameState === 'playing') {
        ship.handleInput(key, false);
    }
}

// Utility function to check if a key is currently pressed. 
// This function can be useful for more complex input handling in the future.
export function isKeyPressed(key) {
    return keys[key.toLowerCase()] || false;
}
