import Navbar from '../components/layout/Navbar';
import { Wine, Sparkles } from 'lucide-react';

/**
 * CatalogPage Component
 * Página protegida general para usuarios autenticados.
 * Muestra el catálogo integral y notas de cata comunitarias.
 */
export default function CatalogPage() {
  return (
    <div className="min-h-screen bg-cream-50 text-earth-900 flex flex-col">
      <Navbar />

      <main className="flex-1 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 w-full">
        {/* Encabezado Editorial */}
        <div className="mb-8">
          <span className="inline-flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-widest text-wine-800 bg-wine-50 px-2.5 py-1 rounded-full border border-wine-100">
            <Sparkles className="w-3 h-3 text-wine-500" />
            Catálogo General Protegido
          </span>

          <h1 className="font-serif text-3xl sm:text-4xl font-bold mt-3 text-earth-900 leading-tight">
            Colección & Terruños Argentinos
          </h1>

          <p className="mt-2 text-sm text-earth-900/70 max-w-2xl font-sans leading-relaxed">
            Explorá el archivo completo de etiquetas certificadas, notas sensoriales de añadas y maridajes propuestos por la comunidad.
          </p>
        </div>

        {/* Placeholder Informativo de Catálogo */}
        <div className="p-10 rounded-2xl bg-cream-100/70 border border-cream-200/90 text-center flex flex-col items-center justify-center space-y-4">
          <div className="w-12 h-12 rounded-full bg-wine-50 text-wine-900 flex items-center justify-center shadow-inner">
            <Wine className="w-6 h-6 text-wine-800" />
          </div>
          <h2 className="font-serif text-xl font-bold text-earth-900">
            Módulo de Catálogo Activo
          </h2>
          <p className="text-xs sm:text-sm text-earth-900/60 max-w-md">
            Has accedido a la vista protegida para miembros registrados de AyVino.
          </p>
        </div>
      </main>
    </div>
  );
}

