/**
 * Dev-only Recently Approved Airtable diagnostic.
 * Does not print tokens, emails, phones, or other record values.
 *
 * Run: node --env-file=.env.local scripts/debug-recently-approved.mjs
 */

import fs from "node:fs";
import path from "node:path";

function loadLocalEnv() {
  const envPath = path.join(process.cwd(), ".env.local");
  if (!fs.existsSync(envPath)) return;
  const text = fs.readFileSync(envPath, "utf8");
  for (const line of text.split(/\r?\n/)) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const index = trimmed.indexOf("=");
    if (index < 0) continue;
    const key = trimmed.slice(0, index).trim();
    let value = trimmed.slice(index + 1).trim();
    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1);
    }
    if (!process.env[key]) process.env[key] = value;
    else process.env[key] = value;
  }
}

loadLocalEnv();

const accessToken = process.env.AIRTABLE_ACCESS_TOKEN?.trim().replace(/^["']|["']$/g, "");
const baseId = process.env.AIRTABLE_BASE_ID?.trim()
  .replace(/^["']|["']$/g, "")
  .replace(/\.+$/, "");
const tableName = (
  process.env.AIRTABLE_APPLICATIONS_TABLE?.trim().replace(/^["']|["']$/g, "") ||
  "Applications"
);

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

async function query(label, params) {
  const url = `https://api.airtable.com/v0/${baseId}/${encodeURIComponent(tableName)}?${params.toString()}`;
  const res = await fetch(url, { headers: authHeaders() });
  const raw = await res.text();
  let payload = {};
  try {
    payload = JSON.parse(raw);
  } catch {
    payload = { parseError: true, raw: raw.slice(0, 200) };
  }
  const err = payload.error ?? {};
  const keys = Array.isArray(payload.records)
    ? [...new Set(payload.records.flatMap((record) => Object.keys(record.fields ?? {})))].sort()
    : [];

  console.log(
    JSON.stringify(
      {
        test: label,
        status: res.status,
        ok: res.ok,
        type: typeof err === "object" ? err.type ?? null : null,
        message:
          typeof err === "object"
            ? err.message ?? null
            : typeof err === "string"
              ? err
              : null,
        recordCount: Array.isArray(payload.records) ? payload.records.length : null,
        sampleFieldNames: keys,
        rawPreview: res.ok ? undefined : String(raw).slice(0, 200),
      },
      null,
      2,
    ),
  );
}

async function listApplicationFields() {
  const url = `https://api.airtable.com/v0/meta/bases/${baseId}/tables`;
  const res = await fetch(url, { headers: authHeaders() });
  const raw = await res.text();
  let payload = {};
  try {
    payload = JSON.parse(raw);
  } catch {
    payload = {};
  }
  if (!res.ok) {
    console.log(
      JSON.stringify(
        {
          test: "schema",
          status: res.status,
          type: payload.error?.type ?? null,
          message: payload.error?.message ?? null,
          rawPreview: raw.slice(0, 200),
        },
        null,
        2,
      ),
    );
    return;
  }

  const table = (payload.tables ?? []).find(
    (item) => String(item.name) === tableName,
  );
  const fields = (table?.fields ?? []).map((field) => ({
    name: field.name,
    type: field.type,
  }));
  const dateLike = fields.filter((field) =>
    /date|time|approv|status|name|email|phone/i.test(field.name),
  );
  console.log(
    JSON.stringify(
      {
        test: "schema",
        status: res.status,
        ok: true,
        table: table?.name ?? null,
        dateOrIdentityFields: dateLike,
      },
      null,
      2,
    ),
  );
}

async function main() {
  console.log(
    JSON.stringify(
      {
        config: {
          table: tableName,
          baseIdLooksValid: /^app[a-zA-Z0-9]{10,}$/.test(baseId),
          tokenLooksValid: /^(pat|key)[a-zA-Z0-9]/.test(accessToken),
          basePrefix: baseId.slice(0, 3),
          tokenPrefix: accessToken.slice(0, 3),
          baseLength: baseId.length,
          tokenLength: accessToken.length,
        },
      },
      null,
      2,
    ),
  );

  await listApplicationFields();

  const a = new URLSearchParams({ maxRecords: "3", pageSize: "3" });
  await query("A", a);

  const b = new URLSearchParams({ maxRecords: "3", pageSize: "3" });
  for (const field of [
    "Name",
    "Phone",
    "Email",
    "Vetting Status",
    "Membership Approval Date",
  ]) {
    b.append("fields[]", field);
  }
  await query("B", b);

  const c = new URLSearchParams({
    maxRecords: "3",
    pageSize: "3",
    filterByFormula: "LOWER({Vetting Status})='approved'",
  });
  for (const field of ["Name", "Phone", "Email", "Vetting Status"]) {
    c.append("fields[]", field);
  }
  await query("C", c);

  const d = new URLSearchParams({
    maxRecords: "3",
    pageSize: "3",
    filterByFormula:
      "AND(LOWER({Vetting Status})='approved',NOT({Membership Approval Date}=BLANK()),DATETIME_DIFF(TODAY(),{Membership Approval Date},'days')>=0,DATETIME_DIFF(TODAY(),{Membership Approval Date},'days')<=60)",
  });
  for (const field of [
    "Name",
    "Phone",
    "Email",
    "Vetting Status",
    "Membership Approval Date",
  ]) {
    d.append("fields[]", field);
  }
  d.append("sort[0][field]", "Membership Approval Date");
  d.append("sort[0][direction]", "desc");
  await query("D", d);
}

main().catch((error) => {
  console.error(
    JSON.stringify({
      ok: false,
      type: "NETWORK",
      message: error instanceof Error ? error.message : String(error),
    }),
  );
  process.exit(1);
});
