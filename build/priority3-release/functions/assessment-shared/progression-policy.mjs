export function requireProgressionPolicy(policy) {
    if (!policy || !Number.isSafeInteger(policy.xpPerLevel) || policy.xpPerLevel < 1 ||
        !Number.isSafeInteger(policy.version) || policy.version < 1) {
        throw new Error("Level progression is unavailable: configure positive integer xpPerLevel and version in learningSettings/progression.");
    }
    return {xpPerLevel: policy.xpPerLevel, version: policy.version};
}
export function progressionState(xp, policy) {
    const {xpPerLevel, version} = requireProgressionPolicy(policy);
    if (!Number.isSafeInteger(xp) || xp < 0) throw new Error("Invalid student XP.");
    const level = Math.floor(xp / xpPerLevel) + 1;
    if (!Number.isSafeInteger(level)) throw new Error("Student level is outside the supported range.");
    const xpInLevel = xp % xpPerLevel;
    return {level, xpPerLevel, version, xpInLevel, xpUntilNextLevel: xpPerLevel - xpInLevel,
        percent: Math.round(xpInLevel / xpPerLevel * 100)};
}
