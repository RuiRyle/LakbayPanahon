// Daily learning uses the Philippines calendar, independent of device timezone.
export function learningDateKey(date = new Date()) {
    return new Date(date.getTime() + 8 * 3600000).toISOString().slice(0,10);
}
export function selectDailyChallenge(challenges, date = new Date()) {
    const active=challenges.filter(row=>row.status === "active").slice()
        .sort((a,b)=>(Number(a.order)||0)-(Number(b.order)||0)||a.id.localeCompare(b.id));
    if (!active.length) return null;
    const day=learningDateKey(date);
    const index=Math.floor((Date.parse(day)-Date.UTC(Number(day.slice(0,4)),0,1))/86400000);
    return active[index % active.length];
}
export function millisecondsUntilLearningMidnight(date = new Date()) {
    const next=Date.parse(learningDateKey(date)+"T00:00:00.000Z")+86400000-8*3600000;
    return Math.max(1,next-date.getTime());
}
