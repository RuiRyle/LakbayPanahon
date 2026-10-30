// Applies one reviewed storyScenes.clueHunt field. Dry run unless --apply is supplied.
const fs = require("fs");
const path = require("path");
const plan = require("../data/clue-hunt-pilot-migration.json");

const encode = value => {
    if (value === null) return { nullValue: null };
    if (typeof value === "string") return { stringValue: value };
    if (typeof value === "boolean") return { booleanValue: value };
    if (typeof value === "number") return Number.isInteger(value)
        ? { integerValue: String(value) }
        : { doubleValue: value };
    if (Array.isArray(value)) return { arrayValue: { values: value.map(encode) } };
    if (value && typeof value === "object") {
        return { mapValue: { fields: Object.fromEntries(Object.entries(value).map(([key, item]) => [key, encode(item)])) } };
    }
    throw new Error("Unsupported Firestore value.");
};

const decode = value => {
    if (!value) return undefined;
    if (value.stringValue !== undefined) return value.stringValue;
    if (value.booleanValue !== undefined) return value.booleanValue;
    if (value.integerValue !== undefined) return Number(value.integerValue);
    if (value.doubleValue !== undefined) return value.doubleValue;
    if (value.nullValue !== undefined) return null;
    if (value.arrayValue) return (value.arrayValue.values || []).map(decode);
    if (value.mapValue) return Object.fromEntries(Object.entries(value.mapValue.fields || {}).map(([key, item]) => [key, decode(item)]));
    return undefined;
};

const stable = value => JSON.stringify(value, (_, item) => item && typeof item === "object" && !Array.isArray(item)
    ? Object.fromEntries(Object.entries(item).sort(([left], [right]) => left.localeCompare(right)))
    : item);

async function main() {
    if (process.env.FIRESTORE_EMULATOR_HOST) throw new Error("This pilot targets the configured original Firestore project only.");
    if (plan.projectId !== "lakbaypanahon-1797e" || plan.write.path !== "storyScenes/mission1-scene1" || plan.write.field !== "clueHunt") {
        throw new Error("Unexpected project, document, or field scope.");
    }
    if (!plan.write.value.choices.includes(plan.write.value.correctAnswer)) throw new Error("The clue hunt answer is missing from its choices.");

    const firebaseTools = require(path.join(process.env.APPDATA, "npm/node_modules/firebase-tools/lib/auth.js"));
    const account = firebaseTools.getProjectDefaultAccount(path.join(__dirname, ".."));
    if (!account) throw new Error("Sign in with Firebase CLI before running this migration.");
    const token = await firebaseTools.getAccessToken(account.tokens.refresh_token, ["https://www.googleapis.com/auth/cloud-platform"]);
    const base = `https://firestore.googleapis.com/v1/projects/${plan.projectId}/databases/(default)/documents`;
    const headers = { Authorization: `Bearer ${token.access_token}`, "Content-Type": "application/json" };

    async function call(url, body) {
        const response = await fetch(url, { headers, ...(body ? { method: "POST", body: JSON.stringify(body) } : {}) });
        const result = await response.json();
        if (!response.ok) throw new Error(`Firestore ${response.status}: ${result.error?.message || "request failed"}`);
        return result;
    }

    const current = await call(`${base}/${plan.write.path}`);
    for (const [key, expected] of Object.entries(plan.write.expected)) {
        if (decode(current.fields?.[key]) !== expected) throw new Error(`Reviewed scene no longer matches ${key}; no write was made.`);
    }

    const existing = decode(current.fields?.[plan.write.field]);
    const sameValue = stable(existing) === stable(plan.write.value);
    if (existing !== undefined && !sameValue) throw new Error("A clueHunt field already exists with different content; no write was made.");

    const apply = process.argv.includes("--apply");
    console.log(JSON.stringify({ project: plan.projectId, document: plan.write.path, field: plan.write.field, changeRequired: !sameValue, mode: apply ? "apply" : "dry-run" }));
    if (!apply || sameValue) return;

    const backupDirectory = path.join(__dirname, "../backups");
    fs.mkdirSync(backupDirectory, { recursive: true });
    const backupFile = path.join(backupDirectory, `clue-hunt-pilot-${Date.now()}.json`);
    fs.writeFileSync(backupFile, JSON.stringify({ name: current.name, updateTime: current.updateTime, document: current }, null, 2));

    await call(`${base}:commit`, {
        writes: [{
            update: {
                name: current.name,
                fields: { [plan.write.field]: encode(plan.write.value) }
            },
            updateMask: { fieldPaths: [plan.write.field] },
            currentDocument: { updateTime: current.updateTime }
        }]
    });

    const saved = await call(`${base}/${plan.write.path}`);
    if (stable(decode(saved.fields?.[plan.write.field])) !== stable(plan.write.value)) throw new Error("Firestore read-back did not match the authored pilot.");
    console.log(`Clue Hunt pilot saved and verified. Backup: ${backupFile}`);
}

main().catch(error => {
    console.error(error.message);
    process.exitCode = 1;
});
