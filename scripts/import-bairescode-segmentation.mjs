import dotenv from "dotenv";
import XLSX from "xlsx";
import { createClient } from "@supabase/supabase-js";

dotenv.config({ path: ".env.local" });

const sourcePath = process.argv.find((arg) => arg.endsWith(".xlsx"));
const dryRun = process.argv.includes("--dry-run");

if (!sourcePath) {
  throw new Error("Uso: node scripts/import-bairescode-segmentation.mjs <archivo.xlsx> [--dry-run]");
}

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!supabaseUrl || !serviceRoleKey) {
  throw new Error("Faltan NEXT_PUBLIC_SUPABASE_URL o SUPABASE_SERVICE_ROLE_KEY");
}

const supabase = createClient(supabaseUrl, serviceRoleKey);
const workbook = XLSX.readFile(sourcePath);
const emailKey = (value) => String(value ?? "").trim().toLowerCase();
const text = (value) => String(value ?? "").trim();

function readSheet(name) {
  const sheet = workbook.Sheets[name];
  if (!sheet) throw new Error(`No existe la hoja "${name}"`);
  return XLSX.utils.sheet_to_json(sheet, { defval: "" });
}

function probability(priority) {
  const normalized = text(priority).toLowerCase();
  if (normalized === "alta") return 80;
  if (normalized === "media") return 60;
  return 35;
}

function splitName(value) {
  const parts = text(value).split(/\s+/).filter(Boolean);
  return {
    nombre: parts.shift() ?? "",
    apellido: parts.join(" "),
  };
}

function note(parts) {
  return parts.filter(Boolean).join("\n");
}

function uniqueByEmail(rows, sheetName) {
  const seen = new Set();
  return rows.filter((row, index) => {
    const email = emailKey(row.Email);
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      throw new Error(`${sheetName}, fila ${index + 2}: email inválido (${email || "vacío"})`);
    }
    if (seen.has(email)) return false;
    seen.add(email);
    return true;
  });
}

async function loadExistingEmails(table) {
  const emails = new Set();
  for (let from = 0; ; from += 1000) {
    const { data, error } = await supabase.from(table).select("email").range(from, from + 999);
    if (error) throw new Error(error.message);
    for (const row of data) emails.add(emailKey(row.email));
    if (data.length < 1000) return emails;
  }
}

async function insertInBatches(table, rows) {
  for (let index = 0; index < rows.length; index += 100) {
    const { error } = await supabase.from(table).insert(rows.slice(index, index + 100));
    if (error) throw new Error(`${table}: ${error.message}`);
  }
}

const sponsorSource = uniqueByEmail(readSheet("Sponsors"), "Sponsors");
const attendeeSource = uniqueByEmail(readSheet("Asistentes sin cruce"), "Asistentes sin cruce");
const [existingSponsorEmails, existingAttendeeEmails] = await Promise.all([
  loadExistingEmails("sponsors"),
  loadExistingEmails("asistentes_potenciales"),
]);

const sponsors = sponsorSource
  .filter((row) => !existingSponsorEmails.has(emailKey(row.Email)))
  .map((row) => ({
    id: `sp-bairescode-${text(row["ID origen"])}`,
    empresa: text(row["Empresa / Entidad"]) || text(row.Marca) || text(row.Dominio),
    contacto: text(row.Contacto),
    email: emailKey(row.Email),
    telefono: "",
    categoria: "Plata",
    estado: "Lead",
    moneda: "USD",
    monto_estimado: 0,
    monto_confirmado: 0,
    probabilidad: probability(row.Prioridad),
    responsable: "",
    segmento: text(row["Categoría sponsor"]),
    prioridad: text(row.Prioridad),
    region: "",
    origen: "BairesCode",
    ultimo_contacto: null,
    proxima_accion: "Contactar con propuesta de sponsorship",
    notas: note([
      "Base propia BairesCode · Segmentación CYBER.AR 2026",
      text(row.Marca) && `Marca: ${text(row.Marca)}`,
      text(row.Cargo) && `Cargo: ${text(row.Cargo)}`,
      text(row["Motivo de selección"]) && `Motivo: ${text(row["Motivo de selección"])}`,
      text(row["Enfoque sugerido"]) && `Enfoque: ${text(row["Enfoque sugerido"])}`,
      text(row["Calidad del email"]) && `Calidad: ${text(row["Calidad del email"])}`,
      `También potencial asistente: ${text(row["También potencial asistente"]) || "No"}`,
      `ID origen: ${text(row["ID origen"])}`,
    ]),
    proposed_email: "",
    email_source_url: "",
  }));

const attendees = attendeeSource
  .filter((row) => !existingAttendeeEmails.has(emailKey(row.Email)))
  .map((row) => {
    const { nombre, apellido } = splitName(row.Contacto);
    return {
      id: `asp-bairescode-${text(row["ID origen"])}`,
      nombre,
      apellido,
      email: emailKey(row.Email),
      telefono: "",
      organizacion: text(row["Empresa / Entidad"]) || text(row.Marca),
      cargo: text(row.Cargo),
      categoria: "Profesional",
      modalidad: "",
      estado: "Lead",
      origen: "BairesCode",
      pais: "",
      region: "",
      responsable: "",
      probabilidad: probability(row.Prioridad),
      ultimo_contacto: null,
      proxima_accion: "Enviar primera invitación",
      notas: note([
        "Base propia BairesCode · Segmentación CYBER.AR 2026",
        text(row.Marca) && `Marca: ${text(row.Marca)}`,
        text(row["Perfil estimado"]) && `Perfil: ${text(row["Perfil estimado"])}`,
        text(row["Motivo de selección"]) && `Motivo: ${text(row["Motivo de selección"])}`,
        text(row["Enfoque sugerido"]) && `Enfoque: ${text(row["Enfoque sugerido"])}`,
        text(row["Calidad del email"]) && `Calidad: ${text(row["Calidad del email"])}`,
        `Prioridad: ${text(row.Prioridad)}`,
        `ID origen: ${text(row["ID origen"])}`,
      ]),
    };
  });

console.log(
  JSON.stringify(
    {
      source: { sponsors: sponsorSource.length, attendeesExclusive: attendeeSource.length },
      new: { sponsors: sponsors.length, attendees: attendees.length },
      skippedExisting: {
        sponsors: sponsorSource.length - sponsors.length,
        attendees: attendeeSource.length - attendees.length,
      },
      dryRun,
    },
    null,
    2
  )
);

if (!dryRun) {
  await insertInBatches("sponsors", sponsors);
  await insertInBatches("asistentes_potenciales", attendees);
  console.log(`Importación completa: ${sponsors.length} sponsors y ${attendees.length} asistentes.`);
}
