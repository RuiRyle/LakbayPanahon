# Teacher follow-up inbox coverage

Implemented locally on 6 November 2026. No schema or permission changes in this refinement.

## Behavior

- Student Progress help and explanation inboxes read 100 records per class-scoped document-ID cursor page, with one extra record to determine whether another page exists.
- Load more requests fetches the next page. There is no fixed total-record ceiling in this inbox. Pending counts and filters apply only to loaded current-member records, and explicitly disclose incomplete coverage. No automatic polling or background full-class scan occurs.
- Another page appends new cards and preserves existing reply elements/drafts. Failed reads keep existing records and the previous cursor; retry is explicit. Refresh confirms discarding unsent text and replaces it only after a successful read.
- Exact dashboard request links use a class-ID plus document-ID query. A selected request beyond the first page can load directly. A later full-page read deduplicates it by ID. Loading that request does not claim the whole inbox has been read.
- The dashboard remains a bounded six-class/100-record snapshot. Open a classroom inbox links lead to Questions or Explanations for the selected class. Other class groups remain accessible through the existing dashboard class paging.
- Existing revision checks, pending-write protection, reply feedback, private access and current-member filtering remain in force. Page completions are ignored after account/class context changes.

## Validation

- 36 mocked Chrome assertions across 390px and 1440px with 205 help records and 105 explanation records: complete cursor traversal, no skipped sentinel, preserved drafts, explicit failed-page retry, later-page private replies, target lookup, duplicate suppression, foreign-class rejection and stale-account results.
- Actual Firebase SDK/local-emulator test created temporary synthetic records, loaded the 105th request, saved its reply, and opened a later explanation directly. All six acceptance checks passed and fixtures were cleaned up.
- Existing dashboard browser checks passed. The broader teacher–student walkthrough is separately recorded in class-teaching-browser-2026-11-06.json.

## Limits

This is a sequence of fresh page reads, not one atomic or live-updating snapshot. Refresh to see changes to already loaded records. Current membership refers to the roster snapshot loaded for the page. Records added with IDs before the current cursor may appear after refreshing. Very large inboxes still require explicit further pages; records are retained in memory while the page is open to preserve drafts.

No production deployment occurred. The earlier activity lifecycle rules/frontend changes still need their coordinated publication; this inbox refinement does not publish them.
