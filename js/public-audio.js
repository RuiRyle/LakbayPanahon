import "./student-audio-host.js";

const MUSIC_KEY = "lakbay-background-music";
const SOUND_KEY = "lakbay-ui-sounds";
const SOUND_VOLUME_KEY = "lakbay-ui-sound-volume";
const musicButton = document.querySelector("[data-landing-music]");
const effectsButton = document.querySelector("[data-landing-effects]");
const status = document.querySelector("[data-landing-audio-status]");
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

let effectsEnabled = readPreference(SOUND_KEY);
let musicEnabled = readPreference(MUSIC_KEY);
let musicPlaying = false;

function renderControls() {
    if (musicButton) {
        musicButton.setAttribute("aria-pressed", String(musicPlaying));
        const label = musicButton.querySelector("[data-landing-music-label]");
        if (label) label.textContent = musicPlaying ? "Pause adventure music" : "Play adventure music";
        const icon = musicButton.querySelector("[aria-hidden='true']");
        if (icon) icon.textContent = musicPlaying ? "Ⅱ" : "▶";
    }
    if (effectsButton) {
        effectsButton.setAttribute("aria-checked", String(effectsEnabled));
        const state = effectsButton.querySelector("[data-landing-effects-state]");
        if (state) state.textContent = effectsEnabled ? "On" : "Off";
    }
}

function setStatus(message) {
    if (status) status.textContent = message;
}

async function toggleMusic() {
    if (!player) {
        setStatus("Audio is not available in this browser.");
        return;
    }

    if (musicPlaying) {
        musicPlaying = false;
        musicEnabled = false;
        await player.setEnabled(false);
        setStatus("Adventure music is paused. Sound effects are controlled separately.");
    } else {
        musicEnabled = true;
        try { localStorage.setItem(MUSIC_KEY, "on"); } catch {}
        musicPlaying = Boolean(await player.setEnabled(true));
        setStatus(musicPlaying
            ? "Adventure music is playing. Use the button again to pause it."
            : "Your browser did not start the music. Press Play again to try.");
    }
    renderControls();
}

musicButton?.addEventListener("click", toggleMusic);

effectsButton?.addEventListener("click", () => {
    effectsEnabled = !effectsEnabled;
    try { localStorage.setItem(SOUND_KEY, effectsEnabled ? "on" : "off"); } catch {}
    renderControls();
    setStatus(effectsEnabled ? "Sound effects are on." : "Sound effects are off.");
    if (effectsEnabled) player?.playSound("toggle", readSoundVolume(), true);
});

// Effects play on landing-page controls once the visitor interacts. Music is
// started by the visible Play button because browsers block unrequested audio.
document.addEventListener("click", event => {
    if (!effectsEnabled || !player) return;
    const target = event.target instanceof Element ? event.target : null;
    if (!target?.closest("a[href],button:not(:disabled),[role='button']:not([aria-disabled='true'])")) return;
    player.playSound("activate", readSoundVolume());
}, true);

let lastHoverSoundAt = 0;
document.addEventListener("pointerover", event => {
    if (!effectsEnabled || event.pointerType !== "mouse" || !player) return;
    const target = event.target instanceof Element ? event.target : null;
    const card = target?.closest(".feature-card,.history-card,.floating-card,.step");
    if (!card || (event.relatedTarget instanceof Node && card.contains(event.relatedTarget))) return;
    if (performance.now() - lastHoverSoundAt < 300) return;
    lastHoverSoundAt = performance.now();
    player.playSound("hover", readSoundVolume());
}, true);

renderControls();
if (musicEnabled) {
    setStatus("Music is enabled. Press Play to start it; your browser requires a click first.");
}
