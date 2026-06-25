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

const DEFAULT_WORDS_ROM = [
    { id: "default_rom_babika", key: "babika", displayName: "bábika", source: "default", image: "images/01_babika.jpg" },
    { id: "default_rom_hrad", key: "hrad", displayName: "hrad", source: "default", image: "images/02_hrad.jpg" },
    { id: "default_rom_chlieb", key: "chlieb", displayName: "chlieb", source: "default", image: "images/03_chlieb.jpg" },
    { id: "default_rom_jablko", key: "jablko", displayName: "jablko", source: "default", image: "images/04_jablko.jpg" },
    { id: "default_rom_macka", key: "macka", displayName: "mačka", source: "default",  image: "images/05_macka.jpg" },
    { id: "default_rom_miska", key: "miska", displayName: "miska", source: "default",  image: "images/06_miska.jpg" },
    { id: "default_rom_noha", key: "noha", displayName: "noha", source: "default",  image: "images/07_noha.jpg" },
    { id: "default_rom_okno", key: "okno", displayName: "okno", source: "default",  image: "images/08_okno.jpg" },
    { id: "default_rom_stolik", key: "stolik", displayName: "stolík", source: "default",  image: "images/09_stolik.jpg" },
    { id: "default_rom_zaba", key: "zaba", displayName: "žaba", source: "default",  image: "images/10_zaba.jpg" }
];

const LEVELS_STORAGE_KEY = "customDbfsLevelsROM";

const WORDS_DB_NAME = "RobotTomasWordsDB";
const WORDS_STORE_NAME = "words";
const SETTINGS_LANGUAGE = "rom";

const MAX_CUSTOM_WORDS = 50;
const SELECTED_WORDS_STORAGE_KEY = "selectedWordsROM";
const REQUIRED_WORD_COUNT = 10;

const CALIBRATION_DB_NAME = "CalibrationDB_rom";
const CALIBRATION_STORE_NAME = "calibration_rom";

document.addEventListener("DOMContentLoaded", () => {
    loadSavedLevels();
    loadAvailableWords();

    const saveLevelsBtn = document.getElementById("saveLevelsBtn");
    if (saveLevelsBtn) {
        saveLevelsBtn.addEventListener("click", saveLevels);
    }

    const resetLevelsBtn = document.getElementById("resetLevelsBtn");
    if (resetLevelsBtn) {
        resetLevelsBtn.addEventListener("click", resetLevelsToDefault);
    }

    const addWordBtn = document.getElementById("addWordBtn");
    if (addWordBtn) {
        addWordBtn.addEventListener("click", addCustomWord);
    }

    const saveSelectedWordsBtn = document.getElementById("saveSelectedWordsBtn");
    if (saveSelectedWordsBtn) {
        saveSelectedWordsBtn.addEventListener("click", saveSelectedWords);
    }
});

function loadSavedLevels() {
    const savedLevels = localStorage.getItem(LEVELS_STORAGE_KEY);

    if (!savedLevels) {
        setInputsFromLevels(DEFAULT_LEVELS);
        return;
    }

    try {
        const levels = JSON.parse(savedLevels);
        setInputsFromLevels(levels);
    } catch (error) {
        console.error("Chyba pri načítaní hlasitostí:", error);
        setInputsFromLevels(DEFAULT_LEVELS);
    }
}

