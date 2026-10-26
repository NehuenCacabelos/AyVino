import { PromoBlocks } from '../features/dashboard';

/**
 * PairingPage Component (/maridaje)
 * Página dedicada a la curaduría editorial de maridajes y pautas de guarda:
 * - Renderizada dentro de AppLayout con Navbar y Footer persistentes.
 * - Integra Bento Grid modular con pautas de estiba, temperaturas y maridajes enogastronómicos.
 */
export default function PairingPage() {
  return (
    <main className="mx-auto flex w-full max-w-7xl flex-col gap-12 sm:gap-16 px-4 sm:px-6 lg:px-8 pb-24 pt-28 sm:pt-32">
      <section id="maridaje" aria-label="Recomendaciones y Maridajes">
        <PromoBlocks />
      </section>
    </main>
  );
}
