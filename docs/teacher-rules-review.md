# Teacher permission changes

Published after explicit approval on 31 October 2026. See [publication and readback evidence](validation/teacher-rules-publication-2026-10-31.json). The before/after text below preserves the reviewed change.

The baseline reconstructs the last published rules and matches its recorded SHA-256 proof. This is an offline comparison, not a fresh live release read. All changes are confined to the scopes below; quiz/reward write checks and independent student access are preserved.

## match /classJoinCodes/{code}

Before:
```
    match /classJoinCodes/{code} {
      allow get: if activeStudent();
      allow list, write: if false;
    }
```

After:
```
    match /classJoinCodes/{code} {
      allow get: if activeStudent() || (activeTeacher() && (!exists(/databases/$(database)/documents/classJoinCodes/$(code)) || ownsClass(resource.data.classId)));
      allow list: if ownsClass(resource.data.classId);
      allow create: if activeTeacher() && code.matches('^[A-Z0-9]{12}$')
        && request.resource.data.keys().hasOnly(['classId','teacherId','status','expiresAt','createdAt'])
        && ownsClass(request.resource.data.classId) && request.resource.data.teacherId == request.auth.uid
        && getAfter(/databases/$(database)/documents/classes/$(request.resource.data.classId)).data.currentJoinCode == code
        && getAfter(/databases/$(database)/documents/classes/$(request.resource.data.classId)).data.status == 'active'
        && request.resource.data.status == 'active' && request.resource.data.createdAt == request.time
        && request.resource.data.expiresAt is timestamp && request.resource.data.expiresAt > request.time
        && request.resource.data.expiresAt <= request.time + duration.value(30, 'd');
      allow update: if ownsClass(resource.data.classId)
        && request.resource.data.diff(resource.data).affectedKeys().hasOnly(['status'])
        && request.resource.data.status == 'revoked';
      allow delete: if false;
    }
```

## match /classes/{classId}

Before:
```
    match /classes/{classId} {
      allow get: if activeStudent() && classMember(classId);
      allow list, write: if false;
    }
```

After:
```
    match /classes/{classId} {
      function validClass() {
        let data = request.resource.data;
        return data.keys().hasOnly(['name','description','teacherId','teacherName','status','currentJoinCode','createdAt','updatedAt'])
          && data.name is string && data.name.size() > 0 && data.name.size() <= 100
          && data.get('description','') is string && data.get('description','').size() <= 500
          && data.teacherName is string && data.teacherName.size() <= 200
          && data.status in ['active','archived'] && data.updatedAt == request.time
          && data.currentJoinCode is string && (data.currentJoinCode == '' || data.currentJoinCode.matches('^[A-Z0-9]{12}$'));
      }
      allow get: if (activeStudent() && classMember(classId)) || (activeTeacher() && resource.data.teacherId == request.auth.uid);
      allow list: if activeTeacher() && resource.data.teacherId == request.auth.uid;
      allow create: if activeTeacher() && validClass() && request.resource.data.teacherId == request.auth.uid
        && request.resource.data.status == 'active' && request.resource.data.currentJoinCode == '' && request.resource.data.createdAt == request.time;
      allow update: if activeTeacher() && resource.data.teacherId == request.auth.uid && validClass()
        && request.resource.data.diff(resource.data).affectedKeys().hasOnly(['name','description','status','currentJoinCode','updatedAt'])
        && (request.resource.data.status == 'active' || request.resource.data.currentJoinCode == '');
      allow delete: if false;
    }
```

## match /classMembers/{membershipId}

Before:
```
    match /classMembers/{membershipId} {
      allow get: if activeStudent() && (!exists(/databases/$(database)/documents/classMembers/$(membershipId)) || ownRecord());
      allow list: if activeStudent() && ownRecord();
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
        && get(/databases/$(database)/documents/classes/$(request.resource.data.classId)).data.status == 'active';
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
      allow delete: if activeStudent() && ownRecord();
      allow update: if false;
    }
```

## match /classAssignments/{assignmentId}

Before:
```
    match /classAssignments/{assignmentId} {
      allow read: if activeStudent() && classMember(resource.data.classId) && resource.data.status == 'published';
      allow write: if false;
    }
```

