import * as XLSX from "xlsx";
import type { AsistentePotencial, AsistenteCategoria, AsistenteEstado } from "@/types/asistentes";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const CATEGORIAS: AsistenteCategoria[] = [
  "Profesional",
  "Estudiante",
  "Militar",
  "Investigador",
  "Invitado",
  "Expositor",
];

const ESTADOS: AsistenteEstado[] = [
  "Lead",
  "Contactado",
  "Invitación enviada",
  "Interesado",
  "Inscripto",
  "No interesado",
];

export interface ParsedAsistenteRow {
  rowNumber: number;
  asistente: Omit<AsistentePotencial, "id">;
  errors: string[];
  sourceSheet?: string;
}

export interface ImportableAsistenteSheet {
  name: string;
  rowCount: number;
  recommended?: boolean;
}

export interface ParseAsistenteFileResult {
  rows: ParsedAsistenteRow[];
  validCount: number;
  errorCount: number;
  sheetName: string;
  availableSheets: ImportableAsistenteSheet[];
  profile: "ciberdefensa" | "comunicaciones" | "cuc" | "generic";
  mergedSheets: string[];
}

export interface ParseAsistenteOptions {
  sheetName?: string;
  mergeAllSheets?: boolean;
}

function normalizeHeader(value: unknown): string {
  return String(value ?? "")
    .trim()
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");
}

function normalizeEmail(value: unknown): string {
  return String(value ?? "").trim().toLowerCase();
}

function isValidEmail(email: string): boolean {
  return EMAIL_RE.test(email);
}

function splitName(full: string): { nombre: string; apellido: string } {
  const parts = full.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return { nombre: "", apellido: "" };
  if (parts.length === 1) return { nombre: parts[0], apellido: "" };
  return { apellido: parts[0], nombre: parts.slice(1).join(" ") };
}

function emptyAsistente(overrides: Partial<Omit<AsistentePotencial, "id">> = {}): Omit<AsistentePotencial, "id"> {
  return {
    nombre: "",
    apellido: "",
    email: "",
    telefono: "",
    organizacion: "",
    cargo: "",
    categoria: "Profesional",
    modalidad: "",
    estado: "Lead",
    origen: "",
    pais: "",
    region: "",
    responsable: "",
    probabilidad: 60,
    ultimoContacto: "",
    proximaAccion: "",
    notas: "",
    ...overrides,
  };
}

function normalizeCategoria(value: string): AsistenteCategoria {
  const n = value.trim().toLowerCase();
  const match = CATEGORIAS.find((c) => c.toLowerCase() === n);
  return match ?? "Profesional";
}

function normalizeEstado(value: string): AsistenteEstado {
  const n = value.trim().toLowerCase();
  const match = ESTADOS.find((e) => e.toLowerCase() === n);
  if (match) return match;
  if (n.includes("inscript")) return "Inscripto";
  if (n.includes("interes")) return "Interesado";
  if (n.includes("invit")) return "Invitación enviada";
  if (n.includes("contact")) return "Contactado";
  if (n.includes("no interes")) return "No interesado";
  return "Lead";
}

export function asistenteKey(asistente: Pick<AsistentePotencial, "email">): string {
  return normalizeEmail(asistente.email);
}

function detectSheetProfile(sheetName: string, headers: string[]): ParseAsistenteFileResult["profile"] {
  const n = normalizeHeader(sheetName);
  const h = headers.map(normalizeHeader);

  if (n.includes("ciberdefensa") || (h.includes("apellido") && h.includes("nombre") && h.includes("e-mail"))) {
    return "ciberdefensa";
  }
  if (n.includes("comunicacion")) return "comunicaciones";
  if (h.length <= 2 && h.some((col) => isValidEmail(col))) return "cuc";
  if (h.filter((col) => isValidEmail(col)).length >= Math.max(1, h.length - 1)) return "cuc";
  return "generic";
}

function parseCiberdefensaRows(
  sheet: XLSX.WorkSheet,
  sheetName: string,
  origen: string
): ParsedAsistenteRow[] {
  const rows: ParsedAsistenteRow[] = [];
  const data = XLSX.utils.sheet_to_json<Record<string, unknown>>(sheet, { defval: "" });

  data.forEach((row, index) => {
    const email = normalizeEmail(row["E-Mail"] ?? row.Email ?? row.email ?? row.Correo);
    const asistente = emptyAsistente({
      apellido: String(row.Apellido ?? "").trim(),
      nombre: String(row.Nombre ?? "").trim(),
      email,
      origen,
      estado: "Lead",
      probabilidad: 65,
      notas: "Importado de edición anterior",
    });

    const errors: string[] = [];
    if (!email) errors.push("Sin email");
    else if (!isValidEmail(email)) errors.push("Email inválido");

    rows.push({ rowNumber: index + 2, asistente, errors, sourceSheet: sheetName });
  });

  return rows;
}

