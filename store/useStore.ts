import { create } from "zustand";
import type {
  EventConfig,
  Sponsor,
  Inscripcion,
  Gasto,
  EscenarioConfig,
} from "@/types";
import {
  defaultConfig,
  emptyEscenarios,
} from "@/data/defaults";
import {
  saveConfig,
  saveSponsor,
  removeSponsor,
  saveInscripcion,
  removeInscripcion,
  saveGasto,
  removeGasto,
  saveEscenario,
  clearAllDataInDb,
} from "@/app/actions/data";
import { syncFinanceSummary } from "@/app/actions/finance-summary";
import type { FinanceSummary } from "@/types/finance-summary";

interface AppState {
  isHydrated: boolean;
  isLoading: boolean;
  config: EventConfig;
  sponsors: Sponsor[];
  inscripciones: Inscripcion[];
  gastos: Gasto[];
  escenarios: EscenarioConfig[];
  presentationMode: boolean;

  financeSummary: FinanceSummary | null;
  financeSummaryLoading: boolean;
  financeSummaryError: string | null;
  financeSummaryConfigured: boolean;

  saveError: string | null;
  clearSaveError: () => void;

  hydrate: (data: {
    config: EventConfig;
    sponsors: Sponsor[];
    inscripciones: Inscripcion[];
    gastos: Gasto[];
    escenarios: EscenarioConfig[];
  }) => void;
  setLoading: (loading: boolean) => void;

  setConfig: (config: Partial<EventConfig>) => void;

  addSponsor: (sponsor: Sponsor) => void;
  updateSponsor: (id: string, updates: Partial<Sponsor>) => void;
  deleteSponsor: (id: string) => void;

  addInscripcion: (inscripcion: Inscripcion) => void;
  updateInscripcion: (id: string, updates: Partial<Inscripcion>) => void;
  deleteInscripcion: (id: string) => void;

  addGasto: (gasto: Gasto) => void;
  updateGasto: (id: string, updates: Partial<Gasto>) => void;
  deleteGasto: (id: string) => void;

  updateEscenario: (
    tipo: EscenarioConfig["tipo"],
    updates: Partial<EscenarioConfig>
  ) => void;

  setPresentationMode: (value: boolean) => void;

  setFinanceSummary: (summary: FinanceSummary | null) => void;
  setFinanceSummaryMeta: (meta: {
    error?: string | null;
    loading?: boolean;
    configured?: boolean;
  }) => void;
  refreshFinanceSummary: () => Promise<void>;

  clearAllData: () => Promise<void>;
}

