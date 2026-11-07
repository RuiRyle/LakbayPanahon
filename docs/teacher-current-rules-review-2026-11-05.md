# Teacher rules comparison � November 5, 2026

Read-only comparison against the actual currently published rules. Nothing published. Candidate is prepared for review, not yet validated for activation.

## match /teacherApplications/{uid}

Published:
```
    match /teacherApplications/{uid} {
      allow get: if teacherApplicant(uid) || activeAdmin();
      allow list: if activeAdmin();
      function validApplicantData() {
        let data = request.resource.data;
        return teacherApplicant(uid)
          && data.keys().hasOnly(['userId','email','emailVerified','revision','status','updatedAt','legalName','institution','locality','roleTitle','officialWebsite','workEmail','prcNumber','prcExpiresAt','sponsorName','sponsorContact','statement','applicantType','acknowledged','evidenceRevision','evidenceName','evidenceUploadedAt'])
          && data.userId == uid && data.email == request.auth.token.email
          && data.emailVerified == request.auth.token.get('email_verified',false)
          && data.revision is int && data.revision == (resource == null ? 1 : resource.data.revision + 1)
          && data.status in ['draft','submitted'] && data.updatedAt == request.time
          && data.applicantType in ['licensed_teacher','student_teacher','facilitator']
          && data.legalName is string && data.legalName.size() <= 100
          && data.institution is string && data.institution.size() <= 150
          && data.locality is string && data.locality.size() <= 100
          && data.roleTitle is string && data.roleTitle.size() <= 100
          && data.statement is string && data.statement.size() <= 1500
          && data.officialWebsite is string && data.officialWebsite.size() <= 250
          && (data.officialWebsite == '' || data.officialWebsite.matches('^https://[^ ]+$'))
          && data.workEmail is string && data.workEmail.size() <= 150
          && data.sponsorName is string && data.sponsorName.size() <= 100
          && data.sponsorContact is string && data.sponsorContact.size() <= 150
          && data.prcNumber is string && data.prcNumber.size() <= 12
          && (data.prcExpiresAt == null || data.prcExpiresAt is timestamp)
          && data.acknowledged is bool && data.evidenceRevision is int && data.evidenceRevision >= 0
          && ((data.evidenceRevision == 0 && data.evidenceName == '' && data.evidenceUploadedAt == null)
            || (data.evidenceRevision > 0
              && getAfter(/databases/$(database)/documents/teacherEvidence/$(uid)).data.revision == data.evidenceRevision
              && getAfter(/databases/$(database)/documents/teacherEvidence/$(uid)).data.name == data.evidenceName
              && getAfter(/databases/$(database)/documents/teacherEvidence/$(uid)).data.uploadedAt == data.evidenceUploadedAt))
          && (data.status == 'draft' || (data.emailVerified && data.acknowledged
            && data.legalName.size() > 0 && data.institution.size() > 0 && data.locality.size() > 0 && data.roleTitle.size() > 0 && data.statement.size() > 0
            && (data.applicantType == 'licensed_teacher'
              ? data.prcNumber.matches('^[0-9]{4,12}$') && data.prcExpiresAt is timestamp && data.prcExpiresAt >= request.time
              : data.sponsorName.size() > 0 && data.sponsorContact.size() > 0)));
      }
      allow create, update: if validApplicantData();
      allow update: if validTeacherDecision(uid,request.resource.data.reviewId)
        && request.resource.data.diff(resource.data).affectedKeys().hasOnly(['status','decisionReason','reviewId','reviewedAt','reviewedBy','updatedAt','evidenceRevision','evidenceName','evidenceUploadedAt'])
        && request.resource.data.status in ['approved','needs_changes','declined'] && request.resource.data.updatedAt == request.time
        && request.resource.data.evidenceRevision == 0 && request.resource.data.evidenceName == '' && request.resource.data.evidenceUploadedAt == null;
      allow delete: if false;
    }
```

