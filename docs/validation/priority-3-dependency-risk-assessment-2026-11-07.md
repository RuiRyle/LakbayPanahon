# Priority 3 dependency risk assessment — proposed disposition

7 November 2026. Scope: the Node 22 assessment package, Admin 14.5.0, Functions 7.4.0 and lockfile SHA-256 `0eaedbf386bb5cddb70ed00be7403a78c5257130487f1fa25d549f1d2cc0ec38`. No dependencies were changed during this pilot-preparation task. **This assessment is not an approved security exception or production authorization.**

## Findings and exposure

| Package in the flagged branch | Version | Finding / role |
|---|---:|---|
| glob | 10.5.0 | Underlying cancellation-bypass advisory can continue filesystem traversal after cancellation. |
| minimatch | 9.0.9 | Audit metadata flags pattern-amplification denial of service. The maintainer's published example concerns 10.2.6; the registry range is broader, so retain the installed-version warning conservatively. |
| rimraf | 5.0.10 | Pulls in glob/minimatch; inherited finding rather than an independent reward defect. |
| google-gax | 5.0.8 | Declares rimraf in the older Firestore API dependency branch. |
| gaxios | 7.1.3 | Declares rimraf; pinned exactly by the older metadata package. |
| gcp-metadata | 8.1.4 | Inherits the gaxios/rimraf branch. |

These packages are installed with production dependencies. Their optional designation does not make them development-only. The six reported nodes correspond to two underlying advisories. [glob maintainer advisory](https://github.com/isaacs/node-glob/security/advisories/GHSA-3g3m-2fjr-6pw4), [minimatch maintainer advisory](https://github.com/isaacs/minimatch/security/advisories/GHSA-g3hv-75wg-m249).

Required exploit preconditions include executing the relevant glob/minimatch operation with an adverse pattern/cancellation scenario. The reviewed assessment endpoints accept fixed activity identities, issued answer actions and bounded structured answers. They do not accept filesystem paths, module names or glob options and do not call these filesystem utilities.

Static inspection found imports of the affected trio only within that trio's own tree. In the shipped JavaScript of the flagged google-gax/gaxios parents, rimraf was declared in package metadata but not referenced by runtime code. An offline initialization of the actual Admin Firestore object and callable factory loaded 612 modules without loading rimraf, glob or minimatch. That was initialization only, not exhaustive tracing of every SDK feature. See `priority-3-final-dependency-metadata-2026-11-07.json` and `priority-3-final-dependency-reachability-2026-11-07.json`.

**Assessment:** no reachable exploit path was identified through the reviewed endpoints. Potential impact, if a path is introduced or missed, is resource exhaustion/service disruption; this is not evidence of a demonstrated XP forgery or learner-record modification. Likelihood for the reviewed endpoint surface is assessed as low; availability impact remains material. This is a conditional source-based judgment, not a guarantee of non-exploitability.

## Why retain the compatible versions temporarily?

The older chain is `firebase-admin -> @google-cloud/firestore 9.3.1 -> @google-cloud/firestore-api 0.2.0 -> google-gax 5.0.8 / metadata 8.1.4 -> rimraf 5 -> glob 10 -> minimatch 9`.

The registry review found no complete remedy within those parent ranges:

- google-gax's latest matching 5.x is 5.0.8; metadata's latest matching 8.x is 8.1.4 and pins gaxios 7.1.3.
- rimraf's latest allowed 5.x is 5.0.10; glob's latest allowed 10.x is 10.5.0; minimatch's latest allowed 9.x is 9.0.9.
- The compatible Firestore 9.4.0 update still retains Firestore API `^0.2.0`, so it does not remove this chain.
- Firestore API 0.7.1, rimraf 6, glob 14 and minimatch 11 cross current declared ranges. An npm force/override is not evidence of compatibility. The separate newer installed gax/gaxios/metadata branches do not cancel the older installed branch's finding.

Retaining the tested package avoids introducing an unverified SDK/API contract change into reward transactions solely to silence inherited warnings. Existing local transaction, legacy-progress and assessment tests support behavior compatibility; they do not prove vulnerable utility behavior safe. Do not edit vendor files, suppress the finding, omit Firestore's required optional packages or force incompatible versions.

## Mitigations and limits

Existing candidate controls: strict answer/action schema, issued identities, server authorization, private grading records and no filesystem-pattern input. Keep these boundaries. The parser advisories were separately patched before this task and are not part of these six remaining findings.

Planned production App Check, tuned all-endpoint throttling, monitoring and instance limits are **not credited as already deployed mitigations**. App Check still needs repair/attestation. The all-endpoint UID limiter is not implemented; the start counter alone does not bound every request. Instance limits do not remove the dependency or impose a spending cap.

For an approved future pilot, require production attestation/readiness gates, staged 30-student acceptance, availability/rate/quota monitoring and a protected pause/rollback path. Do not expand the code to accept user filesystem patterns or expose package utility endpoints. Review the dependency graph on every release and investigate new reachability before widening the pilot.

## Proposed decision and ownership

Recommendation: either approve a **time-limited exception for the reviewed package only**, ending no later than 7 December 2026, or approve a separate local upstream/compatibility remediation investigation before deployment. No exception has been accepted on the user's behalf. Release owner: the LakbayPanahon project owner; engineering retains the evidence and rechecks upstream availability.

Reassess sooner if a compatible upstream fix appears, severity/reachability changes, a new endpoint uses filesystem utilities, the package graph changes, or abnormal resource use appears. Any exception must record the exact lockfile/manifest hashes, owner, expiration, monitoring and stop condition. It does not waive App Check, billing/IAM, operational-load or production approval gates.
