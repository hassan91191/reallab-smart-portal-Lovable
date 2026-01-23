const { getLabConfigCached } = require('./_lab_config_provider');
const { getClients } = require('./_google');
const { resolveLogoFileMeta } = require('./_logo_resolver');

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
    // We want BOTH id + name so the frontend can cache-bust using v=<fileName>.
    let resolvedLogoFileId = cfg.logoFileId;
    let resolvedLogoFileName = cfg.logoFileName;
    try {
      const { drive } = getClients();
      const dynamic = await resolveLogoFileMeta(drive, cfg.driveFolderId);
      if (dynamic?.id) {
        resolvedLogoFileId = dynamic.id;
        resolvedLogoFileName = dynamic.name;
      }
    } catch (e) {
      console.log('Logo resolve failed:', e.message || String(e));
    }

    const logoUrl = resolvedLogoFileId
      ? `/.netlify/functions/download-file?lab=${encodeURIComponent(lab)}&fileId=${encodeURIComponent(resolvedLogoFileId)}&logo=1&v=${encodeURIComponent(resolvedLogoFileName || resolvedLogoFileId)}`
      : undefined;

    // IMPORTANT: in production we DO NOT cache this endpoint, because logo needs to update immediately.
    // The heavier caching is handled inside _lab_config_provider / google clients when needed.
    return json(200, {
      labKey: cfg.labKey,
      driveFolderId: cfg.driveFolderId,
      logSheetId: cfg.logSheetId,
      logoFileId: resolvedLogoFileId,
      logoFileName: resolvedLogoFileName,
      logoUrl,
      title: cfg.title || 'نتائج التحاليل الطبية',
      subtitle: undefined,
    });
  } catch (e) {
    return json(500, { error: 'server_error', message: e.message || String(e) });
  }
};

function json(statusCode, body) {
  const headers = { 'content-type': 'application/json; charset=utf-8' };
  // Do not cache: ensures logo/config always fresh in Netlify + browsers.
  headers['cache-control'] = 'no-store';
  headers['netlify-cdn-cache-control'] = 'no-store';
  return {
    statusCode,
    headers,
    body: JSON.stringify(body),
  };
}
