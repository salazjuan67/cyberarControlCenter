"use client";

import { AlertTriangle, X } from "lucide-react";
import { useStore } from "@/store/useStore";
import { Button } from "@/components/ui/button";

export function SaveErrorBanner() {
  const { saveError, clearSaveError } = useStore();

  if (!saveError) return null;

  return (
    <div className="sticky top-0 z-40 mx-4 md:mx-6 mt-4 flex items-start gap-3 rounded-lg border border-red-200 dark:border-red-500/30 bg-red-50 dark:bg-red-500/10 px-4 py-3 text-sm text-red-800 dark:text-red-200">
      <AlertTriangle className="w-4 h-4 mt-0.5 shrink-0" />
      <div className="flex-1 min-w-0">
        <p className="font-medium">No se pudo guardar en la base de datos</p>
        <p className="text-xs mt-0.5 opacity-90 break-words">{saveError}</p>
      </div>
      <Button
        size="sm"
        variant="ghost"
        onClick={clearSaveError}
        className="h-7 w-7 p-0 shrink-0 text-red-700 dark:text-red-300 hover:bg-red-100 dark:hover:bg-red-500/20"
      >
        <X className="w-4 h-4" />
      </Button>
    </div>
  );
}
