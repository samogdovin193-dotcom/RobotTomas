// IndexedDB funkcie
let db;
const DB_NAME = "CalibrationDB";
const STORE_NAME = "calibration";

function openDatabase() {
    return new Promise((resolve, reject) => {
        const request = indexedDB.open(DB_NAME, 1);
        request.onsuccess = e => { db = e.target.result; resolve(db); };
        request.onerror = () => reject("Chyba DB");
        request.onupgradeneeded = e => {
            db = e.target.result;
            if (!db.objectStoreNames.contains(STORE_NAME)) {
                db.createObjectStore(STORE_NAME, { keyPath: "id", autoIncrement: true });
            }
        };
    });
}

async function addCalibrationRecord(level, mode, side = null) {
    const db = await openDatabase();
    const tx = db.transaction(STORE_NAME, "readwrite");
    const store = tx.objectStore(STORE_NAME);
    await store.add({ level, mode, side, timestamp: new Date().toISOString() });
}

// POTVRDENIE PRE HOME
function confirmation() {
    const user_choice = window.confirm('Naozaj si prajete ukončiť hru a presunúť sa do úvodu aplikácie?');
    if (user_choice) {
        window.location = 'home.html';
    }
}

// Hlavná logika
const urlParams = new URLSearchParams(window.location.search);
const isCalibration = urlParams.get("calibration") === "1";

// Načítaj výsledky
const answerHistory = JSON.parse(localStorage.getItem("answerHistory") || "[]");

// Nájdi poslednú správnu úroveň
let lastCorrectLevel = null;
for (const entry of answerHistory) {
    if (entry.correct === entry.user) {
        lastCorrectLevel = entry.level;
    }
}

// KALIBRÁCIA
if (isCalibration) {
    // Skry normálne tlačidlá
    document.querySelector(".finish-robot-wrapper")?.style.setProperty("display", "none");
    document.querySelectorAll(".action-message").forEach(el => {el.style.display = "none";});
    document.getElementById("outer")?.style.setProperty("display", "none");

    const container = document.createElement("div");
    container.classList.add("result-container");

    const text = document.createElement("p");
    text.classList.add("result-text");

    if (lastCorrectLevel !== null) {
        text.innerHTML = `
            Posledná správna odpoveď:<br>
        <strong class="result-success">úroveň ${lastCorrectLevel}</strong><br>
        <em>Toto bude uložené ako kalibračný prah zdravého sluchu.</em>
        `;
    } else {
        text.innerHTML = `<span class="result-error">Žiadna správna odpoveď – kalibrácia nie je možná.</span>`;
    }

    const saveBtn = document.createElement("button");
    saveBtn.textContent = "Uložiť ako kalibráciu";
    saveBtn.classList.add("finish-btn", "btn-save");

    const discardBtn = document.createElement("button");
    discardBtn.textContent = "Zahodiť a vrátiť sa";
    discardBtn.classList.add("finish-btn", "btn-discard");

    container.appendChild(text);
    container.appendChild(saveBtn);
    container.appendChild(document.createElement("br"));
    container.appendChild(discardBtn);

    document.getElementById("outer").before(container);

    if (lastCorrectLevel === null) {
        saveBtn.disabled = true;
        saveBtn.style.opacity = "0.5";
    }

    // ZÍSKAJ SPRÁVNY REŽIM A STRANU
    const mode = localStorage.getItem("calibrationType") || "reproduktor";
    const side = localStorage.getItem("calibrationSide"); // "lave", "prave" alebo null

    // KAM SA VRÁTIŤ PO KALIBRÁCII
    const returnPage = localStorage.getItem("lastManual") || "manual.html";

    // ULOŽENIE
    saveBtn.onclick = async () => {
        if (lastCorrectLevel !== null) {
            try {
                await addCalibrationRecord(lastCorrectLevel, mode, side);
                alert(`Kalibrácia uložená!\nRežim: ${mode}${side ? " (" + (side === "lave" ? "ľavé" : "pravé") + " ucho)" : ""}\nÚroveň: ${lastCorrectLevel}`);
            } catch (err) {
                alert("Chyba pri ukladaní kalibrácie!");
                console.error(err);
            }
        }

        // Vyčisti kalibračné príznaky
        localStorage.removeItem("calibrationMode");
        localStorage.removeItem("calibrationOrigin");
        localStorage.removeItem("calibrationType");
        localStorage.removeItem("calibrationSide");

        // VRÁŤ SA NA SPRÁVNU MANUAL STRÁNKU
        window.location.href = returnPage;
    };

    // ZAHODENIE
    discardBtn.onclick = () => {
        if (confirm("Naozaj zahodiť túto kalibráciu?")) {
            localStorage.removeItem("calibrationMode");
            localStorage.removeItem("calibrationOrigin");
            localStorage.removeItem("calibrationType");
            localStorage.removeItem("calibrationSide");
            window.location.href = returnPage;
        }
    };
}

// NORMÁLNY TEST
if (!isCalibration) {
    const robotBtn = document.querySelector("#nextbutton3 a");
    if (robotBtn) {
        robotBtn.onclick = () => {
            window.location.href = "result.html";
        };
    }
}

// Pripoj confirmation() na tlačidlo Domov
const homeBtn = document.querySelector('a[id="index"]');
if (homeBtn) {
    homeBtn.onclick = confirmation;
}