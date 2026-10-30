
const test = require("node:test");
const assert = require("node:assert/strict");

const {
    createStudentRewards,
    grade,
    diagnoseWeakTopics
} = require("./student-rewards");

const questions = [
    { id: "q1", correctAnswer: "A" },
    { id: "q2", correctAnswer: "B" },
    { id: "q3", correctAnswer: "C" },
    { id: "q4", correctAnswer: "D" },
    { id: "q5", correctAnswer: "A" }
];

test("Mission Quiz calculates a failing score correctly", () => {
    const answers = {
        q1: "A",
        q2: "B",
        q3: "A",
        q4: "A",
        q5: "B"
    };

    const result = grade(questions, answers);

    assert.equal(result.score, 40);
    assert.equal(result.correctAnswers, 2);
});

test("Mission Quiz calculates a perfect score correctly", () => {
    const answers = {
        q1: "A",
        q2: "B",
        q3: "C",
        q4: "D",
        q5: "A"
    };

    const result = grade(questions, answers);

    assert.equal(result.score, 100);
    assert.equal(result.correctAnswers, 5);
});

test("Mission Quiz rejects incomplete answers", () => {
    const answers = {
        q1: "A",
        q2: "B"
    };

    assert.throws(() => grade(questions, answers));
});

test("Mission Quiz identifies weak topics", () => {
    const questions = [
        {
            id: "q1",
            correctAnswer: "A",
            topic: "social-organization"
        },
        {
            id: "q2",
            correctAnswer: "B",
            topic: "trade"
        },
        {
            id: "q3",
            correctAnswer: "C",
            topic: "social-organization"
        }
    ];

    const answers = {
        q1: "B",
        q2: "B",
        q3: "A"
    };

    const topics = diagnoseWeakTopics(questions, answers);

    assert.deepEqual(topics, ["social-organization"]);
});

test("Mission Quiz returns no weak topics for perfect answers", () => {
    const questions = [
        {
            id: "q1",
            correctAnswer: "A",
            topic: "social-organization"
        },
        {
            id: "q2",
            correctAnswer: "B",
            topic: "trade"
        }
    ];

    const answers = {
        q1: "A",
        q2: "B"
    };

    const topics = diagnoseWeakTopics(questions, answers);

    assert.deepEqual(topics, []);
});

test("Failed Mission Quiz saves an attempt without awarding XP", async () => {
    const savedAttempts = [];
    let transactionCalled = false;

    const documents = {
        learningSettings: [{id: "progression", xpPerLevel: 100, version: 1}],
        users: [
            {
                id: "student1",
                role: "student",
                status: "active",
                xp: 100
            }
        ],
        chapters: [
            {
                id: "chapter1",
                eraId: "era1",
                status: "active",
                contentReady: true
            }
        ],
        missions: [
            {
                id: "mission1",
                chapterId: "chapter1",
                status: "active",
                order: 1,
                xpReward: 50
            }
        ],
        quizzes: [
            {
                id: "quiz1",
                missionId: "mission1",
                status: "active",
                passingScore: 60
            }
        ],
        questions: [
            {
                id: "q1",
                quizId: "quiz1",
                status: "active",
                correctAnswer: "A",
                topic: "trade"
            },
            {
                id: "q2",
                quizId: "quiz1",
                status: "active",
                correctAnswer: "B",
                topic: "culture"
            }
        ],
        artifacts: [],
        studentChapterProgress: [],
        studentProgress: []
    };

    const makeSnapshot = items => ({
        docs: items.map(item => ({
            id: item.id,
            data: () => item
        }))
    });

    const fakeDb = {
        collection(name) {
            return {
                doc(id) {
                    return {
                        collectionName: name,
                        id: id,

                        async get() {
                            const item = (documents[name] || [])
                                .find(entry => entry.id === id);

                            return {
                                exists: !!item,
                                data: () => item
                            };
                        }
                    };
                },

                where(field, operator, value) {
                    assert.equal(operator, "==");

                    return {
                        async get() {
                            return makeSnapshot(
                                (documents[name] || [])
                                    .filter(item => item[field] === value)
                            );
                        }
                    };
                },

                async get() {
                    return makeSnapshot(documents[name] || []);
                },

                async add(data) {
                    assert.equal(name, "studentQuizAttempts");
                    savedAttempts.push(data);

                    return { id: "attempt1" };
                }
            };
        },

        async runTransaction(callback) {
            transactionCalled = true;

            const tx = {
                async get(ref) {
                    return ref.get();
                },

                set(ref, data) {
                    assert.equal(
                        ref.collectionName,
                        "studentQuizAttempts"
                    );

                    savedAttempts.push(data);
                },

                update() {
                    throw new Error(
                        "Failed quizzes must not update student XP"
                    );
                }
            };

            return callback(tx);
        }
    };

    const submitStudentActivity = createStudentRewards(fakeDb);

    const result = await submitStudentActivity({
        auth: { uid: "student1" },
        data: {
            kind: "mission",
            chapterId: "chapter1",
            missionId: "mission1",
            quizId: "quiz1",
            attemptId: "11111111-1111-4111-8111-111111111111",
            answers: {
                q1: "B",
                q2: "B"
            }
        }
    });

    assert.equal(result.score, 50);
    assert.equal(result.passed, false);
    assert.equal(result.xpReward, 0);
    assert.deepEqual(result.topicsForReview, ["trade"]);

    assert.equal(savedAttempts.length, 1);
    assert.equal(savedAttempts[0].userId, "student1");
    assert.equal(savedAttempts[0].chapterId, "chapter1");
    assert.equal(savedAttempts[0].missionId, "mission1");
    assert.equal(savedAttempts[0].quizId, "quiz1");
    assert.equal(savedAttempts[0].score, 50);
    assert.equal(savedAttempts[0].passed, false);
    assert.equal(savedAttempts[0].totalQuestions, 2);
    assert.equal(savedAttempts[0].correctAnswers, 1);
    assert.deepEqual(savedAttempts[0].topicsForReview, ["trade"]);
    assert.ok(savedAttempts[0].completedAt);

    assert.equal(transactionCalled, true);
    assert.equal(documents.users[0].xp, 100);
});

