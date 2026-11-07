# Original student flow ? 31 October 2026

The user explicitly retired exploration/testing mode. Student startup now always disables the retired flag on localhost and hosted pages, removes its old tab preference and removes any leftover testing bar. It creates no testing controls and adds no testing-bar spacing. Storage failure cannot enable exploration. Existing imports keep their initializer name for compatibility. Defensive legacy preview guards remain for older cached code; no supported student control enables them.

Prerequisites, saved progression, quiz grading, targeted review/practice, rewards, chapter challenges and finale requirements are unchanged. No learning record or unrelated preference is removed. No Firebase write or website deployment occurred.

Verification: 390 checks across 63 suites and all 17 browser fixtures pass. The updated mode checks cover every supported host, stale on/off settings, unavailable storage, leftover banner removal and unrelated-preference preservation. The all-mission synthetic audit still reaches 66 missions and 16 chapter challenges. [Full local evidence](student-original-flow-local-2026-10-31.json). This does not close independent content/learner review or hosted-release acceptance.

The rebuilt package is `build/student-web-QbDl12/public`: 26 pages, 541 files, no missing/rejected references. Every staged file matches the current public source hash. Restart the local launcher on that package if an older package was being served, then reload the page.
