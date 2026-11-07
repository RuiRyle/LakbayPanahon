# Explorer UI implementation — 30 October 2026

The local application now shares an expedition visual layer (`css/expedition.css`) across its existing themed pages. Existing Firebase accounts, content, rewards, progression and access rules remain in use.

- Dashboard: the full-width current mission appears before statistics and the lesson list. Its real era name is included; an estimated duration is shown only when the mission has a positive authored `estimatedMinutes` value (up to 180).
- Atlas: three local SVG illustrations provide symbolic island, community and archive destinations. Authored era imagery and prerequisites are preserved. These illustrations are decorative, not historical reconstructions.
- My Journey: the Lakbay Passport derives stamps only from the signed-in student's completed, ready chapters. Dates use Asia/Manila; missing dates stay absent. Stamps link back to the existing chapter mission page. Authentication changes clear the stamp container.
- Story: a paper reading surface can be switched off. The preference is stored on the device and unavailable local storage does not block reading. Period/place metadata appears only when supplied by scene authors (`dateRange`/`period`, `location`/`place`). Existing scene illustrations and evidence interactions remain. Mobile scene actions stay visible within the reading surface.
- Collections: Discovery Museum presentation, expandable artifact learning labels and lesson links. Existing authored learning details take priority; older artifacts get a reflection prompt rather than invented historical facts. Collection dates use Asia/Manila.
- Bayani: consistent guide emblem and editable question starters. A starter never sends automatically; it follows the existing composer's connection/busy state.
- Navigation: consistent inline SVG sidebar icons across student pages. Reduced-motion preferences are respected.
- Teacher: a responsive workspace and classroom guidance replace the authentication placeholder. Assignment management and analytics are explicitly unavailable because the repository has no teacher reporting access path. No sample student data or new permissions were added.

## Sequential design refinements

1. **Time Traveler's Desk:** the current-journey card now includes illustrated map, journal and museum objects. The map points to the selected era; the palette follows its supported `sea`, `forest` or `sand` theme. Loading errors and account changes restore neutral shortcuts. This reuses the dashboard's existing journey load, without fetching collection catalogs.
2. **Era arrival:** a skippable, nonblocking arrival card uses the authored era title and optional date range. Skip moves keyboard focus to the era heading. Reduced-motion users get a static card. Missing periods are not invented.
3. **Inspectable evidence:** authored clue objects are numbered, their buttons control explicitly identified observation panels, and each revealed explanation includes an optional reflection prompt. Reflection does not change completion requirements or grading.
4. **Personal Discovery Wall:** earned artifacts and available journal discoveries offer Pin to My Profile. The wall holds up to three references in browser storage under the current user's key. It rechecks ownership and current catalog content before displaying anything, clears rendered cards on account/page changes, and handles denied storage and unavailable content. Authored artifact icons are preserved. This preference does not synchronize across devices.
5. **Shared illustration family and hierarchy:** map, journal, artifact and stamp illustrations share paper, ink, sea-glass and brass colors. The illustrations are decorative, not historical evidence. Existing authored historical imagery is retained. Secondary actions use quieter treatments around the primary gold action.
6. **Chapter keepsake reveal:** acknowledged passing results connect the passport stamp, a few owned artifacts from this chapter's missions, and the existing validated next destination. Optional artifact reads are scoped to the owner and completed chapter; failure cannot block continuation or change rewards. Updates preserve keyboard focus and do not replay the animation by rebuilding the reveal.

No Firestore collections, student permissions or reward writers were added. `js/explorer-art.js` provides the shared symbolic artwork; `css/expedition.css` owns the additional presentation styles.

## Verification

67 targeted Node tests passed in the final refinement pass, covering pin storage and ownership, chapter keepsake references, journey resolution/access, era prerequisites, evidence journals, home trail, profile behavior and passport ownership/dates. Earlier Bayani connection checks also passed during the initial design pass.

`node tests/expedition-browser.cjs` passes 22 checks across eleven real page templates at 1440px and 390px using isolated local fixtures: landing, student dashboard, journey, chapters, story, collections, Bayani, teacher workspace, era, profile and chapter challenge. It exercises the reading toggle, prompt disabled/ready behavior, passport rendering, artifact details/links, desk theme/links, arrival skipping/focus, clue disclosure/reflection, pin/unpin, stale account-result rejection, completion links, focus retention, heading contrast, SVG navigation and horizontal overflow. Reduced motion is enabled for stable captures. Screenshots and results are written under `build/expedition-review/`.

`node tests/chapter-continuation-browser.cjs` passes the actual challenge module's save retry, reward, scoped continuation, session recovery and optional artifact failure checks. `node tests/story-browser.cjs` passes the actual story module's lesson interaction, previous/next, completion, retry, session recovery and hostile-text/image handling checks.

These browser checks use fixture data, with authentication/network scripts removed. They do not verify a live Firebase session, deployed content or a live AI response. The changes are local and have not been deployed.