Candidate:
```
    match /teacherApplications/{uid} {
      allow get: if teacherApplicant(uid) || activeAdmin();
      allow list: if activeAdmin();
      function validApplicantData() {
        let data = request.resource.data;
        return teacherApplicant(uid)
          && data.keys().hasOnly(['userId','email','emailVerified','revision','status','updatedAt','legalName','institution','locality','roleTitle','officialWebsite','workEmail','prcNumber','prcExpiresAt','sponsorName','sponsorContact','statement','applicantType','acknowledged','evidenceRevision','evidenceName','evidenceUploadedAt'])
          && data.userId == uid && data.email == request.auth.token.email
          && data.emailVerified == request.auth.token.get('email_verified',false)
          && data.revision is int && data.revision == (resource == null ? 1 : resource.data.revision + 1)
          && data.status in ['draft','submitted'] && data.updatedAt == request.time
          && data.applicantType in ['school_teacher','licensed_teacher','student_teacher','facilitator']
          && data.legalName is string && data.legalName.size() <= 100
          && data.institution is string && data.institution.size() <= 150
          && data.locality is string && data.locality.size() <= 100
          && data.roleTitle is string && data.roleTitle.size() <= 100
          && data.statement is string && data.statement.size() <= 1500
          && data.officialWebsite is string && data.officialWebsite.size() <= 250
          && (data.officialWebsite == '' || data.officialWebsite.matches('^https://[^ ]+$'))
          && data.workEmail is string && data.workEmail.size() <= 150
          && data.sponsorName is string && data.sponsorName.size() <= 100
          && data.sponsorContact is string && data.sponsorContact.size() <= 150
          && data.prcNumber is string && data.prcNumber.size() <= 12
          && (data.prcExpiresAt == null || data.prcExpiresAt is timestamp)
          && data.acknowledged is bool && data.evidenceRevision is int && data.evidenceRevision >= 0
          && ((data.evidenceRevision == 0 && data.evidenceName == '' && data.evidenceUploadedAt == null)
            || (data.evidenceRevision > 0
              && getAfter(/databases/$(database)/documents/teacherEvidence/$(uid)).data.revision == data.evidenceRevision
              && getAfter(/databases/$(database)/documents/teacherEvidence/$(uid)).data.name == data.evidenceName
              && getAfter(/databases/$(database)/documents/teacherEvidence/$(uid)).data.uploadedAt == data.evidenceUploadedAt))
          && (data.status == 'draft' || (data.emailVerified && data.acknowledged
            && data.legalName.size() > 0 && data.institution.size() > 0 && data.roleTitle.size() > 0
            && (data.applicantType == 'school_teacher' || (data.applicantType == 'licensed_teacher'
              ? data.prcNumber.matches('^[0-9]{4,12}$') && data.prcExpiresAt is timestamp && data.prcExpiresAt >= request.time
              : data.sponsorName.size() > 0 && data.sponsorContact.size() > 0))));
      }
      allow create, update: if validApplicantData();
      allow update: if validTeacherDecision(uid,request.resource.data.reviewId)
        && request.resource.data.diff(resource.data).affectedKeys().hasOnly(['status','decisionReason','reviewId','reviewedAt','reviewedBy','updatedAt','evidenceRevision','evidenceName','evidenceUploadedAt'])
        && request.resource.data.status in ['approved','needs_changes','declined'] && request.resource.data.updatedAt == request.time
        && request.resource.data.evidenceRevision == 0 && request.resource.data.evidenceName == '' && request.resource.data.evidenceUploadedAt == null;
      allow delete: if false;
    }
```

## match /teacherApplicationReviews/{eventId}

Published:
```
    match /teacherApplicationReviews/{eventId} {
      allow read: if activeAdmin();
      allow create: if validTeacherDecision(request.resource.data.userId,eventId)
        && request.resource.data.keys().hasOnly(['userId','actorId','revision','applicantType','decision','reason','checks','affiliationReference','credentialReference','createdAt'])
        && request.resource.data.applicantType == get(/databases/$(database)/documents/teacherApplications/$(request.resource.data.userId)).data.applicantType
        && request.resource.data.decision in ['approved','needs_changes','declined']
        && request.resource.data.reason is string && request.resource.data.reason.size() >= 5 && request.resource.data.reason.size() <= 500
        && request.resource.data.checks.keys().hasOnly(['identity','affiliation','prc','endorsement'])
        && request.resource.data.checks.identity is bool && request.resource.data.checks.affiliation is bool && request.resource.data.checks.prc is bool && request.resource.data.checks.endorsement is bool
        && request.resource.data.affiliationReference is string && request.resource.data.affiliationReference.size() <= 500
        && request.resource.data.credentialReference is string && request.resource.data.credentialReference.size() <= 500
        && (request.resource.data.decision != 'approved' || (request.resource.data.checks.identity && request.resource.data.checks.affiliation
          && request.resource.data.affiliationReference.size() >= 5 && request.resource.data.credentialReference.size() >= 5
          && get(/databases/$(database)/documents/teacherApplications/$(request.resource.data.userId)).data.emailVerified == true
          && (request.resource.data.applicantType == 'licensed_teacher'
            ? request.resource.data.checks.prc && get(/databases/$(database)/documents/teacherApplications/$(request.resource.data.userId)).data.prcExpiresAt >= request.time
            : request.resource.data.checks.endorsement)));
      allow update, delete: if false;
    }
```

Candidate:
```
    match /teacherApplicationReviews/{eventId} {
      allow read: if activeAdmin();
      allow create: if validTeacherDecision(request.resource.data.userId,eventId)
        && request.resource.data.keys().hasOnly(['userId','actorId','revision','applicantType','decision','reason','checks','affiliationReference','credentialReference','createdAt'])
        && request.resource.data.applicantType == get(/databases/$(database)/documents/teacherApplications/$(request.resource.data.userId)).data.applicantType
        && request.resource.data.decision in ['approved','needs_changes','declined']
        && request.resource.data.reason is string && request.resource.data.reason.size() >= 5 && request.resource.data.reason.size() <= 500
        && request.resource.data.checks.keys().hasOnly(['identity','affiliation','prc','endorsement'])
        && request.resource.data.checks.identity is bool && request.resource.data.checks.affiliation is bool && request.resource.data.checks.prc is bool && request.resource.data.checks.endorsement is bool
        && request.resource.data.affiliationReference is string && request.resource.data.affiliationReference.size() <= 500
        && request.resource.data.credentialReference is string && request.resource.data.credentialReference.size() <= 500
        && (request.resource.data.decision != 'approved' || (request.resource.data.checks.identity && request.resource.data.checks.affiliation
          && request.resource.data.affiliationReference.size() >= 5
          && get(/databases/$(database)/documents/teacherApplications/$(request.resource.data.userId)).data.emailVerified == true
          && (request.resource.data.applicantType == 'school_teacher' || (request.resource.data.credentialReference.size() >= 5 && (request.resource.data.applicantType == 'licensed_teacher'
            ? request.resource.data.checks.prc && get(/databases/$(database)/documents/teacherApplications/$(request.resource.data.userId)).data.prcExpiresAt >= request.time
            : request.resource.data.checks.endorsement)))));
      allow update, delete: if false;
    }
```
