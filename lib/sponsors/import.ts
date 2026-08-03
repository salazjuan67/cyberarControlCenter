import * as XLSX from "xlsx";
import type {
  Moneda,
  Sponsor,
  SponsorCategoria,
  SponsorEstado,
} from "@/types";

const CATEGORIAS: SponsorCategoria[] = [
  "Platino",
  "Oro",
  "Plata",
  "Bronce",
  "Institucional",
];

const ESTADOS: SponsorEstado[] = [
  "Lead",
  "Contactado",
  "Propuesta enviada",
  "En negociación",
  "Confirmado",
  "Perdido",
];

const IMPORTABLE_SHEETS = [
  "Base Sponsors",
  "Primera ola",
  "Nuevos targets",
  "Base depurada",
] as const;

type ImportField = keyof Omit<Sponsor, "id">;

const GENERIC_ALIASES: Record<string, ImportField> = {
  empresa: "empresa",
  company: "empresa",
  nombre: "empresa",
  "razon social": "empresa",
  "razón social": "empresa",
  "cuenta objetivo": "empresa",
  "cuenta consolidada": "empresa",
  organizacion: "empresa",
  organización: "empresa",

  contacto: "contacto",
  contact: "contacto",
  "nombre contacto": "contacto",
  "cargo objetivo": "contacto",
  "cargo objetivo principal": "contacto",
  "cargo objetivo 1": "contacto",

  email: "email",
  correo: "email",
  "e-mail": "email",
  mail: "email",
  "correo institucional publico": "email",
  "email institucional validado": "email",

  telefono: "telefono",
  teléfono: "telefono",
  phone: "telefono",
  tel: "telefono",

  categoria: "categoria",
  tier: "categoria",
  nivel: "categoria",

  estado: "estado",
  status: "estado",
  etapa: "estado",
  "estado de contacto": "estado",
  "estado comercial": "estado",

  moneda: "moneda",
  currency: "moneda",

  "monto estimado": "montoEstimado",
  monto_estimado: "montoEstimado",
  estimado: "montoEstimado",
  amount: "montoEstimado",

  "monto confirmado": "montoConfirmado",
  monto_confirmado: "montoConfirmado",

  probabilidad: "probabilidad",
  prob: "probabilidad",
  probability: "probabilidad",
  puntaje: "probabilidad",
  "puntaje sugerido": "probabilidad",

  responsable: "responsable",
  owner: "responsable",
  asignado: "responsable",
  "responsable interno": "responsable",

  segmento: "segmento",
  segment: "segmento",
  industria: "segmento",
  sector: "segmento",
  rubro: "segmento",
  tag: "segmento",
  tags: "segmento",
  "tipo de cuenta": "segmento",

  prioridad: "prioridad",
  "prioridad comercial": "prioridad",

  region: "region",
  "pais / alcance": "region",
  "equipo geografico": "region",

  "ultimo contacto": "ultimoContacto",
  "último contacto": "ultimoContacto",
  ultimo_contacto: "ultimoContacto",
  "last contact": "ultimoContacto",

  "proxima accion": "proximaAccion",
  "próxima acción": "proximaAccion",
  proxima_accion: "proximaAccion",
  "next action": "proximaAccion",

  notas: "notas",
  notes: "notas",
  comentarios: "notas",
  observaciones: "notas",
};

/** En formato CyberAR, "Categoría" es rubro/industria → segmento, no tier Platino/Oro */
const CYBERAR_INDUSTRY_HEADERS = new Set([
  "categoria",
  "categoría",
  "categoria original",
]);

export interface ParsedSponsorRow {
  rowNumber: number;
  sponsor: Omit<Sponsor, "id">;
  errors: string[];
  warnings: string[];
  sourceSheet?: string;
}

export interface ImportableSheet {
  name: string;
  rowCount: number;
  recommended?: boolean;
}

