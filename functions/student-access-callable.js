'use strict';

const { createHash, createHmac, randomBytes, scrypt, timingSafeEqual } = require('node:crypto');
const { promisify } = require('node:util');
const { HttpsError } = require('firebase-functions/v2/https');

const deriveKey = promisify(scrypt);
const digest = value => createHash('sha256').update(value).digest('hex');
const formatCode = hex => hex.toUpperCase().match(/.{6}/g).join('-');
const newCode = () => formatCode(randomBytes(12).toString('hex'));
const normalizeCode = value => typeof value === 'string' && value.length <= 40 ? value.replace(/[\s-]/g, '').toUpperCase() : '';
const validPathId = value => typeof value === 'string' && /^[\w-]{1,128}$/.test(value);
const unavailable = () => new HttpsError('permission-denied', 'Check your username and passphrase or code. If you forgot your passphrase, use your backup key.');
const noClass = () => new HttpsError('permission-denied', 'Choose an active classroom you manage.');
const checkPassword = value => typeof value === 'string' && value.length > 0 && value.length <= 600;
const codeHash = code => digest(normalizeCode(code));
const windowMs = 15 * 60 * 1000;
const resetClaimMs = 2 * 60 * 1000;
const recoveryReceiptMs = 15 * 60 * 1000;
const timings = { setup: 7 * 86400_000, reset: 30 * 60_000 };
const resetInProgress = () => new HttpsError('failed-precondition', 'A passphrase reset is in progress. Wait a moment and try again.');
const usernameAvailableError = () => new HttpsError('already-exists', 'That username is taken. Choose another one.');
const usernamePattern = /^[a-z][a-z0-9_-]{2,19}$/;
const legacyIdPattern = /^LP[A-F0-9]{12}$/;
const requestIdPattern = /^[a-f0-9]{8}-[a-f0-9]{4}-4[a-f0-9]{3}-[89ab][a-f0-9]{3}-[a-f0-9]{12}$/;

function normalizedUsername(value) {
    const name = typeof value === 'string' ? value.trim().toLowerCase() : '';
    return usernamePattern.test(name) && !legacyIdPattern.test(normalizeCode(name)) ? name : '';
}

function passphraseFor(value) {
    if (!checkPassword(value) || Array.from(value.trim()).length < 15) {
        throw new HttpsError('invalid-argument', 'Use at least 15 characters. A phrase made of several words is easier to remember.');
    }
    return value;
}

function studentName(value, optional = false) {
    const name = typeof value === 'string' ? value.trim().replace(/\s+/g, ' ') : '';
    if ((!optional && !name) || name.length > 100 || /[\u0000-\u001f\u007f]/.test(name)) {
        throw new HttpsError('invalid-argument', 'Enter a first and last name of up to 100 characters each.');
    }
    return name;
}

