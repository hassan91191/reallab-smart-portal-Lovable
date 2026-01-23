// Resolve lab logo dynamically from Google Drive.
// Expected structure:
//   <driveFolderId>/Lab Logo/<logo files>
//
// We support the Whats Sender timestamp naming convention:
//   Logo_yyyyMMdd_HHmmss.png
//
// If such a file exists, we pick the newest one.
// Otherwise we fall back to any file that starts with "logo".

function normalize(s) {
  return String(s || '').trim();
}

// Small in-memory cache per warm instance
// parentFolderId -> { expiresAtMs, meta }
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

function isTimestampLogoName(name) {
  // Logo_20260123_153012.png
  return /^Logo_\d{8}_\d{6}\.png$/i.test(String(name || '').trim());
}

async function resolveLogoMeta(drive, driveFolderId) {
  const parentId = normalize(driveFolderId);
  if (!parentId) return null;

  // Keep this short; we want quick updates when lab changes the logo.
  const cached = getFromMem(parentId);
  if (cached) return cached;

  // Find "Lab Logo" folder under parent (case-insensitive match in code for robustness)
  const qFolders = [
    `'${parentId}' in parents`,
    `mimeType = 'application/vnd.google-apps.folder'`,
    `trashed = false`,
  ].join(' and ');

  const folderRes = await drive.files.list({
    q: qFolders,
    fields: 'files(id,name)',
    pageSize: 50,
    includeItemsFromAllDrives: true,
    supportsAllDrives: true,
  });

  const folders = folderRes.data.files || [];
  const logoFolder = folders.find((f) => String(f.name || '').trim().toLowerCase() === 'lab logo');
  if (!logoFolder) return null;

  const qFiles = [`'${logoFolder.id}' in parents`, `trashed = false`].join(' and ');
  const filesRes = await drive.files.list({
    q: qFiles,
    fields: 'files(id,name,mimeType,modifiedTime)',
    pageSize: 50,
    includeItemsFromAllDrives: true,
    supportsAllDrives: true,
    orderBy: 'modifiedTime desc',
  });

  const files = filesRes.data.files || [];
  if (files.length === 0) return null;

  // Prefer timestamped Logo_yyyyMMdd_HHmmss.png
  const timestamped = files.filter((f) => isTimestampLogoName(f.name));
  const chosen = (timestamped[0] || files.find((f) => String(f.name || '').trim().toLowerCase().startsWith('logo')) || files[0]);

  const meta = chosen
    ? {
        id: chosen.id || null,
        name: chosen.name || null,
        mimeType: chosen.mimeType || null,
        modifiedTime: chosen.modifiedTime || null,
      }
    : null;

  if (meta?.id) {
    // 5s is enough to avoid hot loops, but still near-instant updates on refresh.
    setMem(parentId, meta, 5 * 1000);
  }
  return meta;
}

// Backward compatible helper (existing code imports this)
async function resolveLogoFileId(drive, driveFolderId) {
  const meta = await resolveLogoMeta(drive, driveFolderId);
  return meta?.id || null;
}

module.exports = { resolveLogoMeta, resolveLogoFileId };
