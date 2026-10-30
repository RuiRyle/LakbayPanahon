'use strict';

const {failure, checkActive} = require('./errors.cjs');

function usageDay(milliseconds) {
    return new Date(milliseconds + 8 * 60 * 60 * 1000).toISOString().slice(0, 10);
}
function count(value) { return Number.isSafeInteger(value) && value >= 0; }

// Reservations survive restarts and multiple server instances. No chat text is saved.
// Failed or timed-out provider calls are intentionally not refunded or retried.
function createUsageReservation(db, {now = Date.now} = {}) {
    return async function reserveUsage({uid, settings, signal}) {
        checkActive(signal);
        const milliseconds = now(), date = usageDay(milliseconds), minute = Math.floor(milliseconds / 60000) * 60000;
        const ownerRef = db.doc('bayaniUsage/' + uid + '_' + date);
        const globalRef = db.doc('bayaniUsageDaily/' + date);
        await db.runTransaction(async transaction => {
            checkActive(signal);
            const [ownerSnapshot, globalSnapshot] = await transaction.getAll(ownerRef, globalRef);
            checkActive(signal);
            const owner = ownerSnapshot.exists ? ownerSnapshot.data() : null;
            const global = globalSnapshot.exists ? globalSnapshot.data() : null;
            if (owner && (owner.userId !== uid || owner.date !== date || !count(owner.requests)
                || !count(owner.minuteRequests) || !count(owner.minuteStartMillis) || owner.minuteStartMillis > minute)
                || global && (global.date !== date || !count(global.requests))) {
                throw failure('bayani/unavailable', 503);
            }
            const requests = owner?.requests || 0, globalRequests = global?.requests || 0;
            const minuteRequests = owner?.minuteStartMillis === minute ? owner.minuteRequests : 0;
            if (minuteRequests >= settings.perMinuteLimit) throw failure('bayani/rate-limit', 429);
            if (requests >= settings.perStudentDailyLimit || globalRequests >= settings.globalDailyLimit) {
                throw failure('bayani/quota-exceeded', 429);
            }
            checkActive(signal);
            transaction.set(ownerRef, {userId: uid, date, requests: requests + 1,
                minuteStartMillis: minute, minuteRequests: minuteRequests + 1, updatedAtMillis: milliseconds});
            transaction.set(globalRef, {date, requests: globalRequests + 1, updatedAtMillis: milliseconds});
        });
        checkActive(signal);
    };
}

module.exports = {createUsageReservation, usageDay};
