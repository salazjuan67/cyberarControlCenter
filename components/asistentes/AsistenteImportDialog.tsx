"use client";

import { useMemo, useRef, useState } from "react";
import { AlertCircle, CheckCircle2, FileSpreadsheet, Loader2, Upload } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useStore } from "@/store/useStore";
import type { AsistentePotencial } from "@/types/asistentes";
import {
  asistenteKey,
  parseAsistenteWorkbook,
  type ParsedAsistenteRow,
} from "@/lib/asistentes/import";
import { cn } from "@/lib/utils";

interface AsistenteImportDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function AsistenteImportDialog({ open, onOpenChange }: AsistenteImportDialogProps) {
  const { asistentesPotenciales, importAsistentes } = useStore();
  const inputRef = useRef<HTMLInputElement>(null);
  const [rows, setRows] = useState<ParsedAsistenteRow[]>([]);
  const [fileName, setFileName] = useState("");
  const [sheetInfo, setSheetInfo] = useState("");
  const [replaceDuplicates, setReplaceDuplicates] = useState(false);
  const [importing, setImporting] = useState(false);
  const [resultMessage, setResultMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const existingKeys = useMemo(
    () => new Set(asistentesPotenciales.map((a) => asistenteKey(a))),
    [asistentesPotenciales]
  );

  const validRows = rows.filter((r) => r.errors.length === 0);
  const duplicateCount = validRows.filter((r) => existingKeys.has(asistenteKey(r.asistente))).length;
  const toImportCount = replaceDuplicates ? validRows.length : validRows.length - duplicateCount;

  function resetState() {
    setRows([]);
    setFileName("");
    setSheetInfo("");
    setResultMessage(null);
    setError(null);
    setReplaceDuplicates(false);
    if (inputRef.current) inputRef.current.value = "";
  }

  async function handleFiles(files: FileList | null) {
    if (!files?.length) return;
    setError(null);
    setResultMessage(null);

    try {
      const parsedRows: ParsedAsistenteRow[] = [];
      const names: string[] = [];
      const sheets: string[] = [];

      for (const file of Array.from(files)) {
        const buffer = await file.arrayBuffer();
        const parsed = parseAsistenteWorkbook(buffer, { mergeAllSheets: true });
        parsedRows.push(...parsed.rows);
        names.push(file.name);
        sheets.push(...parsed.mergedSheets);
      }

      const seen = new Map<string, ParsedAsistenteRow>();
      for (const row of parsedRows) {
        if (row.errors.length > 0) continue;
        const key = asistenteKey(row.asistente);
        if (!seen.has(key)) seen.set(key, row);
      }
      const invalid = parsedRows.filter((r) => r.errors.length > 0);
      setRows([...seen.values(), ...invalid]);
      setFileName(names.join(", "));
      setSheetInfo(sheets.join(", "));
    } catch (err) {
      setError(err instanceof Error ? err.message : "No se pudo leer el archivo");
      setRows([]);
    }
  }

  async function handleImport() {
    if (validRows.length === 0) return;
    setImporting(true);
    setError(null);
    setResultMessage(null);

    const payload: AsistentePotencial[] = validRows.map((row, index) => ({
      ...row.asistente,
      id: `ap-imp-${Date.now()}-${index}`,
    }));

    try {
      const result = await importAsistentes(payload, { replaceDuplicates });
      const parts = [
        `${result.imported} importado(s)`,
        result.updated > 0 ? `${result.updated} actualizado(s)` : null,
        result.skipped > 0 ? `${result.skipped} omitido(s)` : null,
      ].filter(Boolean);
      setResultMessage(`Importación completada: ${parts.join(" · ")}.`);
      if (result.errors.length > 0) setError(result.errors.join(" · "));
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
            <FileSpreadsheet className="w-5 h-5 text-violet-500" />
            Importar asistentes desde Excel
          </DialogTitle>
          <DialogDescription className="text-slate-500 dark:text-slate-400">
            Compatible con bases de congresos anteriores: hojas <strong>CIBERDEFENSA</strong>,{" "}
            <strong>COMUNICACIONES</strong> y listas de emails (CUC). Podés seleccionar varios archivos a la vez.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <Button
            type="button"
            onClick={() => inputRef.current?.click()}
            className="gap-2 bg-violet-600 hover:bg-violet-500 text-white font-semibold"
          >
            <Upload className="w-4 h-4" />
            Seleccionar archivo(s)
          </Button>
          <input
            ref={inputRef}
            type="file"
            accept=".xlsx,.xls,.csv"
            multiple
            className="hidden"
            onChange={(e) => void handleFiles(e.target.files)}
          />

          {fileName && (
            <p className="text-xs text-slate-500">
              Archivo(s): <span className="font-medium text-slate-700 dark:text-slate-300">{fileName}</span>
              {sheetInfo && <> · Hojas: {sheetInfo}</>}
            </p>
          )}

          {rows.length > 0 && (
            <>
              <div className="grid grid-cols-3 gap-3">
                <div className="rounded-lg border p-3">
                  <p className="text-xs text-slate-500">Válidos (únicos)</p>
                  <p className="text-lg font-semibold text-emerald-600">{validRows.length}</p>
                </div>
                <div className="rounded-lg border p-3">
                  <p className="text-xs text-slate-500">Duplicados en CRM</p>
                  <p className="text-lg font-semibold text-amber-600">{duplicateCount}</p>
                </div>
                <div className="rounded-lg border p-3">
                  <p className="text-xs text-slate-500">A importar</p>
                  <p className="text-lg font-semibold text-violet-600">{toImportCount}</p>
                </div>
              </div>

              <label className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-300">
                <input
                  type="checkbox"
                  checked={replaceDuplicates}
                  onChange={(e) => setReplaceDuplicates(e.target.checked)}
                  className="rounded border-slate-300"
                />
                Actualizar duplicados (mismo email)
              </label>

              <div className="rounded-xl border overflow-hidden max-h-64 overflow-y-auto">
                <table className="w-full text-xs">
                  <thead className="bg-slate-50 dark:bg-slate-950/50 sticky top-0">
                    <tr>
                      <th className="px-3 py-2 text-left text-slate-500">Nombre</th>
                      <th className="px-3 py-2 text-left text-slate-500">Email</th>
                      <th className="px-3 py-2 text-left text-slate-500">Origen</th>
                      <th className="px-3 py-2 text-left text-slate-500">OK</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                    {rows.slice(0, 50).map((row) => {
                      const isDup = row.errors.length === 0 && existingKeys.has(asistenteKey(row.asistente));
                      const fullName = [row.asistente.nombre, row.asistente.apellido].filter(Boolean).join(" ");
                      return (
                        <tr key={`${row.rowNumber}-${row.asistente.email}`}>
                          <td className="px-3 py-2 max-w-32 truncate">{fullName || "—"}</td>
                          <td className="px-3 py-2 font-mono">{row.asistente.email || "—"}</td>
                          <td className="px-3 py-2 text-slate-500 max-w-40 truncate">{row.asistente.origen}</td>
                          <td className="px-3 py-2">
                            {row.errors.length > 0 ? (
                              <span className="text-red-500">{row.errors[0]}</span>
                            ) : isDup ? (
                              <span className="text-amber-600">Dup</span>
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
                <p className="text-xs text-slate-400">Mostrando 50 de {rows.length} filas.</p>
              )}
            </>
          )}

          {resultMessage && (
            <div className="rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-800">
              {resultMessage}
            </div>
          )}

          {error && (
            <div className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700 flex gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              {error}
            </div>
          )}
        </div>

        <DialogFooter className="gap-2">
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cerrar</Button>
          <Button
            onClick={() => void handleImport()}
            disabled={importing || toImportCount === 0}
            className={cn("gap-2 font-semibold bg-emerald-600 hover:bg-emerald-500 text-white")}
          >
            {importing ? <Loader2 className="w-4 h-4 animate-spin" /> : <Upload className="w-4 h-4" />}
            Importar {toImportCount > 0 ? `(${toImportCount})` : ""}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
