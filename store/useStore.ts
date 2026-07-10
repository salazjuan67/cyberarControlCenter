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
  mockSponsors,
  mockInscripciones,
  mockGastos,
  defaultEscenarios,
} from "@/data/mockData";
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
  resetToDefaultsInDb,
} from "@/app/actions/data";

interface AppState {
  isHydrated: boolean;
  isLoading: boolean;
  config: EventConfig;
  sponsors: Sponsor[];
  inscripciones: Inscripcion[];
  gastos: Gasto[];
  escenarios: EscenarioConfig[];
  presentationMode: boolean;

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

  resetToDefaults: () => Promise<void>;
  clearAllData: () => Promise<void>;
}

export const useStore = create<AppState>()((set, get) => ({
  isHydrated: false,
  isLoading: true,
  config: defaultConfig,
  sponsors: mockSponsors,
  inscripciones: mockInscripciones,
  gastos: mockGastos,
  escenarios: defaultEscenarios,
  presentationMode: false,

  hydrate: (data) =>
    set({
      ...data,
      isHydrated: true,
      isLoading: false,
    }),

  setLoading: (loading) => set({ isLoading: loading }),

  setConfig: (updates) => {
    const newConfig = { ...get().config, ...updates };
    set({ config: newConfig });
    void saveConfig(newConfig);
  },

  addSponsor: (sponsor) => {
    set((state) => ({ sponsors: [...state.sponsors, sponsor] }));
    void saveSponsor(sponsor);
  },

  updateSponsor: (id, updates) => {
    const updated = get().sponsors.map((s) =>
      s.id === id ? { ...s, ...updates } : s
    );
    set({ sponsors: updated });
    const sponsor = updated.find((s) => s.id === id);
    if (sponsor) void saveSponsor(sponsor);
  },

  deleteSponsor: (id) => {
    set((state) => ({
      sponsors: state.sponsors.filter((s) => s.id !== id),
    }));
    void removeSponsor(id);
  },

  addInscripcion: (inscripcion) => {
    set((state) => ({
      inscripciones: [...state.inscripciones, inscripcion],
    }));
    void saveInscripcion(inscripcion);
  },

  updateInscripcion: (id, updates) => {
    const updated = get().inscripciones.map((i) =>
      i.id === id ? { ...i, ...updates } : i
    );
    set({ inscripciones: updated });
    const inscripcion = updated.find((i) => i.id === id);
    if (inscripcion) void saveInscripcion(inscripcion);
  },

  deleteInscripcion: (id) => {
    set((state) => ({
      inscripciones: state.inscripciones.filter((i) => i.id !== id),
    }));
    void removeInscripcion(id);
  },

  addGasto: (gasto) => {
    set((state) => ({ gastos: [...state.gastos, gasto] }));
    void saveGasto(gasto);
  },

  updateGasto: (id, updates) => {
    const updated = get().gastos.map((g) =>
      g.id === id ? { ...g, ...updates } : g
    );
    set({ gastos: updated });
    const gasto = updated.find((g) => g.id === id);
    if (gasto) void saveGasto(gasto);
  },

  deleteGasto: (id) => {
    set((state) => ({
      gastos: state.gastos.filter((g) => g.id !== id),
    }));
    void removeGasto(id);
  },

  updateEscenario: (tipo, updates) => {
    const updated = get().escenarios.map((e) =>
      e.tipo === tipo ? { ...e, ...updates } : e
    );
    set({ escenarios: updated });
    const escenario = updated.find((e) => e.tipo === tipo);
    if (escenario) void saveEscenario(escenario);
  },

  setPresentationMode: (value) => set({ presentationMode: value }),

  resetToDefaults: async () => {
    set({ isLoading: true });
    try {
      const data = await resetToDefaultsInDb();
      set({ ...data, isLoading: false });
    } catch {
      set({ isLoading: false });
    }
  },

  clearAllData: async () => {
    await clearAllDataInDb();
    set({ sponsors: [], inscripciones: [], gastos: [] });
  },
}));
