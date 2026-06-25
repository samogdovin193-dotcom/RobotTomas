function confirmation() {
    if (confirm("Naozaj chcete ukončiť a vrátiť sa domov?")) {
        window.location.href = "home.html";
    }
}

// Zistí aktuálny režim podľa názvu stránky
function getModeFromPage() {
    const page = window.location.pathname.split('/').pop().toLowerCase();
    if (page.includes("lave")) return { mode: "sluchadla", side: "lave" };
    if (page.includes("prave")) return { mode: "sluchadla", side: "prave" };
    return { mode: "reproduktor", side: null };
}

// Presmeruje na kalibráciu
function goToCalibration() {
    const { mode, side } = getModeFromPage();
    
    // Uložíme, odkiaľ ideme
    localStorage.setItem("lastManual", window.location.pathname.split('/').pop());

    // POSIELAME REŽIM
    let url = `kalibracia.html?mode=${mode}`;
    if (side) url += `&side=${side}`;
    window.location.href = url;
}

// Tlačidlo: Preskočiť → ide na start_game.html (nie priamo do hry)
function skipCalibration() {
    const { mode, side } = getModeFromPage();
    
    localStorage.setItem("lastManual", window.location.pathname.split('/').pop());
    localStorage.setItem("gameMode", mode);
    if (side) {
        localStorage.setItem("gameSide", side);
    } else {
        localStorage.removeItem("gameSide");
    }

    localStorage.removeItem("calibrationMode");
    localStorage.removeItem("calibrationOrigin");
    localStorage.removeItem("calibrationType");
    localStorage.removeItem("calibrationSide");

    let url = `start_game.html?mode=${mode}`;
    if (side) url += `&side=${side}`;
    window.location.href = url;
}

// Kontrola počtu kalibrácií a blokovanie tlačidla
async function checkAndToggleSkipButton() {
    const skipBtn = document.getElementById("skipCalibrationBtn");
    if (!skipBtn) return; // ak stránka nemá toto tlačidlo

    try {
        // Otvor IndexedDB
        const db = await new Promise((resolve, reject) => {
            const request = indexedDB.open("CalibrationDB", 1);
            request.onsuccess = () => resolve(request.result);
            request.onerror = () => reject(request.error);
            request.onupgradeneeded = (e) => {
                const db = e.target.result;
                if (!db.objectStoreNames.contains("calibration")) {
                    db.createObjectStore("calibration", { keyPath: "id", autoIncrement: true });
                }
            };
        });

        const transaction = db.transaction("calibration", "readonly");
        const store = transaction.objectStore("calibration");
        const allRecords = await new Promise((resolve) => {
            const req = store.getAll();
            req.onsuccess = () => resolve(req.result);
        });

        // Zistíme aktuálny režim
        const { mode, side } = getModeFromPage();

        // Filtrovanie podľa módu a strany
        const relevantRecords = allRecords.filter(r => {
            if (r.mode !== mode) return false;
            if (mode === "sluchadla" && r.side !== side) return false;
            return true;
        });

        const count = relevantRecords.length;

        // Blokovanie / odblokovanie tlačidla
        if (count < 2) {
            skipBtn.disabled = true;
            skipBtn.style.opacity = "0.4";
            skipBtn.style.cursor = "not-allowed";
            skipBtn.title = "Potrebné aspoň 2 kalibrácie pre spustenie hry";
        } else {
            skipBtn.disabled = false;
            skipBtn.style.opacity = "1";
            skipBtn.style.cursor = "pointer";
            skipBtn.title = "";
        }

    } catch (err) {
        console.error("Chyba pri kontrole kalibrácií:", err);
        // Ak sa niečo pokazí, necháme tlačidlo zablokované
        if (skipBtn) {
            skipBtn.disabled = true;
            skipBtn.style.opacity = "0.4";
        }
    }
}

// Spusti kontrolu hneď po načítaní stránky
document.addEventListener("DOMContentLoaded", () => {
    checkAndToggleSkipButton();
});

// Export pre ostatné súbory
window.confirmation = confirmation;
window.getModeFromPage = getModeFromPage;

// Synteza text to speech
const manualBtn = document.getElementById("manualbtn");

let audio = null;
let isPlaying = false;

function toggleCalibrationTone() {
    // ——————————————————————————————
    //  CASE 1: Not playing → start
    // ——————————————————————————————
    if (!isPlaying) {
        // Clean up any previous audio instance
        if (audio) {
            audio.pause();
            audio.removeEventListener("ended", onAudioEnded);
            audio = null;
        }

        audio = new Audio("audio/ElevenLabs_manul_speech.mp3");   // file path

        audio.play().catch(err => {
            console.warn("Audio play failed:", err);
            resetButton();
        });

        isPlaying = true;
        updateButtonToStop();
        
        // Auto reset button when sound naturally ends
        audio.addEventListener("ended", onAudioEnded, { once: true });
    }

    // ——————————————————————————————
    //  CASE 2: Is playing → stop
    // ——————————————————————————————
    else {
        if (audio) {
            audio.pause();
            audio.currentTime = 0;
            audio.removeEventListener("ended", onAudioEnded);
            audio = null;
        }
        resetButton();
    }
}

function onAudioEnded() {
    resetButton();
}

function resetButton() {
    isPlaying = false;
    manualBtn.classList.remove("stop");
    manualBtn.querySelector(".btn-text").textContent = "Prehrať inštrukcie";
    manualBtn.querySelector(".icon").textContent = "▶";
}

function updateButtonToStop() {
    manualBtn.classList.add("stop");
    manualBtn.querySelector(".btn-text").textContent = "Zastaviť prehrávanie";
    manualBtn.querySelector(".icon").textContent = "⏹";
}

// Attach listener once
if (manualBtn) {
    manualBtn.addEventListener("click", toggleCalibrationTone);
}