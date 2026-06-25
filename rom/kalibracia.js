//Home tlacidlo
function confirmation() {
    if (confirm("Naozaj chcete ukončiť a vrátiť sa domov?")) {
        window.location.href = "home.html";
    }
}

let db_rom;
const DB_NAME = "CalibrationDB_rom";
const STORE_NAME = "calibration_rom";

// Späť na poslednú manual stránku (ľavé/pravé/reproduktor)
document.getElementById("backToManual")?.addEventListener("click", () => {
    const lastPage = localStorage.getItem("lastManual") || "manual.html";
    window.location.href = lastPage;
});

// ======================
// 1. IndexedDB funkcie
// ======================
function openDatabase() {
    return new Promise((resolve, reject) => {
        const request = indexedDB.open(DB_NAME, 1);

        request.onsuccess = e => {
            db_rom = e.target.result;
            resolve(db_rom);
        };

        request.onerror = () => reject("Chyba pri otváraní DB");

        request.onupgradeneeded = e => {
            db_rom = e.target.result;

            if (!db_rom.objectStoreNames.contains(STORE_NAME)) {
                db_rom.createObjectStore(STORE_NAME, {
                    keyPath: "id",
                    autoIncrement: true
                });
            }
        };
    });
}

async function addCalibrationRecord(level, mode, side = null) {
    const db_rom = await openDatabase();
    const tx = db_rom.transaction(STORE_NAME, "readwrite");
    const store = tx.objectStore(STORE_NAME);
    await store.add({ level, mode, side, timestamp: new Date().toISOString() });
}

async function clearCalibrationData() {
    return new Promise(resolve => {
        const req = indexedDB.deleteDatabase(DB_NAME);
        req.onsuccess = req.onblocked = () => { db_rom = null; resolve(); };
    });
}

async function getAllCalibrationRecords() {
    const db_rom = await openDatabase();
    const tx = db_rom.transaction(STORE_NAME, "readonly");
    const store = tx.objectStore(STORE_NAME);
    return new Promise(resolve => {
        const req = store.getAll();
        req.onsuccess = () => resolve(req.result);
    });
}

async function countCalibrationRecords(mode) {
    const all = await getAllCalibrationRecords();
    return all.filter(r => r.mode === mode).length;
}

// ======================
// 2. Zistenie módu
// ======================
function getModeFromPage() {
    // 1. Najprv skús z URL parametrov (dôležité pri presmerovaní z manual_lave_ucho.html)
    const params = new URLSearchParams(window.location.search);
    const urlMode = params.get("mode");
    const urlSide = params.get("side");

    if (urlMode === "sluchadla" && (urlSide === "lave" || urlSide === "prave")) {
        return { mode: "sluchadla", side: urlSide };
    }
    if (urlMode === "reproduktor") {
        return { mode: "reproduktor", side: null };
    }

    // 2. Ak nie je v URL, skús podľa názvu stránky (pre staré odkazy)
    const path = window.location.pathname.toLowerCase();
    if (path.includes("lave")) return { mode: "sluchadla", side: "lave" };
    if (path.includes("prave")) return { mode: "sluchadla", side: "prave" };

    // 3. Default = reproduktor
    return { mode: "reproduktor", side: null };
}

// ======================
// 3. Kalibračné funkcie
// ======================
function startCalibration() {
    // BERIE REŽIM PRIAMO Z URL
    const urlParams = new URLSearchParams(window.location.search);
    const mode = urlParams.get("mode") || "reproduktor";
    const side = urlParams.get("side"); // môže byť "lave", "prave" alebo null

    // Uložíme do localStorage pre finish.js
    localStorage.setItem("calibrationOrigin", "kalibracia.html");
    localStorage.setItem("calibrationMode", "true");
    localStorage.setItem("calibrationType", mode);
    if (side) {
        localStorage.setItem("calibrationSide", side);
    } else {
        localStorage.removeItem("calibrationSide");
    }

    // Presmeruj na hru s rovnakými parametrami
    let url = `game.html?calibration=1&mode=${mode}`;
    if (side) url += `&side=${side}`;
    window.location.href = url;
}

async function showCalibrations() {
    const { mode, side } = getModeFromPage();
    const allData = await getAllCalibrationRecords();

    // Filtrované záznamy len pre aktuálny mód (a prípadne stranu)
    const filtered = allData.filter(r => {
        if (r.mode !== mode) return false;
        if (mode === "sluchadla" && r.side !== side) return false;
        return true;
    });

    // Ak nie je nič uložené pre tento mód
    if (filtered.length === 0) {
        const modText = mode === "sluchadla" 
            ? `slúchadlá (${side === "lave" ? "ľavé" : "pravé"} ucho)` 
            : "reproduktor";
        return alert(`Kalibrácia pre ${modText}:\n\nŽiadne záznamy.`);
    }

    // Zoradenie podľa času (najnovšie dole)
    filtered.sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp));

    // Vytvoríme pekný text
    let text = "";
    const modText = mode === "sluchadla" 
        ? `slúchadlá (${side === "lave" ? "ľavé" : "pravé"} ucho)` 
        : "reproduktor";

    text += `Kalibrácia pre ${modText}:\n\n`;

    filtered.forEach(r => {
        const date = new Date(r.timestamp);
        const formattedDate = date.toLocaleString("sk-SK", {
            day: "2-digit",
            month: "2-digit",
            year: "numeric",
            hour: "2-digit",
            minute: "2-digit",
            second: "2-digit"
        });
        text += `úroveň ${r.level} → ${formattedDate}\n`;
    });

    alert(text.trim());
}

