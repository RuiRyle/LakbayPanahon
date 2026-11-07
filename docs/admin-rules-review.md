# Administrator permission review

Only four named scopes change from the hash-verified published teacher rules. Status changes are limited to student/teacher accounts and require a paired, immutable audit record. No client can grant administrator roles or alter curriculum, grades or rewards through these rules. Current activation status is recorded in admin-workflow.md.

## match /users/{userId}

Before:
```
    match /users/{userId} {
      allow read: if signedIn() && request.auth.uid == userId;
      allow get: if teacherCanReport(userId);
      allow create: if signedIn() && request.auth.uid == userId
        && request.resource.data.keys().hasOnly([
          'firstName', 'middleName', 'lastName', 'email', 'role', 'status', 'createdAt'
        ])
        && request.resource.data.keys().hasAll([
          'firstName', 'lastName', 'email', 'role', 'status', 'createdAt'
        ])
        && request.resource.data.firstName is string
        && request.resource.data.firstName.size() > 0 && request.resource.data.firstName.size() <= 100
        && request.resource.data.lastName is string
        && request.resource.data.lastName.size() > 0 && request.resource.data.lastName.size() <= 100
        && request.resource.data.get('middleName', '') is string
        && request.resource.data.get('middleName', '').size() <= 100
        && request.resource.data.email == request.auth.token.email
        && request.resource.data.createdAt == request.time
        && ((request.resource.data.role == 'student' && request.resource.data.status == 'active')
          || (request.resource.data.role == 'teacher' && request.resource.data.status == 'pending'));
      // Names can be edited; rewards require a paired first-completion write.
      allow update: if signedIn() && request.auth.uid == userId && rewardUpdate();
      allow update: if signedIn() && request.auth.uid == userId
        && request.resource.data.diff(resource.data).affectedKeys().hasOnly([
          'firstName', 'middleName', 'lastName', 'avatarId', 'updatedAt', 'profileSetupCompletedAt'
        ])
        && request.resource.data.firstName is string
        && request.resource.data.firstName.size() > 0 && request.resource.data.firstName.size() <= 100
        && request.resource.data.lastName is string
        && request.resource.data.lastName.size() > 0 && request.resource.data.lastName.size() <= 100
        && request.resource.data.get('middleName', '') is string
        && request.resource.data.get('middleName', '').size() <= 100
        && validAvatarChange()
        && (!request.resource.data.diff(resource.data).affectedKeys().hasAny(['profileSetupCompletedAt'])
          || (activeStudent() && resource.data.get('profileSetupCompletedAt',null) == null
            && request.resource.data.profileSetupCompletedAt == request.time))
        && request.resource.data.updatedAt == request.time;
      allow update: if activeStudent() && request.auth.uid == userId
        && request.resource.data.diff(resource.data).affectedKeys().hasOnly(['profileSetupDismissedAt','updatedAt'])
        && resource.data.get('profileSetupDismissedAt',null) == null
        && request.resource.data.profileSetupDismissedAt == request.time
        && request.resource.data.updatedAt == request.time;
    }
```

