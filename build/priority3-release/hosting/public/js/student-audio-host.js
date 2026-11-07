const SOUND_ENABLED_KEY = "lakbay-ui-sounds";
const SOUND_VOLUME_KEY = "lakbay-ui-sound-volume";
const MUSIC_ENABLED_KEY = "lakbay-background-music";
const MUSIC_VOLUME_KEY = "lakbay-background-music-volume";

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

let context = null;
let musicEnabled = true;
let musicVolume = readVolume(MUSIC_VOLUME_KEY, .8);
let focusMusicLevel = 1;
let musicGain = null;
let musicTimer = null;
let musicStarted = false;
let musicOrigin = 0;
let nextStep = 0;
const stepSeconds = 60 / 116 / 2;
const stepsPerLoop = 32;
const chords = [
    [130.81,196,261.63,329.63],
    [196,246.94,293.66,392],
    [174.61,220,261.63,349.23],
    [196,246.94,293.66,392]
];
const melody = [
    [0,523.25,392],[2,659.25,523.25],[4,783.99,659.25],[6,659.25,523.25],
    [8,587.33,392],[10,783.99,493.88],[12,987.77,587.33],[14,783.99,493.88],
    [16,698.46,523.25],[18,880,698.46],[20,1046.5,880],[22,880,698.46],
    [24,587.33,392],[26,783.99,493.88],[28,987.77,587.33],[30,783.99,493.88]
];

try {
    musicEnabled = localStorage.getItem(MUSIC_ENABLED_KEY) !== "off";
} catch {}

function getContext() {
    try {
        const AudioContextClass = window.AudioContext || window.webkitAudioContext;
        if (!AudioContextClass) return null;
        context ??= new AudioContextClass();
        if (context.state === "suspended") context.resume().catch(() => {});
        return context;
    } catch {
        return null;
    }
}

function makeEnvelope(gain, start, duration, peak, attack, release) {
    gain.gain.setValueAtTime(.0001, start);
    gain.gain.exponentialRampToValueAtTime(peak, start + attack);
    gain.gain.setValueAtTime(peak, start + duration - release);
    gain.gain.exponentialRampToValueAtTime(.0001, start + duration);
}

function scheduleMusicVoice(destination, frequency, start, duration, peak, options = {}) {
    const oscillator = context.createOscillator();
    const filter = context.createBiquadFilter();
    const gain = context.createGain();
    oscillator.type = options.wave || "sine";
    oscillator.frequency.setValueAtTime(frequency, start);
    filter.type = "lowpass";
    filter.frequency.setValueAtTime(options.cutoff || 1100, start);
    filter.Q.setValueAtTime(.25, start);
    makeEnvelope(gain, start, duration, peak, options.attack ?? .08, options.release ?? .2);
    oscillator.connect(filter);
    filter.connect(gain);
    gain.connect(destination);
    oscillator.start(start);
    oscillator.stop(start + duration + .04);
}

function scheduleFlute(destination, frequency, start, duration, peak) {
    const flute = context.createOscillator();
    const filter = context.createBiquadFilter();
    const gain = context.createGain();
    const vibrato = context.createOscillator();
    const vibratoDepth = context.createGain();
    flute.type = "triangle";
    flute.frequency.setValueAtTime(frequency, start);
    filter.type = "lowpass";
    filter.frequency.setValueAtTime(1500, start);
    filter.Q.setValueAtTime(.2, start);
    makeEnvelope(gain, start, duration, peak, .08, .14);
    vibrato.type = "sine";
    vibrato.frequency.setValueAtTime(4.8, start);
    vibratoDepth.gain.setValueAtTime(.4, start);
    vibrato.connect(vibratoDepth);
    vibratoDepth.connect(flute.frequency);
    flute.connect(filter);
    filter.connect(gain);
    gain.connect(destination);
    flute.start(start);
    vibrato.start(start);
    flute.stop(start + duration + .04);
    vibrato.stop(start + duration + .04);
}

