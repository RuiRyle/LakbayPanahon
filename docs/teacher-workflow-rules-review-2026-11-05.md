# Pending teacher workflow rules

Offline comparison against the recorded qualification publication. No live release was queried and nothing was published.

## match /classMembers/{membershipId}

Before:
```
    match /classMembers/{membershipId} {
      allow get: if activeStudent() && (!exists(/databases/$(database)/documents/classMembers/$(membershipId)) || ownRecord());
      allow list: if activeStudent() && ownRecord();
      allow read: if ownsClass(resource.data.classId);
      allow create: if activeStudent()
        && request.resource.data.keys().hasOnly(['userId','classId','joinCode','status','joinedAt'])
        && request.resource.data.userId == request.auth.uid
        && request.resource.data.classId is string && request.resource.data.joinCode is string
        && request.resource.data.joinCode.matches('^[A-Z0-9]{12}$')
        && membershipId == request.auth.uid + '_' + request.resource.data.classId
        && request.resource.data.status == 'active' && request.resource.data.joinedAt == request.time
        && get(/databases/$(database)/documents/classJoinCodes/$(request.resource.data.joinCode)).data.classId == request.resource.data.classId
        && get(/databases/$(database)/documents/classJoinCodes/$(request.resource.data.joinCode)).data.status == 'active'
        && get(/databases/$(database)/documents/classJoinCodes/$(request.resource.data.joinCode)).data.get('expiresAt', request.time + duration.value(1,'s')) > request.time
        && get(/databases/$(database)/documents/classes/$(request.resource.data.classId)).data.status == 'active'
        && get(/databases/$(database)/documents/classes/$(request.resource.data.classId)).data.get('currentJoinCode', request.resource.data.joinCode) == request.resource.data.joinCode;
      allow delete: if activeStudent() && ownRecord();
      allow update: if false;
    }
```
After:
```
    match /classMembers/{membershipId} {
      allow get: if activeStudent() && (!exists(/databases/$(database)/documents/classMembers/$(membershipId)) || ownRecord());
      allow list: if activeStudent() && ownRecord();
      allow read: if ownsClass(resource.data.classId);
      allow create: if activeStudent()
        && request.resource.data.keys().hasOnly(['userId','classId','joinCode','status','joinedAt'])
        && request.resource.data.userId == request.auth.uid
        && request.resource.data.classId is string && request.resource.data.joinCode is string
        && request.resource.data.joinCode.matches('^[A-Z0-9]{12}$')
        && membershipId == request.auth.uid + '_' + request.resource.data.classId
        && request.resource.data.status == 'active' && request.resource.data.joinedAt == request.time
        && get(/databases/$(database)/documents/classJoinCodes/$(request.resource.data.joinCode)).data.classId == request.resource.data.classId
        && get(/databases/$(database)/documents/classJoinCodes/$(request.resource.data.joinCode)).data.status == 'active'
        && get(/databases/$(database)/documents/classJoinCodes/$(request.resource.data.joinCode)).data.get('expiresAt', request.time + duration.value(1,'s')) > request.time
        && get(/databases/$(database)/documents/classes/$(request.resource.data.classId)).data.status == 'active'
        && get(/databases/$(database)/documents/classes/$(request.resource.data.classId)).data.get('currentJoinCode', request.resource.data.joinCode) == request.resource.data.joinCode;
      allow delete: if (activeStudent() && ownRecord())
        || (activeOwnedMember(resource.data.classId,resource.data.userId)
          && membershipId == resource.data.userId + '_' + resource.data.classId);
      allow update: if false;
    }
```

## function validPublication

Before:
```
    function validPublication(kind) {
      let data = request.resource.data;
      return ownsClass(data.classId)
        && get(/databases/$(database)/documents/classes/$(data.classId)).data.status == 'active'
        && (resource == null || resource.data.classId == data.classId)
        && data.title is string && data.title.size() > 0 && data.title.size() <= 120
        && data.status in ['draft','published'] && data.publishedAt == request.time && data.updatedAt == request.time
        && ((kind == 'announcement'
          && data.keys().hasOnly(['classId','title','body','status','publishedAt','updatedAt'])
          && data.body is string && data.body.size() > 0 && data.body.size() <= 3000)
        || (kind == 'assignment'
          && data.keys().hasOnly(['classId','title','instructions','missionId','chapterId','status','publishedAt','updatedAt'])
          && data.instructions is string && data.instructions.size() <= 1500
          && data.missionId is string && data.chapterId is string
          && get(/databases/$(database)/documents/missions/$(data.missionId)).data.chapterId == data.chapterId
          && get(/databases/$(database)/documents/missions/$(data.missionId)).data.status == 'active'
          && get(/databases/$(database)/documents/chapters/$(data.chapterId)).data.status == 'active'));
    }
```
After:
```
    function validPublication(kind) {
      let data = request.resource.data;
      return ownsClass(data.classId)
        && get(/databases/$(database)/documents/classes/$(data.classId)).data.status == 'active'
        && (resource == null || resource.data.classId == data.classId)
        && data.title is string && data.title.size() > 0 && data.title.size() <= 120
        && data.status in ['draft','published'] && data.publishedAt == request.time && data.updatedAt == request.time
        && ((kind == 'announcement'
          && data.keys().hasOnly(['classId','title','body','status','publishedAt','updatedAt'])
          && data.body is string && data.body.size() > 0 && data.body.size() <= 3000)
        || (kind == 'assignment'
          && data.keys().hasOnly(['classId','title','instructions','missionId','chapterId','status','publishedAt','updatedAt','dueAt'])
          && (data.get('dueAt', null) == null || data.dueAt is timestamp)
          && data.instructions is string && data.instructions.size() <= 1500
          && data.missionId is string && data.chapterId is string
          && get(/databases/$(database)/documents/missions/$(data.missionId)).data.chapterId == data.chapterId
          && get(/databases/$(database)/documents/missions/$(data.missionId)).data.status == 'active'
          && get(/databases/$(database)/documents/chapters/$(data.chapterId)).data.status == 'active'));
    }
```

