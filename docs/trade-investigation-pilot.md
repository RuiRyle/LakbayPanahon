# Trade and Livelihood investigation pilot

The final scene of the existing Trade and Livelihood mission (`mission-2`, `mission2-scene4`) now offers an exchange investigation instead of only a multiple-choice decision.

## Student flow

1. Explore three clues: our supplies/needs, the visitors' supplies/needs, and the agreement.
2. Collect those facts in an evidence journal. Planning controls become available after all clues are opened.
3. Choose a good and quantity to offer, and a good and quantity to receive.
4. Check the plan. Feedback distinguishes missing choices, stock limits, unsuitable goods, agreement mismatch and unmet needs.
5. Explain why a valid exchange helps both communities through the scene decision.
6. Finish the lesson and take the existing mission quiz. Only the quiz completes the mission and awards its configured XP/artifact.

Students can revise a checked plan. Revision reopens the plan and its explanation requirement. There are no lost hearts, time limits, real inventory changes or XP costs.

The authored example offers 3 baskets of grain for 2 pots, with sufficient stock for either one or two bundles. Both are valid if both needs are met. Quantities are explicitly fictional classroom agreements, not historical market rates or a claim that all trade used fixed prices.

## Firestore and saved progress

`tradeActivity` in the scene stores the title, instructions, inventories, needs, agreement and journal entries. The runtime reads Firestore; `data/trade-investigation-pilot.json` is an authoring/migration input. The migration updates only this scene's specified learning fields, preserves media/order/review tags, checks expected source content, saves a backup and verifies readback.

The story engine stores selected goods, quantities and confirmation state in `state.tradePlans` within the existing owned story draft. Saved plans are checked against the current authored activity before being treated as complete. Ordinary lesson refresh restores partial and confirmed plans. Topic-review mode retains its existing separate behavior: it does not overwrite the normal lesson draft and currently restarts on refresh.

Changing the scene content may reset unfinished Trade and Livelihood lesson drafts through content-version validation. Completed missions/rewards and existing quiz drafts are unaffected.

The activity uses authored help content and does not call a generative AI provider. Teacher review of wording, the arithmetic and the learning task remains pending.

## Verification — 27 October 2026

- Four pure checks cover valid plans, remaining supplies, wrong goods, stock/quantity limits, exchange agreement, unmet needs and invalid/impossible configuration.
- Desktop Chrome checks cover clue gating, evidence journal, invalid plans, partial/confirmed resume, required reflection and revision.
- Existing story browser behavior remains passing.
- An original-project walkthrough registered a temporary learner, supplied only that learner's prerequisite mission completion, completed the real lesson, refreshed a partial exchange, rejected an invalid plan, accepted a valid plan, required the explanation and passed the existing quiz. XP stayed at its starting value until the quiz; the configured mission reward and artifact were then verified.
- Both live test runs removed their temporary accounts, prerequisite fixtures and owned learning records. The first run exposed a test assumption about starting XP; the final run compares against the actual starting value.

Live report: `docs/validation/trade-investigation-live-report-2026-10-27.json`. These are technical checks, not validation with Grade 5 students.
