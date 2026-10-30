# Student offline regression — 29 October 2026

Result: 440 tests passed, zero failures/skips. Ran all `tests/*.test.cjs` except `student-security.test.cjs`, using `node --test --test-isolation=none`. The excluded suite requires the Firestore emulator; no emulator or live Firebase tests were run.

Nine local Chrome fixtures also passed:

- Home: next lessons, safe content rendering, review links, challenge, empty and retry states.
- Mission quiz: fail/retry/pass, reward behavior, load recovery and delayed/session responses.
- Story: interactions, navigation, completion, empty/load retry and session races.
- Shared navigation: menu state, keyboard entry/Escape/focus return and native navigation.
- Profile: validation/catalog recovery, failed edits, focus, pending-save dismissal and delayed account response.
- My Class: membership, assignment availability, prerequisites, quota recovery and session isolation.
- My Journey: path, review/resume, error recovery and session handling.
- Collections: exclusive toggles, animation, reduced motion, counts and independent recovery.
- Bayani: mocked connection, question retry, local New Chat and stale/session isolation.

Local release inventory: 20 entry pages, 412 files, zero missing/rejected static references.

Candidate content audit: 66 missions, 388 scenes, 330 quiz topic slots; zero missing local images, structural topic gaps or duplicate/missing-correct scene options after prepared overlays. This candidate includes unpublished drafts and is not a report of current Firestore state.

These results support local integration stability. They do not verify hosted deployment, production security, historical accuracy, real Gemini boundaries or Grade 5 comprehension. No claim is made that every browser fixture or every live state was tested. See the current [student release checklist](../student-release-checklist.md) for remaining work.
