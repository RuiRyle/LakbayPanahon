# Bayani AI discovery interface

Bayani uses the existing navy/gold/cream student theme with a companion emblem, an exploration kit linking to My Journey/chapters/collections, a discovery chat header, distinct student/assistant messages, animated connection/thinking status and a question composer. An empty-state panel is replaced by actual conversation messages. New Chat and session/page-exit clearing are preserved.

This is visual gamification, not a new reward system: no fake levels, XP, collectible rewards, streak pressure or message-count incentives were added. No assistant replies or curriculum data are embedded in the UI. Model instructions and the welcome message remain in Firestore. No AI setting or provider activation was changed for this redesign. The pending minors/data-use review is not resolved by a UI change.

The composer reminds students to avoid personal information; responses still carry an accuracy reminder. Text renders safely, keyboard focus remains visible, and reduced-motion preferences disable animation. A responsive layout is included; physical-phone acceptance remains deferred.

The focused Chrome fixture suite passed connection/retry, text safety, conversation history, failure preservation, duplicate-submit/session/page-exit handling and desktop overflow. The preview uses a mocked unavailable connection, not live AI output.

[Desktop preview](validation/bayani-ai-gamified-preview-2026-10-27.png).
