let scoreCorrect = 0;
let scoreWrong = 0;
let lastCorrectIndex = -1;
let lastWrongIndex = -1;
let wrongInRow = 0;
let answerHistory = [];
let currentRound = 0;
let timeoutTimer = null;        // 15-sekundový timeout na odpoveď
let delayTimer = null;          // oneskorenie 1–3 s pred prehrávaním
let isPlaying = false;          // zabráni duplicitnému spusteniu

const totalRounds = 10;
const DEFAULT_LEVELS = {
    10: 0,
    9: -10,
    8: -20,
    7: -30,
    6: -35,
    5: -35,
    4: -40,
    3: -40,
    2: -45,
    1: -45
};

const LEVELS_STORAGE_KEY = "customDbfsLevels";
const DBFS_LEVELS = getDbfsLevels();

const SELECTED_WORDS_STORAGE_KEY = "selectedWordsSK";

const WORDS_DB_NAME = "RobotTomasWordsDB";
const WORDS_STORE_NAME = "words";
const GAME_LANGUAGE = "sk";

const DEFAULT_WORDS_SK = [
    {
        id: "default_bicykel",
        key: "bicykel",
        displayName: "bicykel",
        source: "default",
        image: "images/1_bicykel.jpg",
        audio: {
            speaker: "audio/1_bicykel.wav",
            left: "audio_lave_ucho/1_bicykel.wav",
            right: "audio_prave_ucho/1_bicykel.wav"
        }
    },
    {
        id: "default_auto",
        key: "auto",
        displayName: "auto",
        source: "default",
        image: "images/2_auto.jpg",
        audio: {
            speaker: "audio/2_auto.wav",
            left: "audio_lave_ucho/2_auto.wav",
            right: "audio_prave_ucho/2_auto.wav"
        }
    },
    {
        id: "default_lietadlo",
        key: "lietadlo",
        displayName: "lietadlo",
        source: "default",
        image: "images/3_lietadlo.jpg",
        audio: {
            speaker: "audio/3_lietadlo.wav",
            left: "audio_lave_ucho/3_lietadlo.wav",
            right: "audio_prave_ucho/3_lietadlo.wav"
        }
    },
    {
        id: "default_autobus",
        key: "autobus",
        displayName: "autobus",
        source: "default",
        image: "images/5_autobus.jpg",
        audio: {
            speaker: "audio/5_autobus.wav",
            left: "audio_lave_ucho/5_autobus.wav",
            right: "audio_prave_ucho/5_autobus.wav"
        }
    },
    {
        id: "default_macka",
        key: "macka",
        displayName: "mačka",
        source: "default",
        image: "images/10_macka.jpg",
        audio: {
            speaker: "audio/10_macka.wav",
            left: "audio_lave_ucho/10_macka.wav",
            right: "audio_prave_ucho/10_macka.wav"
        }
    },
    {
        id: "default_vtak",
        key: "vtak",
        displayName: "vták",
        source: "default",
        image: "images/14_vtak.jpg",
        audio: {
            speaker: "audio/14_vtak.wav",
            left: "audio_lave_ucho/14_vtak.wav",
            right: "audio_prave_ucho/14_vtak.wav"
        }
    },
    {
        id: "default_sova",
        key: "sova",
        displayName: "sova",
        source: "default",
        image: "images/18_sova.jpg",
        audio: {
            speaker: "audio/18_sova.wav",
            left: "audio_lave_ucho/18_sova.wav",
            right: "audio_prave_ucho/18_sova.wav"
        }
    },
    {
        id: "default_mys",
        key: "mys",
        displayName: "myš",
        source: "default",
        image: "images/19_mys.jpg",
        audio: {
            speaker: "audio/19_mys.wav",
            left: "audio_lave_ucho/19_mys.wav",
            right: "audio_prave_ucho/19_mys.wav"
        }
    },
    {
        id: "default_dzus",
        key: "dzus",
        displayName: "džús",
        source: "default",
        image: "images/49_dzus.jpg",
        audio: {
            speaker: "audio/49_dzus.wav",
            left: "audio_lave_ucho/49_dzus.wav",
            right: "audio_prave_ucho/49_dzus.wav"
        }
    },
    {
        id: "default_cokolada",
        key: "cokolada",
        displayName: "čokoláda",
        source: "default",
        image: "images/50_cokolada.jpg",
        audio: {
            speaker: "audio/50_cokolada.wav",
            left: "audio_lave_ucho/50_cokolada.wav",
            right: "audio_prave_ucho/50_cokolada.wav"
        }
    }
];

//Tlačidlo na spustenie testu
const play_btn = document.getElementById("playbtn");

// Vyber nahravok
const urlParams = new URLSearchParams(window.location.search);
const mode = urlParams.get("mode") || "reproduktor";
const side = urlParams.get("side");

let gameWords = [];
let randomSequence = [];

function shuffleArray(array) {
    const arr = [...array];
    for (let i = arr.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [arr[i], arr[j]] = [arr[j], arr[i]];
    }
    return arr;
}

