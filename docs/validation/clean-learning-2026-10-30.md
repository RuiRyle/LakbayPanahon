# Clear teaching and clean lesson layout

## Teaching changes

The archaeology practice preview now explicitly teaches context before practice. It states the learning goal, defines the term in plain language and gives a photograph/field-note worked example. Each evidence note explains what it says and why it matters. The care activity explains the purpose of preserving the setting before asking children to order the actions. Answer feedback addresses the specific misconception. Lesson notes can be reopened while answering. The takeaway offers a separate new-situation question, with explanatory feedback, rather than claiming that opening clues proves mastery.

The actual mission player uses its authored mission goal, scene explanation, worked example and vocabulary. These appear before practice when authored. Scene discoveries, terms and insights are kept in the same understanding activity instead of separate small pages. All mission goals remain available under a disclosure and in the existing completion recap. Questions include an optional review of the authored scene notes. Long authored paragraphs are split at sentence boundaries for short reading steps; no sentences are summarized or removed. Maps and illustrations have an accessible larger-view dialog with a close button and keyboard focus restoration.

No Firestore curriculum was rewritten or published. The quality of individual authored lesson questions still depends on their content. This change improves the presentation and strengthens the local archaeology example; it does not establish Grade 5 comprehension or replace teacher review.

## Layout

`pages/story-playground.html` was rebuilt with a single lesson card and one stylesheet, `css/learning-clean.css`. The old stacked preview stylesheets and sidebar layout are no longer loaded there. There is one task heading, compact progress, a Listen control, activity content, a small Bayani tip and Back/Continue. Notes, voice settings and restart are secondary disclosures below the lesson. The actual mission loads the same stylesheet's scoped rules over its existing authenticated layout.

## Validation

- Mission browser checks pass for authored goals and examples, all six archaeology scenes, support-note persistence across scene changes, one-task navigation, required activity gates, lesson completion, saved-state recovery, quiz handoff, narrow layout, image enlargement/close, preserved long-text sentences and hostile-text safety.
- Preview checks pass at 1440 and 600 pixels for learning goals, worked example, clue explanations, ordering, answer feedback, transfer question, restart, journal and reading controls. Screenshots were inspected at both widths.
- Syntax checks pass for the modified story scripts. Three narrator fallback/preference tests pass with `node --test --test-isolation=none tests/adventure-voice.test.cjs`.
- Local fixture screenshots are in `build/learning-clean-review` and `build/story-playground-review`. No signed-in live Firebase walkthrough or child usability session was performed for this revision.
