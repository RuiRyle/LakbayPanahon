# Practice hint-request evidence

6 November 2026. Local, not deployed.

Each newly completed practice question records questionResults[].hintRequested: true if the in-app AI hint button was requested before answering correctly; false if no such request was recorded for the new question; null for a resumed older draft without tracked evidence. Existing historical result rows without the attribute remain unknown.

The current question's hintRequested value is included in its saved draft and restored after reload. Switching questions resets it; a hint request after answering correctly is ignored. It is recorded before the asynchronous request, so failures or missing responses do not silently become evidence of no request. Requesting a hint does not establish that it was delivered or read.

Session summaries report requested/no-recorded-request/unknown counts separately from firstTryCorrect. First-try scoring and the current review policy remain unchanged. No value proves unaided understanding, because help outside this button, prior exposure, chance and external assistance are not measured. Teacher formal-assessment reports must not infer an independence score from these data. This pass does not add a new teacher report or modify historical results.

No new top-level collection/field or additional write request. Existing practice session writes carry the nested attribute and existing draft writes carry its state. Current rules validate the result list but do not individually enforce this nested flag; it remains browser-reported practice evidence, not trusted backend assessment.

Validation: practice-hint-evidence.test.cjs covers explicit values and historical unknowns. practice-hint-evidence-browser.cjs uses the actual controller to request a hint, restore its draft, complete the session, verify per-question isolation and unchanged first-try scoring. Existing ordinary and first-mission pilot browser regressions passed. No production data or deployment changes.
