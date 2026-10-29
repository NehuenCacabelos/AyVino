import { useState } from 'react';
import { DashboardNavbar, PromoBlocks } from '../features/dashboard';
import { PairingInteractiveHub, PairingWallpaper } from '../features/pairings';
import type { HubMode } from '../features/pairings/components/PairingInteractiveHub';

/**
 * PairingPage Component (/maridaje)
 * Guía y selector interactivo y bidireccional ("¿Qué vas a comer?" vs "¿Qué vas a tomar?"):
 * - Vinculado a la opción "Maridaje" de la barra de navegación superior.
 * - Integra selector de afinidades gastronómicas, notas de cata de sommelier y vinculación a botellas reales.
 * - Fondo dinámico editorial con textura temática SVG y viñeta radial.
 * - Mantiene en la parte inferior las pautas de estiba y conservación en bodega (PromoBlocks).
 */
export default function PairingPage() {
  const [stockCount] = useState(24);
  const [activeMode, setActiveMode] = useState<HubMode>('food');

  return (
    <div className="relative min-h-screen bg-[#0f0f11] text-neutral-200 font-sans selection:bg-[#722F37] selection:text-white flex flex-col justify-between overflow-x-hidden">
      {/* Textura de fondo dinámica temática con viñeta radial */}
      <PairingWallpaper mode={activeMode} />

      {/* 1. Navbar Superior Persistente */}
      <DashboardNavbar stockCount={stockCount} />

      {/* 2. Contenido Principal de Maridaje */}
      <main className="relative z-10 mx-auto flex w-full max-w-7xl flex-col gap-16 sm:gap-20 px-4 sm:px-6 lg:px-8 pb-24 pt-28 sm:pt-32">
        {/* Hub Interactivo Bidireccional */}
        <section id="maridaje" aria-label="El Arte del Maridaje">
          <PairingInteractiveHub
            currentMode={activeMode}
            onModeChange={setActiveMode}
          />
        </section>

        {/* Separador Editorial Sutil */}
        <div className="w-full h-px bg-gradient-to-r from-transparent via-neutral-800 to-transparent my-2" />

        {/* Pautas de Guarda, Humedad y Servicio Editorial */}
        <section id="pautas-de-cava" aria-label="Pautas de Estiba y Guarda en Cava">
          <div className="mb-4">
            <span className="text-[11px] font-mono uppercase tracking-[0.25em] text-neutral-500">
              GUÍA COMPLEMENTARIA DE GUARDA
            </span>
            <h3 className="font-serif text-2xl font-semibold text-neutral-200 mt-1">
              Estiba & Maduración en Cava
            </h3>
          </div>
          <PromoBlocks />
        </section>
      </main>

      {/* 3. Footer Editorial */}
      <footer className="relative z-10 border-t border-neutral-800 bg-[#0c0c0e]/95 backdrop-blur-sm transition-colors">
        <div className="mx-auto flex max-w-7xl flex-col sm:flex-row items-center justify-between gap-4 px-4 sm:px-6 lg:px-8 py-8 text-xs text-neutral-500">
          <div className="flex items-center gap-2">
            <span className="text-base font-bold tracking-tight text-zinc-100">
              AyVino<span className="text-rose-500">.</span>
            </span>
            <span className="text-neutral-600 font-mono text-[10px]">|</span>
            <span className="text-neutral-400 font-mono text-[11px]">Guía de Maridajes</span>
          </div>

          <span className="text-[11px] font-mono uppercase tracking-[0.16em] text-neutral-500 text-center sm:text-right">
            Beber con moderación · Prohibida su venta a menores de 18 años
          </span>
        </div>
      </footer>
    </div>
  );
}
