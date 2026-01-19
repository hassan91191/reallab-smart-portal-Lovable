// Snapshot storage for lab configs using Netlify Blobs.
// One JSON blob per labKey: labs/<labKey>.json
//
// NOTE: getStore() must be called at request-time (not module init) to avoid
// MissingBlobsEnvironmentError in some Netlify runtimes.

function getStoreInstance(lambdaEvent) {
  // In Netlify "Lambda compatibility mode", the Blobs environment may not be
  // configured automatically. In that case, we must initialize it explicitly.
  // See Netlify guidance for MissingBlobsEnvironmentError.
  const { getStore, connectLambda } = require('@netlify/blobs');

  if (lambdaEvent) {
    try {
      connectLambda(lambdaEvent);
    } catch (_) {
      // Best-effort. If Blobs is not available, callers will fall back to Sheets.
    }
  }

  const storeName = process.env.REGISTRY_BLOBS_STORE || 'registry-snapshot';
  return getStore(storeName);
}

function makeKey(labKey) {
  const safe = String(labKey || '').trim();
  return `labs/${safe}.json`;
}

async function getLabSnapshot(lambdaEvent, labKey) {
  const key = makeKey(labKey);
  if (key === 'labs/.json') return null;
  const store = getStoreInstance(lambdaEvent);
  // Returns null if not found
  return await store.get(key, { type: 'json' });
}

async function setLabSnapshot(lambdaEvent, labKey, configObj) {
  const key = makeKey(labKey);
  if (key === 'labs/.json') throw new Error('Missing labKey');
  const store = getStoreInstance(lambdaEvent);
  // setJSON will JSON.stringify internally
  const res = await store.setJSON(key, configObj);
  return res;
}

module.exports = { getLabSnapshot, setLabSnapshot };
