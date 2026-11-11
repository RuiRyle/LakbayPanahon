# Render security cutover — 11 November 2026

Published and read back against lakbaypanahon-1797e while securedAssessment.enabled remained false. Rollback rules/public-card state saved under ignored build/render-cutover-review. No student records changed.

31 Rules API synthetic checks pass: canonical student result writes denied, main/chapter/daily answer banks and server private evidence denied, public daily card reads allowed for active students, anonymous/inactive reads denied, public writes denied, policy get allowed. The candidate was derived from current published rules, preserving unrelated live rules. Five public daily cards created from a strict allowlist. These synthetic tests do not certify all teacher/admin/student paths.

23 focused local tests pass across Render HTTP security, client retry/domain configuration, classroom submission and daily projection. Daily browser fixture passed in the earlier preparation.

Before enabling grading: deploy the matching backend with pre-submit answer-key suppression, refresh the matching frontend, review/fix dependency advisories, verify hosted authenticated App Check traffic and IAM, then activate policy for test-account acceptance. Current audit: 6 moderate and 1 low advisory, no high/critical. No automatic npm audit fix/forced dependency upgrade performed. Existing Render instance has not been redeployed by this local command.
