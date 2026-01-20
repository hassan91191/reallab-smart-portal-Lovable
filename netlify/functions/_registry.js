const { getClients } = require('./_google');

const REG_TAB_DEFAULT = 'Labs';

function normalize(s) {
  return String(s || '').trim();
}
function keyNorm(s) {
  return normalize(s).toUpperCase();
}
function sameKey(a, b) {
  return keyNorm(a) === keyNorm(b);
}

// كشف بدائي لو ده "اسم" مش ID
function looksLikeId(x) {
  x = normalize(x);
  if (!x) return false;
  if (x.includes(' ')) return false;
  const low = x.toLowerCase();
  if (low.startsWith('lab results')) return false;
  if (low.startsWith('portal_logs_db')) return false;
  return true;
}

function asHeaderMap(headerRow) {
  const map = {};
  headerRow.forEach((h, idx) => {
    const key = normalize(h).toLowerCase();
    if (!key) return;
    map[key] = idx;
  });
  return map;
}

function pick(row, headerMap, ...keysOrIndexes) {
  for (const k of keysOrIndexes) {
    if (typeof k === 'number') {
      if (row[k] != null && normalize(row[k])) return normalize(row[k]);
    } else {
      const idx = headerMap[k.toLowerCase()];
      if (idx != null && row[idx] != null && normalize(row[idx])) return normalize(row[idx]);
    }
  }
  return '';
}

async function ensureLabsTabAndHeader(sheets, spreadsheetId, tab) {
  // Ensure tab exists
  const meta = await sheets.spreadsheets.get({ spreadsheetId });
  const exists = (meta.data.sheets || []).some(s => (s.properties?.title || '') === tab);
  if (!exists) {
    await sheets.spreadsheets.batchUpdate({
      spreadsheetId,
      requestBody: { requests: [{ addSheet: { properties: { title: tab } } }] }
    });
  }

  // Ensure header row
  const headerRes = await sheets.spreadsheets.values.get({
    spreadsheetId,
    range: `${tab}!A1:F1`,
  });

  const headerRow = headerRes.data.values?.[0] || [];
  if (headerRow.length === 0) {
    await sheets.spreadsheets.values.update({
      spreadsheetId,
      range: `${tab}!A1:F1`,
      valueInputOption: 'RAW',
      requestBody: {
        values: [[ 'LabKey', 'DriveFolderId', 'LogSheetId', 'LogoFileId', 'Title', 'Subtitle' ]]
      },
    });
  }
}

async function getLabConfig(labKey) {
  const registrySheetId = process.env.REGISTRY_SHEET_ID;
  const tab = (process.env.REGISTRY_SHEET_TAB || REG_TAB_DEFAULT).trim();
  if (!registrySheetId) throw new Error('Missing env REGISTRY_SHEET_ID');

  labKey = normalize(labKey);
  if (!labKey) throw new Error('Missing lab');

  const { sheets } = await getClients();

  await ensureLabsTabAndHeader(sheets, registrySheetId, tab);

  const resp = await sheets.spreadsheets.values.get({
    spreadsheetId: registrySheetId,
    range: `${tab}!A1:F`,
    majorDimension: 'ROWS',
  });

  const rows = resp.data.values || [];
  if (rows.length === 0) throw new Error('Registry sheet is empty');

  const headerMap = asHeaderMap(rows[0] || []);

  let found = null;
  for (let i = 1; i < rows.length; i++) {
    const r = rows[i] || [];
    const key = pick(r, headerMap, 'labkey', 0);
    if (key && sameKey(key, labKey)) {
      const driveFolderId = pick(r, headerMap, 'drivefolderid', 'drivefolder', 1);
      const logSheetId = pick(r, headerMap, 'logsheetid', 'logsheet', 2);

      found = {
        rowIndex1Based: i + 1,
        labKey: key,
        driveFolderId,
        logSheetId,
        logoFileId: pick(r, headerMap, 'logofileid', 'logo', 3),
        title: pick(r, headerMap, 'title', 4),
        subtitle: pick(r, headerMap, 'subtitle', 5),
      };
      break;
    }
  }

  if (!found) {
    const err = new Error('Lab not registered');
    err.code = 'LAB_NOT_REGISTERED';
    throw err;
  }

  if (!found.driveFolderId || !found.logSheetId) {
    const err = new Error('Lab config incomplete (missing DriveFolderId or LogSheetId)');
    err.code = 'LAB_CONFIG_INCOMPLETE';
    throw err;
  }

  // لو متسجل اسم بدل ID -> ارمي Error واضح بدل ما يبوظ الموقع بصمت
  if (!looksLikeId(found.driveFolderId) || !looksLikeId(found.logSheetId)) {
    const err = new Error(
      'Registry contains names instead of IDs. Store real DriveFolderId/LogSheetId (IDs), not names.'
    );
    err.code = 'REGISTRY_IDS_INVALID';
    throw err;
  }

  return found;
}

async function upsertLabConfig(payload) {
  const registrySheetId = process.env.REGISTRY_SHEET_ID;
  const tab = (process.env.REGISTRY_SHEET_TAB || REG_TAB_DEFAULT).trim();
  if (!registrySheetId) throw new Error('Missing env REGISTRY_SHEET_ID');

  const labKey = normalize(payload.labKey);
  if (!labKey) throw new Error('Missing labKey');

  const driveFolderId = normalize(payload.driveFolderId);
  const logSheetId = normalize(payload.logSheetId);
  const logoFileId = normalize(payload.logoFileId);
  const title = normalize(payload.title);
  const subtitle = normalize(payload.subtitle);

  if (!driveFolderId || !logSheetId) throw new Error('driveFolderId and logSheetId are required');

  const { sheets } = await getClients();

  await ensureLabsTabAndHeader(sheets, registrySheetId, tab);

  const resp2 = await sheets.spreadsheets.values.get({
    spreadsheetId: registrySheetId,
    range: `${tab}!A1:F`,
    majorDimension: 'ROWS',
  });

  const rows2 = resp2.data.values || [];
  const headerMap = asHeaderMap(rows2[0] || []);

  let existingRow = -1;
  for (let i = 1; i < rows2.length; i++) {
    const key = pick(rows2[i] || [], headerMap, 'labkey', 0);
    if (key && sameKey(key, labKey)) { existingRow = i + 1; break; }
  }

  const values = [[ labKey, driveFolderId, logSheetId, logoFileId, title, subtitle ]];

  if (existingRow > 0) {
    await sheets.spreadsheets.values.update({
      spreadsheetId: registrySheetId,
      range: `${tab}!A${existingRow}:F${existingRow}`,
      valueInputOption: 'RAW',
      requestBody: { values },
    });
    return { action: 'updated', row: existingRow };
  }

  await sheets.spreadsheets.values.append({
    spreadsheetId: registrySheetId,
    range: `${tab}!A:F`,
    valueInputOption: 'RAW',
    insertDataOption: 'INSERT_ROWS',
    requestBody: { values },
  });

  return { action: 'inserted' };
}

module.exports = { getLabConfig, upsertLabConfig };