After:
```
    match /users/{userId} {
      allow read: if activeAdmin();
      allow update: if validModeration(userId);
      allow read: if signedIn() && request.auth.uid == userId;
      allow get: if teacherCanReport(userId);
      allow create: if signedIn() && request.auth.uid == userId
        && request.resource.data.keys().hasOnly([
          'firstName', 'middleName', 'lastName', 'email', 'role', 'status', 'createdAt'
        ])
        && request.resource.data.keys().hasAll([
          'firstName', 'lastName', 'email', 'role', 'status', 'createdAt'
        ])
        && request.resource.data.firstName is string
        && request.resource.data.firstName.size() > 0 && request.resource.data.firstName.size() <= 100
        && request.resource.data.lastName is string
        && request.resource.data.lastName.size() > 0 && request.resource.data.lastName.size() <= 100
        && request.resource.data.get('middleName', '') is string
        && request.resource.data.get('middleName', '').size() <= 100
        && request.resource.data.email == request.auth.token.email
        && request.resource.data.createdAt == request.time
        && ((request.resource.data.role == 'student' && request.resource.data.status == 'active')
          || (request.resource.data.role == 'teacher' && request.resource.data.status == 'pending'));
      // Names can be edited; rewards require a paired first-completion write.
      allow update: if signedIn() && request.auth.uid == userId && rewardUpdate();
      allow update: if signedIn() && request.auth.uid == userId
        && request.resource.data.diff(resource.data).affectedKeys().hasOnly([
          'firstName', 'middleName', 'lastName', 'avatarId', 'updatedAt', 'profileSetupCompletedAt'
        ])
        && request.resource.data.firstName is string
        && request.resource.data.firstName.size() > 0 && request.resource.data.firstName.size() <= 100
        && request.resource.data.lastName is string
        && request.resource.data.lastName.size() > 0 && request.resource.data.lastName.size() <= 100
        && request.resource.data.get('middleName', '') is string
        && request.resource.data.get('middleName', '').size() <= 100
        && validAvatarChange()
        && (!request.resource.data.diff(resource.data).affectedKeys().hasAny(['profileSetupCompletedAt'])
          || (activeStudent() && resource.data.get('profileSetupCompletedAt',null) == null
            && request.resource.data.profileSetupCompletedAt == request.time))
        && request.resource.data.updatedAt == request.time;
      allow update: if activeStudent() && request.auth.uid == userId
        && request.resource.data.diff(resource.data).affectedKeys().hasOnly(['profileSetupDismissedAt','updatedAt'])
        && resource.data.get('profileSetupDismissedAt',null) == null
        && request.resource.data.profileSetupDismissedAt == request.time
        && request.resource.data.updatedAt == request.time;
    }
```

## function activeAdmin

Before:
```
(absent)
```

After:
```
    function activeAdmin() {
      return signedIn()
        && get(/databases/$(database)/documents/users/$(request.auth.uid)).data.role == 'admin'
        && get(/databases/$(database)/documents/users/$(request.auth.uid)).data.status == 'active';
    }
```

## function validModeration

Before:
```
(absent)
```

After:
```
    function validModeration(userId) {
      let data = request.resource.data;
      let event = getAfter(/databases/$(database)/documents/accountModeration/$(data.moderationEventId)).data;
      return activeAdmin() && userId != request.auth.uid && resource.data.role in ['teacher','student']
        && resource.data.status in ['pending','active','inactive'] && data.status in ['active','inactive']
        && data.status != resource.data.status
        && data.diff(resource.data).affectedKeys().hasOnly(['status','updatedAt','moderatedAt','moderatedBy','moderationEventId'])
        && data.updatedAt == request.time && data.moderatedAt == request.time && data.moderatedBy == request.auth.uid
        && event.userId == userId && event.actorId == request.auth.uid && event.createdAt == request.time
        && event.previousStatus == resource.data.status && event.status == data.status;
    }
```

## match /accountModeration/{eventId}

Before:
```
(absent)
```

After:
```
    match /accountModeration/{eventId} {
      allow read: if activeAdmin();
      allow create: if activeAdmin()
        && request.resource.data.keys().hasOnly(['userId','actorId','previousStatus','status','reason','identityVerified','createdAt'])
        && request.resource.data.userId != request.auth.uid && request.resource.data.actorId == request.auth.uid
        && request.resource.data.reason is string && request.resource.data.reason.size() >= 5 && request.resource.data.reason.size() <= 500
        && request.resource.data.createdAt == request.time && request.resource.data.identityVerified is bool
        && get(/databases/$(database)/documents/users/$(request.resource.data.userId)).data.role in ['student','teacher']
        && get(/databases/$(database)/documents/users/$(request.resource.data.userId)).data.status == request.resource.data.previousStatus
        && request.resource.data.status in ['active','inactive'] && request.resource.data.previousStatus != request.resource.data.status
        && (get(/databases/$(database)/documents/users/$(request.resource.data.userId)).data.role != 'teacher'
          || request.resource.data.status != 'active' || request.resource.data.identityVerified == true)
        && getAfter(/databases/$(database)/documents/users/$(request.resource.data.userId)).data.moderationEventId == eventId
        && getAfter(/databases/$(database)/documents/users/$(request.resource.data.userId)).data.status == request.resource.data.status
        && getAfter(/databases/$(database)/documents/users/$(request.resource.data.userId)).data.moderatedAt == request.time
        && getAfter(/databases/$(database)/documents/users/$(request.resource.data.userId)).data.moderatedBy == request.auth.uid;
      allow update, delete: if false;
    }
```
