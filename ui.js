// ui.js

export class UI {
    constructor() {
        this.uiElement = document.getElementById('ui');
        this.deathCountElement = document.getElementById('deathCount');
        this.killCountElement = document.getElementById('killCount');
        this.weaponNameElement = document.getElementById('weaponName');
        this.healthElement = document.getElementById('health');
        this.maxHealthElement = document.getElementById('maxHealth');
        this.roundNumberElement = document.getElementById('roundNumber');
        this.countdownElement = document.getElementById('countdown');
        this.startScreen = document.getElementById('startScreen');
        this.gameOverScreen = document.getElementById('gameOverScreen');
        this.skillMenu = document.getElementById('skillMenu');
        this.skillSlot1 = document.getElementById('skillSlot1');
        this.skillSlot2 = document.getElementById('skillSlot2');
        this.skillSlot3 = document.getElementById('skillSlot3');
        this.saveSkillsButton = document.getElementById('saveSkillsButton');

        this.availableSkills = ['Missile Attack', 'AoE Attack', 'Shield', 'Dash'];
        this.skillAssignments = ['Missile Attack', 'Dash', 'Shield']; // Default assignments

        this.gameStateBeforeMenu = 'playing';

        this.initializeSkillMenu();
    }

    initializeSkillMenu() {
        this.populateSkillMenu();
        this.saveSkillsButton.addEventListener('click', () => {
            const slot1 = this.skillSlot1.value;
            const slot2 = this.skillSlot2.value;
            const slot3 = this.skillSlot3.value;

            // Ensure no duplicate skills
            const selectedSkills = [slot1, slot2, slot3];
            const uniqueSkills = new Set(selectedSkills);
            if (uniqueSkills.size < selectedSkills.length) {
                alert('Please select different skills for each slot.');
                return;
            }

            this.skillAssignments = selectedSkills;
            this.closeSkillMenu();
        });
    }

    populateSkillMenu() {
        const slots = [this.skillSlot1, this.skillSlot2, this.skillSlot3];
        slots.forEach((slot, index) => {
            slot.innerHTML = '';
            this.availableSkills.forEach(skill => {
                const option = document.createElement('option');
                option.value = skill;
                option.textContent = skill;
                if (this.skillAssignments[index] === skill) {
                    option.selected = true;
                }
                slot.appendChild(option);
            });
        });
    }

    updateUI(deathCount, killCount, weaponName, health, maxHealth, roundNumber) {
        this.deathCountElement.textContent = deathCount;
        this.killCountElement.textContent = killCount;
        this.weaponNameElement.textContent = weaponName;
        this.healthElement.textContent = health;
        this.maxHealthElement.textContent = maxHealth;
        this.roundNumberElement.textContent = roundNumber;
    }

    showUI() {
        this.uiElement.style.display = 'block';
        this.roundNumberElement.parentElement.style.display = 'block';
        this.healthElement.parentElement.style.display = 'block';
    }

    hideUI() {
        this.uiElement.style.display = 'none';
        this.roundNumberElement.parentElement.style.display = 'none';
        this.healthElement.parentElement.style.display = 'none';
    }

    showStartScreen() {
        this.startScreen.style.display = 'block';
    }

    hideStartScreen() {
        this.startScreen.style.display = 'none';
    }

    showGameOverScreen() {
        this.gameOverScreen.style.display = 'block';
    }

    hideGameOverScreen() {
        this.gameOverScreen.style.display = 'none';
    }

    showCountdown(time) {
        this.countdownElement.style.display = 'block';
        this.countdownElement.textContent = time;
    }

    hideCountdown() {
        this.countdownElement.style.display = 'none';
    }

    toggleSkillMenu(gameStateCallback, skillAssignmentsCallback) {
        if (this.skillMenu.style.display === 'none' || this.skillMenu.style.display === '') {
            this.openSkillMenu(gameStateCallback, skillAssignmentsCallback);
        } else {
            this.closeSkillMenu();
        }
    }

    openSkillMenu(gameStateCallback, skillAssignmentsCallback) {
        this.gameStateBeforeMenu = gameStateCallback();
        gameStateCallback('paused');
        this.skillMenu.style.display = 'block';
        this.populateSkillMenu();
    }

    closeSkillMenu() {
        this.skillMenu.style.display = 'none';
        // Restore previous game state
        // This should be handled externally
    }

    getSkillAssignments() {
        return this.skillAssignments;
    }
}
