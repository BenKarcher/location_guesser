const GAME_STATE = Object();

function get_distance(coord1, coord2) {
    const [lat1, lon1] = coord1;
    const [lat2, lon2] = coord2;

    const R = 6371; // km
    const φ1 = lat1 * Math.PI / 180; // φ, λ in radians
    const φ2 = lat2 * Math.PI / 180;
    const Δφ = (lat2 - lat1) * Math.PI / 180;
    const Δλ = (lon2 - lon1) * Math.PI / 180;

    const a = Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
        Math.cos(φ1) * Math.cos(φ2) *
        Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

    return R * c; // in km
}

function get_min_dist(border1, border2) {
    let min_dist = Infinity;
    for (let i = 0; i < border1.length; i++) {
        for (let j = 0; j < border2.length; j++) {
            min_dist = Math.min(min_dist, get_distance(border1[i], border2[j]));
        }
    }
    return min_dist;
}

function start_game() {
    if (GAME_STATE.fair) {
        GAME_STATE.secret_idx = GAME_STATE.fair[Math.floor(Math.random() * GAME_STATE.fair.length)]
    } else {
        GAME_STATE.secret_idx = Math.floor(Math.random() * GAME_STATE.level.length);
    }
    GAME_STATE.search_results = { "English": [], "German": [] };
    GAME_STATE.current_top_guess = -1;
    clueContainer.innerHTML = "";
    for (let i = 0; i < GAME_STATE.level.length; i++) {
        let country = GAME_STATE.level[i];
        for (n of country.names) {
            GAME_STATE.search_results["English"].push({ name: n, idx: i });
        }
        for (n of country.german_names) {
            GAME_STATE.search_results["German"].push({ name: n, idx: i });
        }
    }
}

function predict(query) {
    let res = fuzzysort.go(query, GAME_STATE.search_results[get_language()], {
        key: "name", limit: 100,
        threshold: -Infinity,
    })
    let pred = []
    for (let item of res) {
        let idx = item.obj.idx;
        if (!pred.includes(idx)) {
            pred.push(idx);
            if (pred.length == 5) {
                break;
            }
        }
    }
    return pred;
}

// Example function to add a new clue row
function addClue(text, number, idx, dist) {
    // 2. Create a wrapper for this clue row
    const rowDiv = document.createElement("div");
    rowDiv.idx = idx;
    rowDiv.dist = dist;

    rowDiv.classList.add("clueRow");

    // 3. Create the text element
    const textSpan = document.createElement("span");
    textSpan.classList.add("clueText");
    textSpan.textContent = text;

    // 4. Create the number element
    const numberSpan = document.createElement("span");
    numberSpan.classList.add("clueNumber");
    numberSpan.textContent = number;

    // 5. Put the text and number in the row
    rowDiv.appendChild(textSpan);
    rowDiv.appendChild(numberSpan);

    // 6. Append the row to the container
    clueContainer.appendChild(rowDiv);
}
function process_dist(dist) {
    if (dist < GAME_STATE.zero_error) {
        dist = 0;
    }
    if (get_units() == "mi") {
        dist *= 0.621371;
    }
    dist = Math.round(dist);
    return dist + " " + get_units()
}

function submit(idx) {
    guessInput.value = "";
    GAME_STATE.current_top_guess = -1;
    predictions.innerHTML = "";
    if (idx < 0 || idx >= GAME_STATE.level.length) {
        return;
    }
    if (idx == GAME_STATE.secret_idx) {
        const guesses = clueArea.childElementCount + 1;
        if (get_language() == "English") {
            showGameModal("You win!", "You guessed the place in " + guesses + " guesses!")
        } else {
            showGameModal("Du hast Gewonnen!", "Du hast den Ort in" + guesses + " erraten!")
        }
        return;
    }
    const dist = get_min_dist(GAME_STATE.level[idx].border, GAME_STATE.level[GAME_STATE.secret_idx].border);
    const name = get_language() == "English" ? GAME_STATE.level[idx].names[0] : GAME_STATE.level[idx].german_names[0];
    addClue(name, process_dist(dist), idx, dist);
}

function redraw_clues() {
    let clues = Array.from(clueContainer.children);
    for (clue of clues) {
        const name = get_language() == "English" ? GAME_STATE.level[clue.idx].names[0] : GAME_STATE.level[clue.idx].german_names[0];
        clue.children[0].textContent = name;
        clue.children[1].textContent = process_dist(clue.dist);
    }
}