export interface ParseSponsorFileResult {
  rows: ParsedSponsorRow[];
  headers: string[];
  validCount: number;
  errorCount: number;
  sheetName: string;
  availableSheets: ImportableSheet[];
  profile: "cyberar" | "generic";
}

export interface ParseSponsorOptions {
  defaultMoneda?: Moneda;
  sheetName?: string;
}

function normalizeHeader(value: unknown): string {
  return String(value ?? "")
    .trim()
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");
}

function normalizeCategoria(value: string): SponsorCategoria {
  const normalized = value.trim().toLowerCase();
  const match = CATEGORIAS.find((c) => c.toLowerCase() === normalized);
  if (match) return match;
  if (normalized.includes("plat")) return "Platino";
  if (normalized.includes("oro") || normalized === "gold") return "Oro";
  if (normalized.includes("plata") || normalized === "silver") return "Plata";
  if (normalized.includes("bronce") || normalized === "bronze") return "Bronce";
  if (normalized.includes("instit")) return "Institucional";
  return "Plata";
}

function normalizeEstado(value: string): SponsorEstado {
  const normalized = value.trim().toLowerCase();
  const match = ESTADOS.find((e) => e.toLowerCase() === normalized);
  if (match) return match;
  if (normalized.includes("no contactado")) return "Lead";
  if (normalized.includes("confirm")) return "Confirmado";
  if (normalized.includes("negoci")) return "En negociación";
  if (normalized.includes("propuesta")) return "Propuesta enviada";
  if (normalized.includes("contact")) return "Contactado";
  if (normalized.includes("perd")) return "Perdido";
  return "Lead";
}

function normalizeMoneda(value: string, fallback: Moneda): Moneda {
  const normalized = value.trim().toUpperCase();
  if (normalized === "USD" || normalized === "ARS" || normalized === "EUR") {
    return normalized;
  }
  if (normalized.includes("PESO") || normalized === "$") return "ARS";
  if (normalized.includes("DOL") || normalized === "U$S") return "USD";
  if (normalized.includes("EURO")) return "EUR";
  return fallback;
}

function parseNumber(value: unknown): number {
  if (typeof value === "number") return Number.isFinite(value) ? value : 0;
  const raw = String(value ?? "").trim();
  if (!raw) return 0;
  const cleaned = raw.replace(/[^\d,.-]/g, "").replace(/\./g, "").replace(",", ".");
  const parsed = Number(cleaned);
  return Number.isFinite(parsed) ? parsed : 0;
}

function parseProbabilidad(value: unknown): number {
  const num = parseNumber(value);
  if (num <= 1 && num > 0) return Math.round(num * 100);
  return Math.max(0, Math.min(100, Math.round(num)));
}

function parseDate(value: unknown): string {
  if (!value) return "";
  if (value instanceof Date && !Number.isNaN(value.getTime())) {
    return value.toISOString().split("T")[0];
  }

  if (typeof value === "number") {
    const parsed = XLSX.SSF.parse_date_code(value);
    if (parsed) {
      const date = new Date(parsed.y, parsed.m - 1, parsed.d);
      return date.toISOString().split("T")[0];
    }
  }

  const raw = String(value).trim();
  if (/^\d{4}-\d{2}-\d{2}$/.test(raw)) return raw;
  const parts = raw.split(/[/-]/);
  if (parts.length === 3) {
    const [a, b, c] = parts.map((p) => Number(p));
    if (c > 31) return `${c}-${String(b).padStart(2, "0")}-${String(a).padStart(2, "0")}`;
    if (a > 31) return `${a}-${String(b).padStart(2, "0")}-${String(c).padStart(2, "0")}`;
  }
  return "";
}

function detectProfile(headers: string[]): "cyberar" | "generic" {
  const normalized = headers.map(normalizeHeader);
  if (
    normalized.includes("prioridad") &&
    (normalized.includes("estado de contacto") || normalized.includes("estado comercial"))
  ) {
    return "cyberar";
  }
  if (normalized.includes("ranking") && normalized.includes("motivo de afinidad")) {
    return "cyberar";
  }
  return "generic";
}

