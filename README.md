# CYBER.AR Control Center

Sistema de gestión financiera y operativa para el Congreso **CYBER.AR 2026**.

## Descripción

Aplicación web moderna tipo dashboard ejecutivo para gestionar presupuesto, sponsors, inscripciones, gastos y proyecciones financieras del evento.

## Tecnologías

- **Next.js 16** (App Router)
- **React / TypeScript**
- **Tailwind CSS**
- **shadcn/ui** — Componentes UI premium
- **Recharts** — Gráficos interactivos
- **Zustand** — Estado global con persistencia en `localStorage`
- **Lucide React** — Iconografía

## Módulos

| Módulo | Descripción |
|--------|-------------|
| **Dashboard Ejecutivo** | KPIs, gráficos de ingresos/gastos, resumen ejecutivo |
| **Sponsors / Auspiciantes** | CRM comercial con pipeline, estados y totales |
| **Inscripciones** | Gestión por categoría/modalidad con simulador |
| **Presupuesto y Gastos** | CRUD de egresos con análisis de desvíos |
| **Escenarios** | Proyección financiera (Conservador/Esperado/Optimista) |
| **Presentación Ejecutiva** | Vista limpia para reuniones y proyecciones |
| **Configuración** | Parámetros generales del evento |

## Inicio rápido

```bash
# Instalar dependencias
npm install

# Iniciar servidor de desarrollo
npm run dev
```

Abrir [http://localhost:3000](http://localhost:3000) en el navegador.

## Estructura del proyecto

```
├── app/
│   ├── (main)/              # Layout con sidebar
│   │   ├── dashboard/
│   │   ├── sponsors/
│   │   ├── inscripciones/
│   │   ├── presupuesto/
│   │   ├── escenarios/
│   │   ├── presentacion/
│   │   └── configuracion/
│   └── globals.css
├── components/
│   ├── layout/              # Sidebar, Header
│   ├── dashboard/           # KPICard, RevenueChart, etc.
│   ├── sponsors/            # SponsorTable, SponsorDialog, SponsorPipeline
│   ├── presupuesto/         # GastoTable, GastoDialog, GastoChart
│   ├── inscripciones/       # InscripcionTable, InscripcionCharts, Simulator
│   └── escenarios/          # ScenarioCard, ScenarioChart
├── store/
│   └── useStore.ts          # Zustand store con persistencia localStorage
├── types/
│   └── index.ts             # Tipos TypeScript
├── lib/
│   ├── calculations.ts      # Funciones financieras centralizadas
│   └── formatters.ts        # Formateo de moneda, fechas, etc.
└── data/
    └── mockData.ts          # Datos iniciales de ejemplo
```

## Datos de ejemplo precargados

- **Sponsors**: 9 empresas del sector tech/seguridad con distintos estados
- **Inscripciones**: 9 categorías (Profesional, Estudiante, Militar, etc.)
- **Gastos**: 12 conceptos presupuestados con proveedores
- **Escenarios**: Conservador, Esperado y Optimista configurados

## Persistencia

Los datos se almacenan en `localStorage` del navegador. Para restaurar los datos de ejemplo, ir a **Configuración → Restaurar datos demo**.

## Próximos pasos (migración a Supabase)

La arquitectura del store (`useStore.ts`) está preparada para reemplazar `localStorage` con llamadas a Supabase sin cambiar la interfaz de los componentes.
