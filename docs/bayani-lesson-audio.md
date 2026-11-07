# Bayani lesson audio

For all lessons, use the [automatic batch generator](bayani-batch-narration.md). The manual recording instructions below remain available for individual lines.

The mission player and archaeology playground now have separate Narration and Game sounds controls under their existing lesson options. Both have independent volume sliders. Sounds begin only with interaction; there is no automatic spoken greeting or new background music. The mission's existing background music is silenced while narration plays and returns to the page's normal reading level afterward.

## What is available now

- A short paper sound when opening a clue.
- A soft chime for a successful lesson activity.
- A gentle two-note cue for another attempt.
- A quiet note for Back/Continue.
- Device speech using the existing voice selector.

Effects respect the app-wide sound mute and sound-volume preferences. Starting narration stops any lesson effects and suppresses further effects until speech ends. These controls do not change grading, progress or XP.

The saved `assets/audio/bayani/welcome.mp3` is registered for the Try voice sample. It uses the latest greeting script supplied in chat. Other lesson text continues to use a browser/device voice until matching recordings are added. A single recording cannot supply a new voice for arbitrary lesson text.

## Add an original character recording

1. Record a warm, curious young explorer character. Use a clear, unhurried pace with a small smile and natural pauses. Keep Philippine place names distinct. Avoid speeding up or strongly pitching up an adult recording.
2. Start with this sample line, exactly as written:

   “Kumusta, explorer! I'm Bayani. Ready to discover Philippine history? Let's look closely at our first clue. Take your time?we'll figure it out together!”

3. Save the approved recording as `assets/audio/bayani/welcome.mp3`.
4. Register a recording in `js/bayani-voice-clips.js` using this format (the greeting is already registered):

   ```js
   window.LakbayBayaniVoiceClips = [{
       text: "Kumusta, explorer! I'm Bayani. Ready to discover Philippine history? Let's look closely at our first clue. Take your time?we'll figure it out together!",
       src: '../assets/audio/bayani/welcome.mp3'
   }];
   ```

5. Use Try voice to check that recording. Listen for pronunciation, clarity and a comfortable volume before using it in lessons.

Full lesson recordings use the same format: the `text` must match the full narration line. Matching ignores extra whitespace but keeps the actual words and punctuation. A matching recording plays instead of synthesized speech. A missing or failed recording falls back to device speech. An unrelated or externally hosted clip is not selected. When lesson wording changes, update its recording and text together; the player will not reuse a mismatched spoken lesson.

An AI voice service can produce these recordings later, but none is connected by this change. No provider account, billing or deployment was configured.

## Local preferences and checks

The browser stores `lakbay.narration-enabled`, `lakbay.narration-volume`, `lakbay.narrator-voice`, `lakbay.lesson-effects` and `lakbay.lesson-effects-volume`. None contains student progress or goes to Firestore.

Eight focused tests pass for device voice selection, recording matching, fallback, cancellation, mute and suppression of effects during speech. Mission and preview browser checks pass, including independent audio controls and the existing lesson progression. The preview was checked at 1440 and 600 pixels. These are functional tests, not listening or student-comprehension tests.
