# Priority 1 - Voice narration compatibility review

> Publication update, 7 November 2026: the corrected objective-only migration has now been published and verified against live Firestore. See [publication results](priority-1-publication-summary-2026-11-07.md). Unpublished-status notes below describe the earlier review stage.

Reviewed 7 November 2026. No Firestore publication, provider calls, audio regeneration, or Priority 2 work performed.

## Finding: safe to publish the corrected objective-only candidate

The 65 revised learning objectives do not change the text narrated by the main lesson reader. No narration-system change is required. This conclusion concerns narration compatibility and local content alignment; it is not a fresh inspection of deployed Firebase content or a listening/pronunciation certification.

## What the narrator reads

- `js/story.js` renders current scene content as paragraphs in `#storyText`, using `LakbayLessonText.readingParts`.
- `js/story-reading-steps.js:3` binds to that container. Its paragraph list includes only direct P children. At line 31, Listen passes the selected paragraph textContent (or all paragraphs in full-explanation mode) to `LakbayNarrator.play`.
- Objectives appear separately in the Chapter Overview (`js/mission.js:599`), the lesson's goal disclosure (`js/mission-quest.js:53` via `js/story.js:1549`), and the quiz-preparation recap (`js/story.js:1770`). Those lists are outside `#storyText`; the lesson Listen control does not read them.
- Exception: the independent story playground preview has its own scripted goal in `js/story-playground-content.js:27`. That preview can narrate its own goal, but it does not consume the learningObjectives arrays in these 13 missions and is unchanged.

## Live text, scripts and cached audio

The normal reader takes the text currently displayed in the scene paragraphs. `js/adventure-voice.js:19` looks for a local recording whose text exactly matches after whitespace normalization. It does not choose recordings by mission ID or a loose similarity match. If there is no matching recording, or recording playback fails, it uses device speech for the same requested text.

The shipped voice tables are `js/bayani-voice-clips.js` and `js/bayani-generated-clips.js`. The latter corresponds to 47 generated recordings; neither table contains any of the old or revised 65 objective sentences.

`tools/generate-lesson-audio.cjs:11` derives normal lesson recording jobs from active storyScenes.content, not missions.learningObjectives. Its preview mode separately uses the preview script. Generated filenames use a hash of normalized text and voice/model settings. The migration leaves every scene and all 1,793 normal lesson narration segments/cache keys unchanged. Existing audio remains valid; no paid generation is needed.

Instructional content itself has an existing two-minute tab-local cache (`js/content-cache.js:3`). Following any later publication, a student may need Refresh Learning Content or a new read after expiry to see the updated objective lists. That is existing catalog freshness behavior, not a mismatch with spoken scene content.

## Punctuation issue corrected before publication

The prior local authoring process had converted apostrophes and the Manila-Acapulco dash into literal question marks in 19 revised sentences. This was a mistake in the unpublished objective text, not the narrator. Corrected those revised fields to plain ASCII apostrophes/hyphen, regenerated the objective-only migration, and repaired corresponding report punctuation. Original-before text and lesson/source/feedback fields were preserved. Added checks rejecting question marks or replacement characters in revised objective sentences. No existing narration code or audio assets changed.

## Grade 5 review

All 65 objectives use direct action verbs and are 11-22 words long, averaging about 15 words. They describe existing comparisons, model-reading tasks and evidence-based explanations. Historical terms such as tribute, autonomy, Cofradia and babaylan remain because they are the lesson topics; the objectives do not add new historical claims. Their alignment with existing scenes, activity topics and feedback remains covered by the objective regression suite. This is an editorial review, not a classroom comprehension study.

## Tests

Command: `node --test tests/objective-narration-compatibility.test.cjs tests/mission-objective-wording.test.cjs tests/lesson-audio.test.cjs tests/adventure-voice.test.cjs tests/narration-generator.test.cjs`

Result: **28 passed, zero failures**.

New checks compare before/after narration jobs and cache keys, inspect shipped clip text, validate all revised punctuation/action wording, and supply obsolete objective recordings to the actual narrator implementation to verify it falls back to the revised text verbatim rather than playing the old recording. Existing checks cover voice choice, playback cancellation, recording failure, mute/volume behavior, generation caching/limits, objective-only builder changes and unchanged assessment coverage.

Speech/provider behavior was simulated for tests; no listening test, paid API call, live cache invalidation or production database verification was performed.

**Publication status: not published.** Use the regenerated `data/mission-objective-wording-migration.json`, not an earlier copy containing damaged punctuation. Priorities 2-5 remain untouched.
