// Resolve lab logo dynamically from Google Drive.
// Expected structure:
//   <driveFolderId>/Lab Logo/Logo.* (png/jpg/svg/...)
//
// This is a best-effort helper. If no logo is found, returns null.

function normalize(s) {
  return String(s || '').trim();
}

// Small in-memory cache per warm instance
const mem = new Map(); // parentFolderId -> { expiresAtMs, fileId }

function getFromMem(key) {
  const e = mem.get(key);
  if (!e) return null;
  if (Date.now() > e.expiresAtMs) {
    mem.delete(key);
    return null;
  }
  return e.fileId;
}

function setMem(key, fileId, ttlMs) {
  mem.set(key, { expiresAtMs: Date.now() + ttlMs, fileId });
}

async function resolveLogoFileId(drive, driveFolderId) {
  const parentId = normalize(driveFolderId);
  if (!parentId) return null;

  // 60s cache: still "each open" practically, but avoids hot looping.
  const cached = getFromMem(parentId);
  if (cached) return cached;

  // Find "Lab Logo" folder under parent
  const qLogoFolder = [
    `'${parentId}' in parents`,
    `mimeType = 'application/vnd.google-apps.folder'`,
    `name = 'Lab Logo'`,
    `trashed = false`,
  ].join(' and ');

  const folderRes = await drive.files.list({
    q: qLogoFolder,
    fields: 'files(id,name)',
    pageSize: 5,
    includeItemsFromAllDrives: true,
    supportsAllDrives: true,
  });

  const logoFolder = folderRes.data.files?.[0];
  if (!logoFolder) return null;

  // List files inside logo folder
  const qFiles = [
    `'${logoFolder.id}' in parents`,
    `trashed = false`,
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
  if (files.length === 0) return null;

  // Prefer exact "Logo" (case-insensitive) then startsWith("logo")
  const pick = (predicate) => files.find((f) => predicate(String(f.name || '')));
  const byExact = pick((n) => n.trim().toLowerCase() === 'logo');
  const byPrefix = pick((n) => n.trim().toLowerCase().startsWith('logo'));
  const byContains = pick((n) => n.trim().toLowerCase().includes('logo'));

  const chosen = byExact || byPrefix || byContains || files[0];
  const fileId = chosen?.id || null;

  if (fileId) setMem(parentId, fileId, 60 * 1000);
  return fileId;
}

module.exports = { resolveLogoFileId };