function getDbfsLevels() {
    const savedLevels = localStorage.getItem(LEVELS_STORAGE_KEY);

    if (!savedLevels) {
        return DEFAULT_LEVELS;
    }

    try {
        const parsedLevels = JSON.parse(savedLevels);

        for (let level = 1; level <= 10; level++) {
            const value = Number(parsedLevels[level]);

            if (Number.isNaN(value) || value < -60 || value > 0) {
                return DEFAULT_LEVELS;
            }
        }

        return parsedLevels;

    } catch (error) {
        console.error("Chyba pri načítaní hlasitostí:", error);
        return DEFAULT_LEVELS;
    }
}

function clearPreviousResults() {
    localStorage.removeItem("userscore");
    localStorage.removeItem("computerscore");
    localStorage.removeItem("lastCorrectIndex");
    localStorage.removeItem("lastWrongIndex");
    localStorage.removeItem("answerHistory");
}

// FUNKCIA – SPUSTIŤ TEST
function startTest() {
    if (isPlaying) return;
    clearPreviousResults();

    isPlaying = true;

    // Skryť tlačidlo – už sa nikdy nepoužije
    play_btn.style.display = "none";

    // Aktualizovať progress na začiatku
    updateProgress();

    // Spustiť prvé kolo s náhodným oneskorením
    scheduleNextSound();
}

// Náhodné oneskorenie 1–3 sekundy pred prehrávaním
function scheduleNextSound() {
    if (delayTimer) clearTimeout(delayTimer);
    const delay = 1000 + Math.random() * 2000; // 1000–3000 ms
    delayTimer = setTimeout(() => {
        playCurrentSound();
    }, delay);
}

// Prehrať aktuálny zvuk + spustiť 15s timeout
function playCurrentSound() {
    if (currentRound >= totalRounds) {
        saveAndFinish();
        return;
    }

    const word = randomSequence[currentRound];
    const audioSrc = getAudioSourceForCurrentMode(word);
    const audio = new Audio(audioSrc);

    const level = 10 - currentRound;
    const db = DBFS_LEVELS[level] ?? DEFAULT_LEVELS[level];

    audio.volume = dbToVolume(db);

    console.log(`Kolo ${currentRound + 1}/10 | Úroveň: ${level} | dBFS: ${db} | Slovo: ${word.displayName}`);

    // Spustiť 15-sekundový timeout – ak neklikne, koniec
    if (timeoutTimer) clearTimeout(timeoutTimer);
    timeoutTimer = setTimeout(() => {
        console.log("15 sekúnd bez odpovede → nepočul → koniec testu");

        wrongInRow++;
        scoreWrong++;

        answerHistory.push({
            level: level,
            correct: word.displayName,
            user: "(nepočul)"
        });

        saveAndFinish();
    }, 15000);

    audio.play();
}

// Najdi nahravku
function getAudioSourceForCurrentMode(word) {
    if (mode === "reproduktor") {
        return word.source === "default"
            ? word.audio.speaker
            : URL.createObjectURL(word.audio.speaker);
    }

    if (side === "lave") {
        return word.source === "default"
            ? word.audio.left
            : URL.createObjectURL(word.audio.left);
    }

    return word.source === "default"
        ? word.audio.right
        : URL.createObjectURL(word.audio.right);
}

// Vyhodnotenie kliknutia na obrázok
function handleChoice(userChoice) {
    if (!isPlaying || currentRound >= totalRounds) return;

    // Zrušiť 15s timeout – odpovedal včas
    if (timeoutTimer) {
        clearTimeout(timeoutTimer);
        timeoutTimer = null;
    }

    const correctWord = randomSequence[currentRound];
    const clickedWord = gameWords.find(word => word.id === userChoice);
    const clickedEl = document.getElementById(userChoice);

    if (!clickedWord || !clickedEl) {
        console.error("Kliknuté slovo sa nepodarilo nájsť:", userChoice);
        return;
    }

    // Vizuálne označenie kliknutia
    clickedEl.classList.add("clicked");
    setTimeout(() => clickedEl.classList.remove("clicked"), 750);

    // Uložiť do histórie
    answerHistory.push({
        level: 10 - currentRound,
        correct: correctWord.displayName,
        user: clickedWord.displayName
    });

    // Vyhodnotenie
    if (clickedWord.id === correctWord.id) {
        scoreCorrect++;
        lastCorrectIndex = currentRound;
        wrongInRow = 0;
    } else {
        scoreWrong++;
        lastWrongIndex = currentRound;
        wrongInRow++;
    }

    // 3 chyby po sebe → koniec
    if (wrongInRow >= 3) {
        console.log("3 chyby po sebe → koniec testu");
        saveAndFinish();
        return;
    }

    // Ďalšie kolo
    currentRound++;
    updateProgress();

    if (currentRound >= totalRounds) {
        saveAndFinish();
    } else {
        scheduleNextSound();
    }
}

