# Centered illustration viewer and visual polish

The mission and standalone preview share `js/lesson-image-viewer.js`. Clicking a scene image or its View larger control opens the same viewport-centered dialog. The preview illustration is a native button. The mission illustration supports pointer, Enter and Space activation. The viewer supports a Close image button, Escape/cancel, outside-click dismissal, background scroll locking and focus restoration. Images use contain sizing; long captions and small viewports can scroll inside the dialog.

Two causes of off-center rendering were corrected: a reserved root scrollbar gutter and the legacy theme's dialog entrance animation, which replaced the centering transform. The image viewer explicitly opts out of that animation.

The lesson retains a single-column layout. Visual updates include a restrained woven bookmark accent, warmer paper details, clearer active-clue borders, a complete uncropped illustration thumbnail and tactile gold Continue buttons. No historical text, lesson requirements, quiz scoring or progress writes changed.

Validation: mission browser checks pass for direct image clicks, enlarged-image identity, viewport center coordinates within two pixels, close, focus restoration and Escape/cancel, alongside the existing lesson progression checks. Preview browser checks pass at 1440 and 600 pixels, including centered viewer opening, close and outside-click dismissal. JavaScript syntax checks passed. These checks use local fixtures rather than a signed-in live walkthrough.
