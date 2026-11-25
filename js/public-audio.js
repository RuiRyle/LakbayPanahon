import "./student-audio-host.js";

const MUSIC_VOLUME_KEY = "lakbay-background-music-volume";
const SOUND_KEY = "lakbay-ui-sounds";
const SOUND_VOLUME_KEY = "lakbay-ui-sound-volume";
const player = window.LakbayStudentAudio;

function soundsEnabled() {
    try {
        return localStorage.getItem(SOUND_KEY) === "on";
    } catch {
        return false;
    }
}

function readVolume(key, fallback) {
    try {
        const stored = localStorage.getItem(key);
        if (stored === null || stored.trim() === "") return fallback;
        const value = Number(stored);
        return Number.isFinite(value) ? Math.min(100, Math.max(0, value)) / 100 : fallback;
    } catch {
        return fallback;
    }
}

const musicButton = document.querySelector("[data-landing-music]");
const musicStatus = document.querySelector("[data-landing-music-status]");
if (musicButton && musicStatus && player) {
    const musicLabel = musicButton.querySelector("span");
    const refreshMusicLabel = () => {
        musicLabel.textContent = player.isPlaying() ? "Mute music" : "Play music";
    };
    musicButton.hidden = false;
    window.addEventListener("pageshow", refreshMusicLabel);
    musicButton.addEventListener("click", async () => {
        musicStatus.textContent = "";
        if (player.isPlaying()) {
            await player.setEnabled(false);
        } else if (readVolume(MUSIC_VOLUME_KEY, .8) === 0) {
            musicStatus.textContent = "Music volume is set to zero in Student Settings.";
        } else if (!await player.setEnabled(true)) {
            musicStatus.textContent = "Music could not start. Try pressing Play music again.";
        }
        refreshMusicLabel();
    });
}

document.addEventListener("click", event => {
    if (!soundsEnabled() || !player) return;
    const target = event.target instanceof Element ? event.target : null;
    if (!target?.closest("a[href],button:not(:disabled),[role='button']:not([aria-disabled='true'])")) return;
    player.playSound("activate", readVolume(SOUND_VOLUME_KEY, .85));
}, true);

let lastHoverSoundAt = 0;
document.addEventListener("pointerover", event => {
    if (!soundsEnabled() || event.pointerType !== "mouse" || !player) return;
    const target = event.target instanceof Element ? event.target : null;
    const card = target?.closest(".feature-card,.history-card,.floating-card,.step");
    if (!card || (event.relatedTarget instanceof Node && card.contains(event.relatedTarget))) return;
    if (performance.now() - lastHoverSoundAt < 300) return;
    lastHoverSoundAt = performance.now();
    player.playSound("hover", readVolume(SOUND_VOLUME_KEY, .85));
}, true);
