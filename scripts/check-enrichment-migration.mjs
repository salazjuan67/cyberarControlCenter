import { readFileSync } from "node:fs";
import { createClient } from "@supabase/supabase-js";

function loadEnv() {
  try {
    const raw = readFileSync(".env.local", "utf8");
    for (const line of raw.split("\n")) {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith("#")) continue;
      const eq = trimmed.indexOf("=");
      if (eq === -1) continue;
      const key = trimmed.slice(0, eq);
      let value = trimmed.slice(eq + 1);
      if (
        (value.startsWith('"') && value.endsWith('"')) ||
        (value.startsWith("'") && value.endsWith("'"))
      ) {
        value = value.slice(1, -1);
      }
      if (!process.env[key]) process.env[key] = value;
    }
  } catch {
    // .env.local optional when vars are exported
  }
}

loadEnv();

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const key = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!url || !key) {
  console.error("Faltan NEXT_PUBLIC_SUPABASE_URL o SUPABASE_SERVICE_ROLE_KEY");
  process.exit(1);
}

const sql = `
ALTER TABLE sponsors ADD COLUMN IF NOT EXISTS proposed_email TEXT DEFAULT '';
ALTER TABLE sponsors ADD COLUMN IF NOT EXISTS email_source_url TEXT DEFAULT '';
`;

async function main() {
  const supabase = createClient(url, key, {
    auth: { persistSession: false, autoRefreshToken: false },
  });

  const { error: probeError } = await supabase
    .from("sponsors")
    .select("proposed_email")
    .limit(1);

  if (!probeError) {
    console.log("Columnas proposed_email / email_source_url ya existen.");
    return;
  }

  if (!probeError.message.includes("proposed_email")) {
    throw probeError;
  }

  console.log(
    "Las columnas no existen. Ejecutá este SQL en Supabase → SQL Editor:\n"
  );
  console.log(sql.trim());
  process.exit(1);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
