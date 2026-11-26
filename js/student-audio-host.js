const SOUND_ENABLED_KEY = "lakbay-ui-sounds";
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
// Standalone adventure theme, played persistently by the Student shell.
const musicStepSeconds=60/104/2;
const musicStepsPerLoop=64;
const musicChords=[
    [98,196,246.94,293.66],
    [130.81,196,261.63,329.63],
    [146.83,220,293.66,369.99],
    [98,196,246.94,392]
];
const musicMelody=[
    [0,392],[4,493.88],[8,587.33],[12,659.25],
    [16,587.33],[20,493.88],[24,440],[28,493.88],
    [32,493.88],[36,587.33],[40,659.25],[44,587.33],
    [48,493.88],[52,587.33],[56,659.25],[60,392]
];
let backgroundMusicStarted=false;
let backgroundMusicGain=null;
let backgroundMusicTimer=null;
let nextMusicStep=0;
let musicEpoch=0;
let backgroundMusicFocusLevel=1;
let transientFocusActive=false;
let narrationFocusActive=false;
const effectTones = new Set();

try {
    musicEnabled = localStorage.getItem(MUSIC_ENABLED_KEY) !== "off";
} catch {}

function getContext() {
    try {
        const AudioContextClass = window.AudioContext || window.webkitAudioContext;
        if (!AudioContextClass) return null;
        if (!context || context.state === "closed") context = new AudioContextClass();
        if (context.state !== "running") context.resume().catch(() => {});
        return context;
    } catch {
        return null;
    }
}

