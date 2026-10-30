# Seafaring route investigation

The fourth scene of Seafaring and the Balangay now includes a Firestore-authored route activity. Students open the scene clues, compare the boat and travel conditions, choose one of three routes and check their choice. A suitable choice reveals the existing decision area, where students must explain why conditions can change. Revising the route clears that explanation requirement.

The diagram is symbolic, not a geographic map or real-world travel advice. Every route and all relevant conditions are also available as text. Native radio controls support keyboard selection without dragging, color interpretation or geographic map skills. The shortest route is not automatically the suitable one.

`storyScenes/chapter3-mission1-scene4.routeActivity` stores the title, instructions, conditions, map description, route names, descriptions, feedback and suitability. The browser reads Firestore; `data/seafaring-route-investigation.json` is the authoring/migration input. `functions/apply-route-investigation.cjs` defaults to dry run and checks source fields, backs up the scene, applies an update-time-guarded field update and verifies saved content. Existing scene media, help, order and review-topic tags were preserved.

Normal story drafts store the selected route and confirmation in `state.routePlans`. A restored confirmed route is reevaluated against current content. Partial choices, completed route checks and the final explanation restore after refresh. Topic review remains separate from the normal draft and restarts on refresh, as before. Activity changes can reset unfinished lesson drafts through content-version checks; saved mission completions and rewards are untouched.

No XP, hearts or real inventory are spent. The mission quiz remains the reward/completion boundary. The activity uses authored feedback, not generated AI. Independent Grade 5 teacher/student review remains pending.

Verification: 87 non-emulator unit tests pass. Focused Chrome checks passed for clue gating, unsuitable-route feedback, saved selection, required explanation, confirmed refresh and revision; existing story and exchange browser checks also pass. The original Firestore update was backed up and read back. This new route activity has not yet had a complete original-project student walkthrough. Hosting was not deployed.