function studentAccessHandler({ db, auth, timestamp, now = Date.now, clientAddress = request => request.ip }) {
    const ref = (collection, id) => db.collection(collection).doc(id);
    const accountRef = id => ref('studentAccessAccounts', id);
    const usernameRef = username => ref('studentAccessUsernames', digest('student-username:' + username));

    async function lookupStudent(value) {
        const legacy = normalizeCode(value);
        if (legacyIdPattern.test(legacy)) return 'LP-' + legacy.slice(2);
        const username = normalizedUsername(value);
        if (!username) return null;
        const id = (await usernameRef(username).get()).data()?.studentId;
        return /^LP-[A-F0-9]{12}$/.test(id || '') ? id : null;
    }

    async function limit(action, key, max) {
        const bucket = ref('studentAccessLimits', digest(action + ':' + key));
        await db.runTransaction(async tx => {
            const old = (await tx.get(bucket)).data();
            const time = now();
            const active = old?.until > time;
            const count = active ? old.count : 0;
            if (count >= max) throw new HttpsError('resource-exhausted', 'Too many attempts. Wait 15 minutes before trying again.');
            tx.set(bucket, { count: count + 1, until: active ? old.until : time + windowMs, expiresAt: new Date(time + 2 * windowMs) });
        });
    }

    async function teacher(request) {
        const token = request.rawRequest?.headers?.authorization?.match(/^Bearer (.+)$/i)?.[1];
        if (!request.auth?.uid || !token) throw noClass();
        const identity = await auth.verifyIdToken(token, true).catch(() => null);
        if (!identity?.email_verified || identity.uid !== request.auth.uid) throw noClass();
        return identity;
    }

    async function activeClass(tx, classId, teacherId) {
        const classroom = (await tx.get(ref('classes', classId))).data();
        return classroom?.status === 'active' && classroom.teacherId === teacherId ? classroom : null;
    }

    async function approvedTeacher(tx, uid, email) {
        const [profile, application] = await Promise.all([
            tx.get(ref('users', uid)),
            tx.get(ref('teacherApplications', uid))
        ]);
        const owner = profile.data(), approval = application.data();
        return owner?.role === 'teacher' && owner.status === 'active' &&
            approval?.status === 'approved' && approval.emailVerified === true &&
            (email === undefined || approval.email === email) &&
            approval.revision === owner.teacherVerifiedRevision && approval.revision > 0;
    }

    async function teacherClass(tx, classId, identity) {
        if (!validPathId(classId)) throw noClass();
        const [classroom, approved] = await Promise.all([
            activeClass(tx, classId, identity.uid), approvedTeacher(tx, identity.uid, identity.email)
        ]);
        if (!classroom || !approved) throw noClass();
        return classroom;
    }

    const hasResetClaim = account => account?.resetClaimUntil > now();
    const activeStudent = profile => profile?.role === 'student' && profile.status === 'active';
    const classMember = (member, uid, classId) => member?.status === 'active' && member.userId === uid && member.classId === classId;

    const codeFields = (code, kind) => ({ codeHash: codeHash(code), codeExpires: now() + timings[kind] });

    async function issue(data, identity) {
        await limit('issue', identity.uid, 60);
        const id = 'LP-' + randomBytes(6).toString('hex').toUpperCase();
        const code = newCode();
        const fields = codeFields(code, 'setup');
        await db.runTransaction(async tx => {
            await teacherClass(tx, data.classId, identity);
            tx.create(accountRef(id), {
                ...fields, classId: data.classId, teacherId: identity.uid,
                uid: 'lp_student_' + randomBytes(18).toString('hex'), status: 'setup', createdAt: timestamp()
            });
        });
        return { studentId: id, code, kind: 'setup', expiresAt: fields.codeExpires };
    }

    async function reissue(data, identity, studentId) {
        await limit('reissue', identity.uid, 25);
        const code = newCode();
        return db.runTransaction(async tx => {
            await teacherClass(tx, data.classId, identity);
            const target = accountRef(studentId);
            const record = (await tx.get(target)).data();
            const kind = record?.status === 'active' ? 'reset' : 'setup';
            if (!record) throw unavailable();
            if (hasResetClaim(record)) throw resetInProgress();
            if (kind === 'setup') {
                if (record.classId !== data.classId || record.teacherId !== identity.uid) throw unavailable();
            } else {
                const [member, profile] = await Promise.all([
                    tx.get(ref('classMembers', record.uid + '_' + data.classId)), tx.get(ref('users', record.uid))
                ]);
                if (!classMember(member.data(), record.uid, data.classId) || !activeStudent(profile.data())) throw unavailable();
            }
            const fields = codeFields(code, kind);
            tx.update(target, { ...fields, classId: data.classId, teacherId: identity.uid });
            return { ...(record.username ? { username: record.username } : { studentId }), code, kind, expiresAt: fields.codeExpires };
        });
    }

    async function verifyPassphrase(record, passphrase) {
        const stored = /^[a-f0-9]{128}$/.test(record?.hash || '') ? record.hash : '0'.repeat(128);
        const derived = await deriveKey(passphrase, record?.salt || 'invalid-student-id', 64);
        if (!timingSafeEqual(derived, Buffer.from(stored, 'hex')) || record?.status !== 'active') throw unavailable();
    }

    async function signIn(record, studentId, passphrase) {
        await verifyPassphrase(record, passphrase);
        const [fresh, profile] = await Promise.all([accountRef(studentId).get(), ref('users', record.uid).get()]);
        if (fresh.data()?.hash !== record.hash || !activeStudent(profile.data())) throw unavailable();
        if (hasResetClaim(fresh.data())) throw resetInProgress();
        return { token: await auth.createCustomToken(record.uid) };
    }

    async function register(request) {
        if (request.auth) throw new HttpsError('failed-precondition', 'Sign out of your current account before creating another one.');
        const { data } = request;
        const key = data.registrationKey;
        if (typeof key !== 'string' || !requestIdPattern.test(key)) {
            throw new HttpsError('invalid-argument', 'Reload the signup page and try again.');
        }
        const passphrase = passphraseFor(data.passphrase);
        const username = normalizedUsername(data.username);
        if (!username) throw new HttpsError('invalid-argument', 'Choose a username of 3 to 20 characters. Start with a letter and use letters, numbers, hyphens, or underscores.');
        const names = {
            firstName: studentName(data.firstName), middleName: studentName(data.middleName, true), lastName: studentName(data.lastName)
        };
        const address = request.rawRequest ? clientAddress(request.rawRequest) : null;
        await limit('student-registration', address || 'unknown', 30);

        const registrationHash = digest('student-registration:' + key);
        const studentId = 'LP-' + registrationHash.slice(0, 12).toUpperCase();
        const target = accountRef(studentId);
        const usernameEntry = usernameRef(username);
        // A retry in the same form can recover the original backup key after
        // verifying the passphrase. Neither the key nor its source goes in the database.
        const recoveryCodeFor = hash => formatCode(createHmac('sha256', Buffer.from(hash, 'hex'))
            .update('student-registration-recovery:' + key).digest('hex').slice(0, 24));
        async function resume(record) {
            if (record.registrationHash !== registrationHash) {
                throw new HttpsError('failed-precondition', 'Reload the signup page and try again.');
            }
            if (record.username !== username) throw new HttpsError('failed-precondition', 'To finish this account, use the same username you first submitted.');
            const { token } = await signIn(record, studentId, passphrase).catch(error => {
                if (error.code !== 'permission-denied') throw error;
                throw new HttpsError('permission-denied', 'If you are retrying signup, enter the same passphrase you submitted the first time.');
            });
            const recoveryCode = recoveryCodeFor(record.hash);
            return { token, username, ...(record.recoveryHash === codeHash(recoveryCode) ? { recoveryCode } : {}) };
        }

        const existing = (await target.get()).data();
        if (existing) return resume(existing);
        const uid = 'lp_student_' + randomBytes(18).toString('hex');
        const salt = randomBytes(16).toString('hex');
        const hash = (await deriveKey(passphrase, salt, 64)).toString('hex');
        const recoveryCode = recoveryCodeFor(hash);
        // Sign before saving so a signing failure cannot strand a new account.
        const token = await auth.createCustomToken(uid);
        const existingAfterRace = await db.runTransaction(async tx => {
            const [account, reserved] = await Promise.all([tx.get(target), tx.get(usernameEntry)]);
            const previous = account.data();
            if (previous) return previous;
            if (reserved.exists) throw usernameAvailableError();
            tx.create(ref('users', uid), { ...names, role: 'student', status: 'active', studentId, username, createdAt: timestamp() });
            tx.create(target, { uid, status: 'active', salt, hash, username, registrationHash, recoveryHash: codeHash(recoveryCode), createdAt: timestamp() });
            tx.create(usernameEntry, { studentId });
            return null;
        });
        return existingAfterRace ? resume(existingAfterRace) : { token, username, recoveryCode };
    }

    async function rotateRecovery(request, data, studentId) {
        const token = request.rawRequest?.headers?.authorization?.match(/^Bearer (.+)$/i)?.[1];
        if (!request.auth?.uid || !token || !checkPassword(data.passphrase)) throw unavailable();
        const identity = await auth.verifyIdToken(token, true).catch(() => null);
        if (identity?.uid !== request.auth.uid) throw unavailable();
        const requestId = data.recoveryRequestId;
        if (requestId !== undefined && (typeof requestId !== 'string' || !requestIdPattern.test(requestId))) {
            throw new HttpsError('invalid-argument', 'Reload Account settings and try again.');
        }
        await limit('rotate-recovery', identity.uid, 12);
        const target = accountRef(studentId);
        const record = (await target.get()).data();
        if (record?.uid !== identity.uid) throw unavailable();
        await verifyPassphrase(record, data.passphrase);
        const proof = requestId ? digest(JSON.stringify(['rotate-recovery', studentId, requestId])) : null;
        const nonce = randomBytes(16).toString('hex');
        const keyForRotation = salt => formatCode(createHmac('sha256', Buffer.from(record.hash, 'hex'))
            .update(JSON.stringify(['student-backup-key', requestId, salt])).digest('hex').slice(0, 24));
        const recoveryCode = await db.runTransaction(async tx => {
            const [current, profile] = await Promise.all([tx.get(target), tx.get(ref('users', identity.uid))]);
            const account = current.data();
            if (account?.uid !== identity.uid || account.status !== 'active' || account.hash !== record.hash ||
                !activeStudent(profile.data()) || profile.data().studentId !== studentId) throw unavailable();
            if (hasResetClaim(account)) throw resetInProgress();
            const time = now();
            const receipts = (account.rotationReceipts || []).filter(receipt => receipt.until > time);
            const receipt = proof && receipts.find(entry => entry.proof === proof);
            if (receipt) {
                if (receipt.nonce) {
                    const key = keyForRotation(receipt.nonce);
                    if (account.recoveryHash === codeHash(key)) return key;
                }
                throw new HttpsError('failed-precondition', 'A newer backup key replaced this one. Start a new request if you still need a key.');
            }
            if (account.recoveryHash !== record.recoveryHash) throw new HttpsError('failed-precondition', 'Another backup key was just created. Check it before making a new one.');
            const key = proof ? keyForRotation(nonce) : newCode();
            tx.update(target, {
                recoveryHash: codeHash(key), recoveryReceipt: null,
                rotationReceipts: proof ? [...receipts, { proof, nonce, until: time + recoveryReceiptMs }] : receipts
            });
            return key;
        });
        return { studentId, recoveryCode };
    }

    async function authorizeRedemption(tx, action, account) {
        if (action !== 'backup') {
            const [classroom, approved] = await Promise.all([
                activeClass(tx, account.classId, account.teacherId), approvedTeacher(tx, account.teacherId)
            ]);
            if (!classroom || !approved) throw unavailable();
        }
        if (action === 'setup') return;
        const profile = (await tx.get(ref('users', account.uid))).data();
        if (!activeStudent(profile)) throw unavailable();
        if (action === 'reset') {
            const member = (await tx.get(ref('classMembers', account.uid + '_' + account.classId))).data();
            if (!classMember(member, account.uid, account.classId)) throw unavailable();
        }
    }

    async function redeem(action, data, studentId, record, passphrase) {
        const code = normalizeCode(data.code), presentedHash = digest(code);
        const setup = action === 'setup';
        const requestId = data.recoveryRequestId;
        if (requestId !== undefined && (typeof requestId !== 'string' || !requestIdPattern.test(requestId))) {
            throw new HttpsError('invalid-argument', 'Reload the recovery page and try again.');
        }
        const proof = requestId && /^[A-F0-9]{24}$/.test(code)
            ? digest(JSON.stringify([action, studentId, requestId, presentedHash])) : null;
        const keyFor = hash => formatCode(createHmac('sha256', Buffer.from(hash, 'hex'))
            .update('student-recovery-key:' + proof).digest('hex').slice(0, 24));
        const matchesReceipt = account => proof && account?.recoveryReceipt?.proof === proof &&
            account.recoveryReceipt.until > now() && account.recoveryHash === codeHash(keyFor(account.hash));
        const contact = record?.username ? { username: record.username } : { studentId };
        const resumeReceipt = async () => {
            await verifyPassphrase(record, passphrase);
            await db.runTransaction(async tx => {
                const current = (await tx.get(accountRef(studentId))).data();
                if (current?.uid !== record.uid || current.hash !== record.hash || !matchesReceipt(current)) throw unavailable();
                if (hasResetClaim(current)) throw unavailable();
                if (setup) {
                    if (!activeStudent((await tx.get(ref('users', current.uid))).data())) throw unavailable();
                } else {
                    await authorizeRedemption(tx, action, current);
                }
            });
            const { token } = await signIn(record, studentId, passphrase);
            return { token, ...contact, recoveryCode: keyFor(record.hash) };
        };
        if (matchesReceipt(record)) return resumeReceipt();
        const expectedStatus = action === 'setup' ? 'setup' : 'active';
        const validCode = account => account?.status === expectedStatus && /^[A-F0-9]{24}$/.test(code) &&
            (action === 'backup' ? account.recoveryHash === presentedHash : account.codeHash === presentedHash && account.codeExpires > now());
        if (!validCode(record)) throw unavailable();
        const names = setup ? {
            firstName: studentName(data.firstName), middleName: studentName(data.middleName, true), lastName: studentName(data.lastName)
        } : null;
        const salt = randomBytes(16).toString('hex');
        const hash = (await deriveKey(passphrase, salt, 64)).toString('hex');
        const target = accountRef(studentId);
        const claim = setup ? null : randomBytes(16).toString('hex');

        async function readAuthorized(tx) {
            const current = (await tx.get(target)).data();
            if (!validCode(current) || current.uid !== record.uid) throw unavailable();
            await authorizeRedemption(tx, action, current);
            return current;
        }

        const recoveryCode = proof ? keyFor(hash) : newCode();
        const credentials = {
            status: 'active', salt, hash, codeHash: null, codeExpires: null, updatedAt: timestamp(),
            recoveryHash: codeHash(recoveryCode),
            recoveryReceipt: proof ? { proof, until: now() + recoveryReceiptMs } : null
        };
        if (setup) {
            await db.runTransaction(async tx => {
                const { uid, classId } = await readAuthorized(tx);
                tx.create(ref('users', uid), { ...names, role: 'student', status: 'active', studentId, createdAt: timestamp() });
                tx.create(ref('classMembers', uid + '_' + classId), { userId: uid, classId, status: 'active', joinedAt: timestamp() });
                tx.create(ref('studentClassSlots', uid), { classId });
                tx.update(target, credentials);
            });
        } else {
            // Only one authorized request may revoke sessions before changing the passphrase.
            await db.runTransaction(async tx => {
                const current = await readAuthorized(tx);
                if (hasResetClaim(current)) throw resetInProgress();
                tx.update(target, { resetClaim: claim, resetClaimUntil: now() + resetClaimMs });
            });
            try {
                await auth.revokeRefreshTokens(record.uid).catch(error => {
                    if (error.code !== 'auth/user-not-found') throw error;
                });
                await db.runTransaction(async tx => {
                    const current = await readAuthorized(tx);
                    if (current.resetClaim !== claim) throw resetInProgress();
                    tx.update(target, { ...credentials, resetClaim: null, resetClaimUntil: null });
                });
            } catch (error) {
                await db.runTransaction(async tx => {
                    if ((await tx.get(target)).data()?.resetClaim === claim) tx.update(target, { resetClaim: null, resetClaimUntil: null });
                }).catch(() => {});
                throw error;
            }
        }
        return { token: await auth.createCustomToken(record.uid), ...contact, recoveryCode };
    }

    return async request => {
        const data = request.data;
        if (!data || !['register', 'setup', 'sign-in', 'reset', 'backup', 'rotate-recovery', 'issue', 'reissue'].includes(data.action)) {
            throw new HttpsError('invalid-argument', 'Choose a student account action.');
        }
        const { action } = data;
        try {
            if (action === 'register') return await register(request);
            if (action === 'issue') return await issue(data, await teacher(request));
            const identity = action === 'reissue' ? await teacher(request) : null;
            if (!['reissue','rotate-recovery'].includes(action)) {
                await limit('student-source', request.rawRequest ? clientAddress(request.rawRequest) || 'unknown' : 'unknown', 240);
            }
            const studentId = await lookupStudent(data.username ?? data.studentId);
            if (action === 'reissue' || action === 'rotate-recovery') {
                if (!studentId) throw unavailable();
                return action === 'reissue' ? await reissue(data, identity, studentId) : await rotateRecovery(request, data, studentId);
            }
            const record = studentId ? (await accountRef(studentId).get()).data() : null;
            if (record) await limit(action, studentId, 12);
            if (action === 'sign-in') {
                if (!checkPassword(data.passphrase)) throw unavailable();
                return await signIn(record, studentId, data.passphrase);
            }
            return await redeem(action, data, studentId, record, passphraseFor(data.passphrase));
        } catch (error) {
            if (error instanceof HttpsError) throw error;
            console.error('Student access:', error.code || 'internal');
            throw new HttpsError('unavailable', 'Student access is temporarily unavailable. Try again shortly.');
        }
    };
}

module.exports = { studentAccessHandler };
