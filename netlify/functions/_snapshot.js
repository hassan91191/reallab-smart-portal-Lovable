// Snapshot storage for lab configs using Netlify Blobs.
// One JSON blob per labKey: labs/<labKey>.json
//
// NOTE: getStore() must be called at request-time (not module init) to avoid
// MissingBlobsEnvironmentError in some Netlify runtimes.

function getStoreInstance() {
  const { getStore } = require('@netlify/blobs');
  const storeName = process.env.REGISTRY_BLOBS_STORE || 'registry-snapshot';
  return getStore(storeName);
}

function makeKey(labKey) {
  const safe = String(labKey || '').trim();
  return `labs/${safe}.json`;
}

async function getLabSnapshot(labKey) {
  const key = makeKey(labKey);
  if (key === 'labs/.json') return null;
  const store = getStoreInstance();
  // Returns null if not found
  return await store.get(key, { type: 'json' });
}

async function setLabSnapshot(labKey, configObj) {
  const key = makeKey(labKey);
  if (key === 'labs/.json') throw new Error('Missing labKey');
  const store = getStoreInstance();
  // setJSON will JSON.stringify internally
  const res = await store.setJSON(key, configObj);
  return res;
}

module.exports = { getLabSnapshot, setLabSnapshot };
