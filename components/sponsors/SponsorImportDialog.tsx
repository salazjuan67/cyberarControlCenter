"use client";

import { useMemo, useRef, useState } from "react";
import {
  AlertCircle,
  CheckCircle2,
  Download,
  FileSpreadsheet,
  Loader2,
  Upload,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useStore } from "@/store/useStore";
import type { Sponsor } from "@/types";
import {
  downloadImportTemplate,
  parseSponsorWorkbook,
  sponsorKey,
  type ImportableSheet,
  type ParsedSponsorRow,
} from "@/lib/sponsors/import";
import { cn } from "@/lib/utils";

interface SponsorImportDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function SponsorImportDialog({ open, onOpenChange }: SponsorImportDialogProps) {
  const { config, importSponsors, sponsors } = useStore();
  const inputRef = useRef<HTMLInputElement>(null);
  const [fileBuffer, setFileBuffer] = useState<ArrayBuffer | null>(null);
  const [rows, setRows] = useState<ParsedSponsorRow[]>([]);
  const [headers, setHeaders] = useState<string[]>([]);
  const [fileName, setFileName] = useState("");
  const [sheetName, setSheetName] = useState("");
  const [availableSheets, setAvailableSheets] = useState<ImportableSheet[]>([]);
  const [profile, setProfile] = useState<"cyberar" | "generic">("generic");
  const [replaceDuplicates, setReplaceDuplicates] = useState(false);
  const [importing, setImporting] = useState(false);
  const [resultMessage, setResultMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const existingKeys = useMemo(
    () => new Set(sponsors.map((s) => sponsorKey(s))),
    [sponsors]
  );

  const validRows = rows.filter((r) => r.errors.length === 0);
  const duplicateCount = validRows.filter((r) =>
    existingKeys.has(sponsorKey(r.sponsor))
  ).length;
  const toImportCount = replaceDuplicates
    ? validRows.length
    : validRows.length - duplicateCount;

  function resetState() {
    setFileBuffer(null);
    setRows([]);
    setHeaders([]);
    setFileName("");
    setSheetName("");
    setAvailableSheets([]);
    setProfile("generic");
    setResultMessage(null);
    setError(null);
    setReplaceDuplicates(false);
    if (inputRef.current) inputRef.current.value = "";
  }

  function applyParsed(buffer: ArrayBuffer, selectedSheet?: string) {
    const parsed = parseSponsorWorkbook(buffer, {
      defaultMoneda: config.moneda,
      sheetName: selectedSheet,
    });
    setRows(parsed.rows);
    setHeaders(parsed.headers);
    setSheetName(parsed.sheetName);
    setAvailableSheets(parsed.availableSheets);
    setProfile(parsed.profile);
    if (parsed.rows.length === 0) {
      setError("La hoja seleccionada no tiene filas para importar.");
    }
    return parsed;
  }

  async function handleFileChange(file: File | null) {
    if (!file) return;
    setError(null);
    setResultMessage(null);
    setFileName(file.name);

    try {
      const buffer = await file.arrayBuffer();
      setFileBuffer(buffer);
      applyParsed(buffer);
    } catch (err) {
      setError(err instanceof Error ? err.message : "No se pudo leer el archivo");
      setRows([]);
      setHeaders([]);
      setFileBuffer(null);
    }
  }

  function handleSheetChange(nextSheet: string) {
    if (!fileBuffer) return;
    setError(null);
    setResultMessage(null);
    applyParsed(fileBuffer, nextSheet);
  }

  async function handleImport() {
    if (validRows.length === 0) return;

    setImporting(true);
    setError(null);
    setResultMessage(null);

    const payload: Sponsor[] = validRows.map((row, index) => ({
      ...row.sponsor,
      id: `s-imp-${Date.now()}-${index}`,
    }));

    try {
      const result = await importSponsors(payload, { replaceDuplicates });
      const parts = [
        `${result.imported} importado(s)`,
        result.updated > 0 ? `${result.updated} actualizado(s)` : null,
        result.skipped > 0 ? `${result.skipped} omitido(s)` : null,
      ].filter(Boolean);
      setResultMessage(`Importación completada: ${parts.join(" · ")}.`);
      if (result.errors.length > 0) {
        setError(result.errors.join(" · "));
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error al importar");
    } finally {
      setImporting(false);
    }
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        onOpenChange(next);
        if (!next) resetState();
      }}
    >
      <DialogContent className="bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 sm:max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-slate-900 dark:text-white flex items-center gap-2">
            <FileSpreadsheet className="w-5 h-5 text-cyan-500" />
            Importar sponsors desde Excel
          </DialogTitle>
          <DialogDescription className="text-slate-500 dark:text-slate-400">
            Compatible con la base CyberAR (hoja <strong>Base Sponsors</strong>). Mapeamos
            Prioridad, Región, Categoría/rubro, Puntaje y estado de contacto automáticamente.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="flex flex-wrap gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={downloadImportTemplate}
              className="gap-2 border-slate-300 dark:border-slate-700"
            >
              <Download className="w-4 h-4" />
              Descargar plantilla
            </Button>
            <Button
              type="button"
              onClick={() => inputRef.current?.click()}
              className="gap-2 bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-semibold"
            >
              <Upload className="w-4 h-4" />
              Seleccionar archivo
            </Button>
            <input
              ref={inputRef}
              type="file"
              accept=".xlsx,.xls,.csv"
              className="hidden"
              onChange={(e) => void handleFileChange(e.target.files?.[0] ?? null)}
            />
          </div>

          {availableSheets.length > 1 && (
            <div>
              <label className="text-xs text-slate-500 dark:text-slate-400 mb-1.5 block">
                Hoja a importar
              </label>
              <Select value={sheetName} onValueChange={(v) => v && handleSheetChange(v)}>
                <SelectTrigger className="bg-white dark:bg-slate-800 border-slate-300 dark:border-slate-700">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700">
                  {availableSheets.map((sheet) => (
                    <SelectItem key={sheet.name} value={sheet.name}>
                      {sheet.name} ({sheet.rowCount} filas)
                      {sheet.recommended ? " · recomendada" : ""}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          {fileName && (
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Archivo:{" "}
              <span className="font-medium text-slate-700 dark:text-slate-300">{fileName}</span>
              {sheetName && <> · Hoja: <span className="font-medium">{sheetName}</span></>}
              {profile === "cyberar" && (
                <> · <span className="text-cyan-600 dark:text-cyan-400">Formato CyberAR detectado</span></>
              )}
            </p>
          )}

          {rows.length > 0 && (
            <>
              <div className="grid grid-cols-3 gap-3">
                <div className="rounded-lg border border-slate-200 dark:border-slate-700 p-3">
                  <p className="text-xs text-slate-500">Filas válidas</p>
                  <p className="text-lg font-semibold text-emerald-600 dark:text-emerald-400">
                    {validRows.length}
                  </p>
                </div>
                <div className="rounded-lg border border-slate-200 dark:border-slate-700 p-3">
                  <p className="text-xs text-slate-500">Duplicados detectados</p>
                  <p className="text-lg font-semibold text-amber-600 dark:text-amber-400">
                    {duplicateCount}
                  </p>
                </div>
                <div className="rounded-lg border border-slate-200 dark:border-slate-700 p-3">
                  <p className="text-xs text-slate-500">A importar</p>
                  <p className="text-lg font-semibold text-cyan-600 dark:text-cyan-400">
                    {toImportCount}
                  </p>
                </div>
              </div>

              <label className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-300">
                <input
                  type="checkbox"
                  checked={replaceDuplicates}
                  onChange={(e) => setReplaceDuplicates(e.target.checked)}
                  className="rounded border-slate-300"
                />
                Actualizar duplicados (misma empresa)
              </label>

              <div className="rounded-xl border border-slate-200 dark:border-slate-800 overflow-hidden max-h-64 overflow-y-auto">
                <table className="w-full text-xs">
                  <thead className="bg-slate-50 dark:bg-slate-950/50 sticky top-0">
                    <tr>
                      <th className="px-3 py-2 text-left text-slate-500">#</th>
                      <th className="px-3 py-2 text-left text-slate-500">Empresa</th>
                      <th className="px-3 py-2 text-left text-slate-500">Prioridad</th>
                      <th className="px-3 py-2 text-left text-slate-500">Región</th>
                      <th className="px-3 py-2 text-left text-slate-500">Rubro</th>
                      <th className="px-3 py-2 text-left text-slate-500">Pts</th>
                      <th className="px-3 py-2 text-left text-slate-500">OK</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                    {rows.slice(0, 50).map((row) => {
                      const isDuplicate =
                        row.errors.length === 0 &&
                        existingKeys.has(sponsorKey(row.sponsor));
                      return (
                        <tr key={row.rowNumber}>
                          <td className="px-3 py-2 text-slate-400">{row.rowNumber}</td>
                          <td className="px-3 py-2 text-slate-800 dark:text-slate-200 max-w-32 truncate">
                            {row.sponsor.empresa || "—"}
                          </td>
                          <td className="px-3 py-2 text-slate-600 dark:text-slate-400 max-w-24 truncate">
                            {row.sponsor.prioridad || "—"}
                          </td>
                          <td className="px-3 py-2 text-slate-600 dark:text-slate-400">
                            {row.sponsor.region || "—"}
                          </td>
                          <td className="px-3 py-2 text-slate-600 dark:text-slate-400 max-w-32 truncate">
                            {row.sponsor.segmento || "—"}
                          </td>
                          <td className="px-3 py-2 text-slate-600 dark:text-slate-400">
                            {row.sponsor.probabilidad}
                          </td>
                          <td className="px-3 py-2">
                            {row.errors.length > 0 ? (
                              <span className="text-red-500">{row.errors.join(", ")}</span>
                            ) : isDuplicate ? (
                              <span className="text-amber-600 dark:text-amber-400">Dup</span>
                            ) : (
                              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
              {rows.length > 50 && (
                <p className="text-xs text-slate-400">
                  Mostrando 50 de {rows.length} filas en preview.
                </p>
              )}
            </>
          )}

          {resultMessage && (
            <div className="rounded-lg border border-emerald-200 dark:border-emerald-500/30 bg-emerald-50 dark:bg-emerald-500/10 px-3 py-2 text-sm text-emerald-800 dark:text-emerald-200">
              {resultMessage}
            </div>
          )}

          {error && (
            <div className="rounded-lg border border-red-200 dark:border-red-500/30 bg-red-50 dark:bg-red-500/10 px-3 py-2 text-sm text-red-700 dark:text-red-300 flex items-start gap-2">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
              {error}
            </div>
          )}
        </div>

        <DialogFooter className="gap-2">
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            className="border-slate-300 dark:border-slate-700"
          >
            Cerrar
          </Button>
          <Button
            onClick={() => void handleImport()}
            disabled={importing || toImportCount === 0}
            className={cn(
              "gap-2 font-semibold",
              "bg-emerald-600 hover:bg-emerald-500 text-white"
            )}
          >
            {importing ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Upload className="w-4 h-4" />
            )}
            Importar {toImportCount > 0 ? `(${toImportCount})` : ""}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
