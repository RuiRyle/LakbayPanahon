import "./student-audio-host.js";

const MUSIC_KEY = "lakbay-background-music";
const SOUND_KEY = "lakbay-ui-sounds";
const SOUND_VOLUME_KEY = "lakbay-ui-sound-volume";
const player = window.LakbayStudentAudio;

function readPreference(key, fallback = true) {
    try {
        const value = localStorage.getItem(key);
        return value === null ? fallback : value !== "off";
    } catch {
        return fallback;
    }
}

function readSoundVolume() {
    try {
        const stored = localStorage.getItem(SOUND_VOLUME_KEY);
        if (stored === null || stored.trim() === "") return .85;
        const value = Number(stored);
        return Number.isFinite(value) ? Math.min(100, Math.max(0, value)) / 100 : .85;
    } catch {
        return .85;
    }
}

// Account Settings owns music on/off and volume. Starting playback here must
// preserve those saved choices, including a returning visitor's muted music.
function startLandingMusic() {
    if (!readPreference(MUSIC_KEY) || !player) return;
    player.start().then(playing => {
        if (!playing) return;
        document.removeEventListener("pointerdown", startLandingMusic, true);
        document.removeEventListener("keydown", startLandingMusic, true);
        document.removeEventListener("click", startLandingMusic, true);
    }).catch(() => {});
}

// Try immediately; retry with user activation when autoplay is blocked.
document.addEventListener("pointerdown", startLandingMusic, true);
document.addEventListener("keydown", startLandingMusic, true);
document.addEventListener("click", startLandingMusic, true);
window.addEventListener("pageshow", startLandingMusic);
startLandingMusic();

document.addEventListener("click", event => {
    if (!readPreference(SOUND_KEY) || !player) return;
    const target = event.target instanceof Element ? event.target : null;
    if (!target?.closest("a[href],button:not(:disabled),[role='button']:not([aria-disabled='true'])")) return;
    player.playSound("activate", readSoundVolume());
}, true);

let lastHoverSoundAt = 0;
document.addEventListener("pointerover", event => {
    if (!readPreference(SOUND_KEY) || event.pointerType !== "mouse" || !player) return;
    const target = event.target instanceof Element ? event.target : null;
    const card = target?.closest(".feature-card,.history-card,.floating-card,.step");
    if (!card || (event.relatedTarget instanceof Node && card.contains(event.relatedTarget))) return;
    if (performance.now() - lastHoverSoundAt < 300) return;
    lastHoverSoundAt = performance.now();
    player.playSound("hover", readSoundVolume());
}, true);