function mapHeaders(
  headers: string[],
  profile: "cyberar" | "generic"
): Array<ImportField | null> {
  return headers.map((header) => {
    const normalized = normalizeHeader(header);

    if (profile === "cyberar" && CYBERAR_INDUSTRY_HEADERS.has(normalized)) {
      return "segmento";
    }

    return GENERIC_ALIASES[normalized] ?? null;
  });
}

function emptySponsor(defaultMoneda: Moneda): Omit<Sponsor, "id"> {
  return {
    empresa: "",
    contacto: "",
    email: "",
    telefono: "",
    categoria: "Plata",
    estado: "Lead",
    moneda: defaultMoneda,
    montoEstimado: 0,
    montoConfirmado: 0,
    probabilidad: 50,
    responsable: "",
    segmento: "",
    prioridad: "",
    region: "",
    ultimoContacto: "",
    proximaAccion: "",
    notas: "",
    proposedEmail: "",
    emailSourceUrl: "",
  };
}

function appendNote(notes: string, label: string, value: unknown): string {
  const text = String(value ?? "").trim();
  if (!text) return notes;
  const line = `${label}: ${text}`;
  return notes ? `${notes}\n${line}` : line;
}

function enrichCyberARNotes(
  sponsor: Omit<Sponsor, "id">,
  line: unknown[],
  headers: string[]
): void {
  const get = (label: string): string => {
    const idx = headers.findIndex((h) => normalizeHeader(h) === normalizeHeader(label));
    if (idx < 0) return "";
    return String(line[idx] ?? "").trim();
  };

  sponsor.notas = appendNote(sponsor.notas, "Ranking", get("Ranking"));
  sponsor.notas = appendNote(sponsor.notas, "Motivo", get("Motivo de afinidad"));
  sponsor.notas = appendNote(sponsor.notas, "Razón", get("Razón para contactar"));
  sponsor.notas = appendNote(sponsor.notas, "País", get("País / alcance"));
  sponsor.notas = appendNote(sponsor.notas, "Sitio", get("Sitio oficial") || get("Sitio"));
  sponsor.notas = appendNote(
    sponsor.notas,
    "LinkedIn",
    get("Búsqueda LinkedIn") || get("LinkedIn / búsqueda")
  );
  sponsor.notas = appendNote(
    sponsor.notas,
    "Canal sugerido",
    get("Canal público sugerido") || get("Canal público original (NO VALIDADO)")
  );
  sponsor.notas = appendNote(sponsor.notas, "Ruta", get("Ruta de abordaje") || get("Ruta / área de entrada"));
  sponsor.notas = appendNote(sponsor.notas, "Fuente", get("Fuente / evidencia"));
  sponsor.notas = appendNote(sponsor.notas, "Observaciones", get("Observaciones"));

  if (!sponsor.proximaAccion) {
    sponsor.proximaAccion = get("Próxima acción") || "Validar contacto institucional y enviar propuesta";
  }
}

