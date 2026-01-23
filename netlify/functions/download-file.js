const { getClients } = require('./_google');
const { getLabConfigCached } = require('./_lab_config_provider');
const { resolveLogoFileId } = require('./_logo_resolver');

// Marker file prefix created by Whats Sender to indicate portal access should be blocked
const BLOCK_MARKER_PREFIX = '__PORTAL_BLOCKED__';

// IMPORTANT: Netlify's esbuild bundling sometimes inlines/minifies the file in a way that can
// break references to helper symbols if they are not in scope where used. Keeping `json()`
// defined before handler avoids "ReferenceError: json is not defined" in production.
function json(statusCode, body) {
  return {
    statusCode,
    headers: { 'content-type': 'application/json; charset=utf-8', 'cache-control': 'no-store', 'netlify-cdn-cache-control': 'no-store' },
    body: JSON.stringify(body),
  };
}

exports.handler = async (event) => {
  try {
    const qp = event.queryStringParameters || {};
    const lab = (qp.lab || '').trim();
    const patientId = (qp.id || '').trim();
    const fileId = (qp.fileId || '').trim();
    const isLogo = qp.logo === '1' || qp.logo === 'true';
    const forceDownload = qp.download === '1' || qp.download === 'true';

    if (!lab) return json(400, { error: 'missing_lab' });
    if (!fileId) return json(400, { error: 'missing_fileId' });

    const cfg = await getLabConfigCached(event, lab);
    if (!cfg) return json(404, { error: 'lab_not_found' });

    const { drive } = getClients();

    if (isLogo) {
      // Allow dynamic logo resolved from Drive folder "Lab Logo" or fixed logoFileId from registry
      let ok = cfg.logoFileId && cfg.logoFileId === fileId;
      if (!ok) {
        try {
          const dynamic = await resolveLogoFileId(drive, cfg.driveFolderId);
          ok = dynamic && dynamic === fileId;
        } catch (_) {
          ok = false;
        }
      }
      if (!ok) return json(404, { error: 'logo_not_found' });
      const meta = await getMeta(drive, fileId);
      const streamRes = await drive.files.get({ fileId, alt: 'media', supportsAllDrives: true }, { responseType: 'arraybuffer' });
      return bin(200, Buffer.from(streamRes.data), meta.mimeType || 'application/octet-stream', meta.name, forceDownload ? 'attachment' : 'inline', 'public, max-age=86400, immutable');
    }

    if (!patientId) return json(400, { error: 'missing_id' });
    if (!cfg.driveFolderId) return json(500, { error: 'lab_not_ready' });

    // Find patient folder id
    const qFolder = [
      `'${cfg.driveFolderId}' in parents`,
      `name = '${escapeQ(patientId)}'`,
      `mimeType = 'application/vnd.google-apps.folder'`,
      `trashed = false`
    ].join(' and ');

    const folderRes = await drive.files.list({
      q: qFolder,
      fields: 'files(id,name)',
      pageSize: 5,
      includeItemsFromAllDrives: true,
      supportsAllDrives: true,
    });

    const patientFolder = folderRes.data.files?.[0];
    if (!patientFolder) return json(404, { error: 'patient_folder_not_found' });

    // Gate: if a Whats Sender block marker exists inside patient folder, block ALL downloads/views.
    const marker = await findBlockMarkerInFolder(drive, patientFolder.id);
    if (marker) {
      const amount = extractAmountFromMarkerName(marker.name);
      return json(403, {
        error: 'blocked',
        blocked: true,
        amount,
        markerFileId: marker.id,
        markerFileName: marker.name,
      });
    }

    const ok = await isDescendantOf(drive, fileId, patientFolder.id);
    if (!ok) return json(403, { error: 'not_allowed' });

    const meta = await getMeta(drive, fileId);
    const streamRes = await drive.files.get({ fileId, alt: 'media', supportsAllDrives: true }, { responseType: 'arraybuffer' });

    // Inline for pdf/images, attachment otherwise (or when forced)
    const mime = meta.mimeType || 'application/octet-stream';
    const inline = !forceDownload && /^application\/pdf$|^image\//.test(mime);

    return {
      statusCode: 200,
      isBase64Encoded: true,
      headers: {
        'content-type': mime,
        'content-disposition': `${inline ? 'inline' : 'attachment'}; filename*=UTF-8''${encodeRFC5987(meta.name || 'file')}`,
        'cache-control': 'no-store',
      },
      body: Buffer.from(streamRes.data).toString('base64'),
    };
  } catch (e) {
    return json(500, { error: 'server_error', message: e.message || String(e) });
  }
};


async function findBlockMarkerInFolder(drive, folderId) {
  const q = [
    `'${folderId}' in parents`,
    `name contains '${BLOCK_MARKER_PREFIX}'`,
    `trashed = false`,
    `mimeType != 'application/vnd.google-apps.folder'`,
  ].join(' and ');

  const res = await drive.files.list({
    q,
    fields: 'files(id,name)',
    pageSize: 10,
    includeItemsFromAllDrives: true,
    supportsAllDrives: true,
  });

  const files = res.data.files || [];
  return files.find(f => (f.name || '').startsWith(BLOCK_MARKER_PREFIX) && /\.txt$/i.test(f.name || '')) || null;
}

function extractAmountFromMarkerName(name) {
  const n = String(name || '');
  const after = n.startsWith(BLOCK_MARKER_PREFIX) ? n.slice(BLOCK_MARKER_PREFIX.length) : n;
  const m = after.match(/(\d+)/);
  return m ? Number(m[1]) : 0;
}


async function getMeta(drive, fileId) {
  const res = await drive.files.get({
    fileId,
    fields: 'id,name,mimeType,parents',
    supportsAllDrives: true,
  });
  return res.data;
}

async function isDescendantOf(drive, fileId, ancestorId) {
  const visited = new Set();
  let cur = fileId;
  for (let hops = 0; hops < 25; hops++) {
    if (visited.has(cur)) return false;
    visited.add(cur);
    const meta = await getMeta(drive, cur);
    const parents = meta.parents || [];
    if (parents.includes(ancestorId)) return true;
    if (parents.length === 0) return false;
    cur = parents[0];
  }
  return false;
}

function escapeQ(s) {
  return String(s).replace(/'/g, "\'");
}

function encodeRFC5987(str) {
  return encodeURIComponent(str)
    .replace(/['()]/g, escape)
    .replace(/\*/g, '%2A')
    .replace(/%(7C|60|5E)/g, (m) => m.toLowerCase());
}

function bin(statusCode, buf, mime, filename, disposition = 'inline', cacheControl = 'no-store') {
  return {
    statusCode,
    isBase64Encoded: true,
    headers: {
      'content-type': mime,
      'content-disposition': `${disposition}; filename*=UTF-8''${encodeRFC5987(filename || 'file')}`,
      'cache-control': cacheControl,
      ...(cacheControl !== 'no-store' ? { 'netlify-cdn-cache-control': cacheControl } : {}),
    },
    body: Buffer.from(buf).toString('base64'),
  };
}

// json() helper is defined above the handler.
