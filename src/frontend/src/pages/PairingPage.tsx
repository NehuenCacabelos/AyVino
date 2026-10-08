import { useState } from 'react';
import {
  DashboardNavbar,
  PromoBlocks,
} from '../features/dashboard';

/**
 * PairingPage Component (/maridaje)
 * Página dedicada a la curaduría editorial de maridajes y pautas de guarda:
 * - Vinculada a la opción "Maridaje" del Navbar principal.
 * - Integra Bento Grid modular con pautas de estiba, temperaturas y maridajes enogastronómicos.
 */
export default function PairingPage() {
  const [stockCount] = useState(24);

  return (
    <div className="min-h-screen bg-[#0f0f11] text-neutral-200 font-sans selection:bg-[#722F37] selection:text-white flex flex-col justify-between">
      {/* 1. Navbar Superior Persistente */}
      <DashboardNavbar stockCount={stockCount} />

      {/* 2. Contenido Principal de Maridaje */}
      <main className="mx-auto flex w-full max-w-7xl flex-col gap-12 sm:gap-16 px-4 sm:px-6 lg:px-8 pb-24 pt-28 sm:pt-32">
        <section id="maridaje" aria-label="Recomendaciones y Maridajes">
          <PromoBlocks />
        </section>
      </main>

      {/* 3. Footer Editorial */}
      <footer className="border-t border-neutral-800 bg-[#0c0c0e] transition-colors">
        <div className="mx-auto flex max-w-7xl flex-col sm:flex-row items-center justify-between gap-4 px-4 sm:px-6 lg:px-8 py-8 text-xs text-neutral-500">
          <div className="flex items-center gap-2">
            <span className="text-base font-bold tracking-tight text-zinc-100">
              AyVino<span className="text-rose-500">.</span>
            </span>
          </div>

          <span className="text-[11px] font-mono uppercase tracking-[0.16em] text-neutral-500 text-center sm:text-right">
            Beber con moderación · Prohibida su venta a menores de 18 años
          </span>
        </div>
      </footer>
    </div>
  );
}