function rowToSponsor(
  line: unknown[],
  headers: string[],
  headerMap: Array<ImportField | null>,
  defaultMoneda: Moneda,
  profile: "cyberar" | "generic"
): Omit<Sponsor, "id"> {
  const sponsor = emptySponsor(defaultMoneda);

  for (let col = 0; col < headers.length; col += 1) {
    const field = headerMap[col];
    const value = line[col];
    if (!field || value === undefined || value === null || value === "") continue;

    switch (field) {
      case "empresa":
      case "contacto":
      case "email":
      case "telefono":
      case "responsable":
      case "segmento":
      case "prioridad":
      case "region":
      case "proximaAccion":
      case "notas":
        sponsor[field] = String(value).trim();
        break;
      case "categoria":
        sponsor.categoria = normalizeCategoria(String(value));
        break;
      case "estado":
        sponsor.estado = normalizeEstado(String(value));
        break;
      case "moneda":
        sponsor.moneda = normalizeMoneda(String(value), defaultMoneda);
        break;
      case "montoEstimado":
        sponsor.montoEstimado = parseNumber(value);
        break;
      case "montoConfirmado":
        sponsor.montoConfirmado = parseNumber(value);
        break;
      case "probabilidad":
        sponsor.probabilidad = parseProbabilidad(value);
        break;
      case "ultimoContacto":
        sponsor.ultimoContacto = parseDate(value);
        break;
    }
  }

  if (profile === "cyberar") {
    enrichCyberARNotes(sponsor, line, headers);
    if (sponsor.prioridad.startsWith("A")) {
      sponsor.categoria = "Oro";
    } else if (sponsor.prioridad.startsWith("B")) {
      sponsor.categoria = "Plata";
    }
  }

  return sponsor;
}

function findHeaderRow(matrix: unknown[][]): number {
  for (let i = 0; i < Math.min(matrix.length, 20); i += 1) {
    const row = matrix[i] ?? [];
    const normalized = row.map(normalizeHeader);
    const hasEmpresa =
      normalized.includes("empresa") ||
      normalized.includes("cuenta objetivo") ||
      normalized.includes("cuenta consolidada");
    if (hasEmpresa) return i;
  }
  return 0;
}

function countDataRows(matrix: unknown[][], headerRowIndex: number): number {
  let count = 0;
  for (let i = headerRowIndex + 1; i < matrix.length; i += 1) {
    const line = matrix[i] ?? [];
    if (line.every((cell) => String(cell ?? "").trim() === "")) continue;
    count += 1;
  }
  return count;
}

function listImportableSheets(workbook: XLSX.WorkBook): ImportableSheet[] {
  return workbook.SheetNames
    .filter((name) =>
      IMPORTABLE_SHEETS.includes(name as (typeof IMPORTABLE_SHEETS)[number]) ||
      name.toLowerCase().includes("sponsor") ||
      name.toLowerCase().includes("target") ||
      name.toLowerCase().includes("ola")
    )
    .map((name) => {
      const sheet = workbook.Sheets[name];
      const matrix = XLSX.utils.sheet_to_json<unknown[]>(sheet, {
        header: 1,
        defval: "",
      }) as unknown[][];
      const headerRowIndex = findHeaderRow(matrix);
      return {
        name,
        rowCount: countDataRows(matrix, headerRowIndex),
        recommended: name === "Base Sponsors",
      };
    })
    .filter((s) => s.rowCount > 0)
    .sort((a, b) => {
      if (a.recommended) return -1;
      if (b.recommended) return 1;
      return b.rowCount - a.rowCount;
    });
}

function resolveSheetName(
  workbook: XLSX.WorkBook,
  preferred?: string
): string {
  if (preferred && workbook.SheetNames.includes(preferred)) {
    return preferred;
  }
  const available = listImportableSheets(workbook);
  if (available.length > 0) return available[0].name;
  return workbook.SheetNames[0] ?? "";
}