function scheduleSaxophone(destination, frequency, start, duration, peak) {
    const reed = context.createOscillator();
    const body = context.createOscillator();
    const reedBand = context.createBiquadFilter();
    const warmth = context.createBiquadFilter();
    const mix = context.createGain();
    const gain = context.createGain();
    const vibrato = context.createOscillator();
    const vibratoDepth = context.createGain();
    reed.type = "sawtooth";
    reed.frequency.setValueAtTime(frequency, start);
    body.type = "triangle";
    body.frequency.setValueAtTime(frequency, start);
    reedBand.type = "bandpass";
    reedBand.frequency.setValueAtTime(920, start);
    reedBand.Q.setValueAtTime(.72, start);
    warmth.type = "lowpass";
    warmth.frequency.setValueAtTime(1750, start);
    warmth.Q.setValueAtTime(.18, start);
    mix.gain.setValueAtTime(.58, start);
    vibrato.type = "sine";
    vibrato.frequency.setValueAtTime(5.1, start);
    vibratoDepth.gain.setValueAtTime(.32, start);
    vibrato.connect(vibratoDepth);
    vibratoDepth.connect(reed.frequency);
    vibratoDepth.connect(body.frequency);
    makeEnvelope(gain, start, duration, peak, .075, .13);
    reed.connect(reedBand);
    body.connect(reedBand);
    reedBand.connect(warmth);
    warmth.connect(mix);
    mix.connect(gain);
    gain.connect(destination);
    reed.start(start);
    body.start(start);
    vibrato.start(start);
    reed.stop(start + duration + .04);
    body.stop(start + duration + .04);
    vibrato.stop(start + duration + .04);
}

function scheduleStrings(destination, frequency, start, duration, pan) {
    const filter = context.createBiquadFilter();
    const gain = context.createGain();
    const stereo = context.createStereoPanner();
    filter.type = "lowpass";
    filter.frequency.setValueAtTime(720, start);
    filter.Q.setValueAtTime(.25, start);
    makeEnvelope(gain, start, duration, .013, .35, .3);
    stereo.pan.setValueAtTime(pan, start);
    filter.connect(gain);
    gain.connect(stereo);
    stereo.connect(destination);
    [-5,5].forEach(detune => {
        const voice = context.createOscillator();
        voice.type = "sawtooth";
        voice.frequency.setValueAtTime(frequency, start);
        voice.detune.setValueAtTime(detune, start);
        voice.connect(filter);
        voice.start(start);
        voice.stop(start + duration + .04);
    });
}

function scheduleCello(destination, frequency, start, duration) {
    const lowTone = context.createOscillator();
    const bodyTone = context.createOscillator();
    const filter = context.createBiquadFilter();
    const gain = context.createGain();
    lowTone.type = "sine";
    lowTone.frequency.setValueAtTime(frequency / 2, start);
    bodyTone.type = "triangle";
    bodyTone.frequency.setValueAtTime(frequency, start);
    filter.type = "lowpass";
    filter.frequency.setValueAtTime(520, start);
    filter.Q.setValueAtTime(.22, start);
    makeEnvelope(gain, start, duration, .017, .32, .38);
    lowTone.connect(filter);
    bodyTone.connect(filter);
    filter.connect(gain);
    gain.connect(destination);
    lowTone.start(start);
    bodyTone.start(start);
    lowTone.stop(start + duration + .04);
    bodyTone.stop(start + duration + .04);
}

function scheduleHighStrings(destination, frequency, start, duration) {
    const filter = context.createBiquadFilter();
    const gain = context.createGain();
    const stereo = context.createStereoPanner();
    filter.type = "lowpass";
    filter.frequency.setValueAtTime(1850, start);
    filter.Q.setValueAtTime(.2, start);
    makeEnvelope(gain, start, duration, .009, .42, .38);
    stereo.pan.setValueAtTime(.2, start);
    filter.connect(gain);
    gain.connect(stereo);
    stereo.connect(destination);
    [-4, 4].forEach(detune => {
        const voice = context.createOscillator();
        voice.type = "triangle";
        voice.frequency.setValueAtTime(frequency, start);
        voice.detune.setValueAtTime(detune, start);
        voice.connect(filter);
        voice.start(start);
        voice.stop(start + duration + .04);
    });
}

function scheduleSoftStrum(destination, chord, start) {
    chord.forEach((frequency, index) => {
        scheduleMusicVoice(destination, frequency, start + index * .025, .72, .016, {
            wave: "triangle",
            cutoff: 780,
            attack: .035,
            release: .55
        });
    });
}

function scheduleWarmPluck(destination, frequency, start, peak, pan) {
    const body = context.createOscillator();
    const upperPartial = context.createOscillator();
    const filter = context.createBiquadFilter();
    const gain = context.createGain();
    const stereo = context.createStereoPanner();
    body.type = "sine";
    body.frequency.setValueAtTime(frequency, start);
    upperPartial.type = "triangle";
    upperPartial.frequency.setValueAtTime(frequency * 2, start);
    filter.type = "lowpass";
    filter.frequency.setValueAtTime(1250, start);
    filter.frequency.exponentialRampToValueAtTime(760, start + .38);
    filter.Q.setValueAtTime(.3, start);
    makeEnvelope(gain, start, .68, peak, .025, .42);
    stereo.pan.setValueAtTime(pan, start);
    body.connect(filter);
    upperPartial.connect(filter);
    filter.connect(gain);
    gain.connect(stereo);
    stereo.connect(destination);
    body.start(start);
    upperPartial.start(start);
    body.stop(start + .72);
    upperPartial.stop(start + .72);
}

