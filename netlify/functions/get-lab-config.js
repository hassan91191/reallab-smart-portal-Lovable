const { getLabConfigCached } = require('./_lab_config_provider');
const { getClients } = require('./_google');
const { resolveLogoMeta } = require('./_logo_resolver');

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
    // We return both fileId and fileName so the frontend can cache-bust by version.
    let resolvedLogoFileId = cfg.logoFileId;
    let resolvedLogoFileName = cfg.logoFileName;
    try {
      const { drive } = getClients();
      const dynamic = await resolveLogoMeta(drive, cfg.driveFolderId);
      if (dynamic?.id) {
        resolvedLogoFileId = dynamic.id;
        resolvedLogoFileName = dynamic.name || resolvedLogoFileName;
      }
    } catch (e) {
      console.log('Logo resolve failed:', e.message || String(e));
    }

    const version = resolvedLogoFileName || resolvedLogoFileId || '';

    return json(200, {
      labKey: cfg.labKey,
      driveFolderId: cfg.driveFolderId,
      logSheetId: cfg.logSheetId,
      logoFileId: resolvedLogoFileId,
      logoFileName: resolvedLogoFileName,
      logoUrl: resolvedLogoFileId
        ? `/.netlify/functions/download-file?lab=${encodeURIComponent(lab)}&fileId=${encodeURIComponent(resolvedLogoFileId)}&logo=1&v=${encodeURIComponent(version)}`
        : undefined,
      title: cfg.title || 'نتائج التحاليل الطبية',
      subtitle: undefined,
    });
  } catch (e) {
    return json(500, { error: 'server_error', message: e.message || String(e) });
  }
};

function json(statusCode, body) {
  const headers = {
    'content-type': 'application/json; charset=utf-8',
  };

  // IMPORTANT: this endpoint must reflect latest logo changes immediately.
  // So we disable caching here; the logo itself can be cached safely because its URL changes when the logo name changes.
  headers['cache-control'] = 'no-store';

  return {
    statusCode,
    headers,
    body: JSON.stringify(body),
  };
}