function parseSheet(
  workbook: XLSX.WorkBook,
  sheetName: string,
  defaultMoneda: Moneda
): ParseSponsorFileResult {
  const sheet = workbook.Sheets[sheetName];
  if (!sheet) {
    return {
      rows: [],
      headers: [],
      validCount: 0,
      errorCount: 0,
      sheetName,
      availableSheets: listImportableSheets(workbook),
      profile: "generic",
    };
  }

  const matrix = XLSX.utils.sheet_to_json<unknown[]>(sheet, {
    header: 1,
    defval: "",
    raw: false,
  }) as unknown[][];

  if (matrix.length === 0) {
    return {
      rows: [],
      headers: [],
      validCount: 0,
      errorCount: 0,
      sheetName,
      availableSheets: listImportableSheets(workbook),
      profile: "generic",
    };
  }

  const headerRowIndex = findHeaderRow(matrix);
  const headers = (matrix[headerRowIndex] ?? []).map((cell) => String(cell ?? "").trim());
  const profile = detectProfile(headers);
  const headerMap = mapHeaders(headers, profile);
  const hasEmpresaColumn = headerMap.includes("empresa");

  const rows: ParsedSponsorRow[] = [];

  for (let i = headerRowIndex + 1; i < matrix.length; i += 1) {
    const line = matrix[i] ?? [];
    const isEmpty = line.every((cell) => String(cell ?? "").trim() === "");
    if (isEmpty) continue;

    const sponsor = rowToSponsor(line, headers, headerMap, defaultMoneda, profile);
    const errors: string[] = [];
    const warnings: string[] = [];

    if (!hasEmpresaColumn) {
      errors.push("Falta columna Empresa");
    }
    if (!sponsor.empresa.trim()) {
      errors.push("Empresa vacía");
    }
    if (!sponsor.email.trim()) {
      warnings.push("Sin email");
    }

    rows.push({
      rowNumber: i + 1,
      sponsor,
      errors,
      warnings,
      sourceSheet: sheetName,
    });
  }

  const validCount = rows.filter((r) => r.errors.length === 0).length;

  return {
    rows,
    headers,
    validCount,
    errorCount: rows.length - validCount,
    sheetName,
    availableSheets: listImportableSheets(workbook),
    profile,
  };
}

export function parseSponsorWorkbook(
  buffer: ArrayBuffer,
  options: ParseSponsorOptions = {}
): ParseSponsorFileResult {
  const defaultMoneda = options.defaultMoneda ?? "ARS";
  const workbook = XLSX.read(buffer, { type: "array", cellDates: true });
  const sheetName = resolveSheetName(workbook, options.sheetName);
  if (!sheetName) {
    return {
      rows: [],
      headers: [],
      validCount: 0,
      errorCount: 0,
      sheetName: "",
      availableSheets: [],
      profile: "generic",
    };
  }

  return parseSheet(workbook, sheetName, defaultMoneda);
}

export function buildImportTemplateWorkbook(): ArrayBuffer {
  const headers = [
    "Empresa",
    "Contacto",
    "Email",
    "Teléfono",
    "Segmento",
    "Prioridad",
    "Región",
    "Categoría tier",
    "Estado",
    "Moneda",
    "Monto Estimado",
    "Probabilidad",
    "Responsable",
    "Próxima Acción",
    "Notas",
  ];

  const sample = [
    [
      "Acme Security SA",
      "Marketing Institucional",
      "maria@acme.com",
      "+54 11 5555-1234",
      "Ciberseguridad",
      "A - Alta",
      "Argentina",
      "Oro",
      "Lead",
      "ARS",
      1500000,
      85,
      "Juan",
      "Enviar propuesta",
      "Referido por partner",
    ],
  ];

  const sheet = XLSX.utils.aoa_to_sheet([headers, ...sample]);
  sheet["!cols"] = headers.map(() => ({ wch: 18 }));
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, sheet, "Sponsors");
  return XLSX.write(workbook, { type: "array", bookType: "xlsx" }) as ArrayBuffer;
}

export function downloadImportTemplate(): void {
  const buffer = buildImportTemplateWorkbook();
  const blob = new Blob([buffer], {
    type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = "plantilla-sponsors-cyberar.xlsx";
  link.click();
  URL.revokeObjectURL(url);
}

export function sponsorKey(sponsor: Pick<Sponsor, "empresa" | "email">): string {
  const empresa = sponsor.empresa.trim().toLowerCase();
  const email = sponsor.email.trim().toLowerCase();
  return email ? `${empresa}|${email}` : empresa;
}
