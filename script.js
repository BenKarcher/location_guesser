// Cache DOM elements
const mainMenu = document.getElementById('mainMenu');
const gameScreen = document.getElementById('gameScreen');
const instructionsModal = document.getElementById('instructionsModal');
const settingsModal = document.getElementById('settingsModal');
const modalOverlay = document.getElementById('modalOverlay');
const guessInput = document.getElementById('guessInput');
const predictions = document.getElementById('predictions');
const clueArea = document.getElementById('clueArea');

const backToMenuBtn = document.getElementById('backToMenuBtn');
const giveUpBtn = document.getElementById('giveUpBtn');
const settingsBtn = document.getElementById('settingsBtn');
const instructionsBtn = document.getElementById('instructionsBtn');
const closeInstructionsBtn = document.getElementById('closeInstructionsBtn');
const closeSettingsBtn = document.getElementById('closeSettingsBtn');

const languageSelect = document.getElementById('languageSelect');
const unitsSelect = document.getElementById('unitsSelect');
const languageSelectModal = document.getElementById('languageSelectModal');
const unitsSelectModal = document.getElementById('unitsSelectModal');
const clueContainer = document.getElementById("clueArea");
const gameModal = document.getElementById("gameModal");
const gameModalConntent = document.getElementById("gameModalConntent");
const gameModalHeader = document.getElementById("gameModalHeader");
const closeGameModalBtn = document.getElementById("closeGameModalBtn");

const JSON_CACHE = Object();
// Utility functions
function show(element) {
    element.classList.remove('hidden');
}
function hide(element) {
    element.classList.add('hidden');
}

function showModal(modal) {
    show(modal);
    show(modalOverlay);
}
function hideModal(modal) {
    hide(modal);
    hide(modalOverlay);
}

// Sync settings between main menu and modal
function syncSettingsToModal() {
    languageSelectModal.value = languageSelect.value;
    unitsSelectModal.value = unitsSelect.value;
}
function syncSettingsFromModal() {
    languageSelect.value = languageSelectModal.value;
    unitsSelect.value = unitsSelectModal.value;
    redraw_clues();
}
//get settings
function get_language() {
    return languageSelect.value;
}
function get_units() {
    return unitsSelect.value;
}
// Event Listeners

// Show instructions
instructionsBtn.addEventListener('click', () => {
    showModal(instructionsModal);
});

// Close instructions
closeInstructionsBtn.addEventListener('click', () => {
    hideModal(instructionsModal);
});

closeGameModalBtn.addEventListener('click', () => {
    hideModal(gameModal);
    start_game();
});

function showGameModal(header, text) {
    gameModalHeader.innerText = header;
    gameModalConntent.innerText = text;
    showModal(gameModal);
}

giveUpBtn.addEventListener('click', () => {
    if (get_language() == "English") {
        showGameModal("You gave up", "The place was " + GAME_STATE.level[GAME_STATE.secret_idx].names[0]);
    } else {
        showGameModal("Du hast aufgegeben", "Der Ort war " + GAME_STATE.level[GAME_STATE.secret_idx].german_names[0]);
    }
});
// Show settings modal
settingsBtn.addEventListener('click', () => {
    syncSettingsToModal();
    showModal(settingsModal);
});

// Close settings modal
closeSettingsBtn.addEventListener('click', () => {
    syncSettingsFromModal();
    hideModal(settingsModal);
});

// Return to main menu
backToMenuBtn.addEventListener('click', () => {
    show(mainMenu);
    hide(gameScreen);
    hide(giveUpBtn);
});

// Level buttons
function recieve_data(data) {
    GAME_STATE.level = data.level;
    GAME_STATE.fair = data.fair;
    GAME_STATE.zero_error = data.zero_error;
    console.log(data);
    start_game();
}
document.querySelectorAll('.levelBtn').forEach(levelBtn => {
    levelBtn.addEventListener('click', () => {
        const levelFile = levelBtn.dataset.level;
        // Hide main menu and show game screen
        hide(mainMenu);
        show(gameScreen);
        show(giveUpBtn);
        if (JSON_CACHE[levelFile]) {
            recieve_data(JSON_CACHE[levelFile]);
            return;
        }
        // Example of fetching the JSON data for that level
        fetch(levelFile)
            .then(response => response.json())
            .then((data) => {
                recieve_data(data);
                JSON_CACHE[levelFile] = data;
            })
            .catch(error => {
                console.error('Error loading level JSON:', error);
            });
    });
});

//input
guessInput.addEventListener('input', () => {
    let res = predict(guessInput.value);
    for (let i in res) {
        if (predictions.children.length <= i) {
            let div = document.createElement("div");
            div.classList.add("pred");
            predictions.appendChild(div);
        }
        if (get_language() == "English") {
            predictions.children[i].innerText = GAME_STATE.level[res[i]].names[0];
        } else {
            predictions.children[i].innerText = GAME_STATE.level[res[i]].german_names[0];
        }
        predictions.children[i].onclick = submit.bind(null, res[i]);
    }
    while (predictions.children.length > res.length) {
        predictions.removeChild(predictions.lastElementChild);
    }
    GAME_STATE.current_top_guess = res[0];
});

guessInput.addEventListener("keypress", function (event) {
    // If the user presses the "Enter" key on the keyboard
    if (event.key === "Enter") {
        // Cancel the default action, if needed
        event.preventDefault();
        submit(GAME_STATE.current_top_guess);
    }
});