// Aktualizácia progress baru
function updateProgress() {
    const displayRound = currentRound + 1;
    document.getElementById("current-round").textContent = displayRound;
    const percent = (displayRound / totalRounds) * 100;
    document.getElementById("progress-fill").style.width = percent + "%";
}

function dbToVolume(db) {
    return Math.pow(10, db / 20);
}

function saveAndFinish() {
    if (!isPlaying) return;
    isPlaying = false;

    localStorage.setItem("userscore", scoreCorrect);
    localStorage.setItem("computerscore", scoreWrong);
    localStorage.setItem("lastCorrectIndex", lastCorrectIndex);
    localStorage.setItem("lastWrongIndex", lastWrongIndex);
    localStorage.setItem("answerHistory", JSON.stringify(answerHistory));

    const isCalibrationMode = localStorage.getItem("calibrationMode") === "true";
    if (isCalibrationMode) {
        const params = new URLSearchParams(window.location.search);
        params.set("calibration", "1");
        window.location.href = "finish.html?" + params.toString();
    } else {
        window.location.href = "finish.html";
    }
}

// Pripojiť kliknutia na obrázky
function setupChoices() {
    document.querySelectorAll(".choice").forEach(choice => {
        choice.addEventListener("click", () => handleChoice(choice.id));
    });
}

function confirmation() {
    if (confirm('Naozaj si prajete ukončiť hru a presunúť sa do úvodu aplikácie?')) {
        window.location = 'home.html';
    }
}

// IndexedDB

function openWordsDB() {
    return new Promise((resolve, reject) => {
        const request = indexedDB.open(WORDS_DB_NAME, 1);

        request.onupgradeneeded = function(event) {
            const db = event.target.result;

            if (!db.objectStoreNames.contains(WORDS_STORE_NAME)) {
                const store = db.createObjectStore(WORDS_STORE_NAME, {
                    keyPath: "id"
                });

                store.createIndex("language", "language", { unique: false });
                store.createIndex("key", "key", { unique: false });
            }
        };

        request.onsuccess = function(event) {
            resolve(event.target.result);
        };

        request.onerror = function(event) {
            reject(event.target.error);
        };
    });
}

async function getCustomWordsByLanguage(language) {
    const db = await openWordsDB();

    return new Promise((resolve, reject) => {
        const transaction = db.transaction(WORDS_STORE_NAME, "readonly");
        const store = transaction.objectStore(WORDS_STORE_NAME);
        const index = store.index("language");

        const request = index.getAll(language);

        request.onsuccess = function () {
            resolve(request.result);
        };

        request.onerror = function (event) {
            reject(event.target.error);
        };
    });
}

function getSelectedWordIds() {
    const saved = localStorage.getItem(SELECTED_WORDS_STORAGE_KEY);

    if (!saved) {
        return DEFAULT_WORDS_SK.map(word => word.id);
    }

    try {
        const selectedIds = JSON.parse(saved);

        if (!Array.isArray(selectedIds) || selectedIds.length !== 10) {
            return DEFAULT_WORDS_SK.map(word => word.id);
        }

        return selectedIds;

    } catch (error) {
        console.error("Chyba pri načítaní vybraných slov:", error);
        return DEFAULT_WORDS_SK.map(word => word.id);
    }
}

// FINAL 10 words

async function loadGameWords() {
    const customWords = await getCustomWordsByLanguage(GAME_LANGUAGE);

    const allWords = [
        ...DEFAULT_WORDS_SK,
        ...customWords.map(word => ({
            ...word,
            source: "custom"
        }))
    ];

    const selectedIds = getSelectedWordIds();

    const selectedWords = selectedIds
        .map(id => allWords.find(word => word.id === id))
        .filter(Boolean);

    if (selectedWords.length !== 10) {
        console.warn("Výber slov je neplatný. Použijú sa predvolené slová.");
        return DEFAULT_WORDS_SK;
    }

    return selectedWords;
}

// Zobrazenie obrazkov

function renderChoices(words) {
    const choicesContainer = document.getElementById("choices");
    if (!choicesContainer) return;

    choicesContainer.innerHTML = "";

    words.forEach(word => {
        const choice = document.createElement("div");
        choice.className = "choice";
        choice.id = word.id;

        const img = document.createElement("img");
        img.src = getWordImageUrl(word);
        img.alt = word.displayName;

        choice.appendChild(img);
        choicesContainer.appendChild(choice);
    });
}

// Pomocna funkcia

function getWordImageUrl(word) {
    if (word.source === "default") {
        return word.image;
    }

    return URL.createObjectURL(word.image);
}

// ====================== SPUSTENIE ======================
async function main() {
    gameWords = await loadGameWords();
    randomSequence = shuffleArray(gameWords);

    renderChoices(gameWords);
    setupChoices();

    play_btn.addEventListener("click", startTest);
    play_btn.textContent = "Spustiť test";
}

main();