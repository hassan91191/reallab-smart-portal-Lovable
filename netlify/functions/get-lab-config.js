const { getLabConfigCached } = require('./_lab_config_provider');
const { getClients } = require('./_google');
const { resolveLogoFileId } = require('./_logo_resolver');

exports.handler = async (event) => {
  try {
    const lab = (event.queryStringParameters?.lab || '').trim();
    if (!lab) {
      return json(400, { error: 'missing_lab', message: 'Missing lab query parameter' });
    }

    const cfg = await getLabConfigCached(event, lab);
    if (!cfg) {
      return json(404, { error: 'lab_not_found', message: 'LabKey not found in Registry' });
    }

    // Resolve logo dynamically from Drive folder "Lab Logo" (best-effort)
    let resolvedLogoFileId = cfg.logoFileId;
    try {
      const { drive } = getClients();
      const dynamic = await resolveLogoFileId(drive, cfg.driveFolderId);
      if (dynamic) resolvedLogoFileId = dynamic;
    } catch (e) {
      console.log('Logo resolve failed:', e.message || String(e));
    }

    return json(200, {
      labKey: cfg.labKey,
      driveFolderId: cfg.driveFolderId,
      logSheetId: cfg.logSheetId,
      logoFileId: resolvedLogoFileId,
      logoUrl: resolvedLogoFileId
        ? `/.netlify/functions/download-file?lab=${encodeURIComponent(lab)}&fileId=${encodeURIComponent(resolvedLogoFileId)}&logo=1`
        : undefined,
      title: cfg.title || 'نتائج التحاليل الطبية',
      subtitle: undefined,
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