After:
```
    match /classAssignments/{assignmentId} {
      allow read: if activeStudent() && classMember(resource.data.classId) && resource.data.status == 'published';
      allow read: if ownsClass(resource.data.classId);
      allow create, update: if validPublication('assignment');
      allow delete: if false;
    }
```

## match /classAnnouncements/{announcementId}

Before:
```
    match /classAnnouncements/{announcementId} {
      allow read: if activeStudent() && classMember(resource.data.classId) && resource.data.status == 'published';
      allow write: if false;
    }
```

After:
```
    match /classAnnouncements/{announcementId} {
      allow read: if activeStudent() && classMember(resource.data.classId) && resource.data.status == 'published';
      allow read: if ownsClass(resource.data.classId);
      allow create, update: if validPublication('announcement');
      allow delete: if false;
    }
```

## match /users/{userId}

Before:
```
    match /users/{userId} {
      allow read: if signedIn() && request.auth.uid == userId;
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

## match /{catalog}/{contentId}

Before:
```
    match /{catalog}/{contentId} {
      allow read: if activeStudent() && catalog in [
        'eras', 'chapters', 'missions', 'storyScenes', 'quizzes', 'questions',
        'practiceQuestions', 'artifacts', 'chapterChallenges', 'chapterChallengeQuestions',
        'badges', 'dailyChallenges'
      ];
    }
```

After:
```
    match /{catalog}/{contentId} {
      allow read: if activeTeacher() && catalog in ['chapters','missions'] && resource.data.status == 'active';
      allow read: if activeStudent() && catalog in [
        'eras', 'chapters', 'missions', 'storyScenes', 'quizzes', 'questions',
        'practiceQuestions', 'artifacts', 'chapterChallenges', 'chapterChallengeQuestions',
        'badges', 'dailyChallenges'
      ];
    }
```

## match /studentProgress/{progressId}

Before:
```
    match /studentProgress/{progressId} {
      function validMission() {
        let data = request.resource.data;
        let mission = get(/databases/$(database)/documents/missions/$(data.missionId)).data;
        let chapter = get(/databases/$(database)/documents/chapters/$(data.chapterId)).data;
        let quiz = get(/databases/$(database)/documents/quizzes/$(data.quizId)).data;
        return data.keys().hasOnly(['userId', 'chapterId', 'missionId', 'quizId', 'completed',
            'bestScore', 'completedAt', 'updatedAt', 'xpEarned'])
          && progressId == request.auth.uid + '_' + data.missionId
          && mission.status == 'active' && mission.chapterId == data.chapterId
          && chapter.status == 'active' && chapter.get('contentReady', true) != false
          && quiz.status == 'active' && quiz.missionId == data.missionId
          && quiz.passingScore is number && quiz.passingScore >= 0 && quiz.passingScore <= 100
          && data.bestScore >= quiz.passingScore
          && data.xpEarned is int && data.xpEarned >= 0 && data.xpEarned == mission.get('xpReward', 0)
          && pairedReward('mission', data.missionId);
      }
      allow create: if activeStudent() && validCompletion() && validMission();
      allow update: if activeStudent() && scoreReplay();
    }
```

After:
```
    match /studentProgress/{progressId} {
      allow read: if teacherCanReport(resource.data.userId);
      function validMission() {
        let data = request.resource.data;
        let mission = get(/databases/$(database)/documents/missions/$(data.missionId)).data;
        let chapter = get(/databases/$(database)/documents/chapters/$(data.chapterId)).data;
        let quiz = get(/databases/$(database)/documents/quizzes/$(data.quizId)).data;
        return data.keys().hasOnly(['userId', 'chapterId', 'missionId', 'quizId', 'completed',
            'bestScore', 'completedAt', 'updatedAt', 'xpEarned'])
          && progressId == request.auth.uid + '_' + data.missionId
          && mission.status == 'active' && mission.chapterId == data.chapterId
          && chapter.status == 'active' && chapter.get('contentReady', true) != false
          && quiz.status == 'active' && quiz.missionId == data.missionId
          && quiz.passingScore is number && quiz.passingScore >= 0 && quiz.passingScore <= 100
          && data.bestScore >= quiz.passingScore
          && data.xpEarned is int && data.xpEarned >= 0 && data.xpEarned == mission.get('xpReward', 0)
          && pairedReward('mission', data.missionId);
      }
      allow create: if activeStudent() && validCompletion() && validMission();
      allow update: if activeStudent() && scoreReplay();
    }
