# Reference proportion correction

9 November 2026. Local CSS-only application refinement responding to the owner's visual-reference correction. The previous five-section behavior is retained.

Changed `css/admin-workspace.css`: desktop sidebar 242px, header 66px, main padding 18/24px, 94px welcome banner, approximately 112px icon/text summary cards, smaller application rows and compact stacked quick actions. Navy gradients, gold priority accents and rounded panels follow the supplied reference. Removed inherited sidebar timeline decoration and corrected shared-selector precedence that initially overrode compact link sizing and clipped the application badge. Desktop Overview's redundant top gap was removed. Tablet/mobile retain readable responsive stacking and mobile action sizes.

Changed `tests/admin-workspace-browser.cjs` only to expect the new approved desktop sidebar width. All **130 existing interaction/security/recovery/layout assertions passed** after the final CSS correction. No handlers, services, permissions, records or learning logic changed in this pass. Accepted Stage 0 validator passed.

Fresh screenshots use the existing passing real-module browser fixture with synthetic mocked Firestore data, at exact 1380/900/390px CDP viewports. They are not new emulator-backed or production screenshots. Desktop panels reach roughly 766px from the viewport top with this bounded fixture; more loaded decision/application content can legitimately extend the page. Do not infer that arbitrary populated records always fit one screen.

- [Desktop Overview](admin-reference-proportions/overview-1380.png)
- [Tablet Overview](admin-reference-proportions/overview-900.png)
- [Mobile Overview](admin-reference-proportions/overview-390.png)
- [Desktop Accounts](admin-reference-proportions/accounts-1380.png)
- [Desktop Records](admin-reference-proportions/records-1380.png)

The screenshot helper initially encountered a temporary destroyed Chrome navigation context; its polling was corrected to tolerate that transition. Screenshot inspection also caught the sidebar selector override, which was fixed and regression-tested. These were not counted as passing before correction.

The reference is followed for layout/proportions and styling, rather than adding unsupported notification/profile dropdown controls, inventing account names or pretending to monitor live services. Existing functionality and all preview records remain accessible. No files/data were deleted to make the page fit. Main Firebase, billing, deployment, accepted Priority 3 artifacts and remote Git branches remain untouched. The owner should inspect the fresh screenshot to approve visual similarity; this report does not substitute automated checks for that preference.
