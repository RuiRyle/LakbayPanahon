// Restrict rollout to eras that already exist; never create empty curriculum.
function existingEraPlan(plan, existingPaths) {
    const writes = plan.writes.filter(write => !write.path.startsWith('eras/') || existingPaths.has(write.path));
    const required = new Set(writes.flatMap(write => write.fields.requiredChapterIds || []));
    return {
        ...plan,
        writes,
        prerequisites: plan.prerequisites.filter(item => required.has(item.path.split('/')[1])),
        deferred: plan.writes.filter(write => !writes.includes(write)).map(write => write.path)
    };
}
module.exports = {existingEraPlan};
