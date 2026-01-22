const { getClients } = require('./_google');
const { getLabConfigCached } = require('./_lab_config_provider');

// Marker file prefix created by Whats Sender to indicate portal access should be blocked
const BLOCK_MARKER_PREFIX = '__PORTAL_BLOCKED__';

exports.handler = async (event) => {
  try {
    const lab = (event.queryStringParameters?.lab || '').trim();
    const patientId = (event.queryStringParameters?.id || '').trim();

    if (!lab) return json(400, { error: 'missing_lab', message: 'Missing lab' });
    if (!patientId) return json(400, { error: 'missing_id', message: 'Missing patient id' });

    const cfg = await getLabConfigCached(event, lab);
    if (!cfg) return json(404, { error: 'lab_not_found', message: 'LabKey not found' });
    if (!cfg.driveFolderId) return json(500, { error: 'lab_not_ready', message: 'DriveFolderId not configured for this lab' });

    const { drive } = getClients();

    // 1) Find patient folder under lab root
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
    if (!patientFolder) {
      return json(404, { error: 'patient_folder_not_found', message: 'Patient folder not found' });
    }

    // 2) List files inside patient folder
    const qFiles = [
      `'${patientFolder.id}' in parents`,
      `trashed = false`,
      `mimeType != 'application/vnd.google-apps.folder'`
    ].join(' and ');

    const filesRes = await drive.files.list({
      q: qFiles,
      fields: 'files(id,name,mimeType,size,modifiedTime)',
      orderBy: 'modifiedTime desc',
      pageSize: 200,
      includeItemsFromAllDrives: true,
      supportsAllDrives: true,
    });

    const files = (filesRes.data.files || []).map(f => ({
      id: f.id,
      name: f.name,
      mimeType: f.mimeType,
      size: f.size,
      modifiedTime: f.modifiedTime,
    }));


    // 3) Gate: if a Whats Sender block marker exists, do NOT return files.
    const marker = files.find(f => {
      const n = (f.name || '');
      return n.startsWith(BLOCK_MARKER_PREFIX) && /\.txt$/i.test(n);
    });

    if (marker) {
      const amount = extractAmountFromMarkerName(marker.name);
      return json(200, {
        labKey: cfg.labKey,
        patientId,
        folderId: patientFolder.id,
        blocked: true,
        amount,
        markerFileId: marker.id,
        markerFileName: marker.name,
        files: [],
      });
    }

    return json(200, {
      labKey: cfg.labKey,
      patientId,
      folderId: patientFolder.id,
      files,
    });
  } catch (e) {
    return json(500, { error: 'server_error', message: e.message || String(e) });
  }
};


function extractAmountFromMarkerName(name) {
  // Expected: __PORTAL_BLOCKED__150.txt (amount only, no currency)
  // Be tolerant: pick the first group of digits after the prefix.
  const n = String(name || '');
  const after = n.startsWith(BLOCK_MARKER_PREFIX) ? n.slice(BLOCK_MARKER_PREFIX.length) : n;
  const m = after.match(/(\d+)/);
  return m ? Number(m[1]) : 0;
}


function escapeQ(s) {
  // Escape single quotes for Drive query
  return String(s).replace(/'/g, "\'");
}

function json(statusCode, body) {
  return {
    statusCode,
    headers: {
      'content-type': 'application/json; charset=utf-8',
      'cache-control': 'no-store',
    },
    body: JSON.stringify(body),
  };
}
