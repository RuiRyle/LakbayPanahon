# Learning spacing and text hierarchy

6 November 2026. Local, not deployed.

learning-rhythm.css is loaded last on mission stories and chapter challenges. It defines shared small/regular/large spacing and body typography tokens, keeping layout rules separate from learning-tokens.css palette pairs and learning-contrast.css component color mappings.

Questions have a clear heading size/line height, limited reading width and a consistent gap before options. Answer controls wrap text, keep letter markers from shrinking and provide at least 48-52px intended height. Matching instructions/selects use readable body text. Challenge review explanations no longer use the legacy 13px body size; small uppercase question labels remain secondary.

Mission headings use a compact responsive scale; paragraph lines are limited to 70 characters where possible with 1.8 line height. Worked examples and feedback panels use consistent internal space. Mobile padding reduces while maintaining reading size and answer target size. No DOM order, hidden states, lesson segmentation, animation, gameplay, access or reward behavior changes.

Validation: learning-text-contrast-browser.cjs passed 108 contrast samples and six responsive fixture variants covering 390px/1280px, challenges and normal/paper lessons. Added long question text, page-overflow detection, 16px minimum checks for sampled body text and 44px minimum checks for sampled answer/select controls; no layout failures. This remains representative fixture coverage, not every authored lesson or native select popup.
