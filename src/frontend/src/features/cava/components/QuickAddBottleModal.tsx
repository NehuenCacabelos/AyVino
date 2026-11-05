import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { X, Plus, Compass, Sparkles } from 'lucide-react';
import type { BottleKind } from '../../../types/wine';
import type { QuickAddBottlePayload } from '../types';

interface QuickAddBottleModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAddBottle: (bottle: QuickAddBottlePayload) => void;
}

export default function QuickAddBottleModal({
  isOpen,
  onClose,
  onAddBottle,
}: QuickAddBottleModalProps) {
  const navigate = useNavigate();

  const [name, setName] = useState('');
  const [winery, setWinery] = useState('');
  const [region, setRegion] = useState('Mendoza, Argentina');
  const [varietal, setVarietal] = useState('Malbec');
  const [vintage, setVintage] = useState<number>(new Date().getFullYear() - 3);
  const [location, setLocation] = useState('A1 · ESTANTE SUP.');
  const [units, setUnits] = useState<number>(1);
  const [isJewel, setIsJewel] = useState(false);
  const [bottleKind, setBottleKind] = useState<BottleKind>('red-burgundy');

  if (!isOpen) {
    return null;
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !winery.trim()) {
      return;
    }

    onAddBottle({
      name: name.trim(),
      winery: winery.trim(),
      region: region.trim(),
      varietal,
      vintage: Number(vintage) || 2021,
      location: location.trim(),
      units: Math.max(1, Number(units) || 1),
      isJewel,
      bottle: bottleKind,
    });

    onClose();
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/80 backdrop-blur-md animate-in fade-in duration-200"
    >
      <div className="bg-[#121216] border border-neutral-800 rounded-2xl w-full max-w-xl max-h-[90vh] flex flex-col shadow-[0_20px_50px_rgba(0,0,0,0.85)] overflow-hidden">
        {/* Header */}
        <div className="p-5 border-b border-neutral-800 flex items-center justify-between bg-[#0e0e11]">
          <div className="flex items-center gap-2">
            <Plus className="w-5 h-5 text-[#fbbf24]" />
            <h3 className="font-serif text-xl text-neutral-100 font-semibold">
              Ingresar Lote / Botella a la Cava
            </h3>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-neutral-400 hover:text-white p-1 rounded-lg hover:bg-neutral-800 transition-colors"
            aria-label="Cerrar modal"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Catalog Shortcut Banner */}
        <div className="bg-[#18181f] border-b border-neutral-800/80 px-5 py-3 flex items-center justify-between gap-3">
          <div className="flex items-center gap-2 text-xs text-neutral-300">
            <Compass className="w-4 h-4 text-[#fbbf24] shrink-0" />
            <span>¿Buscás una etiqueta curada con ficha técnica oficial?</span>
          </div>
          <button
            type="button"
            onClick={() => {
              onClose();
              navigate('/catalogo');
            }}
            className="text-xs font-semibold text-[#fbbf24] hover:text-[#fde68a] hover:underline whitespace-nowrap transition-colors"
          >
            Explorar en Catálogo &rarr;
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-5 sm:p-6 space-y-4 overflow-y-auto">
          {/* Nombre de la etiqueta */}
          <div className="space-y-1.5">
            <label htmlFor="wine-name" className="font-mono text-xs text-neutral-300 uppercase tracking-wide block">
              Nombre de la Etiqueta *
            </label>
            <input
              id="wine-name"
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Ej. Catena Zapata Mundus Bacillus Terrae"
              className="w-full bg-[#0a0a0c] border border-neutral-800 rounded-lg px-3.5 py-2.5 text-sm text-neutral-100 placeholder-neutral-500 focus:outline-none focus:border-[#722F37] focus:ring-1 focus:ring-[#722F37] transition-all"
            />
          </div>

          {/* Bodega y Región */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <label htmlFor="wine-winery" className="font-mono text-xs text-neutral-300 uppercase tracking-wide block">
                Bodega *
              </label>
              <input
                id="wine-winery"
                type="text"
                required
                value={winery}
                onChange={(e) => setWinery(e.target.value)}
                placeholder="Ej. Bodega Catena Zapata"
                className="w-full bg-[#0a0a0c] border border-neutral-800 rounded-lg px-3.5 py-2.5 text-sm text-neutral-100 placeholder-neutral-500 focus:outline-none focus:border-[#722F37] focus:ring-1 focus:ring-[#722F37] transition-all"
              />
            </div>
            <div className="space-y-1.5">
              <label htmlFor="wine-region" className="font-mono text-xs text-neutral-300 uppercase tracking-wide block">
                Región / Terroir
              </label>
              <input
                id="wine-region"
                type="text"
                value={region}
                onChange={(e) => setRegion(e.target.value)}
                placeholder="Ej. Gualtallary, Valle de Uco"
                className="w-full bg-[#0a0a0c] border border-neutral-800 rounded-lg px-3.5 py-2.5 text-sm text-neutral-100 placeholder-neutral-500 focus:outline-none focus:border-[#722F37] focus:ring-1 focus:ring-[#722F37] transition-all"
              />
            </div>
          </div>

          {/* Varietal y Añada */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <label htmlFor="wine-varietal" className="font-mono text-xs text-neutral-300 uppercase tracking-wide block">
                Varietal Principal
              </label>
              <select
                id="wine-varietal"
                value={varietal}
                onChange={(e) => {
                  setVarietal(e.target.value);
                  if (e.target.value.includes('Blanco') || e.target.value === 'Chardonnay') {
                    setBottleKind('white');
                  } else if (e.target.value === 'Torrontés') {
                    setBottleKind('white-flute');
                  } else if (e.target.value.includes('Espumante')) {
                    setBottleKind('sparkling');
                  } else {
                    setBottleKind('red-burgundy');
                  }
                }}
                className="w-full bg-[#0a0a0c] border border-neutral-800 rounded-lg px-3.5 py-2.5 text-sm text-neutral-100 focus:outline-none focus:border-[#722F37] transition-all"
              >
                <option value="Malbec">Malbec</option>
                <option value="Cabernet Franc">Cabernet Franc</option>
                <option value="Cabernet Sauvignon">Cabernet Sauvignon</option>
                <option value="Blend de Tintas">Blend de Tintas</option>
                <option value="Pinot Noir">Pinot Noir</option>
                <option value="Chardonnay">Chardonnay</option>
                <option value="Torrontés">Torrontés</option>
                <option value="Espumante">Espumante</option>
              </select>
            </div>
            <div className="space-y-1.5">
              <label htmlFor="wine-vintage" className="font-mono text-xs text-neutral-300 uppercase tracking-wide block">
                Añada (Cosecha)
              </label>
              <input
                id="wine-vintage"
                type="number"
                min={1970}
                max={2030}
                value={vintage}
                onChange={(e) => setVintage(Number(e.target.value))}
                className="w-full bg-[#0a0a0c] border border-neutral-800 rounded-lg px-3.5 py-2.5 text-sm text-neutral-100 focus:outline-none focus:border-[#722F37] transition-all"
              />
            </div>
          </div>

          {/* Ubicación de Estante y Cantidad */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <label htmlFor="wine-location" className="font-mono text-xs text-neutral-300 uppercase tracking-wide block">
                Ubicación en Cava
              </label>
              <input
                id="wine-location"
                type="text"
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                placeholder="Ej. B2 · ESTANTE MEDIO"
                className="w-full bg-[#0a0a0c] border border-neutral-800 rounded-lg px-3.5 py-2.5 text-sm text-neutral-100 focus:outline-none focus:border-[#722F37] transition-all"
              />
            </div>
            <div className="space-y-1.5">
              <label htmlFor="wine-units" className="font-mono text-xs text-neutral-300 uppercase tracking-wide block">
                Cantidad de Botellas
              </label>
              <input
                id="wine-units"
                type="number"
                min={1}
                max={120}
                value={units}
                onChange={(e) => setUnits(Number(e.target.value))}
                className="w-full bg-[#0a0a0c] border border-neutral-800 rounded-lg px-3.5 py-2.5 text-sm text-neutral-100 focus:outline-none focus:border-[#722F37] transition-all"
              />
            </div>
          </div>

          {/* Toggle Joya de Colección */}
          <div className="pt-2">
            <label className="flex items-center gap-3 p-3 bg-[#18181f] rounded-lg border border-neutral-800 cursor-pointer hover:border-neutral-700 transition-colors">
              <input
                type="checkbox"
                checked={isJewel}
                onChange={(e) => setIsJewel(e.target.checked)}
                className="rounded border-neutral-700 text-[#722F37] focus:ring-[#722F37] h-4 w-4 bg-[#0a0a0c]"
              />
              <div className="flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-[#fbbf24]" />
                <span className="text-xs text-neutral-200 font-medium">
                  Marcar como Joya / Gran Reserva de la Cava
                </span>
              </div>
            </label>
          </div>

          {/* Footer Submit */}
          <div className="pt-4 border-t border-neutral-800 flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-lg bg-neutral-800 hover:bg-neutral-700 text-neutral-300 text-xs font-semibold transition-colors"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="px-5 py-2 rounded-lg bg-[#722F37] hover:bg-[#5C1D24] text-white text-xs font-semibold border border-rose-500/30 shadow-[0_0_16px_rgba(114,47,55,0.4)] transition-all"
            >
              Guardar en Bóveda
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
