# Local-only publication authority experiment

No production entry or account/IAM configuration. Tests require the existing demo
Auth/Firestore emulators. Accepted Stage 0 and prior prototypes are unchanged.

The authority owns a separate hash-chained, fsynced journal and publication
approval capability. Content writers (including application admins) have only
Firebase Auth credentials, not server/Admin credentials or authority access.
Existing unchanged client rules deny direct legacy/head/pack writes.

Publication freezes new grading, drains active store transactions, validates the
full previous legacy source, and writes changed legacy rows, compact packs and a
signed higher-generation head in one Firestore transaction. A prepare/commit
journal protocol makes the database/journal gap fail closed. Recovery audits
source data and reconciles pending publication before reopening. Rollback always
advances generation. Unfinished attempts bind to one generation; historical
receipts remain recoverable without awarding again.

The store checks current head digest/generation against the authority's checkpoint
on every grading transaction, including receipt replay. Copying an older signed
head into Firestore cannot lower this independently held checkpoint.

This is a **local protocol/capability model**. Bootstrap colocates the trusted
operator fixture, signer and grading components in one Node process, with a
workspace journal. It does not establish OS isolation, protected remote storage,
distributed leases or a free hosted coordinator. Signing keys and approval
secrets are ephemeral and never persisted. `.local-state` contains test metadata,
not production keys; it is excluded from source packaging.

Raw Admin legacy writers, project owners, host/code execution and journal rollback
are outside the content-writer threat model. A raw Admin source edit can bypass
client rules; audits detect it at publication/recovery, not continuously during
grading. Hosted content roles must have no such credentials. If that condition
cannot be enforced, this experiment remains NO-GO.
