# Teacher feedback-state refinement

Shared request feedback now exposes loading, info, success, error and idle states with consistent visual treatments. Known service connection/quota/permission/session errors describe recovery and avoid automatic retries. Errors provide Reload Workspace, guarded by current busy state and unsaved-edit confirmation. Successful requests clear the recovery controls; account clearing resets prior status.

Teacher desktop/mobile tests pass, including busy feedback, recoverable errors, enabled recovery controls, success-state cleanup, preserved announcement text on a simulated connection failure, hidden internal error detail and enabled refresh afterward. Existing section-level empty/unavailable/read-recovery checks remain passing. Separate teacher-page navigation remains checked. These are local mocked-record tests, with no database or deployment changes.