```

## match /studentQuizAttempts/{attemptId}

Before:
```
    match /studentQuizAttempts/{attemptId} {
      function firstAttemptCompletion(data) {
        let path = completionPath('mission', data.missionId);
        let progress = getAfter(path).data;
        return !exists(path) && progress.userId == request.auth.uid
          && progress.chapterId == data.chapterId && progress.missionId == data.missionId
          && progress.quizId == data.quizId && progress.completed == true
          && progress.completedAt == request.time && progress.updatedAt == request.time
          && progress.bestScore == data.score && progress.xpEarned == data.response.xpReward;
      }
      function validAttempt() {
        let data = request.resource.data;
        let quiz = get(/databases/$(database)/documents/quizzes/$(data.quizId)).data;
        let mission = get(/databases/$(database)/documents/missions/$(data.missionId)).data;
        return data.keys().hasOnly(['userId', 'chapterId', 'missionId', 'quizId', 'attemptId',
            'questionIds', 'answers', 'score', 'correctAnswers', 'totalQuestions', 'passed', 'topicsForReview', 'completedAt', 'response'])
          && data.keys().hasAll(['userId', 'chapterId', 'missionId', 'quizId', 'attemptId', 'questionIds',
            'answers', 'score', 'correctAnswers', 'totalQuestions', 'passed', 'topicsForReview', 'completedAt', 'response'])
          && data.userId == request.auth.uid && attemptId == request.auth.uid + '_' + data.attemptId
          && quiz.status == 'active' && quiz.missionId == data.missionId
          && mission.status == 'active' && mission.chapterId == data.chapterId
          && data.totalQuestions is int && data.totalQuestions > 0 && data.totalQuestions <= 200
          && data.totalQuestions == quiz.questionCount && data.questionIds is list
          && data.questionIds.size() == data.totalQuestions && data.questionIds.toSet().size() == data.totalQuestions
          && data.answers is map && data.answers.keys().hasAll(data.questionIds) && data.answers.size() == data.totalQuestions
          && data.correctAnswers is int && data.correctAnswers >= 0 && data.correctAnswers <= data.totalQuestions
          && data.score is int && data.score == math.round(data.correctAnswers * 100.0 / data.totalQuestions)
          && data.passed == (data.score >= quiz.passingScore)
          && data.topicsForReview is list && data.topicsForReview.size() <= data.totalQuestions
          && data.completedAt == request.time && data.response is map
          && data.response.score == data.score && data.response.correctAnswers == data.correctAnswers
          && data.response.passed == data.passed && data.response.topicsForReview == data.topicsForReview
          && data.response.firstCompletion is bool && (!data.response.firstCompletion || data.passed)
          && data.response.xpReward is int && data.response.xpReward >= 0
          && data.response.xpReward == (data.response.firstCompletion ? mission.get('xpReward', 0) : 0)
          && (!data.response.firstCompletion || firstAttemptCompletion(data));
      }
      allow create: if activeStudent() && validAttempt();
      allow update, delete: if false;
    }
