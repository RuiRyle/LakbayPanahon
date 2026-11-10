# Bayani New Chat discard protection

9 November 2026. Local UI improvement only.

Confirmed usability issue: New Chat discarded typed questions, conversation history and pending replies without confirmation. It now asks before discarding any of those states. Cancelling preserves the draft, history and in-flight reply. Confirming retains the existing generation guard against late replies. Empty chats can still reset without a prompt. Sign-out/account changes still clear private state immediately without a discard prompt.

Files changed: `js/bayani-ai.js`, `tests/bayani-ai-browser.cjs`.

The isolated actual Chrome regression passed with added cancellation checks for both typed text and a pending reply, alongside existing confirmed reset, late-reply rejection, logout isolation, deadline recovery and safe rendering checks. Responses and authentication are mocked; no live AI/Firebase requests are made by the fixture. Existing request/error suite: 6/6 passed. Accepted Stage 0 validator and scoped whitespace check passed.

Native browser confirmation supplies keyboard-accessible accept/cancel controls. No new storage of conversations, educational content, grading, XP, reward, server permission, deployment or billing change. No push was performed.