function setInputsFromLevels(levels) {
    for (let level = 1; level <= 10; level++) {
        const input = document.getElementById(`level-${level}`);

        if (input) {
            input.value = levels[level] ?? DEFAULT_LEVELS[level];
        }
    }
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

async function saveLevels() {
    const oldLevels = getDbfsLevels();
    const newLevels = {};

    for (let level = 1; level <= 10; level++) {
        const input = document.getElementById(`level-${level}`);

        if (!input) continue;

        const value = Number(input.value);

        if (Number.isNaN(value)) {
            alert(`Hodnota pre úroveň ${level} musí byť číslo.`);
            input.focus();
            return;
        }

        if (value < -60 || value > 0) {
            alert(`Hodnota pre úroveň ${level} musí byť v rozsahu od -60 do 0 dBFS.`);
            input.focus();
            return;
        }

        newLevels[level] = value;
    }

    const levelsChanged = !areLevelsEqual(oldLevels, newLevels);

    if (levelsChanged) {
        const confirmChange = confirm(
            "Zmenou hlasitostí jednotlivých úrovní budú vymazané všetky kalibračné dáta rómskej verzie.\n\n" +
            "Kalibráciu bude potrebné vykonať znova.\n\n" +
            "Naozaj chcete uložiť nové hlasitosti?"
        );

        if (!confirmChange) return;
    }

    try {
        localStorage.setItem(LEVELS_STORAGE_KEY, JSON.stringify(newLevels));

        if (levelsChanged) {
            await clearCalibrationData();
            alert("Hlasitosti boli uložené a kalibračné dáta boli vymazané.");
        } else {
            alert("Hlasitosti boli uložené.");
        }

    } catch (error) {
        console.error("Chyba pri ukladaní hlasitostí alebo mazaní kalibrácie:", error);
        alert("Nastala chyba pri ukladaní hlasitostí alebo mazaní kalibračných dát.");
    }
}

async function resetLevelsToDefault() {
    const oldLevels = getDbfsLevels();
    const levelsChanged = !areLevelsEqual(oldLevels, DEFAULT_LEVELS);

    if (!levelsChanged) {
        setInputsFromLevels(DEFAULT_LEVELS);
        alert("Predvolené hodnoty už sú nastavené.");
        return;
    }

    const confirmReset = confirm(
        "Nastavením predvolených hlasitostí budú vymazané všetky kalibračné dáta rómskej verzie.\n\n" +
        "Kalibráciu bude potrebné vykonať znova.\n\n" +
        "Naozaj chcete pokračovať?"
    );

    if (!confirmReset) return;

    try {
        setInputsFromLevels(DEFAULT_LEVELS);
        localStorage.setItem(LEVELS_STORAGE_KEY, JSON.stringify(DEFAULT_LEVELS));

        await clearCalibrationData();

        alert("Predvolené hodnoty boli obnovené a kalibračné dáta boli vymazané.");

    } catch (error) {
        console.error("Chyba pri obnovení predvolených hodnôt:", error);
        alert("Nastala chyba pri obnovení predvolených hodnôt alebo mazaní kalibračných dát.");
    }
}

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

function countCustomWordsByLanguage(language) {
    return new Promise(async (resolve, reject) => {
        try {
            const db = await openWordsDB();

            const transaction = db.transaction(WORDS_STORE_NAME, "readonly");
            const store = transaction.objectStore(WORDS_STORE_NAME);
            const index = store.index("language");

            const request = index.count(language);

            request.onsuccess = function () {
                resolve(request.result);
            };

            request.onerror = function (event) {
                reject(event.target.error);
            };

        } catch (error) {
            reject(error);
        }
    });
}

async function addCustomWord() {
    const currentWordCount = await countCustomWordsByLanguage(SETTINGS_LANGUAGE);

    if (currentWordCount >= MAX_CUSTOM_WORDS) {
        alert(`Dosiahli ste maximálny počet ${MAX_CUSTOM_WORDS} vlastných slov pre túto verziu testu.`);
        return;
    }

    const wordNameInput = document.getElementById("wordName");
    const imageInput = document.getElementById("wordImage");
    const speakerInput = document.getElementById("audioSpeaker");
    const leftInput = document.getElementById("audioLeft");
    const rightInput = document.getElementById("audioRight");

    const displayName = wordNameInput.value.trim();

    if (!displayName) {
        alert("Zadajte názov slova.");
        wordNameInput.focus();
        return;
    }

    if (!imageInput.files[0]) {
        alert("Vyberte obrázok pre slovo.");
        return;
    }

    if (!speakerInput.files[0]) {
        alert("Vyberte nahrávku pre reproduktor.");
        return;
    }

    if (!leftInput.files[0]) {
        alert("Vyberte nahrávku pre ľavé ucho.");
        return;
    }

    if (!rightInput.files[0]) {
        alert("Vyberte nahrávku pre pravé ucho.");
        return;
    }

    const wordRecord = {
        id: crypto.randomUUID(),
        language: SETTINGS_LANGUAGE,
        key: createWordKey(displayName),
        displayName: displayName,
        createdAt: new Date().toISOString(),

        image: imageInput.files[0],

        audio: {
            speaker: speakerInput.files[0],
            left: leftInput.files[0],
            right: rightInput.files[0]
        }
    };

    try {
        const db = await openWordsDB();

        const transaction = db.transaction(WORDS_STORE_NAME, "readwrite");
        const store = transaction.objectStore(WORDS_STORE_NAME);

        store.add(wordRecord);

        transaction.oncomplete = function() {
            alert("Slovo bolo úspešne pridané.");
            clearAddWordForm();
            loadAvailableWords();
        };

        transaction.onerror = function(event) {
            console.error("Chyba pri ukladaní slova:", event.target.error);
            alert("Slovo sa nepodarilo uložiť.");
        };

    } catch (error) {
        console.error("Chyba pri práci s databázou slov:", error);
        alert("Nepodarilo sa otvoriť databázu slov.");
    }
}

function createWordKey(text) {
    return text
        .toLowerCase()
        .trim()
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .replace(/\s+/g, "_")
        .replace(/[^a-z0-9_]/g, "");
}

function clearAddWordForm() {
    document.getElementById("wordName").value = "";
    document.getElementById("wordImage").value = "";
    document.getElementById("audioSpeaker").value = "";
    document.getElementById("audioLeft").value = "";
    document.getElementById("audioRight").value = "";
}

async function loadAvailableWords() {
    const wordList = document.getElementById("wordList");
    if (!wordList) return;

    wordList.innerHTML = "";

    try {
        const customWords = await getCustomWordsByLanguage(SETTINGS_LANGUAGE);

        updateCustomWordsCounter(customWords.length);

        const allWords = [
            ...DEFAULT_WORDS_ROM,
            ...customWords.map(word => ({
                ...word,
                source: "custom"
            }))
        ];

        const selectedIds = getSelectedWordIds();

        allWords.forEach(word => {
            const item = document.createElement("div");
            item.className = "word-list-item";
            item.dataset.wordId = word.id;

            if (selectedIds.includes(word.id)) {
                item.classList.add("selected");
            }

            const imageUrl = getWordImageUrl(word);

            const sourceText = word.source === "default"
                ? "Predvolené"
                : "Vlastné";

            item.innerHTML = `
                <div class="word-image-wrapper">
                    <img src="${imageUrl}" alt="${word.displayName}">
                    <span class="word-badge">${sourceText}</span>
                    ${
                        word.source === "custom"
                            ? `<button class="word-delete-ui" type="button" title="Odstrániť slovo">×</button>`
                            : ""
                    }
                </div>
                <div class="word-title">${word.displayName}</div>
            `;

            item.addEventListener("click", () => {
                item.classList.toggle("selected");
                updateSelectedWordsCounter();
            });

            const deleteBtn = item.querySelector(".word-delete-ui");
            if (deleteBtn && word.source === "custom") {
                deleteBtn.addEventListener("click", (event) => {
                    event.stopPropagation();
                    deleteCustomWord(word.id, word.displayName);
                });
            }

            wordList.appendChild(item);
        });

        updateSelectedWordsCounter();

    } catch (error) {
        console.error("Chyba pri načítaní slov:", error);
        wordList.innerHTML = "<p>Nepodarilo sa načítať slová.</p>";
    }
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
        return DEFAULT_WORDS_ROM.map(word => word.id);
    }

    try {
        const selectedIds = JSON.parse(saved);

        if (!Array.isArray(selectedIds)) {
            return DEFAULT_WORDS_ROM.map(word => word.id);
        }

        return selectedIds;

    } catch (error) {
        console.error("Chyba pri načítaní výberu slov:", error);
        return DEFAULT_WORDS_ROM.map(word => word.id);
    }
}

