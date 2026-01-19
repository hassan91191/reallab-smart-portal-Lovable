const { getLabConfig: getLabConfigFromSheet } = require('./_registry');
const { getLabSnapshot, setLabSnapshot } = require('./_snapshot');

function normalize(s) {
  return String(s || '').trim();
}

function ttlSeconds() {
  const raw = process.env.CACHE_TTL_SECONDS || '600';
  const n = parseInt(raw, 10);
  return Number.isFinite(n) && n > 0 ? n : 600;
}

// In-memory cache (per warm Lambda instance)
const mem = new Map(); // labKey -> { expiresAtMs, config }

function getFromMem(labKey) {
  const entry = mem.get(labKey);
  if (!entry) return null;
  if (Date.now() > entry.expiresAtMs) {
    mem.delete(labKey);
    return null;
  }
  return entry.config;
}

function setMem(labKey, config) {
  mem.set(labKey, {
    expiresAtMs: Date.now() + ttlSeconds() * 1000,
    config,
  });
}

function invalidateLabConfig(labKey) {
  mem.delete(normalize(labKey));
}

async function getLabConfigCached(labKey) {
  labKey = normalize(labKey);
  if (!labKey) {
    const err = new Error('Missing lab');
    err.code = 'MISSING_LAB';
    throw err;
  }

  // 1) Memory cache
  const m = getFromMem(labKey);
  if (m) return m;

  // 2) Blobs snapshot
  try {
    const snap = await getLabSnapshot(labKey);
    if (snap) {
      setMem(labKey, snap);
      return snap;
    }
  } catch (e) {
    // Snapshot is an optimization; continue to sheet fallback.
    // (We intentionally don't fail the request here.)
    console.log('Snapshot read failed:', e.message || String(e));
  }

  // 3) Sheet fallback (source of truth)
  const cfg = await getLabConfigFromSheet(labKey);

  // Write/update snapshot (best-effort)
  try {
    await setLabSnapshot(labKey, cfg);
  } catch (e) {
    console.log('Snapshot write failed:', e.message || String(e));
  }

  setMem(labKey, cfg);
  return cfg;
}

module.exports = {
  getLabConfigCached,
  invalidateLabConfig,
};
