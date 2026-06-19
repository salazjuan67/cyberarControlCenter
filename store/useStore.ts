import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
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

interface AppState {
  config: EventConfig;
  sponsors: Sponsor[];
  inscripciones: Inscripcion[];
  gastos: Gasto[];
  escenarios: EscenarioConfig[];
  presentationMode: boolean;

  // Config actions
  setConfig: (config: Partial<EventConfig>) => void;

  // Sponsor actions
  addSponsor: (sponsor: Sponsor) => void;
  updateSponsor: (id: string, updates: Partial<Sponsor>) => void;
  deleteSponsor: (id: string) => void;

  // Inscripción actions
  addInscripcion: (inscripcion: Inscripcion) => void;
  updateInscripcion: (id: string, updates: Partial<Inscripcion>) => void;
  deleteInscripcion: (id: string) => void;

  // Gasto actions
  addGasto: (gasto: Gasto) => void;
  updateGasto: (id: string, updates: Partial<Gasto>) => void;
  deleteGasto: (id: string) => void;

  // Escenario actions
  updateEscenario: (
    tipo: EscenarioConfig["tipo"],
    updates: Partial<EscenarioConfig>
  ) => void;

  // UI actions
  setPresentationMode: (value: boolean) => void;

  // Reset
  resetToDefaults: () => void;
  clearAllData: () => void;
}

export const useStore = create<AppState>()(
  persist(
    (set) => ({
      config: defaultConfig,
      sponsors: mockSponsors,
      inscripciones: mockInscripciones,
      gastos: mockGastos,
      escenarios: defaultEscenarios,
      presentationMode: false,

      setConfig: (updates) =>
        set((state) => ({ config: { ...state.config, ...updates } })),

      addSponsor: (sponsor) =>
        set((state) => ({ sponsors: [...state.sponsors, sponsor] })),
      updateSponsor: (id, updates) =>
        set((state) => ({
          sponsors: state.sponsors.map((s) =>
            s.id === id ? { ...s, ...updates } : s
          ),
        })),
      deleteSponsor: (id) =>
        set((state) => ({
          sponsors: state.sponsors.filter((s) => s.id !== id),
        })),

      addInscripcion: (inscripcion) =>
        set((state) => ({
          inscripciones: [...state.inscripciones, inscripcion],
        })),
      updateInscripcion: (id, updates) =>
        set((state) => ({
          inscripciones: state.inscripciones.map((i) =>
            i.id === id ? { ...i, ...updates } : i
          ),
        })),
      deleteInscripcion: (id) =>
        set((state) => ({
          inscripciones: state.inscripciones.filter((i) => i.id !== id),
        })),

      addGasto: (gasto) =>
        set((state) => ({ gastos: [...state.gastos, gasto] })),
      updateGasto: (id, updates) =>
        set((state) => ({
          gastos: state.gastos.map((g) =>
            g.id === id ? { ...g, ...updates } : g
          ),
        })),
      deleteGasto: (id) =>
        set((state) => ({
          gastos: state.gastos.filter((g) => g.id !== id),
        })),

      updateEscenario: (tipo, updates) =>
        set((state) => ({
          escenarios: state.escenarios.map((e) =>
            e.tipo === tipo ? { ...e, ...updates } : e
          ),
        })),

      setPresentationMode: (value) => set({ presentationMode: value }),

      resetToDefaults: () =>
        set({
          config: defaultConfig,
          sponsors: mockSponsors,
          inscripciones: mockInscripciones,
          gastos: mockGastos,
          escenarios: defaultEscenarios,
        }),

      clearAllData: () =>
        set({
          sponsors: [],
          inscripciones: [],
          gastos: [],
        }),
    }),
    {
      name: "cybear-control-storage",
      storage: createJSONStorage(() => localStorage),
    }
  )
);