function getWordImageUrl(word) {
    if (word.source === "default") {
        return word.image;
    }

    return URL.createObjectURL(word.image);
}

function updateSelectedWordsCounter() {
    const counter = document.getElementById("selectedWordsCounter");
    if (!counter) return;

    const selectedCount = document.querySelectorAll(".word-list-item.selected").length;
    counter.textContent = `Vybraných slov: ${selectedCount} / ${REQUIRED_WORD_COUNT}`;

    if (selectedCount === REQUIRED_WORD_COUNT) {
        counter.style.color = "green";
    } else {
        counter.style.color = "#8a1f11";
    }
}

function areWordSelectionsEqual(selectionA, selectionB) {
    if (!Array.isArray(selectionA) || !Array.isArray(selectionB)) {
        return false;
    }

    if (selectionA.length !== selectionB.length) {
        return false;
    }

    const sortedA = [...selectionA].sort();
    const sortedB = [...selectionB].sort();

    for (let i = 0; i < sortedA.length; i++) {
        if (sortedA[i] !== sortedB[i]) {
            return false;
        }
    }

    return true;
}

async function saveSelectedWords() {
    const selectedItems = document.querySelectorAll(".word-list-item.selected");

    if (selectedItems.length !== REQUIRED_WORD_COUNT) {
        alert(`Do testu musí byť vybraných presne ${REQUIRED_WORD_COUNT} slov. Aktuálne je vybraných ${selectedItems.length}.`);
        return;
    }

    const oldSelectedIds = getSelectedWordIds();
    const newSelectedIds = Array.from(selectedItems).map(item => item.dataset.wordId);

    const selectionChanged = !areWordSelectionsEqual(oldSelectedIds, newSelectedIds);

    if (selectionChanged) {
        const confirmChange = confirm(
            "Zmenou výberu slov budú vymazané všetky kalibračné dáta rómskej verzie.\n\n" +
            "Kalibráciu bude potrebné vykonať znova.\n\n" +
            "Naozaj chcete uložiť nový výber slov?"
        );

        if (!confirmChange) return;
    }

    try {
        localStorage.setItem(SELECTED_WORDS_STORAGE_KEY, JSON.stringify(newSelectedIds));

        if (selectionChanged) {
            await clearCalibrationData();
            alert("Výber slov bol uložený a kalibračné dáta boli vymazané.");
        } else {
            alert("Výber slov bol uložený.");
        }

    } catch (error) {
        console.error("Chyba pri ukladaní výberu slov alebo mazaní kalibrácie:", error);
        alert("Nastala chyba pri ukladaní výberu slov alebo mazaní kalibračných dát.");
    }
}

