import fs from "node:fs/promises";
import path from "node:path";
import dotenv from "dotenv";
import { createClient } from "@supabase/supabase-js";

dotenv.config({ path: ".env.local" });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!supabaseUrl || !serviceRoleKey) {
  throw new Error("Faltan NEXT_PUBLIC_SUPABASE_URL o SUPABASE_SERVICE_ROLE_KEY");
}

const baseDir = path.resolve("content/attendee-email-drafts");
const audience = "unconfirmed_unpaid";
const definitions = [
  {
    id: "draft-potential-01-presentacion",
    sortOrder: 1,
    name: "Presentación",
    subject: "La Ciberdefensa tiene un punto de encuentro: CYBER.AR 2026",
    file: "01-cyberar-presentacion.html",
    recommendedFor: "2026-08-25T13:30:00.000Z",
  },
  {
    id: "draft-potential-02-speakers",
    sortOrder: 2,
    name: "Speakers",
    subject: "Quiénes van a estar en CYBER.AR 2026",
    file: "02-cyberar-speakers.html",
    recommendedFor: "2026-08-28T13:30:00.000Z",
  },
  {
    id: "draft-potential-03-contenidos",
    sortOrder: 3,
    name: "Contenidos",
    subject: "Tres días para abordar los desafíos de la Ciberdefensa",
    file: "03-cyberar-contenidos.html",
    recommendedFor: "2026-09-01T13:30:00.000Z",
  },
  {
    id: "draft-potential-04-tech-arena",
    sortOrder: 4,
    name: "Tech Arena",
    subject: "Del análisis a la acción: CYBER.AR Tech Arena",
    file: "04-cyberar-tech-arena.html",
    recommendedFor: "2026-09-04T13:30:00.000Z",
  },
  {
    id: "draft-potential-05-ecosistema",
    sortOrder: 5,
    name: "Ecosistema / Networking",
    subject: "Tres días para encontrarse con el ecosistema de la Ciberdefensa",
    file: "05-cyberar-ecosistema.html",
    recommendedFor: "2026-09-08T13:30:00.000Z",
  },
  {
    id: "draft-potential-06-tres-dias",
    sortOrder: 6,
    name: "Faltan 2 días",
    subject: "En 2 días comienza CYBER.AR 2026",
    file: "06-cyberar-3-dias.html",
    recommendedFor: "2026-09-13T22:00:00.000Z",
  },
  {
    id: "draft-potential-07-manana",
    sortOrder: 7,
    name: "Mañana comienza",
    subject: "Mañana comienza CYBER.AR 2026",
    file: "07-cyberar-manana.html",
    recommendedFor: "2026-09-15T13:00:00.000Z",
  },
];

const rows = await Promise.all(
  definitions.map(async (definition) => {
    const html = (await fs.readFile(path.join(baseDir, definition.file), "utf8")).trim();
    if (!html.includes("https://www.cyberar.fie.undef.edu.ar/header2.png")) {
      throw new Error(`${definition.file}: falta header2.png`);
    }
    if (/src=["'](?!https:\/\/)/i.test(html)) {
      throw new Error(`${definition.file}: contiene una imagen sin URL HTTPS absoluta`);
    }
    if (/\{\{|PLACEHOLDER|assets\//i.test(html)) {
      throw new Error(`${definition.file}: contiene placeholders o assets relativos`);
    }

    return {
      id: definition.id,
      sort_order: definition.sortOrder,
      name: definition.name,
      subject: definition.subject,
      html,
      audience,
      recommended_for: definition.recommendedFor,
      status: "draft",
      updated_at: new Date().toISOString(),
    };
  })
);

const supabase = createClient(supabaseUrl, serviceRoleKey);
const { data, error } = await supabase
  .from("attendee_email_drafts")
  .upsert(rows, { onConflict: "id" })
  .select("id, sort_order, name, subject, audience, recommended_for, status")
  .order("sort_order");
if (error) throw new Error(error.message);

console.log(JSON.stringify({ imported: data.length, drafts: data }, null, 2));