test("Passing Mission Quiz saves an attempt and awards XP once", async () => {
    const saved = [];
    const updates = [];
    let transactionCount = 0;

    const documents = {
        learningSettings: [{id: "progression", xpPerLevel: 100, version: 1}],
        users: [
            { id: "student1", role: "student", status: "active", xp: 100 }
        ],
        chapters: [
            {
                id: "chapter1",
                eraId: "era1",
                status: "active",
                contentReady: true
            }
        ],
        missions: [
            {
                id: "mission1",
                chapterId: "chapter1",
                status: "active",
                order: 1,
                xpReward: 50
            }
        ],
        quizzes: [
            {
                id: "quiz1",
                missionId: "mission1",
                status: "active",
                passingScore: 60
            }
        ],
        questions: [
            {
                id: "q1",
                quizId: "quiz1",
                status: "active",
                correctAnswer: "A",
                topic: "trade"
            },
            {
                id: "q2",
                quizId: "quiz1",
                status: "active",
                correctAnswer: "B",
                topic: "culture"
            }
        ],
        artifacts: [],
        studentChapterProgress: [],
        studentProgress: []
    };

    const snapshot = items => ({
        docs: items.map(item => ({
            id: item.id,
            data: () => item
        }))
    });

    const fakeDb = {
        collection(name) {
            return {
                doc(id) {
                    const documentId = id || `auto-${saved.length + 1}`;

                    return {
                        collectionName: name,
                        id: documentId,

                        async get() {
                            const item = (documents[name] || [])
                                .find(entry => entry.id === documentId);

                            return {
                                exists: !!item,
                                data: () => item
                            };
                        }
                    };
                },

                where(field, operator, value) {
                    assert.equal(operator, "==");

                    return {
                        async get() {
                            return snapshot(
                                (documents[name] || [])
                                    .filter(item => item[field] === value)
                            );
                        }
                    };
                },

                async get() {
                    return snapshot(documents[name] || []);
                }
            };
        },

        async runTransaction(callback) {
            transactionCount++;

            const tx = {
                async get(ref) {
                    return ref.get();
                },

                set(ref, data) {
                    saved.push({
                        collection: ref.collectionName,
                        id: ref.id,
                        data
                    });

                    const collection = documents[ref.collectionName] ||= [];
                    const existing = collection.find(item => item.id === ref.id);

                    if (existing) {
                        Object.assign(existing, data);
                    } else {
                        collection.push({ id: ref.id, ...data });
                    }
                },

                update(ref, data) {
                    updates.push({
                        collection: ref.collectionName,
                        id: ref.id,
                        data
                    });

                    const item = (documents[ref.collectionName] || [])
                        .find(entry => entry.id === ref.id);

                    assert.ok(item);
                    Object.assign(item, data);
                }
            };

            return callback(tx);
        }
    };

    const submitStudentActivity = createStudentRewards(fakeDb);

    const request = {
        auth: { uid: "student1" },
        data: {
            kind: "mission",
            chapterId: "chapter1",
            missionId: "mission1",
            quizId: "quiz1",
            attemptId: "22222222-2222-4222-8222-222222222222",
            answers: {
                q1: "A",
                q2: "B"
            }
        }
    };

    const first = await submitStudentActivity(request);

    assert.equal(first.passed, true);
    assert.equal(first.score, 100);
    assert.equal(first.xpReward, 50);
    assert.equal(first.firstCompletion, true);

    const attemptsAfterFirst = saved.filter(
        item => item.collection === "studentQuizAttempts"
    );

    assert.equal(attemptsAfterFirst.length, 1);
    assert.equal(attemptsAfterFirst[0].data.passed, true);
    assert.equal(attemptsAfterFirst[0].data.score, 100);
    assert.deepEqual(attemptsAfterFirst[0].data.topicsForReview, []);

    assert.equal(documents.users[0].xp, 150);

  const second = await submitStudentActivity(request);

assert.equal(second.passed, true);
assert.equal(second.score, 100);

// A duplicate request returns the original result.
assert.equal(second.xpReward, 50);
assert.equal(second.firstCompletion, true);

// The student's XP must not increase again.
assert.equal(documents.users[0].xp, 150);

    const allAttempts = saved.filter(
        item => item.collection === "studentQuizAttempts"
    );

// The same attempt ID must create only one attempt record.
assert.equal(allAttempts.length, 1);

// Both requests use a transaction, but only the first writes.
assert.equal(transactionCount, 2);

    const xpUpdates = updates.filter(
        item => item.collection === "users"
    );

    assert.equal(xpUpdates.length, 1);

// Reusing a passing attempt ID with changed answers must fail.
const changedRequest = {
    auth: { uid: "student1" },
    data: {
        ...request.data,
        answers: {
            q1: "B",
            q2: "B"
        }
    }
};

await assert.rejects(
    () => submitStudentActivity(changedRequest),
    error => {
        assert.equal(error.code, "already-exists");
        return true;
    }
);

// The rejected request must not change XP or create an attempt.
assert.equal(documents.users[0].xp, 150);

assert.equal(
    saved.filter(
        item => item.collection === "studentQuizAttempts"
    ).length,
    1
);

assert.equal(
    updates.filter(
        item => item.collection === "users"
    ).length,
    1
);
});


