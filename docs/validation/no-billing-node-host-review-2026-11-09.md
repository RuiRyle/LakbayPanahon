# No-billing Node host assessment

9 November 2026. Read-only assessment of Render Free against LakbayPanahon's existing Node backend. **Not accepted for public production deployment. A limited hosted demonstration remains conditional and untested.** This does not establish that every free host is unsuitable.

No account, credential, deployment, IAM change, billing activation or production request was made. No application code, educational logic or accepted Priority 3 artifact was changed. The owner's no-billing requirement takes precedence over the earlier conditional Google-managed hosting preference in `docs/managed-backend-decision.md`.

## Findings

| Requirement | Evidence and implication |
|---|---|
| Node runtime | Render supports Express/Node web services. A service must listen on `0.0.0.0` and its assigned port. Runtime compatibility is plausible; this is not a verified callable deployment. [Web services](https://render.com/docs/web-services) |
| Runtime version | Pin the project's tested Node 22 version rather than relying on the host default. [Node version configuration](https://render.com/docs/node-version) |
| Free operation | Free services sleep after 15 idle minutes; waking takes about a minute. They have 750 shared instance hours/month and ephemeral files. Without a payment method, bandwidth/build exhaustion suspends services or builds. Render discourages production use. [Free limitations](https://render.com/docs/free) |
| External Firebase traffic | Render may suspend unusually high outbound database/API traffic; restoring such a service requires paid compute. No numeric threshold is given. This creates an unresolved availability risk for this database-heavy workload. [Traffic policy](https://render.com/docs/free#service-initiated-traffic-threshold) |
| Google runtime identity | Render's managed short-lived OIDC integration supports GCP but requires a Pro workspace or higher. It therefore does not supply the reviewed identity route on Free. Other federation designs have not been evaluated. [Managed OIDC](https://render.com/docs/oidc) |
| Secret storage | Environment variables and secret files are available, but storage alone does not establish safe Firebase permissions, rotation or revocation. A long-lived service-account-key fallback would require a separate credential/security review; none was created. [Secrets](https://render.com/docs/configure-environment-variables) |
| No-card assurance | Documentation describes operation without a payment method, but this assessment did not verify signup or guarantee that this particular account could avoid verification requirements. No signup was attempted. |

## Existing code boundary

`experiments/priority3-netlify/functions/assessment.cjs` deliberately rejects non-demo projects and non-loopback emulator endpoints. Its local callable/Node packaging evidence is useful, but that entrypoint is not a deployable Render service. Do not remove those guards merely to obtain a public URL. A reviewed server entrypoint, real token/App Check validation, least-privilege runtime credentials, origin configuration and hosted recovery/load acceptance would still be required.

The Workers transport failure remains unresolved by this assessment. The accepted assessment core and current local administrator acceptance result remain unchanged.

## Decision and next gate

**Keep the complete local presentation as the dependable no-billing deliverable. Do not label the full public application deployment-ready.** Render is a plausible Node runtime for a limited demonstration, but current evidence does not resolve the free credential path or external-traffic availability risk.

Before any hosted implementation, establish a supported no-billing runtime identity design and an acceptable host traffic policy. Then validate cold-start callable behavior, Auth/App Check, duplicate submissions, interrupted commits and a representative classroom workload in an isolated hosted acceptance environment, subject to explicit hosting approval. Do not weaken server grading or browser write restrictions to bypass this gate.

For the presentation deadline, use the existing local emulator guide and finish the owner's three-role browser walkthrough. Public hosting is a separate unresolved release gate, not a reason to redo the approved dashboard or alter learning logic.

## Validation performed

- Checked official Render runtime, free-tier, identity and secret-management documentation.
- Inspected the existing external Node entrypoint and its demo-only refusal boundary.
- Documentation-only change: no application regression tests were rerun and no hosted test results are claimed.