## match /classFeedback/{feedbackId}

Before:
```
(absent)
```
After:
```
    match /classFeedback/{feedbackId} {
      allow get: if activeTeacher() && !exists(/databases/$(database)/documents/classFeedback/$(feedbackId));
      allow read: if activeOwnedMember(resource.data.classId, resource.data.userId)
        && resource.data.teacherId == request.auth.uid;
      allow read: if activeStudent() && resource.data.userId == request.auth.uid && classMember(resource.data.classId);
      function validFeedback() {
        let data = request.resource.data;
        return activeOwnedMember(data.classId,data.userId) && data.teacherId == request.auth.uid
          && data.keys().hasOnly(['classId','userId','teacherId','missionId','chapterId','body','revision','createdAt','updatedAt','readAt'])
          && data.missionId is string && data.chapterId is string
          && feedbackId == data.classId + '_' + data.userId + '_' + data.missionId
          && data.body is string && data.body.size() > 0 && data.body.size() <= 1500
          && data.revision is int && data.revision == (resource == null ? 1 : resource.data.revision + 1)
          && data.updatedAt == request.time && data.readAt == null
          && get(/databases/$(database)/documents/missions/$(data.missionId)).data.status == 'active'
          && get(/databases/$(database)/documents/missions/$(data.missionId)).data.chapterId == data.chapterId
          && get(/databases/$(database)/documents/chapters/$(data.chapterId)).data.status == 'active'
          && (resource == null ? data.createdAt == request.time : data.createdAt == resource.data.createdAt
            && data.classId == resource.data.classId && data.userId == resource.data.userId
            && data.teacherId == resource.data.teacherId && data.missionId == resource.data.missionId
            && data.chapterId == resource.data.chapterId);
      }
      allow create, update: if validFeedback();
      allow update: if activeStudent() && resource.data.userId == request.auth.uid && classMember(resource.data.classId)
        && request.resource.data.diff(resource.data).affectedKeys().hasOnly(['readAt'])
        && resource.data.readAt == null && request.resource.data.readAt == request.time;
      allow delete: if false;
    }
```

## match /teacherSupportNotes/{noteId}

Before:
```
(absent)
```
After:
```
    match /teacherSupportNotes/{noteId} {
      allow get: if activeTeacher() && !exists(/databases/$(database)/documents/teacherSupportNotes/$(noteId));
      allow read: if activeOwnedMember(resource.data.classId,resource.data.userId) && resource.data.teacherId == request.auth.uid;
      function validSupportNote() {
        let data = request.resource.data;
        return activeOwnedMember(data.classId,data.userId) && data.teacherId == request.auth.uid
          && data.keys().hasOnly(['classId','userId','teacherId','missionId','chapterId','status','note','revision','createdAt','updatedAt','statusAt'])
          && data.missionId is string && data.chapterId is string
          && noteId == data.classId + '_' + data.userId + '_' + data.missionId
          && data.note is string && data.note.size() > 0 && data.note.size() <= 1500
          && data.status in ['planned','discussed'] && data.revision is int
          && data.revision == (resource == null ? 1 : resource.data.revision + 1)
          && data.updatedAt == request.time
          && get(/databases/$(database)/documents/missions/$(data.missionId)).data.status == 'active'
          && get(/databases/$(database)/documents/missions/$(data.missionId)).data.chapterId == data.chapterId
          && get(/databases/$(database)/documents/chapters/$(data.chapterId)).data.status == 'active'
          && (resource == null ? data.createdAt == request.time : data.createdAt == resource.data.createdAt
            && data.classId == resource.data.classId && data.userId == resource.data.userId
            && data.teacherId == resource.data.teacherId && data.missionId == resource.data.missionId && data.chapterId == resource.data.chapterId)
          && (resource != null && resource.data.status == data.status ? data.statusAt == resource.data.statusAt : data.statusAt == request.time);
      }
      allow create, update: if validSupportNote();
      allow delete: if false;
    }
```