test("Mission Quiz rejects a reused attempt ID with different answers", async () => {
    const documents = {
        learningSettings: [{id: "progression", xpPerLevel: 100, version: 1}],
        users: [
            {
                id: "student1",
                role: "student",
                status: "active",
                xp: 100
            }
        ],
        chapters: [
            {
                id: "chapter1",
                eraId: "era1",
                status: "active",
                contentReady: true
            }
        ],
        missions: [
            {
                id: "mission1",
                chapterId: "chapter1",
                status: "active",
                order: 1,
                xpReward: 50
            }
        ],
        quizzes: [
            {
                id: "quiz1",
                missionId: "mission1",
                status: "active",
                passingScore: 60
            }
        ],
        questions: [
            {
                id: "q1",
                quizId: "quiz1",
                status: "active",
                correctAnswer: "A",
                topic: "trade"
            },
            {
                id: "q2",
                quizId: "quiz1",
                status: "active",
                correctAnswer: "B",
                topic: "culture"
            }
        ],
        artifacts: [],
        studentChapterProgress: [],
        studentProgress: [],
        studentQuizAttempts: []
    };

    const snapshot = items => ({
        docs: items.map(item => ({
            id: item.id,
            data: () => item
        }))
    });

    const fakeDb = {
        collection(name) {
            return {
                doc(id) {
                    return {
                        collectionName: name,
                        id,

                        async get() {
                            const item = (documents[name] || [])
                                .find(entry => entry.id === id);

                            return {
                                exists: !!item,
                                data: () => item
                            };
                        }
                    };
                },

                where(field, operator, value) {
                    assert.equal(operator, "==");

                    return {
                        async get() {
                            return snapshot(
                                (documents[name] || [])
                                    .filter(item => item[field] === value)
                            );
                        }
                    };
                },

                async get() {
                    return snapshot(documents[name] || []);
                }
            };
        },

        async runTransaction(callback) {
            const tx = {
                async get(ref) {
                    return ref.get();
                },

                set(ref, data) {
                    const collection =
                        documents[ref.collectionName] ||= [];

                    const existing = collection.find(
                        item => item.id === ref.id
                    );

                    if (existing) {
                        Object.assign(existing, data);
                    } else {
                        collection.push({
                            id: ref.id,
                            ...data
                        });
                    }
                },

                update() {
                    throw new Error(
                        "Failed attempts must not award XP"
                    );
                }
            };

            return callback(tx);
        }
    };

    const submitStudentActivity = createStudentRewards(fakeDb);

    const request = {
        auth: { uid: "student1" },
        data: {
            kind: "mission",
            chapterId: "chapter1",
            missionId: "mission1",
            quizId: "quiz1",
            attemptId:
                "33333333-3333-4333-8333-333333333333",
            answers: {
                q1: "B",
                q2: "B"
            }
        }
    };

    const first = await submitStudentActivity(request);

    assert.equal(first.passed, false);
    assert.equal(first.score, 50);

    // Retry with exactly the same answers.
    const second = await submitStudentActivity(request);

    assert.equal(second.passed, false);
    assert.equal(second.score, 50);

    // The duplicate must not create another attempt.
    assert.equal(
        documents.studentQuizAttempts.length,
        1
    );

    // Change answers while keeping the same attempt ID
    // and the same score (50%).
    const changedRequest = {
        auth: { uid: "student1" },
        data: {
            ...request.data,
            answers: {
                q1: "A",
                q2: "A"
            }
        }
    };

    await assert.rejects(
        () => submitStudentActivity(changedRequest),
        error => {
            assert.equal(error.code, "already-exists");
            return true;
        }
    );

    assert.equal(
        documents.studentQuizAttempts.length,
        1
    );

    assert.equal(documents.users[0].xp, 100);
});
