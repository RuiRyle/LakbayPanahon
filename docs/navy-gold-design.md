# Navy and gold website theme

The shared `css/navy-gold-theme.css` is loaded after each public, authentication and student page's existing styles. It provides the reference-inspired navy backgrounds, blue surfaces, gold primary actions, green completion states, sun brand mark, focus outlines and responsive navigation. The existing teacher/admin placeholder pages receive basic matching colors; their workflows are not implemented by this redesign. Internal audit and metadata tools retain their existing appearance.

Home now shows four nearby learning chapters beside the next-mission card. Titles, completion and availability come from the dashboard's existing Firestore snapshots through `home-learning-trail.js` and `buildJourneyPath`; the component makes no extra reads. Daily Challenge, Bayani AI, collections and review remain available. Sample names and scores exist only in the local visual fixture.

Validation: seven existing mocked Chrome interaction suites passed with the theme included (journey, class, Bayani, mission, quiz, story and collections). Nineteen focused local checks passed for dashboard recovery/session handling, read scope and the new chapter rows. Local previews were inspected for desktop appearance and narrow-screen overflow; the Home progress card overflow and observed text contrast issues were corrected. This is fixture validation, not a complete accessibility certification or live Firebase acceptance test.

Run `node tests/navy-gold-preview.cjs` for desktop fixtures or add `--mobile` and selected page names. Preview files and screenshots go to the OS temporary directory. The script does not use Firebase. No database migration or Hosting deployment was made. Open the site with Live Server and hard-refresh once to load the new stylesheet.


### Era layout correction

Restricted the Home two-column dashboard grid to `student-home-page`; Explore Chapters and Era Overview previously inherited it, squeezing their content into columns. Unified era cards, discovery lists, progress, chapter states and artwork sizing with the navy theme. Era overview now puts progress before learning goals and the chapter trail.

Validated local Chrome fixtures at desktop and narrow widths for Home, Explore, Era, Journey, Class, Achievements and Profile, plus desktop Mission, Story, Quiz, Practice, Chapter Challenge and Bayani. No horizontal overflow in those fixtures. Era browser regression covers full-width hero, navigation, locks, preview access, progress, retry and sign-out. These are local fixtures, not a live-content acceptance test; no Firestore calls or deployment.


Bayani readability update: full-width conversation, resource links below chat, 16px reply/input text, taller reading area and wider assistant messages. Bold key terms use text nodes and b elements, never reply HTML. Local browser interaction checks passed; narrow-window fixture has no horizontal overflow. User supplied a successful real Bayani reply; independent response accuracy and age-appropriateness review remain open.


### Local accessibility pass ? 29 October

Added focus-visible Skip to main content links and programmatically focusable main landmarks to the 12 student pages with sidebar navigation. Chapter Challenge has no repeated sidebar, so no redundant skip link was added. Hidden narrow-screen sidebars now use visibility:hidden until open, removing offscreen links from keyboard focus.

Desktop fixtures for 13 student screens and narrow fixtures for 12 sidebar screens reported no horizontal overflow or flagged leaf-text contrast issues. All 12 skip links moved native browser focus to their main target. Closed/open sidebar focus was checked in Era and Bayani narrow fixtures. Existing native navigation/back-forward check passed. These fixtures do not certify every live-content, dialog, screen-reader or zoom state; no Firebase reads or writes.
