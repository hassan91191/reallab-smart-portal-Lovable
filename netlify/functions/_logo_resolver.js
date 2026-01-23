// Resolve lab logo dynamically from Google Drive.
// Expected structure:
//   <Lab Results - LABKEY>/<Lab Logo>/<Logo_yyyyMMdd_HHmmss.png>
//
// The Whats Sender uploads the logo using a timestamped name to bust browser/CDN cache.
// We return both fileId + fileName so the frontend can include `v=<fileName>`.

function normalize(s) {
  return String(s || '').trim();
}

function lower(s) {
  return normalize(s).toLowerCase();
}

// Small in-memory cache per warm instance
// parentFolderId -> { expiresAtMs, meta: { id, name } }
const mem = new Map();

function getFromMem(key) {
  const e = mem.get(key);
  if (!e) return null;
  if (Date.now() > e.expiresAtMs) {
    mem.delete(key);
    return null;
  }
  return e.meta;
}

function setMem(key, meta, ttlMs) {
  mem.set(key, { expiresAtMs: Date.now() + ttlMs, meta });
}

async function findLabLogoFolderId(drive, parentId) {
  // Search for a folder named "Lab Logo" under parent.
  // We do a tolerant search because some drives may differ in case.
  const q = [
    `'${parentId}' in parents`,
    `mimeType = 'application/vnd.google-apps.folder'`,
    `trashed = false`,
  ].join(' and ');

  const res = await drive.files.list({
    q,
    fields: 'files(id,name)',
    pageSize: 100,
    includeItemsFromAllDrives: true,
    supportsAllDrives: true,
  });

  const folders = res.data.files || [];
  const exact = folders.find(f => lower(f.name) === 'lab logo');
  if (exact) return exact.id;

  // fallback: any folder containing both words
  const fallback = folders.find(f => {
    const n = lower(f.name);
    return n.includes('lab') && n.includes('logo');
  });

  return fallback ? fallback.id : null;
}

function pickLogoFile(files) {
  if (!files || files.length === 0) return null;
  // Prefer timestamp format: Logo_yyyyMMdd_HHmmss.png
  const reTs = /^logo_\d{8}_\d{6}\.png$/i;
  const ts = files.find(f => reTs.test(String(f.name || '')));
  if (ts) return ts;

  // Otherwise prefer anything starting with logo
  const byPrefix = files.find(f => lower(f.name).startsWith('logo'));
  if (byPrefix) return byPrefix;

  // Otherwise first (files are ordered by modifiedTime desc)
  return files[0];
}

async function resolveLogoFileMeta(drive, driveFolderId) {
  const parentId = normalize(driveFolderId);
  if (!parentId) return null;

  // 30s cache: keeps things responsive but still updates quickly.
  const cached = getFromMem(parentId);
  if (cached) return cached;

  const logoFolderId = await findLabLogoFolderId(drive, parentId);
  if (!logoFolderId) return null;

  const qFiles = [
    `'${logoFolderId}' in parents`,
    `trashed = false`,
    `mimeType != 'application/vnd.google-apps.folder'`,
  ].join(' and ');

  const filesRes = await drive.files.list({
    q: qFiles,
    fields: 'files(id,name,mimeType,modifiedTime)',
    pageSize: 50,
    includeItemsFromAllDrives: true,
    supportsAllDrives: true,
    orderBy: 'modifiedTime desc',
  });

  const files = filesRes.data.files || [];
  const chosen = pickLogoFile(files);
  if (!chosen || !chosen.id) return null;

  const meta = { id: chosen.id, name: chosen.name || 'Logo.png' };
  setMem(parentId, meta, 30 * 1000);
  return meta;
}

async function resolveLogoFileId(drive, driveFolderId) {
  const meta = await resolveLogoFileMeta(drive, driveFolderId);
  return meta ? meta.id : null;
}

module.exports = { resolveLogoFileMeta, resolveLogoFileId };