```

After:
```
    match /studentQuizAttempts/{attemptId} {
      allow read: if teacherCanReport(resource.data.userId);
      function firstAttemptCompletion(data) {
        let path = completionPath('mission', data.missionId);
        let progress = getAfter(path).data;
        return !exists(path) && progress.userId == request.auth.uid
          && progress.chapterId == data.chapterId && progress.missionId == data.missionId
          && progress.quizId == data.quizId && progress.completed == true
          && progress.completedAt == request.time && progress.updatedAt == request.time
          && progress.bestScore == data.score && progress.xpEarned == data.response.xpReward;
      }
      function validAttempt() {
        let data = request.resource.data;
        let quiz = get(/databases/$(database)/documents/quizzes/$(data.quizId)).data;
        let mission = get(/databases/$(database)/documents/missions/$(data.missionId)).data;
        return data.keys().hasOnly(['userId', 'chapterId', 'missionId', 'quizId', 'attemptId',
            'questionIds', 'answers', 'score', 'correctAnswers', 'totalQuestions', 'passed', 'topicsForReview', 'completedAt', 'response'])
          && data.keys().hasAll(['userId', 'chapterId', 'missionId', 'quizId', 'attemptId', 'questionIds',
            'answers', 'score', 'correctAnswers', 'totalQuestions', 'passed', 'topicsForReview', 'completedAt', 'response'])
          && data.userId == request.auth.uid && attemptId == request.auth.uid + '_' + data.attemptId
          && quiz.status == 'active' && quiz.missionId == data.missionId
          && mission.status == 'active' && mission.chapterId == data.chapterId
          && data.totalQuestions is int && data.totalQuestions > 0 && data.totalQuestions <= 200
          && data.totalQuestions == quiz.questionCount && data.questionIds is list
          && data.questionIds.size() == data.totalQuestions && data.questionIds.toSet().size() == data.totalQuestions
          && data.answers is map && data.answers.keys().hasAll(data.questionIds) && data.answers.size() == data.totalQuestions
          && data.correctAnswers is int && data.correctAnswers >= 0 && data.correctAnswers <= data.totalQuestions
          && data.score is int && data.score == math.round(data.correctAnswers * 100.0 / data.totalQuestions)
          && data.passed == (data.score >= quiz.passingScore)
          && data.topicsForReview is list && data.topicsForReview.size() <= data.totalQuestions
          && data.completedAt == request.time && data.response is map
          && data.response.score == data.score && data.response.correctAnswers == data.correctAnswers
          && data.response.passed == data.passed && data.response.topicsForReview == data.topicsForReview
          && data.response.firstCompletion is bool && (!data.response.firstCompletion || data.passed)
          && data.response.xpReward is int && data.response.xpReward >= 0
          && data.response.xpReward == (data.response.firstCompletion ? mission.get('xpReward', 0) : 0)
          && (!data.response.firstCompletion || firstAttemptCompletion(data));
      }
      allow create: if activeStudent() && validAttempt();
      allow update, delete: if false;
    }
```

## function activeTeacher

Before:
```
(absent)
```

After:
```
    function activeTeacher() {
      return signedIn()
        && get(/databases/$(database)/documents/users/$(request.auth.uid)).data.role == 'teacher'
        && get(/databases/$(database)/documents/users/$(request.auth.uid)).data.status == 'active';
    }
```

## function ownsClass

Before:
```
(absent)
```

After:
```
    function ownsClass(classId) {
      return activeTeacher() && get(/databases/$(database)/documents/classes/$(classId)).data.teacherId == request.auth.uid;
    }
```

## function activeOwnedMember

Before:
```
(absent)
```

After:
```
    function activeOwnedMember(classId, userId) {
      let classroom = get(/databases/$(database)/documents/classes/$(classId)).data;
      let member = get(/databases/$(database)/documents/classMembers/$(userId + '_' + classId)).data;
      return activeTeacher() && classroom.teacherId == request.auth.uid && classroom.status == 'active'
        && member.userId == userId && member.classId == classId && member.status == 'active';
    }
```

## function teacherCanReport

Before:
```
(absent)
```

After:
```
    function teacherCanReport(userId) {
      let link = get(/databases/$(database)/documents/teacherStudentLinks/$(request.auth.uid + '_' + userId)).data;
      return activeTeacher() && link.teacherId == request.auth.uid && link.userId == userId
        && activeOwnedMember(link.classId, userId);
    }
```

## function validPublication

Before:
```
(absent)
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
          && data.keys().hasOnly(['classId','title','instructions','missionId','chapterId','status','publishedAt','updatedAt'])
          && data.instructions is string && data.instructions.size() <= 1500
          && data.missionId is string && data.chapterId is string
          && get(/databases/$(database)/documents/missions/$(data.missionId)).data.chapterId == data.chapterId
          && get(/databases/$(database)/documents/missions/$(data.missionId)).data.status == 'active'
          && get(/databases/$(database)/documents/chapters/$(data.chapterId)).data.status == 'active'));
    }
```

## match /teacherStudentLinks/{linkId}

Before:
```
(absent)
```

After:
```
    match /teacherStudentLinks/{linkId} {
      allow get: if activeTeacher() && resource.data.teacherId == request.auth.uid;
      allow list, delete: if false;
      allow create, update: if request.resource.data.keys().hasOnly(['teacherId','userId','classId'])
        && request.resource.data.teacherId == request.auth.uid
        && linkId == request.auth.uid + '_' + request.resource.data.userId
        && activeOwnedMember(request.resource.data.classId, request.resource.data.userId);
    }
```
