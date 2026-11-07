# Story completion screen polish

6 November 2026. Local only; deployment deferred at the user's request.

## Structure

The actual story.html completion section now separates a compact heading, the next learning step, lesson recap and optional discovery activities. Existing element IDs remain stable for the controller and authored modules. The quiz/practice action and retry details controls appear before optional extras. Recap paragraphs, vocabulary and existing optional activities remain accessible without competing with the primary action.

The heading describes reaching the end of a lesson, not earning mission credit or proven understanding. Recap objectives are called Ideas you explored. Topic-review completion updates the heading description explicitly by class rather than relying on the first paragraph after future layout changes.

story-completion.css is a dedicated presentation boundary for this screen, loaded last. Navy/teal surfaces, warm-gold primary action, readable body text, responsive question/pass/XP facts, consistent action spacing and collapsed extras preserve the project's design identity. Mobile facts stack; actions fill the available width. No forced animation, sound or auto-dismissal was introduced.

The existing sequential completion action moves focus to the completion heading. Quiz details failure still disables the quiz action and exposes Retry; topic-review save failures still allow practice with an explicit notice. Lesson completion remains separate from saved quiz/mission completion and rewards.

## Validation

story-browser.cjs passed actual local controller checks for interactive steps, completion, next/previous, recap restoration, quiz detail recovery, topic review, session changes and hostile text/URLs. story-completion-design-browser.cjs uses the actual completion markup with populated quiz/recap fixtures and real stylesheet order at 390px/1280px in normal/paper modes. Its combined challenge/completion run passed 120 text contrast samples and reported no checked layout failures. This representative fixture does not constitute all-content or assistive-technology certification.

No assessment, grading, XP, content publication, database or rules changes.

## Visual refinement - friendly game checkpoint

The heading now includes the existing Bayani explorer illustration with a decorative check badge and concise welcoming text. A single teal next-step card holds quiz/practice details and its primary gold action. Reminder content remains secondary; optional application/detective activities are grouped beneath one collapsed Explore more disclosure. Empty recap/extras containers hide without inventing content.

Added a short 450ms mascot entrance, suppressed by both system and saved reduced-motion preferences. No continuous animation, sound, extra reward claim or focus steal. Kept primary-action loading/disabled/retry behavior. The optional section says activities are at the student's own pace rather than claiming the quiz is ready while its details may still be loading.

Updated actual-markup design fixture passed 128 combined contrast samples and checked layouts, including opened optional activity content and saved reduced-motion suppression. Actual story-controller regression also passed completion, topic review, restored state and error/session cases. Local only; deployment remains deferred.
