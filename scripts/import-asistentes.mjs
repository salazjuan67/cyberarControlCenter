import fs from "fs";
import { config } from "dotenv";
import { createClient } from "@supabase/supabase-js";
import { parseAsistenteFiles, asistenteKey } from "../lib/asistentes/import.ts";

config({ path: ".env.local" });

const defaultFiles = [
  "/Users/juansebastiansalazar/Downloads/INSCRIPTOS CIBERDEFENSA Y COMUNICACION PARA DIFUSION.xlsx",
  "/Users/juansebastiansalazar/Downloads/CUC.xlsx",
];

const filePaths = process.argv.slice(2).length > 0 ? process.argv.slice(2) : defaultFiles;

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const key = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!url || !key) {
  console.error("Faltan NEXT_PUBLIC_SUPABASE_URL o SUPABASE_SERVICE_ROLE_KEY");
  process.exit(1);
}

for (const path of filePaths) {
  if (!fs.existsSync(path)) {
    console.error("No se encontró el archivo:", path);
    process.exit(1);
  }
}

function toRow(asistente, id) {
  return {
    id,
    nombre: asistente.nombre,
    apellido: asistente.apellido,
    email: asistente.email,
    telefono: asistente.telefono,
    organizacion: asistente.organizacion,
    cargo: asistente.cargo,
    categoria: asistente.categoria,
    modalidad: asistente.modalidad,
    estado: asistente.estado,
    origen: asistente.origen,
    pais: asistente.pais,
    region: asistente.region,
    responsable: asistente.responsable,
    probabilidad: asistente.probabilidad,
    ultimo_contacto: asistente.ultimoContacto || null,
    proxima_accion: asistente.proximaAccion,
    notas: asistente.notas,
  };
}

const buffers = filePaths.map((path) => {
  const buf = fs.readFileSync(path);
  return {
    name: path.split("/").pop(),
    buffer: buf.buffer.slice(buf.byteOffset, buf.byteOffset + buf.byteLength),
  };
});

const parsed = parseAsistenteFiles(buffers);
const valid = parsed.rows.filter((r) => r.errors.length === 0);

console.log(`Archivos: ${filePaths.map((p) => p.split("/").pop()).join(", ")}`);
console.log(`Hojas: ${parsed.mergedSheets.join(", ")}`);
console.log(`Filas válidas (deduplicadas): ${valid.length}`);

const supabase = createClient(url, key);
const { data: existing, error: fetchError } = await supabase
  .from("asistentes_potenciales")
  .select("id, email");

if (fetchError) {
  console.error("Error leyendo asistentes existentes:", fetchError.message);
  process.exit(1);
}

console.log(`Asistentes existentes: ${existing?.length ?? 0}`);

const existingByEmail = new Map();
for (const row of existing ?? []) {
  const keyMatch = asistenteKey({ email: String(row.email ?? "") });
  if (keyMatch) existingByEmail.set(keyMatch, row.id);
}

const payload = valid.map((row, index) => {
  const keyMatch = asistenteKey(row.asistente);
  const existingId = existingByEmail.get(keyMatch);
  return toRow(row.asistente, existingId ?? `asp-imp-${Date.now()}-${index}`);
});

let imported = 0;
const chunkSize = 100;
for (let i = 0; i < payload.length; i += chunkSize) {
  const chunk = payload.slice(i, i + chunkSize);
  const { error } = await supabase.from("asistentes_potenciales").upsert(chunk, { onConflict: "id" });
  if (error) {
    console.error(`Error en chunk ${i / chunkSize + 1}:`, error.message);
    process.exit(1);
  }
  imported += chunk.length;
  console.log(`  · ${imported}/${payload.length}`);
}

const { count } = await supabase
  .from("asistentes_potenciales")
  .select("*", { count: "exact", head: true });

console.log(`Listo. Total asistentes en DB: ${count}`);

const { data: sample } = await supabase
  .from("asistentes_potenciales")
  .select("nombre, apellido, email, origen")
  .eq("email", "lopez@fie.undef.edu.ar")
  .maybeSingle();

console.log("Verificación lopez@fie.undef.edu.ar:", sample);
