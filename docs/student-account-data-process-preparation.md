# Student account-data handling preparation

30 October 2026. The user describes LakbayPanahon as an educational capstone to be treated as a strict application. No operator/school identity, monitored contact, retention period or school/guardian process has been supplied. The Settings help surface stays factual; no account-copy/deletion request form, acknowledgment of receipt or final policy is enabled.

Prepared tool: `functions/student-account-inventory.cjs`. With no arguments it shows the offline collection scope. The explicit `--inspect UID` mode uses the original project's operator login to read only that account's profile presence and owner-filtered collection counts. It does not return names, emails, answers or chat text, export records, inspect Firebase Auth identity or delete anything. This live mode has not been run. Four local ownership/bounds tests pass.

The scope includes existing learner records, class memberships, and optional Bayani/trusted-assessment records. Shared classes, codes, assignments, curriculum and global AI counters are excluded. Collections with more than 500 matching records are marked incomplete; an incomplete inventory must not be represented as a full data copy or deletion plan.

Before enabling actual requests, assign a responsible operator and monitored contact, agree how the account/guardian is verified, define retention/disposal and provider/host handling, and review a safe export/deletion process. Never accept a typed UID or an unverified email alone as authorization to disclose or remove data. Any later tool must operate on verified owner-scoped records, account for Firebase Auth separately, preserve shared class/catalog data, and report partial failures without claiming success.

The [privacy notice draft](drafts/student-privacy-notice.md) remains unpublished. Generating an inventory does not resolve those decisions or establish privacy compliance.

Student registration now describes the test version's account data and asks readers to acknowledge that notice. It no longer claims agreement to nonexistent final Terms or Privacy Policy. This acknowledgment is not guardian consent, verified permission or privacy acceptance. The mocked registration recovery browser check passes; final notices and a responsible request handler remain release requirements.
