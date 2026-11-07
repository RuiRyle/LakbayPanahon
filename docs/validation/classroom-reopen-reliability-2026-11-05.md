# Classroom reopen reliability — 2026-11-05

Supersedes the previous animation lock. Closing now removes the panel synchronously. A short 110 ms opening fade runs independently, so the animation cannot prevent a subsequent close/reopen. New animations cancel old ones without being awaited by the interaction.

Classroom-card previews reuse successfully loaded details for up to 30 seconds within the current signed-in page session. Refresh clears the cache, account/page cleanup clears it, and all mutation-triggered openClass calls bypass reuse and replace the entry. Reuse is only requested by classroom card clicks, not teacher reports or write operations. Server rules continue to validate every write. Counts and invitations can reflect the last preview during that 30-second window; Refresh Classes requests current data.

The first detail load checks teacher approval and classroom ownership concurrently. Profile and teacher application checks also run concurrently while preserving the same approval conditions. This reduces sequential network waits without removing permission checks. Subsequent collection reads remain server-validated.

Browser regression now includes two immediate clicks to close and reopen the same card, checking that it opens and completes in under one second on the local fixture. Other coverage retains invitation generation, edit cancellation, mobile layout, cursor behavior and reduced motion. Local preview updated; no production deployment.
