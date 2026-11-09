# Local Node HTTP transport follow-up

9 November 2026. **Five focused test groups pass under Node 22.23.4. Public deployment remains unaccepted.** The owner reports that the three-role interaction walkthrough works; that manual acceptance is preserved and was not repeated here.

## Implemented

- `experiments/priority3-netlify/local-http.cjs`: loopback HTTP listener feeding the existing Lambda-compatible callable bridge. Existing demo-only entrypoint guards remain in force. No accepted service file changed.
- `experiments/priority3-netlify/local-http.test.cjs`: real loopback HTTP tests, including actual callable wrappers.
- Experimental README: reproducible test command and explicit limitations.

## Final tests

| Group | Result |
|---|---|
| Callable route/body, repeated query values and duplicate credential evidence | PASS |
| Body over 65,536 bytes rejected before backend invocation | PASS |
| Internal exceptions return a generic error without exception text | PASS |
| OPTIONS forwarding, origin response header and base64 response | PASS |
| Real callable wrappers: all four unsigned operations return UNAUTHENTICATED; duplicate Authorization rejected | PASS |

Final run: 5 passed, 0 failed. Initial Node test-runner subprocess launch hit sandbox `spawn EPERM`; direct execution of the test file worked. An initial raw-header fixture omitted the HTTP Host header, so Node rejected it before reaching the handler; the fixture was corrected and all tests rerun. No application defect was concealed by that correction.

Tests used the existing accepted dependency installation through test-only NODE_PATH. No new install, emulator seed, database mutation, credential generation, account creation, production action or deployment occurred. Actual unsigned requests stop before database operations. This follow-up does not establish signed Auth/App Check acceptance, mutation recovery, Linux packaging or hosted load behavior.

## Credential finding

Paid managed OIDC is not the only technically supported way to authenticate Firebase Admin outside Google. Firebase documents initialization using an exported service-account key in external environments. [Firebase Admin setup](https://firebase.google.com/docs/admin/setup). Therefore the absence of free managed OIDC alone does not prove free hosting impossible.

Google recommends avoiding user-managed keys where feasible because possession permits acting as the service account. [Key-management guidance](https://docs.cloud.google.com/iam/docs/best-practices-for-managing-service-account-keys). A key-based candidate would require a dedicated least-privilege identity, reviewed trusted builds/deployers, server-only secret delivery, no preview inheritance, rotation and revocation procedures. No key should enter this repository, browser package, test output or chat. Exact required permissions and host secret/build isolation remain to be verified; broad Owner/Editor access is not an acceptable shortcut.

This is a design option for review, not an implemented credential path or proof of no-billing Firebase API eligibility. Existing Render availability and outbound-traffic concerns remain documented in [the host assessment](no-billing-node-host-review-2026-11-09.md).

## Next release gate

The next necessary work is a concrete host-and-identity security review, including whether the required APIs and least-privilege permissions work on the intended non-billing Firebase project. Only after that review should a separately approved isolated hosted test use real credentials. A local transport cannot settle account eligibility, actual free quotas, real attestation or cold starts.

Do not remove emulator-only guards, change accepted grading/rewards, substitute browser reward writes or describe this proof as a production release. The current local presentation remains usable while that gate is unresolved.
