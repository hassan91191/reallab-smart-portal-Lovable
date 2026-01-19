const { upsertLabConfig } = require('./_registry');
const { setLabSnapshot } = require('./_snapshot');
const { invalidateLabConfig } = require('./_lab_config_provider');

exports.handler = async (event) => {
  try {
    if (event.httpMethod !== 'POST') return json(405, { error: 'method_not_allowed' });

    const token = event.headers['x-admin-token'] || event.headers['X-Admin-Token'] || '';
    const expected = process.env.REGISTRY_ADMIN_TOKEN || '';
    if (!expected || token !== expected) {
      return json(401, { error: 'unauthorized' });
    }

    const body = safeJson(event.body);
    const labKey = String(body.labKey || '').trim();
    const driveFolderId = String(body.driveFolderId || '').trim();
    const logSheetId = String(body.logSheetId || '').trim();
    const logoFileId = String(body.logoFileId || '').trim();
    const title = String(body.title || '').trim();
    const subtitle = String(body.subtitle || '').trim();

    if (!labKey || !driveFolderId || !logSheetId) {
      return json(400, { error: 'bad_request', message: 'labKey, driveFolderId, logSheetId are required' });
    }

    const result = await upsertLabConfig({ labKey, driveFolderId, logSheetId, logoFileId, title, subtitle });

    // Enterprise-ready: update Blobs snapshot so reads don't have to hit Google Sheets.
    const snapshot = {
      labKey,
      driveFolderId,
      logSheetId,
      logoFileId,
      title,
      subtitle,
    };
    try {
      await setLabSnapshot(labKey, snapshot);
    } catch (e) {
      console.log('Snapshot update failed:', e.message || String(e));
    }

    // Invalidate in-memory cache (warm instance)
    invalidateLabConfig(labKey);

    return json(200, { ok: true, result, snapshotUpdated: true });
  } catch (e) {
    return json(500, { error: 'server_error', message: e.message || String(e) });
  }
};

function safeJson(txt) { try { return txt ? JSON.parse(txt) : {}; } catch { return {}; } }
function json(statusCode, body) {
  return {
    statusCode,
    headers: { 'content-type': 'application/json; charset=utf-8', 'cache-control': 'no-store' },
    body: JSON.stringify(body)
  };
}
