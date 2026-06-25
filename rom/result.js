const scoreCorrect_span = document.getElementById("correct-score");
const scoreWrong_span = document.getElementById("wrong-score");

// Načítanie skóre z localStorage a prevod na čísla
const scoreCorrect = parseInt(localStorage.getItem("userscore") || 0, 10);
const scoreWrong = parseInt(localStorage.getItem("computerscore") || 0, 10);
const lastCorrectIndex = parseInt(localStorage.getItem("lastCorrectIndex") || -1, 10);
const lastWrongIndex = parseInt(localStorage.getItem("lastWrongIndex") || -1, 10);
const answerHistory = JSON.parse(localStorage.getItem("answerHistory") || "[]");

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

const LEVELS_STORAGE_KEY = "customDbfsLevelsROM";
const DBFS_LEVELS = getDbfsLevels();

// Zobrazenie skóre
if (scoreCorrect_span) scoreCorrect_span.textContent = scoreCorrect;
if (scoreWrong_span)   scoreWrong_span.textContent   = scoreWrong;

// Mapovanie indexu na úroveň (10 → 1)
function getLevelFromIndex(index) {
    if (index < 0 || index >= 10) return null;
    return 10 - index; // 0 → 10, 1 → 9, ..., 9 → 1
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

// GLOBÁLNA PREMENNÁ – bude nastavená v showResult()
let subjectThreshold = null;  // ← sem sa uloží správny prah z funkcie

function showResult() {
    const total = scoreCorrect + scoreWrong;
    const percentage = total > 0 ? Math.floor((scoreCorrect / total) * 100) : 0;

    let bestCorrectLevel = null;
    let lowestHeardLevel = null;
    let hearingLevel = null;

    for (let i = 0; i < answerHistory.length; i++) {
        const entry = answerHistory[i];
        const level = entry.level;

        lowestHeardLevel = level;

        if (entry.correct === entry.user) {
            if (bestCorrectLevel === null || level < bestCorrectLevel) {
                bestCorrectLevel = level;
            }
        }
    }

    // Zobraz percentá
    document.getElementById("percentage").textContent = 
        `Celková úspešnosť: ${percentage} %`;

    // Hladina porozumenia reči
    if (bestCorrectLevel !== null) {
        document.getElementById("demo1").textContent =
            `Prah porozumenia reči: úroveň ${bestCorrectLevel} (z 10)`;
    } else {
        document.getElementById("demo1").textContent =
            "Nebola zaznamenaná žiadna správna odpoveď.";
        bestCorrectLevel = null;
    }

    // Hladina počutia reči
    if (answerHistory.length > 0) {
        // nájdeme najnižšiu úroveň v histórii
        hearingLevel = Math.min(...answerHistory.map(e => e.level));

        // skontrolujeme odpoveď na tejto najnižšej úrovni
        const lowestEntry = answerHistory.find(e => e.level === hearingLevel);
        if (lowestEntry) {
            const resp = (lowestEntry.user || "").trim().toLowerCase();
            if (resp === "" || resp.includes("nepočul")) {
                hearingLevel += 1;
            }
        }
    }

    if (hearingLevel !== null) {
        document.getElementById("demo2").textContent =
        `Prah počutia reči: úroveň ${hearingLevel} (z 10)`;
    }

    // ULOŽ SPRÁVNU HODNOTU DO GLOBÁLNEJ
    subjectThreshold = bestCorrectLevel;

    // VOLAJ POROVNANIE
    setTimeout(compareWithCalibration, 100);
}

// Zobrazenie histórie v tabuľke
function showHistory() {
    const tbody = document.querySelector("#historyTable tbody");
    tbody.innerHTML = "";

    if (answerHistory.length === 0) {
        tbody.innerHTML = "<tr><td colspan='4'>Žiadne údaje o odpovediach.</td></tr>";
        return;
    }

    answerHistory.forEach(entry => {
        const row = document.createElement("tr");

        // Úroveň
        const levelCell = document.createElement("td");
        levelCell.textContent = entry.level;

        // Slová sú už uložené ako displayName z game.js
        const correctPretty = entry.correct || "—";
        const userPretty = entry.user || "—";

        // Bunka – správna odpoveď
        const correctCell = document.createElement("td");
        correctCell.textContent = correctPretty;

        // Bunka – odpoveď používateľa + farba
        const userCell = document.createElement("td");
        userCell.textContent = userPretty;

        if (entry.correct === entry.user) {
            userCell.style.color = "green";
        } else {
            userCell.style.color = "red";
        }

        // 4. stĺpec – Odstupy hlasitosti
        const dbCell = document.createElement("td");
        const dbValue = DBFS_LEVELS[entry.level] ?? DEFAULT_LEVELS[entry.level];
        dbCell.textContent = dbValue !== undefined ? `${dbValue} dBFS` : "—";

        row.appendChild(levelCell);
        row.appendChild(correctCell);
        row.appendChild(userCell);
        row.appendChild(dbCell);
        tbody.appendChild(row);
    });
}

function confirmation() {
    const user_choice = window.confirm('Naozaj si prajete ukončiť hru a presunúť sa do úvodu aplikácie ?');
    if(user_choice==true) {
        window.location='home.html';
    } else {
        return false;
    }
}

// POROVNANIE S KALIBRÁCIOU
async function compareWithCalibration() {
    const comparisonDiv = document.getElementById("hearingComparison");
    if (!comparisonDiv) return;

    if (subjectThreshold === null) {
        comparisonDiv.innerHTML = `<p class="no-comparison"><strong>Žiadna správna odpoveď – nemožno porovnať.</strong></p>`;
        return;
    }

    try {
        const allRecords = await getAllCalibrationRecords();

        // ZISTI SPRÁVNY REŽIM – najprv z URL, potom z localStorage (fallback)
        const urlParams = new URLSearchParams(window.location.search);
        let mode = urlParams.get("mode");
        let side = urlParams.get("side");

        // Ak nie je v URL (normálny test), skús z localStorage (z manual stránky)
        if (!mode || mode === "null") {
            const lastManual = localStorage.getItem("lastManual") || "";
            if (lastManual.includes("lave")) {
                mode = "sluchadla";
                side = "lave";
            } else if (lastManual.includes("prave")) {
                mode = "sluchadla";
                side = "prave";
            } else {
                mode = "reproduktor";
                side = null;
            }
        } else {
            // Ak je v URL, spracuj
            mode = mode === "reproduktor" ? "reproduktor" : "sluchadla";
        }

        // Filtrovanie podľa módu a strany
        const records = allRecords.filter(r => {
            if (r.mode !== mode) return false;
            if (mode === "sluchadla" && r.side !== side) return false;
            return true;
        });

        if (records.length === 0) {
            const regimeText = mode === "reproduktor" 
                ? "reproduktor" 
                : `slúchadlá (${side === "lave" ? "ľavé" : "pravé"} ucho)`;
            comparisonDiv.innerHTML = `
                <div class="no-calibration-box">
                     <p class="no-calibration-title">
                        <strong>Žiadne kalibrácie pre ${regimeText}.</strong>
                    </p>
                    <p class="no-calibration-text">
                        Pre porovnanie je potrebné vykonať aspoň 2 kalibrácie.
                    </p>
                </div>
            `;
            return;
        }

        const average = Math.round(records.reduce((a, r) => a + r.level, 0) / records.length);
        const diff = subjectThreshold - average;

        // Rozdielový popis
        let diffText = "";
        if (diff === 1 || diff === 2) {
           diffText = "mierne vyšší";
        } else if (diff >= 3) {
            diffText = "výrazne vyšší";
        }

        // 🔍 Interpretácia podľa inštrukcií
        let interpretation = "";

        if (subjectThreshold > average) {
            if (diff >= 1 && diff <= 2) {
                interpretation = `
                    <p class="interpretation-text">
                        <strong>Interpretácia:</strong><br>
                        Nameraný prah porozumenia reči je <strong>${diffText}</strong> (úroveň ${subjectThreshold}) 
                        voči priemernému prahu (úroveň ${average}). 
                        Odporúčame zopakovať meranie. Ak bude znova nameraný prah vyšší ako ${average}, 
                        odporúčame sa poradiť s ošetrujúcim lekárom o prípadnom audiologickom vyšetrení.
                    </p>`;
            }

            if (diff >= 3) {
                interpretation = `
                    <p class="interpretation-text">
                        <strong>Interpretácia:</strong><br>
                        Nameraný prah porozumenia reči je <strong>${diffText}</strong> (úroveň ${subjectThreshold}) 
                        voči priemernému prahu (úroveň ${average}). 
                        Odporúčame zopakovať meranie pre potvrdenie výsledku. 
                        Ak bude aj opakované meranie výrazne vyššie, 
                        odporúčame konzultáciu s ošetrujúcim lekárom a zváženie audiologického vyšetrenia.
                    </p>`;
            }
        } 
        else if (subjectThreshold === average) {
            interpretation = `
                <p class="interpretation-text">
                    <strong>Interpretácia:</strong><br>
                    Nameraný prah porozumenia reči je na rovnakej úrovni (úroveň ${subjectThreshold}) 
                    ako priemerný prah na základe vami zadaných kalibračných dát (úroveň ${average}). 
                    Testovaný subjekt má teda rovnaký prah porozumenia reči ako kalibračné osoby.<br>
                    Tento výsledok automaticky neznamená, že testovaná osoba nemá sluchové postihnutie. 
                    Ak pozorujete akékoľvek problémy so sluchom testovanej osoby, poraďte sa 
                    s ošetrujúcim lekárom.
                </p>`;
        }
        else if (subjectThreshold < average) {
            interpretation = `
                <p class="interpretation-text">
                    <strong>Interpretácia:</strong><br>
                    Nameraný prah porozumenia reči je na nižšej (lepšej) úrovni (úroveň ${subjectThreshold}) 
                    ako priemerný prah na základe vami zadaných kalibračných dát (úroveň ${average}). 
                    Testovaný subjekt má teda nižší prah porozumenia reči ako kalibračné osoby a teda 
                    rozpoznáva tichšie zvuky ako kalibračné osoby.<br>
                    Tento výsledok automaticky nemusí znamenať, že testovaná osoba nemá sluchové postihnutie. 
                    Ak pozorujete akékoľvek problémy so sluchom testovanej osoby, poraďte sa 
                    s ošetrujúcim lekárom.
                </p>`;
        }

        const regimeText = mode === "reproduktor" 
            ? "reproduktor" 
            : `slúchadlá (${side === "lave" ? "ľavé" : "pravé"} ucho)`;

        comparisonDiv.innerHTML = `
             <div class="comparison-box">
                <p class="comparison-text">
                    <strong>Priemerný prah porozumenia reči (${regimeText})</strong>: úroveň ${average} 
                    <small class="comparison-meta">(z ${records.length} kalibrácií)</small>
                </p>

                 <p class="comparison-text">
                    <strong>Tvoj prah porozumenia reči</strong>: úroveň ${subjectThreshold}
                </p>

                 <div class="comparison-interpretation">
                    ${interpretation}
                </div>
            </div>
        `;

    } catch (err) {
        comparisonDiv.innerHTML = `<p style="color:#e74c3c;">Chyba pri načítaní kalibrácií.</p>`;
        console.error("Chyba v compareWithCalibration:", err);
    }
}

function main(){
    showResult();
    showHistory();
}

main();