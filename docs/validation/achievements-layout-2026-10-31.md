# Achievements layout and centred exhibits — 31 October 2026

Achievements now puts collection selection and earned keepsakes ahead of the journey-finale promotion. Two consistent collection buttons lead to responsive two-column galleries (one column on phones). Cards use a shared icon/title/description/date structure and grouped actions aligned at the bottom.

Each artifact has **View Exhibit** as its primary action and **Pin to My Profile** as its secondary action. The duplicate inline learning disclosure was removed; its story, learning connection, reflection and collectible context remain in the exhibit views. One gallery-level Discovery Wall link replaces repeated links on every card. Pin storage and ownership, progress, rewards and collection toggle behavior are unchanged.

Exhibits use fixed viewport geometry, explicit auto margins, bounded height, a stable header and view controls, and internal content scrolling. The inherited entrance transform is disabled to keep the dialog centred from its first frame. Opening locks background scrolling; Close/Escape or account change restores it. Closing returns focus to the originating button without moving the page. Switching views leaves the dialog in place.

The new dedicated fixture uses actual page markup, stylesheet order and collection/exhibit renderers with synthetic owned artifacts. At exact 390px and 1440px widths it checks two actions per card, minimum 44px targets, a single wall link, finale ordering, centre geometry after page scrolling and every view change, viewport containment, long text, focus/scroll restoration and account cleanup. All four gallery/exhibit captures pass. Existing collection and discovery fixtures pass too.

Final local regression: **323 checks across 52 suites, zero failures/skips; all 16 browser fixtures passed**. The final focused layout fixture also passed after preview refinements. Latest hash-verified package: `build/student-web-yI4Eub/public`, 26 pages and 537 files, no missing/rejected references. UI changes are local, not a hosted deployment; no Firestore access, content publication or billing changes were needed.

Previews in `build/achievements-layout-review/` use synthetic data, not a real learner's collection. Restart an already running local server with `node tools/serve-student-web.cjs` to select the newest package, then refresh Achievements. The separate Balangay content revision remains unpublished while the existing Firestore quota issue is unresolved.
