const { getLabConfigCached } = require('./_lab_config_provider');

exports.handler = async (event) => {
  try {
    const lab = (event.queryStringParameters?.lab || '').trim();
    if (!lab) {
      return json(400, { error: 'missing_lab', message: 'Missing lab query parameter' });
    }

    const cfg = await getLabConfigCached(lab);
    if (!cfg) {
      return json(404, { error: 'lab_not_found', message: 'LabKey not found in Registry' });
    }

    // NOTE: Returning IDs is convenient for debugging and the desktop app,
    // but consider removing driveFolderId/logSheetId from the client response in high-security deployments.
    return json(200, {
      labKey: cfg.labKey,
      driveFolderId: cfg.driveFolderId,
      logSheetId: cfg.logSheetId,
      logoFileId: cfg.logoFileId,
      title: cfg.title || 'بوابة النتائج الذكية',
      subtitle: cfg.subtitle || 'نتائج التحاليل الطبية',
    });
  } catch (e) {
    return json(500, { error: 'server_error', message: e.message || String(e) });
  }
};

function json(statusCode, body) {
  const ttlRaw = process.env.CACHE_TTL_SECONDS || '600';
  const ttl = parseInt(ttlRaw, 10);
  const maxAge = Number.isFinite(ttl) && ttl > 0 ? ttl : 600;

  const headers = {
    'content-type': 'application/json; charset=utf-8',
  };

  if (statusCode === 200) {
    headers['cache-control'] = `public, max-age=${maxAge}`;
    headers['netlify-cdn-cache-control'] = `public, max-age=${maxAge}`;
  } else {
    headers['cache-control'] = 'no-store';
  }

  return {
    statusCode,
    headers,
    body: JSON.stringify(body),
  };
}
