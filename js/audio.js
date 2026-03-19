const hintsfx = new Audio('sfx/hint.mp3');
const backgroundMusic = new Audio('sfx/Dreamscape.mp3');
const move = new Audio('sfx/move.mp3');
const win = new Audio('sfx/win.mp3');
const hardModeSound = new Audio('sfx/hardmode.mp3');
window.addEventListener("DOMContentLoaded", function () {
    
});

function moveSfx() {
    move.volume = 0.3;
    move.play();
move.currentTime = 0;
}
function backgroundMusicSfx() {
    backgroundMusic.volume = 0.1;
    backgroundMusic.loop = true;
    backgroundMusic.play();
}
function hardModeSfx() {
    hardModeSound.volume = 0.4;
    hardModeSound.loop = true;
    hardModeSound.play();
}
function winSfx() {
    win.volume = 0.5;
    win.play();
}

function hintSfx() {
    hintsfx.volume = 0.3;
    hintsfx.play();
    hintsfx.currentTime = 0; // Reset to start for rapid hints
}