function scheduleAhead() {
    if (!musicGain || !musicStarted || !context) return;
    const elapsed = context.currentTime - musicOrigin;
    const currentStep = Math.max(0, Math.floor(elapsed / stepSeconds));
    if (currentStep - nextStep > stepsPerLoop * 2) nextStep = currentStep;
    while (nextStep * stepSeconds - elapsed < .2) {
        const step = nextStep % stepsPerLoop;
        const start = musicOrigin + nextStep * stepSeconds;
        if (step % 8 === 0) {
            const chord = chords[Math.floor(step / 8)];
            chord.forEach((frequency, index) => scheduleMusicVoice(
                musicGain, frequency, start, 1.92, index === 0 ? .031 : .023,
                { wave: "sine", cutoff: index === 0 ? 480 : 950, attack: .22, release: .35 }
            ));
            chord.slice(1).forEach((frequency, index) => scheduleStrings(
                musicGain, frequency, start, 1.92, (index - 1) * .28
            ));
            scheduleCello(musicGain, chord[0], start, 1.92);
            scheduleHighStrings(musicGain, chord[3] * 2, start, 1.92);
            scheduleWarmPluck(musicGain, chord[0], start, .028, -.16);
        }
        if (step % 8 === 4) {
            const chord = chords[Math.floor(step / 8)];
            scheduleWarmPluck(musicGain, chord[2], start, .023, .16);
        }
        if (step % 4 === 0) scheduleSoftStrum(musicGain, chords[Math.floor(step / 8)], start);
        const note = melody.find(([at]) => at === step);
        if (note) {
            // Let the sax carry alternating notes while the flute answers in
            // the gaps. This keeps their tones distinct instead of stacking.
            if (step % 4 === 0) scheduleSaxophone(musicGain, note[1], start, .44, .052);
            else scheduleFlute(musicGain, note[1], start, .44, .029);
        }
        nextStep++;
    }
}

function musicLevel() {
    return Math.max(.0001, Math.min(1.4, musicVolume * 1.4 * focusMusicLevel));
}

function setFocusMode(mode = "normal") {
    focusMusicLevel = mode === "focus" ? 0 : mode === "reading" ? .28 : 1;
    if (musicGain && context) {
        const now = context.currentTime;
        musicGain.gain.cancelScheduledValues(now);
        musicGain.gain.setTargetAtTime(musicLevel(), now, mode === "normal" ? 1 : .38);
    }
}

function isMusicPlaying() {
    return Boolean(musicStarted && context?.state === "running");
}

function stopMusic() {
    if (musicTimer) {
        clearInterval(musicTimer);
        musicTimer = null;
    }
    if (!musicGain) {
        musicStarted = false;
        return;
    }
    const previous = musicGain;
    musicGain = null;
    musicStarted = false;
    try {
        const now = context?.currentTime || 0;
        previous.gain.cancelScheduledValues(now);
        previous.gain.setTargetAtTime(.0001, now, .12);
        window.setTimeout(() => { try { previous.disconnect(); } catch {} }, 900);
    } catch {
        try { previous.disconnect(); } catch {}
    }
}

function startMusic() {
    if (!musicEnabled) return Promise.resolve(false);
    if (musicStarted && context?.state === "running") return Promise.resolve(true);
    const audio = getContext();
    if (!audio) return Promise.resolve(false);
    const resumed = audio.state === "suspended" ? audio.resume() : Promise.resolve();
    return resumed.then(() => {
        if (!musicEnabled || audio.state !== "running") return false;
        if (musicStarted) return true;
        musicStarted = true;
        musicGain = audio.createGain();
        musicGain.gain.setValueAtTime(.0001, audio.currentTime);
        musicGain.gain.setTargetAtTime(musicLevel(), audio.currentTime, .75);
        musicGain.connect(audio.destination);
        musicOrigin = audio.currentTime + .08;
        nextStep = 0;
        scheduleAhead();
        musicTimer = window.setInterval(scheduleAhead, 50);
        return true;
    }).catch(() => false);
}

function setMusicEnabled(enabled) {
    musicEnabled = Boolean(enabled);
    try { localStorage.setItem(MUSIC_ENABLED_KEY, musicEnabled ? "on" : "off"); } catch {}
    return musicEnabled ? startMusic() : (stopMusic(), Promise.resolve(false));
}

