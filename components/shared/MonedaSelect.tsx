"use client";

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { MONEDAS, type Moneda } from "@/types";
import { MONEDA_LABELS } from "@/lib/formatters";

const selectContentCls =
  "bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700";
const selectItemCls =
  "text-slate-700 dark:text-slate-200 focus:bg-slate-100 dark:focus:bg-slate-700";

interface MonedaSelectProps {
  value: Moneda;
  onChange: (value: Moneda) => void;
  className?: string;
}

export function MonedaSelect({ value, onChange, className }: MonedaSelectProps) {
  return (
    <Select value={value} onValueChange={(v) => v && onChange(v as Moneda)}>
      <SelectTrigger className={className}>
        <SelectValue />
      </SelectTrigger>
      <SelectContent className={selectContentCls}>
        {MONEDAS.map((m) => (
          <SelectItem key={m} value={m} className={selectItemCls}>
            {MONEDA_LABELS[m]}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
