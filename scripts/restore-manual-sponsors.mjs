/**
 * Restaura sponsors cargados manualmente (no están en el Excel).
 * Ejecutar: npx tsx scripts/restore-manual-sponsors.mjs
 */
import { config } from "dotenv";
import { createClient } from "@supabase/supabase-js";

config({ path: ".env.local" });

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const key = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!url || !key) {
  console.error("Faltan variables de Supabase en .env.local");
  process.exit(1);
}

/** Datos mínimos recuperados de la carga manual previa */
const MANUAL_SPONSORS = [
  {
    id: "s-manual-smsv",
    empresa: "SMSV",
    contacto: "",
    email: "",
    telefono: "",
    categoria: "Plata",
    estado: "Lead",
    monto_estimado: 0,
    monto_confirmado: 0,
    probabilidad: 100,
    responsable: "",
    segmento: "",
    prioridad: "",
    region: "Argentina",
    ultimo_contacto: null,
    proxima_accion: "",
    notas: "Carga manual — recuperado",
  },
  {
    id: "s-manual-infodef",
    empresa: "INFODEF",
    contacto: "",
    email: "",
    telefono: "",
    categoria: "Plata",
    estado: "Lead",
    monto_estimado: 0,
    monto_confirmado: 0,
    probabilidad: 50,
    responsable: "",
    segmento: "Defensa / tecnología",
    prioridad: "",
    region: "Argentina",
    ultimo_contacto: null,
    proxima_accion: "",
    notas: "Carga manual — recuperado",
  },
  {
    id: "s-manual-tecnous",
    empresa: "TECNOUS",
    contacto: "",
    email: "",
    telefono: "",
    categoria: "Plata",
    estado: "Lead",
    monto_estimado: 0,
    monto_confirmado: 0,
    probabilidad: 50,
    responsable: "",
    segmento: "",
    prioridad: "",
    region: "Argentina",
    ultimo_contacto: null,
    proxima_accion: "",
    notas: "Carga manual — recuperado",
  },
  {
    id: "s-manual-personal-tech",
    empresa: "Personal Tech",
    contacto: "",
    email: "",
    telefono: "",
    categoria: "Plata",
    estado: "Lead",
    monto_estimado: 0,
    monto_confirmado: 0,
    probabilidad: 50,
    responsable: "",
    segmento: "",
    prioridad: "",
    region: "Argentina",
    ultimo_contacto: null,
    proxima_accion: "",
    notas: "Carga manual — recuperado",
  },
];

const supabase = createClient(url, key);

const { data: existing } = await supabase.from("sponsors").select("id, empresa");
const byEmpresa = new Map(
  (existing ?? []).map((s) => [s.empresa.trim().toLowerCase(), s.id])
);

const toInsert = MANUAL_SPONSORS.filter(
  (s) => !byEmpresa.has(s.empresa.trim().toLowerCase())
);

if (toInsert.length === 0) {
  console.log("Todos los sponsors manuales ya existen en la base.");
  process.exit(0);
}

const { error } = await supabase.from("sponsors").upsert(toInsert, { onConflict: "id" });

if (error) {
  console.error("Error:", error.message);
  process.exit(1);
}

console.log("Restaurados:", toInsert.map((s) => s.empresa).join(", "));

const { count } = await supabase.from("sponsors").select("*", { count: "exact", head: true });
console.log("Total sponsors:", count);
