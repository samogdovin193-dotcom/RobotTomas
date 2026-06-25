function confirmation() {
    if (confirm("Naozaj chcete ukončiť a vrátiť sa domov?")) {
        window.location.href = "home.html";
    }
}

// Späť na poslednú manual stránku (ľavé/pravé/reproduktor)
document.getElementById("backToManual")?.addEventListener("click", () => {
    const lastPage = localStorage.getItem("lastManual") || "manual.html";
    window.location.href = lastPage;
});

function getModeFromStorage() {
    const mode = localStorage.getItem("gameMode") || "reproduktor";
    const side = localStorage.getItem("gameSide") || null;
    return { mode, side };
}

// Spustenie hry
function startGame() {
    const { mode, side } = getModeFromStorage();

    // Vymažeme kalibračné príznaky
    localStorage.removeItem("calibrationMode");
    localStorage.removeItem("calibrationOrigin");
    localStorage.removeItem("calibrationType");
    localStorage.removeItem("calibrationSide");

    // Po spustení hry môžeme vymazať aj dočasné gameMode/gameSide
    localStorage.removeItem("gameMode");
    localStorage.removeItem("gameSide");

    let url = `game.html?mode=${mode}`;
    if (side) url += `&side=${side}`;
    window.location.href = url;
}

window.startGame = startGame;