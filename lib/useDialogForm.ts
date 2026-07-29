import { useEffect, useRef, useState, type Dispatch, type SetStateAction } from "react";

/**
 * Estado de formulario en diálogos: solo reinicia al abrir, no en cada re-render del padre.
 * (Evita que defaultValues={fn()} nuevo cada render borre montos editados.)
 */
export function useDialogForm<T extends object>(
  open: boolean,
  initial: T | undefined,
  defaultValues: T
): [T, Dispatch<SetStateAction<T>>] {
  const [form, setForm] = useState<T>(() =>
    initial ? { ...initial } : { ...defaultValues }
  );
  const wasOpen = useRef(false);

  useEffect(() => {
    if (open && !wasOpen.current) {
      setForm(initial ? { ...initial } : { ...defaultValues });
    }
    wasOpen.current = open;
  }, [open, initial, defaultValues]);

  return [form, setForm];
}

export function parseAmount(value: string): number {
  const normalized = value.replace(/\s/g, "").replace(/\./g, "").replace(",", ".");
  const n = Number(normalized);
  return Number.isFinite(n) ? n : 0;
}
