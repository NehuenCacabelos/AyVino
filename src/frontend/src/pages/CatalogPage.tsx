import Navbar from '../components/layout/Navbar';
import { Wine, Sparkles } from 'lucide-react';

/**
 * CatalogPage Component
 * Página protegida general para usuarios autenticados con estética editorial oscura (#0f0f11).
 * Muestra el catálogo integral y notas de cata comunitarias.
 */
export default function CatalogPage() {
  return (
    <div className="min-h-screen bg-[#0f0f11] text-neutral-100 font-sans flex flex-col">
      <Navbar />

      <main className="flex-1 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 w-full">
        {/* Encabezado Editorial */}
        <div className="mb-8">
          <span className="inline-flex items-center gap-1.5 text-[11px] font-mono font-semibold uppercase tracking-widest text-neutral-400 bg-neutral-900 px-3 py-1 rounded-sm border border-neutral-800">
            <Sparkles className="w-3 h-3 text-neutral-400" />
            Catálogo General Protegido
          </span>

          <h1 className="font-serif text-3xl sm:text-4xl font-semibold mt-3 text-neutral-100 leading-tight">
            Colección & Terruños Argentinos
          </h1>

          <p className="mt-2 text-sm text-neutral-400 max-w-2xl font-sans leading-relaxed">
            Explorá el archivo completo de etiquetas certificadas, notas sensoriales de añadas y maridajes propuestos por la comunidad.
          </p>
        </div>

        {/* Bloque Informativo de Catálogo */}
        <div className="p-10 rounded-sm bg-[#141416] border border-neutral-800 text-center flex flex-col items-center justify-center space-y-4">
          <div className="w-12 h-12 rounded-full border border-neutral-800 bg-neutral-900 text-neutral-300 flex items-center justify-center">
            <Wine className="w-6 h-6 text-neutral-300" />
          </div>
          <h2 className="font-serif text-xl font-semibold text-neutral-100">
            Módulo de Catálogo Activo
          </h2>
          <p className="text-xs sm:text-sm text-neutral-400 max-w-md font-sans">
            Has accedido a la vista protegida para miembros registrados de AyVino.
          </p>
        </div>
      </main>
    </div>
  );
}
