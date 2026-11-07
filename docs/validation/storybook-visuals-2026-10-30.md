# Storybook learning visuals

Shared `css/storybook-learning.css` is loaded after the existing mission and playground styles. It adds warm tan reading and clue surfaces, deep teal activity cards, gold actions, clearer card spacing and a compact Bayani speech bubble. It retains the existing one-activity-at-a-time mission controller. Real mission illustrations remain authored scene illustrations.

The preview's opening illustration is now `assets/story/clue-desk.svg`, an original vector drawing of a fictional investigation kit. It replaces the decorative island. Duplicate island clue controls were removed from the preview script; the clue cards remain the only way to open a clue.

Checks: mission browser regression passes including progression, saved-state recovery, quiz gating and narrow layout. Playground browser checks pass at 1440 and 600 pixels; screenshots at those widths were inspected. JavaScript syntax checks pass. This revision does not change the speech engine: browser voices remain device-dependent. No expressive AI narration or recorded child character voice has been generated or connected.
