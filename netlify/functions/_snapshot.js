function getStoreInstance(lambdaEvent) {
  const { getStore, connectLambda } = require('@netlify/blobs');

  if (lambdaEvent) {
    try { connectLambda(lambdaEvent); } catch (_) {}
  }

  const storeName = process.env.REGISTRY_BLOBS_STORE || 'registry-snapshot';
  return getStore(storeName);
}

function keyNorm(labKey) {
  return String(labKey || '').trim().toUpperCase();
}

function makeKey(labKey) {
  const safe = keyNorm(labKey);
  return `labs/${safe}.json`;
}

async function getLabSnapshot(lambdaEvent, labKey) {
  const safe = keyNorm(labKey);
  if (!safe) return null;
  const store = getStoreInstance(lambdaEvent);
  return await store.get(makeKey(safe), { type: 'json' });
}

async function setLabSnapshot(lambdaEvent, labKey, configObj) {
  const safe = keyNorm(labKey);
  if (!safe) throw new Error('Missing labKey');
  const store = getStoreInstance(lambdaEvent);
  await store.set(makeKey(safe), JSON.stringify(configObj), {
    contentType: 'application/json',
  });
  return { ok: true };
}

module.exports = { getLabSnapshot, setLabSnapshot };
