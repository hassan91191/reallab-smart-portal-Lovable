# Real Lab Smart Portal (Multi-Labs via LabKey) - Enterprise Ready

This repo is **Netlify-ready** (static site + Netlify Functions) and supports **multiple labs** on the same portal via:

`/?lab=<LabKey>&id=<PatientID>`

## Service Account (موحَّد لكل المعامل)

Service Account Email (ثابت في الكود / Env):

`netlify-connect@crested-photon-483015-i9.iam.gserviceaccount.com`

> البرنامج (C#) بيعمل Share تلقائي لـ Drive folder + Logs sheet مع ال Service Account.

---

## Registry (موحَّد)

**Registry Sheet واحدة مركزية** تحتوي على إعدادات كل معمل.

- Spreadsheet: أي Google Sheet (ID ثابت في Env)
- Tab name: **`Labs`**

### أعمدة Tab `Labs`
| Col | Name |
|-----|------|
| A | LabKey |
| B | DriveFolderId |
| C | LogSheetId |
| D | LogoFileId |
| E | Title (optional) |
| F | Subtitle (optional) |

---

## Per-Lab (لكل معمل على حدة)
- Google Drive root folder: `Lab Results - <LabKey>`
- Logs Sheet: `Portal_Logs_DB - <LabKey>` (SpreadsheetId مختلف لكل معمل) + Tab اسمه:
  - **`Patient Lab Log`**
- Logo file (optional) داخل `PortalAssets/` تحت فولدر المعمل

---

## Enterprise-Ready Optimization

### 1) Cache TTL (10 دقائق)
- In-memory cache داخل الـ Function instance
- HTTP cache لــ endpoint `/.netlify/functions/get-lab-config`

Set via env:
- `CACHE_TTL_SECONDS=600`

### 2) Snapshot JSON (Netlify Blobs)
عند `register-lab` بنعمل Snapshot JSON لكل LabKey داخل Netlify Blobs:
- Key: `labs/<LabKey>.json`

وده بيقلل الضغط على Google Sheets لأن أغلب القراءات بتبقى من Blobs + Memory cache.

Optional env:
- `REGISTRY_BLOBS_STORE=registry-snapshot`

---

## Required Netlify Environment Variables

### Google Service Account
- `GOOGLE_SERVICE_ACCOUNT_JSON`
  - JSON كامل، أو Base64 بصيغة: `base64:<...>`

### Registry Sheet
- `REGISTRY_SHEET_ID` (SpreadsheetId بتاع الـ Registry Sheet الموحد)
- `REGISTRY_SHEET_TAB` = `Labs`

### Logs tab name
- `LAB_LOG_TAB_NAME` = `Patient Lab Log`

### Admin token (للـ register-lab)
- `REGISTRY_ADMIN_TOKEN` (أي قيمة سرية)

---

## Endpoints

- `/.netlify/functions/get-lab-config?lab=<LabKey>`
- `/.netlify/functions/get-files?lab=<LabKey>&id=<PatientID>`
- `/.netlify/functions/download-file?lab=<LabKey>&id=<PatientID>&fileId=<FileId>`
- `/.netlify/functions/log-access` (POST)
- `/.netlify/functions/register-lab` (POST + header `x-admin-token`)

