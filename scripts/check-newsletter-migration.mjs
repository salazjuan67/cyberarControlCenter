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
    // optional
  }
}

loadEnv();

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const key = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!url || !key) {
  console.error("Faltan variables de Supabase");
  process.exit(1);
}

async function main() {
  const supabase = createClient(url, key, {
    auth: { persistSession: false, autoRefreshToken: false },
  });

  const probe = await supabase.from("newsletter_campaigns").select("id").limit(1);
  if (!probe.error) {
    console.log("Tablas newsletter_campaigns / newsletter_deliveries ya existen.");
    return;
  }

  console.log(
    "Las tablas no existen. Ejecutá en Supabase → SQL Editor:\n\n" +
      readFileSync("supabase/migrations/add_newsletter_tracking.sql", "utf8")
  );
  process.exit(1);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