function parseComunicacionesRows(sheet: XLSX.WorkSheet, sheetName: string): ParsedAsistenteRow[] {
  const rows: ParsedAsistenteRow[] = [];
  const raw = XLSX.utils.sheet_to_json<unknown[]>(sheet, { header: 1, defval: "" });
  let headerRowIndex = raw.findIndex(
    (row) =>
      Array.isArray(row) &&
      normalizeHeader(row[1]) === "apellido" &&
      normalizeHeader(row[3]).includes("mail")
  );
  if (headerRowIndex < 0) headerRowIndex = 1;

  for (let i = headerRowIndex + 1; i < raw.length; i++) {
    const row = raw[i];
    if (!Array.isArray(row)) continue;

    const email = normalizeEmail(row[3]);
    let apellido = String(row[1] ?? "").trim();
    let nombre = String(row[2] ?? "").trim();

    if (!nombre && apellido.includes(" ")) {
      const split = splitName(apellido);
      apellido = split.apellido;
      nombre = split.nombre;
    }

    const asistente = emptyAsistente({
      apellido,
      nombre,
      email,
      origen: "Comunicaciones (edición anterior)",
      estado: "Lead",
      probabilidad: 65,
      notas: "Importado de edición anterior",
    });

    const errors: string[] = [];
    if (!email) errors.push("Sin email");
    else if (!isValidEmail(email)) errors.push("Email inválido");

    rows.push({ rowNumber: i + 1, asistente, errors, sourceSheet: sheetName });
  }

  return rows;
}

function parseCucRows(sheet: XLSX.WorkSheet, sheetName: string): ParsedAsistenteRow[] {
  const rows: ParsedAsistenteRow[] = [];
  const raw = XLSX.utils.sheet_to_json<unknown[]>(sheet, { header: 1, defval: "" });

  raw.forEach((row, index) => {
    if (!Array.isArray(row)) return;
    const candidates = row.map((cell) => normalizeEmail(cell)).filter(Boolean);
    const email = candidates.find((c) => isValidEmail(c)) ?? "";

    const asistente = emptyAsistente({
      email,
      origen: "CUC (congreso anterior)",
      estado: "Lead",
      probabilidad: 55,
      notas: "Importado — solo email disponible",
    });

    const errors: string[] = [];
    if (!email) errors.push("Sin email");
    else if (!isValidEmail(email)) errors.push("Email inválido");

    rows.push({ rowNumber: index + 1, asistente, errors, sourceSheet: sheetName });
  });

  return rows;
}

function parseGenericRows(sheet: XLSX.WorkSheet, sheetName: string): ParsedAsistenteRow[] {
  const rows: ParsedAsistenteRow[] = [];
  const data = XLSX.utils.sheet_to_json<Record<string, unknown>>(sheet, { defval: "" });
  if (data.length === 0) return rows;

  const headers = Object.keys(data[0]);
  const headerMap = new Map<string, string>();
  for (const h of headers) {
    const n = normalizeHeader(h);
    if (n.includes("apellido")) headerMap.set("apellido", h);
    if (n === "nombre" || n.includes("nombre")) headerMap.set("nombre", h);
    if (n.includes("mail") || n === "email" || n === "correo") headerMap.set("email", h);
    if (n.includes("organiz")) headerMap.set("organizacion", h);
    if (n.includes("telefono") || n === "tel") headerMap.set("telefono", h);
    if (n.includes("categoria")) headerMap.set("categoria", h);
    if (n.includes("origen")) headerMap.set("origen", h);
  }

  data.forEach((row, index) => {
    const email = normalizeEmail(row[headerMap.get("email") ?? ""]);
    const asistente = emptyAsistente({
      apellido: String(row[headerMap.get("apellido") ?? ""] ?? "").trim(),
      nombre: String(row[headerMap.get("nombre") ?? ""] ?? "").trim(),
      email,
      telefono: String(row[headerMap.get("telefono") ?? ""] ?? "").trim(),
      organizacion: String(row[headerMap.get("organizacion") ?? ""] ?? "").trim(),
      categoria: normalizeCategoria(String(row[headerMap.get("categoria") ?? ""] ?? "")),
      origen: String(row[headerMap.get("origen") ?? ""] ?? "").trim() || "Importación Excel",
      estado: "Lead",
    });

    const errors: string[] = [];
    if (!email) errors.push("Sin email");
    else if (!isValidEmail(email)) errors.push("Email inválido");

    rows.push({ rowNumber: index + 2, asistente, errors, sourceSheet: sheetName });
  });

  return rows;
}

