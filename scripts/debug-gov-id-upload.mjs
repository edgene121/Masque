/**
 * One-off Airtable Government ID upload debug (dev only).
 * Does not print tokens, file contents, or attachment URLs.
 *
 * Run: node --env-file=.env.local scripts/debug-gov-id-upload.mjs
 */

const accessToken = process.env.AIRTABLE_ACCESS_TOKEN?.trim();
const baseId = process.env.AIRTABLE_BASE_ID?.trim();
const tableName =
  process.env.AIRTABLE_APPLICATIONS_TABLE?.trim() || "Applications";
const fieldName = "Government ID";

if (!accessToken || !baseId) {
  console.error("Missing AIRTABLE_ACCESS_TOKEN or AIRTABLE_BASE_ID");
  process.exit(1);
}

function authHeaders() {
  return {
    Authorization: `Bearer ${accessToken}`,
    "Content-Type": "application/json",
  };
}

async function listTablesMeta() {
  const url = `https://api.airtable.com/v0/meta/bases/${baseId}/tables`;
  const res = await fetch(url, { headers: authHeaders() });
  const body = await res.json().catch(() => ({}));
  return { status: res.status, body };
}

async function findFirstRecord() {
  const params = new URLSearchParams({ maxRecords: "3" });
  const url = `https://api.airtable.com/v0/${baseId}/${encodeURIComponent(tableName)}?${params}`;
  const res = await fetch(url, { headers: authHeaders() });
  const body = await res.json().catch(() => ({}));
  return { status: res.status, body };
}

async function getRecord(recordId) {
  const url = `https://api.airtable.com/v0/${baseId}/${encodeURIComponent(tableName)}/${encodeURIComponent(recordId)}`;
  const res = await fetch(url, { headers: authHeaders() });
  const body = await res.json().catch(() => ({}));
  return { status: res.status, body };
}

async function uploadTinyPng(recordId, fieldIdOrName, host = "api") {
  // 1x1 PNG
  const pngBase64 =
    "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==";

  const hostBase =
    host === "content"
      ? "https://content.airtable.com"
      : "https://api.airtable.com";

  const url = `${hostBase}/v0/${baseId}/${encodeURIComponent(recordId)}/${encodeURIComponent(fieldIdOrName)}/uploadAttachment`;

  const res = await fetch(url, {
    method: "POST",
    headers: authHeaders(),
    body: JSON.stringify({
      contentType: "image/png",
      file: pngBase64,
      filename: "debug-gov-id.png",
    }),
  });

  const text = await res.text();
  let body;
  try {
    body = JSON.parse(text);
  } catch {
    body = { raw: text.slice(0, 800) };
  }

  // Strip any attachment URLs from success payloads before printing.
  if (body?.fields && typeof body.fields === "object") {
    const sanitizedFields = {};
    for (const [key, value] of Object.entries(body.fields)) {
      if (Array.isArray(value)) {
        sanitizedFields[key] = value.map((att) => ({
          id: att?.id,
          filename: att?.filename,
          type: att?.type,
          size: att?.size,
          hasUrl: Boolean(att?.url),
        }));
      } else {
        sanitizedFields[key] = value;
      }
    }
    body = { ...body, fields: sanitizedFields };
  }

  return {
    host,
    httpStatus: res.status,
    requestPath: `/v0/{baseId}/${recordId}/${fieldIdOrName}/uploadAttachment`,
    fieldIdOrNameUsed: fieldIdOrName,
    body,
  };
}

console.log("=== CONFIG (no secrets) ===");
console.log({
  baseId,
  tableName,
  governmentIdFieldName: fieldName,
});

const meta = await listTablesMeta();
console.log("\n=== META TABLES ===");
console.log("HTTP status:", meta.status);
if (meta.status !== 200) {
  console.log("Meta error:", JSON.stringify(meta.body, null, 2));
} else {
  const tables = meta.body.tables || [];
  const table = tables.find((t) => t.name === tableName || t.id === tableName);
  console.log(
    "Matched table:",
    table ? { id: table.id, name: table.name } : null,
  );
  if (table) {
    const govField = (table.fields || []).find(
      (f) => f.name === fieldName || f.id === fieldName,
    );
    console.log(
      "Government ID field:",
      govField
        ? { id: govField.id, name: govField.name, type: govField.type }
        : null,
    );
    if (!govField) {
      console.log(
        "All fields:",
        (table.fields || []).map((f) => `${f.name} (${f.type})`),
      );
    }
  }
}

const listed = await findFirstRecord();
console.log("\n=== LIST APPLICATIONS RECORDS ===");
console.log("HTTP status:", listed.status);
if (listed.status !== 200) {
  console.log("List error:", JSON.stringify(listed.body, null, 2));
  process.exit(1);
}

const records = listed.body.records || [];
console.log(
  "Records sample:",
  records.map((r) => ({
    id: r.id,
    email: r.fields?.Email ? "[present]" : "[missing]",
    fieldKeys: Object.keys(r.fields || {}),
    hasGovernmentIdKey: Object.prototype.hasOwnProperty.call(
      r.fields || {},
      fieldName,
    ),
    governmentIdCount: Array.isArray(r.fields?.[fieldName])
      ? r.fields[fieldName].length
      : r.fields?.[fieldName] == null
        ? null
        : typeof r.fields[fieldName],
  })),
);

const record = records[0];
if (!record?.id) {
  console.error("No application records found to test upload.");
  process.exit(1);
}

console.log("\n=== GET SINGLE RECORD ===");
const single = await getRecord(record.id);
console.log("HTTP status:", single.status);
console.log({
  id: single.body?.id,
  hasGovernmentIdKey: Object.prototype.hasOwnProperty.call(
    single.body?.fields || {},
    fieldName,
  ),
  fieldKeys: Object.keys(single.body?.fields || {}),
});

console.log("\n=== UPLOAD via api.airtable.com + field NAME ===");
const byNameApi = await uploadTinyPng(record.id, fieldName, "api");
console.log(JSON.stringify(byNameApi, null, 2));

console.log("\n=== UPLOAD via content.airtable.com + field NAME ===");
const byNameContent = await uploadTinyPng(record.id, fieldName, "content");
console.log(JSON.stringify(byNameContent, null, 2));

console.log("\nDone.");