function setMusicVolume(value) {
    musicVolume = Math.min(1, Math.max(0, Number(value) || 0));
    try { localStorage.setItem(MUSIC_VOLUME_KEY, String(Math.round(musicVolume * 100))); } catch {}
    if (musicGain && context) {
        const now = context.currentTime;
        musicGain.gain.cancelScheduledValues(now);
        musicGain.gain.setTargetAtTime(musicLevel(), now, .08);
    }
}

function playTone(audio, frequency, endFrequency, duration, volume, type, delay = 0) {
    if (volume <= 0) return;
    const start = audio.currentTime + delay;
    const oscillator = audio.createOscillator();
    const gain = audio.createGain();
    oscillator.type = type;
    oscillator.frequency.setValueAtTime(frequency, start);
    oscillator.frequency.exponentialRampToValueAtTime(endFrequency, start + duration);
    gain.gain.setValueAtTime(.0001, start);
    gain.gain.exponentialRampToValueAtTime(volume, start + .008);
    gain.gain.exponentialRampToValueAtTime(.0001, start + duration);
    oscillator.connect(gain);
    gain.connect(audio.destination);
    oscillator.start(start);
    oscillator.stop(start + duration + .012);
}

function playSound(kind, volume = 1, force = false) {
    let effectsEnabled = true;
    try { effectsEnabled = localStorage.getItem(SOUND_ENABLED_KEY) !== "off"; } catch {}
    if ((!effectsEnabled && !force) || volume <= 0) return;
    const audio = getContext();
    if (!audio) return;
    const level = Math.min(1, Math.max(0, Number(volume) || 0));
    if (kind === "hover") {
        playTone(audio, 620, 740, .055, .07 * level, "sine");
    } else if (kind === "toggle") {
        playTone(audio, 650, 820, .085, .11 * level, "triangle");
        playTone(audio, 850, 1060, .105, .085 * level, "sine", .055);
    } else if (kind === "correct") {
        playTone(audio, 659, 784, .09, .075 * level, "sine");
        playTone(audio, 784, 988, .12, .07 * level, "sine", .075);
    } else if (kind === "challenge-start") {
        playTone(audio, 196, 261.63, .2, .075 * level, "triangle");
        playTone(audio, 392, 523.25, .2, .09 * level, "triangle", .1);
        playTone(audio, 523.25, 659.25, .26, .085 * level, "sine", .2);
    } else if (kind === "chapter-complete") {
        playTone(audio, 523.25, 659.25, .17, .075 * level, "triangle");
        playTone(audio, 659.25, 783.99, .17, .08 * level, "triangle", .12);
        playTone(audio, 783.99, 1046.5, .24, .085 * level, "sine", .24);
        playTone(audio, 523.25, 523.25, .36, .045 * level, "sine", .34);
        playTone(audio, 659.25, 659.25, .36, .045 * level, "sine", .34);
        playTone(audio, 783.99, 783.99, .36, .045 * level, "sine", .34);
    } else if (kind === "needs-practice") {
        playTone(audio, 523.25, 493.88, .2, .055 * level, "sine");
        playTone(audio, 659.25, 587.33, .24, .05 * level, "triangle", .13);
    } else if (kind === "artifact") {
        playTone(audio, 784, 1046, .16, .105 * level, "sine");
        playTone(audio, 988, 1318, .19, .095 * level, "sine", .09);
        playTone(audio, 1318, 1760, .28, .085 * level, "sine", .18);
        playTone(audio, 587, 659, .32, .045 * level, "triangle", .12);
    } else if (kind === "mission") {
        playTone(audio, 392, 523, .15, .075 * level, "triangle");
        playTone(audio, 523, 659, .15, .085 * level, "triangle", .12);
        playTone(audio, 659, 784, .2, .095 * level, "triangle", .24);
        playTone(audio, 523, 523, .34, .065 * level, "sine", .28);
        playTone(audio, 659, 659, .34, .065 * level, "sine", .28);
        playTone(audio, 784, 784, .4, .07 * level, "sine", .28);
    } else {
        playTone(audio, 520, 690, .09, .12 * level, "triangle");
        playTone(audio, 780, 930, .105, .09 * level, "sine", .04);
    }
}

window.LakbayStudentAudio = {
    start: startMusic,
    stop: stopMusic,
    setEnabled: setMusicEnabled,
    setVolume: setMusicVolume,
    setFocusMode,
    isPlaying: isMusicPlaying,
    playSound
};

window.addEventListener("pagehide", stopMusic);
document.addEventListener("visibilitychange", () => {
    if (!document.hidden && musicEnabled && musicStarted && context?.state === "suspended") {
        context.resume().catch(() => {});
    }
});