function scheduleMusicVoice(context,destination,frequency,start,duration,peak,options={}){
    const oscillator=context.createOscillator();
    const filter=context.createBiquadFilter();
    const gain=context.createGain();
    oscillator.type=options.wave||'sine';
    oscillator.frequency.setValueAtTime(frequency,start);
    filter.type='lowpass';
    filter.frequency.setValueAtTime(options.cutoff||1400,start);
    filter.Q.setValueAtTime(.35,start);
    const attack=options.attack??.08;
    const release=Math.min(options.release??.18,duration-attack-.01);
    gain.gain.setValueAtTime(.0001,start);
    gain.gain.exponentialRampToValueAtTime(peak,start+attack);
    gain.gain.setValueAtTime(peak,start+duration-release);
    gain.gain.exponentialRampToValueAtTime(.0001,start+duration);
    oscillator.connect(filter);
    filter.connect(gain);
    gain.connect(destination);
    oscillator.start(start);
    oscillator.stop(start+duration+.04);
}
function scheduleFluteNote(context,destination,frequency,start,duration,peak){
    const flute=context.createOscillator();
    const fluteFilter=context.createBiquadFilter();
    const fluteGain=context.createGain();
    const vibrato=context.createOscillator();
    const vibratoDepth=context.createGain();
    flute.type='triangle';
    flute.frequency.setValueAtTime(frequency,start);
    fluteFilter.type='lowpass';
    fluteFilter.frequency.setValueAtTime(1450,start);
    fluteFilter.Q.setValueAtTime(.2,start);
    fluteGain.gain.setValueAtTime(.0001,start);
    fluteGain.gain.exponentialRampToValueAtTime(peak,start+.14);
    fluteGain.gain.setValueAtTime(peak,start+duration-.38);
    fluteGain.gain.exponentialRampToValueAtTime(.0001,start+duration);
    vibrato.type='sine';
    vibrato.frequency.setValueAtTime(4.8,start);
    vibratoDepth.gain.setValueAtTime(.65,start);
    vibrato.connect(vibratoDepth);
    vibratoDepth.connect(flute.frequency);
    flute.connect(fluteFilter);
    fluteFilter.connect(fluteGain);
    fluteGain.connect(destination);
    flute.start(start);
    vibrato.start(start);
    flute.stop(start+duration+.04);
    vibrato.stop(start+duration+.04);
}
function scheduleSaxophoneNote(context,destination,frequency,start,duration,peak){
    const reed=context.createOscillator();
    const body=context.createOscillator();
    const band=context.createBiquadFilter();
    const warmth=context.createBiquadFilter();
    const mix=context.createGain();
    const gain=context.createGain();
    const vibrato=context.createOscillator();
    const vibratoDepth=context.createGain();
    reed.type='sawtooth';
    reed.frequency.setValueAtTime(frequency,start);
    body.type='triangle';
    body.frequency.setValueAtTime(frequency,start);
    band.type='bandpass';
    band.frequency.setValueAtTime(920,start);
    band.Q.setValueAtTime(.72,start);
    warmth.type='lowpass';
    warmth.frequency.setValueAtTime(1750,start);
    warmth.Q.setValueAtTime(.18,start);
    mix.gain.setValueAtTime(.58,start);
    vibrato.type='sine';
    vibrato.frequency.setValueAtTime(5.1,start);
    vibratoDepth.gain.setValueAtTime(.32,start);
    vibrato.connect(vibratoDepth);
    vibratoDepth.connect(reed.frequency);
    vibratoDepth.connect(body.frequency);
    gain.gain.setValueAtTime(.0001,start);
    gain.gain.exponentialRampToValueAtTime(peak,start+.075);
    gain.gain.setValueAtTime(peak,start+duration-.13);
    gain.gain.exponentialRampToValueAtTime(.0001,start+duration);
    reed.connect(band);
    body.connect(band);
    band.connect(warmth);
    warmth.connect(mix);
    mix.connect(gain);
    gain.connect(destination);
    reed.start(start);
    body.start(start);
    vibrato.start(start);
    reed.stop(start+duration+.04);
    body.stop(start+duration+.04);
    vibrato.stop(start+duration+.04);
}
function scheduleStringHarmony(context,destination,frequency,start,duration,peak,pan=0){
    const filter=context.createBiquadFilter();
    const gain=context.createGain();
    const stereo=context.createStereoPanner();
    filter.type='lowpass';
    filter.frequency.setValueAtTime(760,start);
    filter.Q.setValueAtTime(.25,start);
    gain.gain.setValueAtTime(.0001,start);
    gain.gain.exponentialRampToValueAtTime(peak,start+.8);
    gain.gain.setValueAtTime(peak,start+duration-.9);
    gain.gain.exponentialRampToValueAtTime(.0001,start+duration);
    stereo.pan.setValueAtTime(pan,start);
    filter.connect(gain);
    gain.connect(stereo);
    stereo.connect(destination);
    [-5,5].forEach(detune=>{
        const voice=context.createOscillator();
        voice.type='sawtooth';
        voice.frequency.setValueAtTime(frequency,start);
        voice.detune.setValueAtTime(detune,start);
        voice.connect(filter);
        voice.start(start);
        voice.stop(start+duration+.04);
    });
}

function scheduleAhead(){
    if(!musicGain||!musicStarted||!context)return;
    const elapsed=context.currentTime-musicOrigin;
    const currentStep=Math.max(0,Math.floor(elapsed/musicStepSeconds));
    if(currentStep-nextStep>musicStepsPerLoop*2)nextStep=currentStep;
    const horizon=.2;
    while(nextStep*musicStepSeconds-elapsed<horizon){
        const step=nextStep%musicStepsPerLoop;
        const start=Math.max(context.currentTime+.015,context.currentTime+nextStep*musicStepSeconds-elapsed);
        if(step%16===0){
            const chord=musicChords[Math.floor(step/16)];
            chord.forEach((frequency,index)=>scheduleMusicVoice(context,musicGain,frequency,start,5.52,index===0 ? .034 : .026,{wave:'sine',cutoff:index===0?460:900,attack:.8,release:.9}));
            chord.slice(1).forEach((frequency,index)=>scheduleStringHarmony(context,musicGain,frequency,start,5.52,.014,(index-1)*.28));
        }
        const melodyNote=musicMelody.find(note=>note[0]===step);
        if(melodyNote){
            if(step%8===0) scheduleSaxophoneNote(context,musicGain,melodyNote[1],start,1.8,.055);
            else scheduleFluteNote(context,musicGain,melodyNote[1],start,1.8,.034);
        }
        nextStep++;
    }
}

