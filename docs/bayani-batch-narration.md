# Automatic Bayani lesson narration

The generator reads lesson text, sends each unique passage to ElevenLabs using your saved voice, saves the returned MP3 and connects it to Listen. No manual lesson prompts are needed. Credentials stay in your terminal process; the website receives only lesson text and audio paths.

## 1. Get your saved voice and API key

In ElevenLabs, go to **My Voices**, find your saved Bayani voice, open its three-dot menu and choose **Copy voice ID**. See the [official voice ID instructions](https://elevenlabs.io/docs/help-center/technical/how-do-i-find-the-voice-id-of-my-voices-via-the-website-and-api).

Open **Developers → API Keys** and create a key with text-to-speech access. See the [official API-key instructions](https://elevenlabs.io/docs/help-center/technical/how-do-i-authorize-myself-using-an-api-key). Use your own account's available generation credits. Do not paste the key into this chat, a project file or browser JavaScript.

## 2. Enter them once in the VS Code PowerShell terminal

Run from `C:\LakbayPanahon`:

```powershell
$env:ELEVENLABS_VOICE_ID = Read-Host 'Paste your saved Bayani Voice ID'
$bayaniKeyInput = Read-Host 'Paste your ElevenLabs API key (hidden)' -AsSecureString
$env:ELEVENLABS_API_KEY = [System.Net.NetworkCredential]::new('', $bayaniKeyInput).Password
```

The key is hidden during entry. These commands put it in this terminal's environment, not in the website or PowerShell command history as a literal key. Close the terminal when finished, or clear it with:

```powershell
Remove-Item Env:ELEVENLABS_API_KEY -ErrorAction SilentlyContinue
Remove-Variable bayaniKeyInput -ErrorAction SilentlyContinue
```

The generator uses `eleven_multilingual_v2` by default. If the saved voice requires another model, set `ELEVENLABS_MODEL_ID` to its supported model ID before generation. Use the same voice/model as the sample you liked. This generator does not redesign or clone a voice from the saved MP3.

## 3. Generate the playground first

This plan is free of ElevenLabs generation requests:

```powershell
node tools/generate-lesson-audio.cjs --preview --plan
```

The current preview contains 35 unique spoken segments, totaling 2,664 characters. The generator speaks them as a sequence, so changing the order of a care activity does not require generating every possible ordering.

Generate the preview using your account credits:

```powershell
node tools/generate-lesson-audio.cjs --preview --generate --limit 100 --max-characters 5000
```

Refresh `pages/story-playground.html`, then click Listen. Once all segments have been generated, preview narration uses Bayani's generated voice. Until a passage is available, the player falls back to device speech. Check pronunciation and delivery before generating the larger mission batch.

## 4. Generate the current real mission readings

The existing Firebase CLI login reads authored `storyScenes` from the configured project. No learner data is requested or modified. If the terminal is not logged in, run `firebase login` first.

```powershell
node tools/generate-lesson-audio.cjs --source firestore --preview --plan
```

The read-only plan on 31 October 2026 found **388 active scenes, 1,294 unique passages and 354,679 characters**, including the preview. That is a text count, not an exact credit quotation; check your provider account's credits and selected model. The plan is saved in `build/bayani-narration/plan.json`.

For a small first mission batch:

```powershell
node tools/generate-lesson-audio.cjs --source firestore --mission prologue-mission3 --generate --limit 100 --max-characters 20000
```

For the whole current scope, after checking the plan and available credits:

```powershell
node tools/generate-lesson-audio.cjs --source firestore --preview --generate --limit 2000 --max-characters 400000
```

The limits cap new requests and text sent during that run. Existing complete files do not consume new requests. A run can take time because generation is sequential. Each successful new recording is checkpointed, and rerunning resumes from cached files. On a failed or timed-out request, check ElevenLabs' request history before retrying: the provider may have processed a request even if its response was interrupted. The script does not automatically retry uncertain requests.

## Behavior and files

- The reading text splitter is shared with the browser, so generated passages match the actual displayed reading parts. It preserves authored sentences.
- Scope: the real missions' existing Listen reading passages, including full-reading mode, plus the playground's narration. It does not add narration to quiz pages or silently narrate every secondary panel.
- Voice/model and passage text determine the cache filename. Changed text gets a new recording; unchanged text reuses its audio. Choosing a different voice/model produces a different cache profile. Existing cached audio is not deleted.
- MP3 files: `assets/audio/bayani/generated/`.
- Public playback manifest: `js/bayani-generated-clips.js`; automatically loaded by the mission and preview pages.
- Generation metadata: `data/bayani-generated-clips.json`. It contains text, local paths and a non-secret cache-profile hash; no API key.
- Offline source alternative: `--source exported-scenes.json`, with an array of `{id, missionId, status:'active', content}` or an object containing a `scenes` array.
- No generated audio is published to Hosting automatically. The local Live Server preview can use it as soon as generation finishes.

Implementation follows the official [text-to-speech endpoint](https://elevenlabs.io/docs/api-reference/text-to-speech/convert). Live paid generation has not been run in this session because no ElevenLabs credentials were supplied. Tests cover cache reuse, request/character caps, failure behavior, exact text selection, queued playback and the browser lesson flow.

## If ElevenLabs rejects the request

The generator now prints the provider's error status, message and request ID when supplied. API key values are redacted. An HTTP 400 by itself does not identify the cause: use its detailed reason rather than guessing a different model or buying more credits.

In the same terminal where you entered the key and voice ID, run this read-only check:

```powershell
node tools/generate-lesson-audio.cjs --check
```

It requests only voice and model metadata; it does not generate audio or read Firestore. The key may need voice/model read permissions for this diagnostic. A metadata permission error does not, by itself, establish that text-to-speech access is denied.

The output lists the configured model, whether it is a speech model, and any recommended base models reported by the voice. A recommendation is not an exhaustive compatibility guarantee. If the model is unavailable or not a speech model, set `ELEVENLABS_MODEL_ID` to a speech model supported by that saved voice. Otherwise, use the provider's detailed status to resolve voice access, account or request issues. See the official [error guide](https://elevenlabs.io/docs/eleven-api/resources/errors).

If the metadata check succeeds, a one-new-clip attempt will show any speech-specific rejection:

```powershell
node tools/generate-lesson-audio.cjs --preview --generate --limit 1 --max-characters 5000
```

This command does generate audio if accepted and uses account credits. Completed cached files are reused. No automatic model switch or failed-request retry is performed.
