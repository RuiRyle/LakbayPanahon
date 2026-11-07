# Clue Quest mission integration

The existing `pages/story.html?chapter=…&mission=…` player now uses a navy, teal and gold game presentation, Bayani, and navigation generated from the actual visible scene activities. Open it through Explore Chapters → a chapter → a mission → its story lesson. The standalone playground remains a practice preview.

`mission-quest.js` receives presentation events from the existing requirement calculation in `story.js`. It does not award XP, grade answers, change authored text, write progress, or replace quiz routing. Navigation scrolls to real activities; it does not mark them complete. Existing short reading steps and narration remain available. The interface supports clues, decisions, clue hunts, exchange, route and exhibit panels where authored. No additional curriculum or new game mechanics were authored in this pass.

The shared SVG mascot waves briefly and blinks for a limited time. The mission has a static-image pause control, a brief scene-ready celebration, and reduced-motion support. Bayani is a fictional tarsier guide, not historical evidence.

Validation:
- `node tests/story-browser.cjs`: passed existing progression, completion, recovery, quiz gating, narrow layout and input safety checks, plus mission navigation, requirement-driven tips, mascot pause, and rendering/exploration of all six authored archaeology scenes.
- `node tests/story-playground-browser.cjs`: passed at 1440 and 600 pixels.
- `node --check js/mission-quest.js`: passed.
- The older standalone `archaeology-pilot-browser.cjs` returned RUNNING without completing. Its stripped-module fixture has not been updated to the newer story dependencies. Archaeology presentation checks were added to the current passing story harness instead.

These are local browser fixtures. A signed-in Firebase walkthrough and observation with children were not performed for this change. Topic-specific new games and a one-panel-at-a-time activity redesign remain possible later work; this pass connects the visual concept to the working missions.