function musicLevel() {
    return Math.max(.0001, Math.min(1.4, musicVolume * 1.4 * focusMusicLevel));
}

function setFocusMode(mode = "normal") {
    narrationFocusActive = mode === "narration";
    if (narrationFocusActive) stopEffects();
    focusMusicLevel = mode === "focus" ? 0 : mode === "narration" ? .08 : mode === "reading" ? .28 : 1;
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
    effectTones.add(oscillator);
    oscillator.onended = () => {
        effectTones.delete(oscillator);
        oscillator.disconnect();
        gain.disconnect();
    };
    oscillator.start(start);
    oscillator.stop(start + duration + .012);
}

function stopEffects() {
    for (const tone of effectTones) {
        try { tone.stop(); } catch {}
    }
    effectTones.clear();
}

function playSound(kind, volume = 1, force = false) {
    let effectsEnabled = true;
    try { effectsEnabled = localStorage.getItem(SOUND_ENABLED_KEY) !== "off"; } catch {}
    if (document.hidden || narrationFocusActive || (!effectsEnabled && !force) || !(volume > 0)) return false;
    const audio = getContext();
    if (!audio || (audio.state !== "running" && window.navigator?.userActivation?.isActive === false)) return false;
    const level = Math.min(1, Math.max(0, Number(volume) || 0));
    if (kind === "activate") {
        playTone(audio, 540, 375, .06, .055 * level, "triangle");
    } else if (kind === "clue-saved") {
        playTone(audio, 587, 587, .13, .048 * level, "sine");
        playTone(audio, 784, 784, .18, .04 * level, "sine", .08);
    } else if (kind === "hover") {
        playTone(audio, 620, 740, .055, .07 * level, "sine");
    } else if (kind === "toggle") {
        playTone(audio, 650, 820, .085, .11 * level, "triangle");
        playTone(audio, 850, 1060, .105, .085 * level, "sine", .055);
    } else if (kind === "correct") {
        playTone(audio, 659, 784, .09, .075 * level, "sine", .045);
        playTone(audio, 784, 988, .12, .07 * level, "sine", .12);
    } else if (kind === "retry") {
        playTone(audio, 440, 415, .15, .06 * level, "sine");
        playTone(audio, 523, 523, .17, .05 * level, "sine", .09);
    } else if (kind === "heart-lost") {
        playTone(audio, 370, 220, .19, .052 * level, "sine", .045);
    } else if (kind === "hearts-depleted") {
        playTone(audio, 392, 392, .19, .06 * level, "sine");
        playTone(audio, 311, 311, .24, .055 * level, "sine", .15);
        playTone(audio, 196, 174, .42, .05 * level, "sine", .33);
    } else if (kind === "countdown-tick") {
        playTone(audio, 790, 495, .052, .055 * level, "triangle");
    } else if (kind === "compass-ready") {
        playTone(audio, 880, 610, .085, .065 * level, "triangle");
        playTone(audio, 1175, 988, .105, .045 * level, "sine", .04);
    } else if (kind === "answer-lock") {
        playTone(audio, 760, 450, .04, .042 * level, "triangle");
    } else if (kind === "seal-stamp") {
        playTone(audio, 175, 75, .09, .064 * level, "triangle");
    } else if (kind === "finale-arrival") {
        playTone(audio, 262, 392, .19, .052 * level, "triangle");
        playTone(audio, 392, 523, .22, .042 * level, "sine", .11);
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
    return true;
}

window.LakbayStudentAudio = {
    start: startMusic,
    stop: stopMusic,
    setEnabled: setMusicEnabled,
    setVolume: setMusicVolume,
    setFocusMode,
    isPlaying: isMusicPlaying,
    unlockEffects() { getContext(); },
    stopEffects,
    playSound
};

window.addEventListener("pagehide", stopMusic);
window.addEventListener("pagehide", stopEffects);
document.addEventListener("visibilitychange", () => {
    if (document.hidden) stopEffects();
    if (!document.hidden && musicEnabled && musicStarted && context?.state === "suspended") {
        context.resume().catch(() => {});
    }
});
