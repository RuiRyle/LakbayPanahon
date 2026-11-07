# Teacher qualification permission review

Only the named qualification/approval scopes below change. Existing teacher accounts must complete the new review before accessing classroom records; no profile or learning records are deleted. Student access/progression and administrator role provisioning remain unchanged.

## function validTeacherDecision

Before:
```
    function validTeacherDecision(uid, eventId) {
      let old = get(/databases/$(database)/documents/teacherApplications/$(uid)).data;
      let application = getAfter(/databases/$(database)/documents/teacherApplications/$(uid)).data;
      let review = getAfter(/databases/$(database)/documents/teacherApplicationReviews/$(eventId)).data;
      return activeAdmin() && old.status == 'submitted' && application.reviewId == eventId
        && application.revision == old.revision && review.revision == old.revision
        && review.actorId == request.auth.uid && review.userId == uid && review.createdAt == request.time
        && application.reviewedAt == request.time && application.reviewedBy == request.auth.uid
        && application.status == review.decision && application.decisionReason == review.reason
        && !existsAfter(/databases/$(database)/documents/teacherEvidence/$(uid));
    }
```

After:
```
    function validTeacherDecision(uid, eventId) {
      let old = get(/databases/$(database)/documents/teacherApplications/$(uid)).data;
      let application = getAfter(/databases/$(database)/documents/teacherApplications/$(uid)).data;
      let review = getAfter(/databases/$(database)/documents/teacherApplicationReviews/$(eventId)).data;
      let profile = getAfter(/databases/$(database)/documents/users/$(uid)).data;
      let audit = getAfter(/databases/$(database)/documents/accountModeration/$(eventId)).data;
      return activeAdmin() && old.status == 'submitted' && application.reviewId == eventId
        && application.revision == old.revision && review.revision == old.revision
        && review.actorId == request.auth.uid && review.userId == uid && review.createdAt == request.time
        && application.reviewedAt == request.time && application.reviewedBy == request.auth.uid
        && application.status == review.decision && application.decisionReason == review.reason
        && profile.teacherVerificationReviewId == eventId && profile.moderationEventId == eventId && profile.moderatedAt == request.time
        && audit.userId == uid && audit.actorId == request.auth.uid && audit.createdAt == request.time
        && !existsAfter(/databases/$(database)/documents/teacherEvidence/$(uid));
    }
```
