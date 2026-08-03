import { create } from "zustand";
import type {
  EventConfig,
  Sponsor,
  Inscripcion,
  Gasto,
  EscenarioConfig,
} from "@/types";
import type { AsistentePotencial } from "@/types/asistentes";
import {
  defaultConfig,
  emptyEscenarios,
} from "@/data/defaults";
import {
  saveConfig,
  saveSponsor,
  removeSponsor,
  saveAsistentePotencial,
  removeAsistentePotencial,
  importAsistentesBulk,
  removeSponsorsWithoutEmail,
  saveInscripcion,
  removeInscripcion,
  saveGasto,
  removeGasto,
  saveEscenario,
  clearAllDataInDb,
  importSponsorsBulk,
  fetchAllData,
  type ImportSponsorsResult,
  type ImportAsistentesResult,
} from "@/app/actions/data";
import { syncFinanceSummary } from "@/app/actions/finance-summary";
import type { FinanceSummary } from "@/types/finance-summary";

interface AppState {
  isHydrated: boolean;
  isLoading: boolean;
  config: EventConfig;
  sponsors: Sponsor[];
  asistentesPotenciales: AsistentePotencial[];
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
    asistentesPotenciales: AsistentePotencial[];
    inscripciones: Inscripcion[];
    gastos: Gasto[];
    escenarios: EscenarioConfig[];
  }) => void;
  setLoading: (loading: boolean) => void;

  setConfig: (config: Partial<EventConfig>) => void;

  addSponsor: (sponsor: Sponsor) => Promise<void>;
  updateSponsor: (id: string, updates: Partial<Sponsor>) => Promise<void>;
  deleteSponsor: (id: string) => Promise<void>;
  deleteSponsorsWithoutEmail: () => Promise<number>;

  addAsistentePotencial: (asistente: AsistentePotencial) => Promise<void>;
  updateAsistentePotencial: (id: string, updates: Partial<AsistentePotencial>) => Promise<void>;
  deleteAsistentePotencial: (id: string) => Promise<void>;
  importAsistentes: (
    asistentes: AsistentePotencial[],
    options?: { replaceDuplicates?: boolean }
  ) => Promise<ImportAsistentesResult>;

  importSponsors: (
    sponsors: Sponsor[],
    options?: { replaceDuplicates?: boolean }
  ) => Promise<ImportSponsorsResult>;

  addInscripcion: (inscripcion: Inscripcion) => Promise<void>;
  updateInscripcion: (id: string, updates: Partial<Inscripcion>) => Promise<void>;
  deleteInscripcion: (id: string) => Promise<void>;

  addGasto: (gasto: Gasto) => Promise<void>;
  updateGasto: (id: string, updates: Partial<Gasto>) => Promise<void>;
  deleteGasto: (id: string) => Promise<void>;

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
  asistentesPotenciales: [],
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

  addSponsor: async (sponsor) => {
    set((state) => ({ sponsors: [...state.sponsors, sponsor], saveError: null }));
    try {
      await saveSponsor(sponsor);
    } catch (err) {
      set((state) => ({
        sponsors: state.sponsors.filter((s) => s.id !== sponsor.id),
        saveError: err instanceof Error ? err.message : "Error al guardar sponsor",
      }));
      throw err;
    }
  },

  updateSponsor: async (id, updates) => {
    const previous = get().sponsors;
    const updated = previous.map((s) =>
      s.id === id ? { ...s, ...updates } : s
    );
    set({ sponsors: updated, saveError: null });
    const sponsor = updated.find((s) => s.id === id);
    if (!sponsor) return;
    try {
      await saveSponsor(sponsor);
    } catch (err) {
      set({
        sponsors: previous,
        saveError: err instanceof Error ? err.message : "Error al guardar sponsor",
      });
      throw err;
    }
  },

  deleteSponsor: async (id) => {
    const previous = get().sponsors;
    set({
      sponsors: previous.filter((s) => s.id !== id),
      saveError: null,
    });
    try {
      await removeSponsor(id);
    } catch (err) {
      set({
        sponsors: previous,
        saveError: err instanceof Error ? err.message : "Error al eliminar sponsor",
      });
      throw err;
    }
  },

  deleteSponsorsWithoutEmail: async () => {
    const previous = get().sponsors;
    const withoutEmail = previous.filter((s) => !s.email.trim());
    set({
      sponsors: previous.filter((s) => s.email.trim()),
      saveError: null,
    });
    try {
      const { deleted } = await removeSponsorsWithoutEmail();
      return deleted;
    } catch (err) {
      set({
        sponsors: previous,
        saveError: err instanceof Error ? err.message : "Error al eliminar sponsors",
      });
      throw err;
    }
  },

  addAsistentePotencial: async (asistente) => {
    set((state) => ({
      asistentesPotenciales: [...state.asistentesPotenciales, asistente],
      saveError: null,
    }));
    try {
      await saveAsistentePotencial(asistente);
    } catch (err) {
      set((state) => ({
        asistentesPotenciales: state.asistentesPotenciales.filter((a) => a.id !== asistente.id),
        saveError: err instanceof Error ? err.message : "Error al guardar asistente",
      }));
      throw err;
    }
  },

  updateAsistentePotencial: async (id, updates) => {
    const previous = get().asistentesPotenciales;
    const updated = previous.map((a) => (a.id === id ? { ...a, ...updates } : a));
    set({ asistentesPotenciales: updated, saveError: null });
    const asistente = updated.find((a) => a.id === id);
    if (!asistente) return;
    try {
      await saveAsistentePotencial(asistente);
    } catch (err) {
      set({
        asistentesPotenciales: previous,
        saveError: err instanceof Error ? err.message : "Error al guardar asistente",
      });
      throw err;
    }
  },

  deleteAsistentePotencial: async (id) => {
    const previous = get().asistentesPotenciales;
    set({
      asistentesPotenciales: previous.filter((a) => a.id !== id),
      saveError: null,
    });
    try {
      await removeAsistentePotencial(id);
    } catch (err) {
      set({
        asistentesPotenciales: previous,
        saveError: err instanceof Error ? err.message : "Error al eliminar asistente",
      });
      throw err;
    }
  },

  importAsistentes: async (asistentes, options) => {
    const previous = get().asistentesPotenciales;
    set({ saveError: null });
    try {
      const result = await importAsistentesBulk(asistentes, options);
      const refreshed = await fetchAllData();
      set({ asistentesPotenciales: refreshed.asistentesPotenciales });
      return result;
    } catch (err) {
      set({
        asistentesPotenciales: previous,
        saveError: err instanceof Error ? err.message : "Error al importar asistentes",
      });
      throw err;
    }
  },

  importSponsors: async (sponsors, options) => {
    const previous = get().sponsors;
    set({ saveError: null });

    try {
      const result = await importSponsorsBulk(sponsors, options);
      const refreshed = await fetchAllData();
      set({ sponsors: refreshed.sponsors });
      return result;
    } catch (err) {
      set({
        sponsors: previous,
        saveError: err instanceof Error ? err.message : "Error al importar sponsors",
      });
      throw err;
    }
  },

  addInscripcion: async (inscripcion) => {
    set((state) => ({
      inscripciones: [...state.inscripciones, inscripcion],
      saveError: null,
    }));
    try {
      await saveInscripcion(inscripcion);
    } catch (err) {
      set((state) => ({
        inscripciones: state.inscripciones.filter((i) => i.id !== inscripcion.id),
        saveError: err instanceof Error ? err.message : "Error al guardar inscripción",
      }));
      throw err;
    }
  },

  updateInscripcion: async (id, updates) => {
    const previous = get().inscripciones;
    const updated = previous.map((i) =>
      i.id === id ? { ...i, ...updates } : i
    );
    set({ inscripciones: updated, saveError: null });
    const inscripcion = updated.find((i) => i.id === id);
    if (!inscripcion) return;
    try {
      await saveInscripcion(inscripcion);
    } catch (err) {
      set({
        inscripciones: previous,
        saveError: err instanceof Error ? err.message : "Error al guardar inscripción",
      });
      throw err;
    }
  },

  deleteInscripcion: async (id) => {
    const previous = get().inscripciones;
    set({
      inscripciones: previous.filter((i) => i.id !== id),
      saveError: null,
    });
    try {
      await removeInscripcion(id);
    } catch (err) {
      set({
        inscripciones: previous,
        saveError: err instanceof Error ? err.message : "Error al eliminar inscripción",
      });
      throw err;
    }
  },

  addGasto: async (gasto) => {
    set((state) => ({ gastos: [...state.gastos, gasto], saveError: null }));
    try {
      await saveGasto(gasto);
    } catch (err) {
      set((state) => ({
        gastos: state.gastos.filter((g) => g.id !== gasto.id),
        saveError: err instanceof Error ? err.message : "Error al guardar gasto",
      }));
      throw err;
    }
  },

  updateGasto: async (id, updates) => {
    const previous = get().gastos;
    const updated = previous.map((g) =>
      g.id === id ? { ...g, ...updates } : g
    );
    set({ gastos: updated, saveError: null });
    const gasto = updated.find((g) => g.id === id);
    if (!gasto) return;
    try {
      await saveGasto(gasto);
    } catch (err) {
      set({
        gastos: previous,
        saveError: err instanceof Error ? err.message : "Error al guardar gasto",
      });
      throw err;
    }
  },

  deleteGasto: async (id) => {
    const previous = get().gastos;
    set({
      gastos: previous.filter((g) => g.id !== id),
      saveError: null,
    });
    try {
      await removeGasto(id);
    } catch (err) {
      set({
        gastos: previous,
        saveError: err instanceof Error ? err.message : "Error al eliminar gasto",
      });
      throw err;
    }
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