export const useStore = create<AppState>()((set, get) => ({
  isHydrated: false,
  isLoading: true,
  config: defaultConfig,
  sponsors: [],
  inscripciones: [],
  gastos: [],
  escenarios: emptyEscenarios,
  presentationMode: false,
  financeSummary: null,
  financeSummaryLoading: false,
  financeSummaryError: null,
  financeSummaryConfigured: false,
  saveError: null,

  hydrate: (data) =>
    set({
      ...data,
      isHydrated: true,
      isLoading: false,
    }),

  setLoading: (loading) => set({ isLoading: loading }),

  clearSaveError: () => set({ saveError: null }),

  setConfig: (updates) => {
    const newConfig = { ...get().config, ...updates };
    set({ config: newConfig, saveError: null });
    saveConfig(newConfig).catch((err: Error) => {
      set({ saveError: err.message || "Error al guardar configuración" });
    });
  },

  addSponsor: (sponsor) => {
    set((state) => ({ sponsors: [...state.sponsors, sponsor], saveError: null }));
    saveSponsor(sponsor).catch((err: Error) => {
      set({ saveError: err.message || "Error al guardar sponsor" });
    });
  },

  updateSponsor: (id, updates) => {
    const updated = get().sponsors.map((s) =>
      s.id === id ? { ...s, ...updates } : s
    );
    set({ sponsors: updated, saveError: null });
    const sponsor = updated.find((s) => s.id === id);
    if (sponsor) {
      saveSponsor(sponsor).catch((err: Error) => {
        set({ saveError: err.message || "Error al guardar sponsor" });
      });
    }
  },

  deleteSponsor: (id) => {
    set((state) => ({
      sponsors: state.sponsors.filter((s) => s.id !== id),
      saveError: null,
    }));
    removeSponsor(id).catch((err: Error) => {
      set({ saveError: err.message || "Error al eliminar sponsor" });
    });
  },

  addInscripcion: (inscripcion) => {
    set((state) => ({
      inscripciones: [...state.inscripciones, inscripcion],
      saveError: null,
    }));
    saveInscripcion(inscripcion).catch((err: Error) => {
      set({ saveError: err.message || "Error al guardar inscripción" });
    });
  },

  updateInscripcion: (id, updates) => {
    const updated = get().inscripciones.map((i) =>
      i.id === id ? { ...i, ...updates } : i
    );
    set({ inscripciones: updated, saveError: null });
    const inscripcion = updated.find((i) => i.id === id);
    if (inscripcion) {
      saveInscripcion(inscripcion).catch((err: Error) => {
        set({ saveError: err.message || "Error al guardar inscripción" });
      });
    }
  },

  deleteInscripcion: (id) => {
    set((state) => ({
      inscripciones: state.inscripciones.filter((i) => i.id !== id),
      saveError: null,
    }));
    removeInscripcion(id).catch((err: Error) => {
      set({ saveError: err.message || "Error al eliminar inscripción" });
    });
  },

  addGasto: (gasto) => {
    set((state) => ({ gastos: [...state.gastos, gasto], saveError: null }));
    saveGasto(gasto).catch((err: Error) => {
      set({ saveError: err.message || "Error al guardar gasto" });
    });
  },

  updateGasto: (id, updates) => {
    const updated = get().gastos.map((g) =>
      g.id === id ? { ...g, ...updates } : g
    );
    set({ gastos: updated, saveError: null });
    const gasto = updated.find((g) => g.id === id);
    if (gasto) {
      saveGasto(gasto).catch((err: Error) => {
        set({ saveError: err.message || "Error al guardar gasto" });
      });
    }
  },

  deleteGasto: (id) => {
    set((state) => ({
      gastos: state.gastos.filter((g) => g.id !== id),
      saveError: null,
    }));
    removeGasto(id).catch((err: Error) => {
      set({ saveError: err.message || "Error al eliminar gasto" });
    });
  },

  updateEscenario: (tipo, updates) => {
    const updated = get().escenarios.map((e) =>
      e.tipo === tipo ? { ...e, ...updates } : e
    );
    set({ escenarios: updated, saveError: null });
    const escenario = updated.find((e) => e.tipo === tipo);
    if (escenario) {
      saveEscenario(escenario).catch((err: Error) => {
        set({ saveError: err.message || "Error al guardar escenario" });
      });
    }
  },

  setPresentationMode: (value) => set({ presentationMode: value }),

  setFinanceSummary: (summary) => set({ financeSummary: summary }),

  setFinanceSummaryMeta: (meta) =>
    set((state) => ({
      financeSummaryLoading:
        meta.loading !== undefined ? meta.loading : state.financeSummaryLoading,
      financeSummaryError:
        meta.error !== undefined ? meta.error : state.financeSummaryError,
      financeSummaryConfigured:
        meta.configured !== undefined
          ? meta.configured
          : state.financeSummaryConfigured,
    })),

  refreshFinanceSummary: async () => {
    set({ financeSummaryLoading: true, financeSummaryError: null });
    try {
      const result = await syncFinanceSummary();
      set({
        financeSummary: result.summary,
        financeSummaryError: result.error ?? null,
        financeSummaryLoading: false,
      });
    } catch (err) {
      set({
        financeSummaryLoading: false,
        financeSummaryError:
          err instanceof Error ? err.message : "Error al sincronizar",
      });
    }
  },

  clearAllData: async () => {
    await clearAllDataInDb();
    set({ sponsors: [], inscripciones: [], gastos: [] });
  },
}));