async function deleteCustomWord(wordId, displayName) {
    const selected = isWordSelected(wordId);

    let message = `Naozaj chcete odstrániť slovo "${displayName}"?\n\nTúto akciu nie je možné vrátiť späť.`;

    if (selected) {
        message =
            `Slovo "${displayName}" je aktuálne vybrané do testu.\n\n` +
            `Ak ho odstránite, bude vymazané aj z výberu slov pre test a budete musieť vybrať nové slovo, aby bolo v teste opäť presne 10 slov.\n\n` +
            `Po uložení nového výberu slov budú vymazané aktuálne kalibračné dáta a kalibráciu bude potrebné vykonať znova.\n\n` +
            `Naozaj chcete pokračovať?`;
    }

    const confirmDelete = confirm(message);

    if (!confirmDelete) return;

    try {
        const db = await openWordsDB();

        const transaction = db.transaction(WORDS_STORE_NAME, "readwrite");
        const store = transaction.objectStore(WORDS_STORE_NAME);

        store.delete(wordId);

        transaction.oncomplete = function () {
            removeDeletedWordFromSelection(wordId);
            loadAvailableWords();

            if (selected) {
                alert(`Slovo "${displayName}" bolo odstránené. Vyberte nové slovo do testu a uložte výber.`);
            } else {
                alert(`Slovo "${displayName}" bolo odstránené.`);
            }
        };

        transaction.onerror = function (event) {
            console.error("Chyba pri mazaní slova:", event.target.error);
            alert("Slovo sa nepodarilo odstrániť.");
        };

    } catch (error) {
        console.error("Chyba pri otvorení databázy slov:", error);
        alert("Nepodarilo sa otvoriť databázu slov.");
    }
}

function removeDeletedWordFromSelection(wordId) {
    const saved = localStorage.getItem(SELECTED_WORDS_STORAGE_KEY);

    if (!saved) return;

    try {
        const selectedIds = JSON.parse(saved);

        if (!Array.isArray(selectedIds)) return;

        const updatedSelectedIds = selectedIds.filter(id => id !== wordId);

        localStorage.setItem(
            SELECTED_WORDS_STORAGE_KEY,
            JSON.stringify(updatedSelectedIds)
        );

    } catch (error) {
        console.error("Chyba pri úprave uloženého výberu slov:", error);
    }
}

function isWordSelected(wordId) {
    const saved = localStorage.getItem(SELECTED_WORDS_STORAGE_KEY);

    if (!saved) return false;

    try {
        const selectedIds = JSON.parse(saved);

        if (!Array.isArray(selectedIds)) return false;

        return selectedIds.includes(wordId);

    } catch (error) {
        console.error("Chyba pri kontrole vybraného slova:", error);
        return false;
    }
}

function updateCustomWordsCounter(customWordsCount) {
    const counter = document.getElementById("customWordsCounter");
    if (!counter) return;

    counter.textContent = `Vlastné slová: ${customWordsCount} / ${MAX_CUSTOM_WORDS}`;

    if (customWordsCount >= MAX_CUSTOM_WORDS) {
        counter.style.color = "#8a1f11";
    } else {
        counter.style.color = "green";
    }
}

function openCalibrationDB() {
    return new Promise((resolve, reject) => {
        const request = indexedDB.open(CALIBRATION_DB_NAME, 1);

        request.onsuccess = function(event) {
            resolve(event.target.result);
        };

        request.onerror = function(event) {
            reject(event.target.error);
        };

        request.onupgradeneeded = function(event) {
            const db = event.target.result;

            if (!db.objectStoreNames.contains(CALIBRATION_STORE_NAME)) {
                db.createObjectStore(CALIBRATION_STORE_NAME, {
                    keyPath: "id",
                    autoIncrement: true
                });
            }
        };
    });
}

async function clearCalibrationData() {
    const db = await openCalibrationDB();

    return new Promise((resolve, reject) => {
        const transaction = db.transaction(CALIBRATION_STORE_NAME, "readwrite");
        const store = transaction.objectStore(CALIBRATION_STORE_NAME);

        store.clear();

        transaction.oncomplete = function() {
            resolve();
        };

        transaction.onerror = function(event) {
            reject(event.target.error);
        };
    });
}

function areLevelsEqual(levelsA, levelsB) {
    for (let level = 1; level <= 10; level++) {
        if (Number(levelsA[level]) !== Number(levelsB[level])) {
            return false;
        }
    }

    return true;
}