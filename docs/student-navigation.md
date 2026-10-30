# Student navigation polish

Internal links now use normal browser navigation. The previous click interception, page fade-out and 260 ms timer were removed. Dynamic links, modified clicks, fragments, download/target behavior and beforeunload draft warnings remain browser-controlled. Back/Forward restores page appearance without fading it out.

Protected student pages include a neutral loading shell in their initial HTML. Its sidebar/header shapes match the shared app layout, but it contains no student names, progress or activity content. The actual student app/chapter page stays hidden before authorization. During access checks, those application roots are inert; successful authorization reveals and re-enables them. Existing guard errors/retry, role checks and stale-response protection remain in place.

Only newly authorized main content receives a short entrance animation. Reduced-motion preferences disable it. Loading does not bypass Firebase authentication or trust locally cached role flags.

This is still a multi-page website: documents and page modules reload between URLs. A persistent sidebar/header and main-content router would be a separate architectural change requiring page listener/state cleanup.

Verification: focused Chrome checks passed native/modified/dynamic navigation and Back/Forward restoration, loading-shell visibility and protected-root inertness, guard recovery/session checks, lesson interactions/resume, quiz fail/retry/pass, practice recovery and chapter-challenge completion/replay. No deployment or Firestore data change was needed for this update.
