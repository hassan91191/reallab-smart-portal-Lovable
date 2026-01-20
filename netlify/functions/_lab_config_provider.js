const { getLabConfig: getLabConfigFromSheet } = require('./_registry');
const { getLabSnapshot, setLabSnapshot } = require('./_snapshot');

function normalize(s) {
  return String(s || '').trim();
}
function keyNorm(s) {
  return normalize(s).toUpperCase();
}

function ttlSeconds() {
  const raw = process.env.CACHE_TTL_SECONDS || '600';
  const n = parseInt(raw, 10);
  return Number.isFinite(n) && n > 0 ? n : 600;
}

const mem = new Map(); // LABKEY_UPPER -> { expiresAtMs, config }

function getFromMem(key) {
  const entry = mem.get(key);
  if (!entry) return null;
  if (Date.now() > entry.expiresAtMs) {
    mem.delete(key);
    return null;
  }
  return entry.config;
}

function setMem(key, config) {
  mem.set(key, {
    expiresAtMs: Date.now() + ttlSeconds() * 1000,
    config,
  });
}

function invalidateLabConfig(labKey) {
  mem.delete(keyNorm(labKey));
}

async function getLabConfigCached(lambdaEvent, labKey) {
  const raw = normalize(labKey);
  if (!raw) {
    const err = new Error('Missing lab');
    err.code = 'MISSING_LAB';
    throw err;
  }

  const key = keyNorm(raw);

  // 1) Memory cache
  const m = getFromMem(key);
  if (m) return m;

  // 2) Blobs snapshot
  try {
    const snap = await getLabSnapshot(lambdaEvent, key);
    if (snap) {
      setMem(key, snap);
      return snap;
    }
  } catch (e) {
    console.log('Snapshot read failed:', e.message || String(e));
  }

  // 3) Sheet fallback
  const cfg = await getLabConfigFromSheet(raw);

  // snapshot best-effort
  try {
    await setLabSnapshot(lambdaEvent, key, cfg);
  } catch (e) {
    console.log('Snapshot write failed:', e.message || String(e));
  }

  setMem(key, cfg);
  return cfg;
}

module.exports = { getLabConfigCached, invalidateLabConfig };
