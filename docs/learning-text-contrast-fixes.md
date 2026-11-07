# Learning text contrast fixes

Updated 6 November 2026. Local changes only.

Added a final, page-scoped learning-contrast.css stylesheet to story.html and chapter-challenge.html. Legacy light-theme text was surviving inside dark question/review/interaction surfaces; paper sections could inherit pale text. The stylesheet pairs navy panels with warm off-white text, secondary labels with pale blue-gray, gold headings with dark panels, and brown paper with dark brown ink.

Covered surfaces include challenge question/options, matching labels/selects, evidence cards, trade instructions/counts, correct/incorrect review answers and explanations; mission reading text, worked examples, discoveries, key terms, historical insights and check/decision feedback. Submitted answer text stays opaque and readable while controls remain disabled. Color remains supplementary to existing textual correct/incorrect states.

## Validation

learning-text-contrast-browser.cjs loads the actual local stylesheet order from both HTML pages and checks computed foreground/background pairs at 390px and 1280px. It covers normal and paper-reading lesson modes. All 108 representative checks meet 4.5:1. Before the final review-row correction, the sampled pale-pink answer row measured approximately 1.02:1.

This is representative computed-color validation, not an exhaustive screenshot audit. It composites solid/transparent ancestor backgrounds; it does not certify every gradient/image, focus state, browser-native menu or runtime-generated passage.

Existing chapter-challenge-browser.cjs and evidence-challenge-browser.cjs fail their Continue navigation assertion. Those fixtures strip page stylesheet links and do not load the new contrast stylesheet, so they do not validate this patch's colors; their navigation timing/fixture issue remains a separate follow-up. No gameplay JavaScript or navigation behavior was changed for this contrast fix.

No content, grading, reward, schema or rules changes. The live site has not been updated in this pass.