async function clearCalibrations() {
    if (confirm("Naozaj vymazať VŠETKY kalibrácie?")) {
        await clearCalibrationData();
        alert("Kalibrácie boli vymazané.");
        location.reload();
    }
}

// ======================
// 4. Prehrávanie tlačidiel (Play/Stop)
// ======================

// =============================================
// Ovladanie tlačidiel
// =============================================
let currentAudio = null;
let currentButton = null;

function setButtonToPlaying(btn) {
    btn.classList.add("stop");
    btn.querySelector(".icon").textContent = "⏹";
    btn.querySelector(".btn-text").textContent = btn.dataset.textStop || "Zastaviť";
}

function resetButton(btn) {
    btn.classList.remove("stop");
    btn.querySelector(".icon").textContent = "▶";
    btn.querySelector(".btn-text").textContent = btn.dataset.textPlay || "Prehrať/Spustiť";
}

function stopEverything() {
    if (currentAudio) {
        currentAudio.pause();
        currentAudio.currentTime = 0;
        currentAudio = null;
    }
    if (currentButton) {
        resetButton(currentButton);
        currentButton = null;
    }
}

// =============================================
// One-shot audio (inštrukcie + ukončenie)
// =============================================
function playOneShot(btn) {
    // If THIS is the currently playing button → just stop it
    if (currentButton === btn && currentAudio && !currentAudio.paused) {
        stopEverything();
        return;
    }

    // Otherwise stop anything else and start this audio
    stopEverything();

    const src = btn.dataset.audio;
    if (!src) return;

    currentAudio = new Audio(src);
    currentAudio.loop = false;

    currentAudio.play()
        .catch(e => console.warn("Play error:", e));

    setButtonToPlaying(btn);
    currentButton = btn;

    currentAudio.addEventListener("ended", () => {
        resetButton(btn);
        if (currentButton === btn) {  // only reset if still this one
            currentAudio = null;
            currentButton = null;
        }
    }, { once: true });
}

// =============================================
// Konštantný tón
// =============================================
function toggleConstantTone() {
    const btn = document.getElementById("playbtn-konstantny");

    if (currentButton === btn && currentAudio) {
        // Already playing this one → STOP
        stopEverything();
        return;
    }

    // Start / restart
    stopEverything(); // kill anything else

    currentAudio = new Audio(btn.dataset.audio);
    currentAudio.loop = true;

    currentAudio.play()
        .then(() => {
            setButtonToPlaying(btn);
            currentButton = btn;
        })
        .catch(err => {
            console.warn("Constant tone play failed:", err);
            resetButton(btn);
        });
}

// =============================================
// Attach listeners
// =============================================
document.addEventListener("DOMContentLoaded", () => {
    // One-shot buttons
    const btnInstruction = document.getElementById("playbtn-instruction");
    const btnUkoncenie   = document.getElementById("playbtn-ukoncenie");

    if (btnInstruction) btnInstruction.addEventListener("click", () => playOneShot(btnInstruction));
    if (btnUkoncenie)   btnUkoncenie.addEventListener("click",   () => playOneShot(btnUkoncenie));

    // Constant tone
    const btnConstant = document.getElementById("playbtn-konstantny");
    if (btnConstant) {
        btnConstant.addEventListener("click", toggleConstantTone);
    }
});

// ======================
// 5. Aktualizácia nadpisu
// ======================
function updatePageTitle() {
    const titleSpan = document.getElementById("mode-title");
    if (!titleSpan) return;

    const { mode, side } = getModeFromPage();
    if (mode === "sluchadla") {
        titleSpan.textContent = side === "lave" ? "(Ľavé ucho)" : "(Pravé ucho)";
    } else {
        titleSpan.textContent = "(Reproduktor)";
    }
}

// ======================
// 6. Pripojenie tlačidiel po načítaní stránky
// ======================
document.addEventListener("DOMContentLoaded", () => {
    updatePageTitle();

    const startBtn = document.getElementById("startCalibrationBtn");
    const showBtn = document.getElementById("showCalibrationBtn");
    const clearBtn = document.getElementById("clearCalibrationBtn");

    if (startBtn) startBtn.addEventListener("click", startCalibration);
    if (showBtn) showBtn.addEventListener("click", showCalibrations);
    if (clearBtn) clearBtn.addEventListener("click", clearCalibrations);

    const urlParams = new URLSearchParams(window.location.search);
    const mode = urlParams.get("mode") || "reproduktor";
    const side = urlParams.get("side");

    localStorage.setItem("calibrationType", mode);
    if (side) {
        localStorage.setItem("calibrationSide", side);
    } else {
        localStorage.removeItem("calibrationSide");
    }
});

// ======================
// 7. Export funkcií
// ======================
window.addCalibrationRecord = addCalibrationRecord;
window.getModeFromPage = getModeFromPage;