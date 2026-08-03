import fs from "fs";
import { config } from "dotenv";
import { createClient } from "@supabase/supabase-js";
import { parseSponsorWorkbook, sponsorKey } from "../lib/sponsors/import.ts";

config({ path: ".env.local" });

const excelPath =
  process.argv[2] ||
  "/Users/juansebastiansalazar/Downloads/CyberAR_Base_Sponsors_Depurada_v1 (1).xlsx";
const sheetName = process.argv[3] || "Base Sponsors";

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const key = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!url || !key) {
  console.error("Faltan NEXT_PUBLIC_SUPABASE_URL o SUPABASE_SERVICE_ROLE_KEY");
  process.exit(1);
}

if (!fs.existsSync(excelPath)) {
  console.error("No se encontró el archivo:", excelPath);
  process.exit(1);
}

function toRow(sponsor, id) {
  return {
    id,
    empresa: sponsor.empresa,
    contacto: sponsor.contacto,
    email: sponsor.email,
    telefono: sponsor.telefono,
    categoria: sponsor.categoria,
    estado: sponsor.estado,
    monto_estimado: sponsor.montoEstimado,
    monto_confirmado: sponsor.montoConfirmado,
    probabilidad: sponsor.probabilidad,
    responsable: sponsor.responsable,
    segmento: sponsor.segmento,
    prioridad: sponsor.prioridad,
    region: sponsor.region,
    ultimo_contacto: sponsor.ultimoContacto || null,
    proxima_accion: sponsor.proximaAccion,
    notas: sponsor.notas,
  };
}

const buffer = fs.readFileSync(excelPath).buffer;
const parsed = parseSponsorWorkbook(buffer, { defaultMoneda: "ARS", sheetName });
const valid = parsed.rows.filter((r) => r.errors.length === 0);

console.log(`Hoja: ${parsed.sheetName} · Perfil: ${parsed.profile}`);
console.log(`Filas válidas: ${valid.length}`);

const supabase = createClient(url, key);
const { data: existing, error: fetchError } = await supabase
  .from("sponsors")
  .select("id, empresa, email");

if (fetchError) {
  console.error("Error leyendo sponsors existentes:", fetchError.message);
  process.exit(1);
}

console.log(`Sponsors existentes: ${existing?.length ?? 0}`);

const existingByKey = new Map();
for (const row of existing ?? []) {
  existingByKey.set(
    sponsorKey({ empresa: String(row.empresa), email: String(row.email ?? "") }),
    row.id
  );
}

const payload = valid.map((row, index) => {
  const keyMatch = sponsorKey(row.sponsor);
  const existingId = existingByKey.get(keyMatch);
  return toRow(row.sponsor, existingId ?? `s-imp-${Date.now()}-${index}`);
});

let imported = 0;
const chunkSize = 100;
for (let i = 0; i < payload.length; i += chunkSize) {
  const chunk = payload.slice(i, i + chunkSize);
  const { error } = await supabase.from("sponsors").upsert(chunk, { onConflict: "id" });
  if (error) {
    console.error(`Error en chunk ${i / chunkSize + 1}:`, error.message);
    process.exit(1);
  }
  imported += chunk.length;
  console.log(`  · ${imported}/${payload.length}`);
}

const { count } = await supabase.from("sponsors").select("*", { count: "exact", head: true });
console.log(`Listo. Total sponsors en DB: ${count}`);

const { data: check } = await supabase
  .from("sponsors")
  .select("empresa, prioridad, region, segmento")
  .eq("empresa", "Mercado Libre")
  .maybeSingle();
console.log("Verificación Mercado Libre:", check);