function parseSheet(sheet: XLSX.WorkSheet, sheetName: string): ParsedAsistenteRow[] {
  const preview = XLSX.utils.sheet_to_json<Record<string, unknown>>(sheet, { defval: "", range: 0 });
  const headers = preview.length > 0 ? Object.keys(preview[0]) : [];
  const rawHeaders = XLSX.utils.sheet_to_json<unknown[]>(sheet, { header: 1, defval: "", range: 0 })[0];
  const headerList = Array.isArray(rawHeaders) ? rawHeaders.map(String) : headers;

  const profile = detectSheetProfile(sheetName, headerList);

  switch (profile) {
    case "ciberdefensa":
      return parseCiberdefensaRows(sheet, sheetName, "Ciberdefensa (edición anterior)");
    case "comunicaciones":
      return parseComunicacionesRows(sheet, sheetName);
    case "cuc":
      return parseCucRows(sheet, sheetName);
    default:
      return parseGenericRows(sheet, sheetName);
  }
}

function dedupeRows(rows: ParsedAsistenteRow[]): ParsedAsistenteRow[] {
  const seen = new Map<string, ParsedAsistenteRow>();

  for (const row of rows) {
    if (row.errors.length > 0) continue;
    const key = asistenteKey(row.asistente);
    const existing = seen.get(key);
    if (!existing) {
      seen.set(key, row);
      continue;
    }
    const merged = { ...existing.asistente };
    if (!merged.nombre && row.asistente.nombre) merged.nombre = row.asistente.nombre;
    if (!merged.apellido && row.asistente.apellido) merged.apellido = row.asistente.apellido;
    if (!merged.organizacion && row.asistente.organizacion) merged.organizacion = row.asistente.organizacion;
    merged.origen = [merged.origen, row.asistente.origen].filter(Boolean).join(" · ");
    seen.set(key, { ...existing, asistente: merged });
  }

  const invalid = rows.filter((r) => r.errors.length > 0);
  return [...seen.values(), ...invalid];
}

function sheetsToParse(
  workbook: XLSX.WorkBook,
  options: ParseAsistenteOptions
): string[] {
  if (options.sheetName) return [options.sheetName];

  const names = workbook.SheetNames;
  if (options.mergeAllSheets !== false && names.length > 1) {
    const importable = names.filter((name) => {
      const sheet = workbook.Sheets[name];
      const rows = XLSX.utils.sheet_to_json(sheet, { defval: "" });
      return rows.length > 0;
    });
    if (importable.length > 1) return importable;
  }

  const preferred = names.find((n) => /ciberdefensa|comunicacion|hoja 1|asistentes|inscriptos/i.test(n));
  return [preferred ?? names[0]];
}

export function parseAsistenteWorkbook(
  buffer: ArrayBuffer,
  options: ParseAsistenteOptions = {}
): ParseAsistenteFileResult {
  const workbook = XLSX.read(buffer, { type: "array", cellDates: true });
  const sheetNames = sheetsToParse(workbook, options);
  const mergedSheets: string[] = [];

  let allRows: ParsedAsistenteRow[] = [];
  for (const name of sheetNames) {
    const sheet = workbook.Sheets[name];
    if (!sheet) continue;
    const parsed = parseSheet(sheet, name);
    if (parsed.length === 0) continue;
    mergedSheets.push(name);
    allRows = allRows.concat(parsed);
  }

  if (mergedSheets.length > 1) {
    allRows = dedupeRows(allRows);
  }

  const primarySheet = sheetNames[0] ?? "";
  const profile =
    mergedSheets.length === 1
      ? detectSheetProfile(
          mergedSheets[0],
          Object.keys(XLSX.utils.sheet_to_json(workbook.Sheets[mergedSheets[0]] ?? {}, { defval: "" })[0] ?? {})
        )
      : "generic";

  const availableSheets: ImportableAsistenteSheet[] = workbook.SheetNames.map((name) => ({
    name,
    rowCount: XLSX.utils.sheet_to_json(workbook.Sheets[name], { defval: "" }).length,
    recommended: /ciberdefensa|comunicacion/i.test(name),
  }));

  const validCount = allRows.filter((r) => r.errors.length === 0).length;
  const errorCount = allRows.filter((r) => r.errors.length > 0).length;

  return {
    rows: allRows,
    validCount,
    errorCount,
    sheetName: mergedSheets.length > 1 ? mergedSheets.join(" + ") : primarySheet,
    availableSheets,
    profile,
    mergedSheets,
  };
}

export function parseAsistenteFiles(buffers: { name: string; buffer: ArrayBuffer }[]): ParseAsistenteFileResult {
  let allRows: ParsedAsistenteRow[] = [];
  const mergedSheets: string[] = [];

  for (const file of buffers) {
    const parsed = parseAsistenteWorkbook(file.buffer, { mergeAllSheets: true });
    mergedSheets.push(...parsed.mergedSheets.map((s) => `${file.name}:${s}`));
    allRows = allRows.concat(parsed.rows);
  }

  allRows = dedupeRows(allRows);

  return {
    rows: allRows,
    validCount: allRows.filter((r) => r.errors.length === 0).length,
    errorCount: allRows.filter((r) => r.errors.length > 0).length,
    sheetName: mergedSheets.join(", "),
    availableSheets: [],
    profile: "generic",
    mergedSheets,
  };
}
