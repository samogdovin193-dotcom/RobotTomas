function confirmation() {
    var user_choice = window.confirm('Naozaj si prajete ukončiť hru a presunúť sa do úvodu aplikácie ?');
    if(user_choice==true) {
        window.location='home.html';
    } else {
        return false;
    }
}

// ── function for language switch ──
function confirmLanguageSwitch() {
    var message = "Naozaj chceš prejsť na rómsku verziu?";
    
    // Optional: different message for Romanian version
    if (window.location.pathname.includes('/rom/')) {
        message = "Naozaj chceš prejsť na slovenskú verziu?";
    }

    var user_choice = window.confirm(message);
    
    if (user_choice === true) {
        if (window.location.pathname.includes('/sk/')) {
            window.location.href = "../rom/home.html";
        } else if (window.location.pathname.includes('/rom/')) {
            window.location.href = "../sk/home.html";
        }
    }
    // no else needed — just stay on page
}

function goToSettings() {
    window.location.href = 'settings.html';
}

function main(){
}

main();