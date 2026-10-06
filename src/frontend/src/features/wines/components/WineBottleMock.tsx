import { Award, Compass, Sparkles } from 'lucide-react';

/**
 * WineBottleMock Component
 * Renderiza una botella de vino con perspectiva pseudo-3D profunda,
 * integrada orgánicamente con el fondo oscuro mate (#0f0f11),
 * tarjetas técnicas en font-mono y sombras de contacto realistas.
 */
export default function WineBottleMock() {
  return (
    <div className="relative w-full max-w-[420px] mx-auto h-[480px] sm:h-[540px] flex items-center justify-center perspective-1000 select-none">
      
      {/* Halo de luz ambiental tenue detrás de la botella */}
      <div className="absolute w-72 h-72 rounded-full bg-[#6b1d28]/10 blur-3xl -z-10 pointer-events-none" />
      <div className="absolute w-48 h-48 rounded-full bg-neutral-800/20 blur-2xl translate-y-12 -z-10 pointer-events-none" />

      {/* Tarjeta flotante 3D izquierda: Altitud / Origen */}
      <div className="absolute left-2 sm:-left-4 top-1/3 z-20 bg-[#141416]/95 backdrop-blur-md border border-neutral-800 px-3.5 py-2.5 rounded-sm transform -translate-y-6 hover:scale-105 transition-transform duration-300">
        <div className="flex items-center gap-2">
          <div className="p-1.5 rounded-sm bg-neutral-900 border border-neutral-800 text-neutral-300">
            <Compass className="w-3.5 h-3.5" />
          </div>
          <div>
            <p className="text-[10px] uppercase font-mono tracking-widest text-neutral-500">Terroir</p>
            <p className="text-xs font-medium text-neutral-200 font-sans">Gualtallary, 1.350m</p>
          </div>
        </div>
      </div>

      {/* Tarjeta flotante 3D derecha: Puntuación de cata */}
      <div className="absolute right-2 sm:-right-4 top-1/4 z-20 bg-[#141416]/95 backdrop-blur-md border border-neutral-800 px-3.5 py-2.5 rounded-sm transform translate-y-4 hover:scale-105 transition-transform duration-300">
        <div className="flex items-center gap-2">
          <div className="p-1.5 rounded-sm bg-neutral-900 border border-neutral-800 text-amber-400">
            <Award className="w-3.5 h-3.5" />
          </div>
          <div>
            <p className="text-[10px] uppercase font-mono tracking-widest text-neutral-500">Cata a Ciegas</p>
            <p className="text-xs font-mono font-semibold text-neutral-200">96 Puntos Guía</p>
          </div>
        </div>
      </div>

      {/* Contenedor con animación flotante continua y rotación 3D */}
      <div className="relative z-10 preserve-3d animate-wine-float flex flex-col items-center">
        
        {/* === BOTELLA EN TRES DIMENSIONES (Vector/CSS Layered) === */}
        <div className="relative w-28 sm:w-32 h-[380px] sm:h-[420px] transition-transform">
          
          {/* Cuello de la botella */}
          <div className="absolute left-1/2 -translate-x-1/2 top-0 w-8 sm:w-9 h-28 bg-gradient-to-r from-[#170508] via-[#380b14] to-[#120306] rounded-t-sm shadow-inner">
            {/* Cápsula de plomo/foil con acabado metalizado mate */}
            <div className="w-full h-16 bg-gradient-to-r from-[#5a141f] via-[#7e2432] to-[#3a0d14] rounded-t-sm border-b border-amber-600/30 relative overflow-hidden">
              <div className="absolute top-1 left-0 right-0 h-1 bg-amber-500/20" />
              <div className="absolute inset-y-0 left-2 w-1 bg-white/20 blur-[0.5px]" />
              {/* Estampa en la cápsula */}
              <div className="absolute bottom-2 left-1/2 -translate-x-1/2">
                <Sparkles className="w-2.5 h-2.5 text-amber-300/60" />
              </div>
            </div>
            {/* Brillo especular longitudinal en el cuello de vidrio */}
            <div className="absolute top-16 bottom-0 left-2 w-1 bg-white/15 blur-[0.5px]" />
          </div>

          {/* Hombros de la botella (transición cónica) */}
          <div className="absolute left-1/2 -translate-x-1/2 top-24 w-28 sm:w-32 h-14 bg-gradient-to-b from-[#24060c] to-[#1a0408] rounded-t-[40px] shadow-inner overflow-hidden">
            <div className="absolute inset-y-0 left-5 w-2 bg-white/10 blur-[1px] transform -rotate-12" />
          </div>

          {/* Cuerpo cilíndrico de vidrio oscuro con reflejos */}
          <div className="absolute left-1/2 -translate-x-1/2 top-36 w-28 sm:w-32 h-64 sm:h-72 bg-gradient-to-r from-[#140205] via-[#2f0810] to-[#0d0204] rounded-b-xl shadow-2xl overflow-hidden border-t border-white/5">
            
            {/* Reflejos de cristal laterales (vidrio realista) */}
            <div className="absolute inset-y-0 left-3 w-1.5 bg-gradient-to-b from-white/25 via-white/10 to-transparent blur-[0.5px]" />
            <div className="absolute inset-y-0 right-3 w-1 bg-white/10 blur-[0.5px]" />
            <div className="absolute inset-y-0 left-7 w-6 bg-gradient-to-r from-transparent via-[#6b1d28]/20 to-transparent" />

            {/* ETIQUETA EDITORIAL TEXTURADA (Papel noble pergamino con bordes definidos) */}
            <div className="absolute left-1/2 -translate-x-1/2 top-8 w-[88%] h-44 bg-gradient-to-b from-[#ede8dc] via-[#e2dbcc] to-[#d6cebf] rounded-sm border border-neutral-700/40 p-3 shadow-md flex flex-col justify-between text-center overflow-hidden">
              
              {/* Marco perimetral fino de la etiqueta */}
              <div className="absolute inset-1 border border-neutral-800/20 pointer-events-none" />

              {/* Encabezado de la etiqueta */}
              <div className="pt-1">
                <span className="text-[8px] tracking-[0.25em] font-mono font-bold uppercase text-neutral-800/70 block">
                  Edición Limitada
                </span>
                <div className="w-6 h-[1px] bg-[#6b1d28]/40 mx-auto my-1" />
              </div>

              {/* Nombre de la etiqueta en tipografía serif noble */}
              <div>
                <h4 className="font-serif text-sm font-black tracking-tight text-[#4c0519] leading-none">
                  AYVINO
                </h4>
                <p className="font-serif italic text-[10px] text-neutral-800 mt-0.5">
                  Gran Terroir
                </p>
                <p className="text-[8px] font-mono tracking-widest text-neutral-600 uppercase mt-1">
                  Valle de Uco
                </p>
              </div>

              {/* Pie de la etiqueta con añada */}
              <div className="pb-1">
                <div className="w-8 h-[1px] bg-neutral-800/20 mx-auto mb-1" />
                <span className="font-mono text-[9px] font-bold text-neutral-900">
                  2021 · Malbec
                </span>
              </div>

              {/* Reflejo brillante sutil que atraviesa la etiqueta al rotar */}
              <div className="absolute inset-0 bg-gradient-to-tr from-transparent via-white/20 to-transparent pointer-events-none" />
            </div>

            {/* Fondo de la botella (punt del fondo cóncavo) */}
            <div className="absolute bottom-0 inset-x-0 h-4 bg-gradient-to-t from-black/80 to-transparent" />
          </div>

        </div>

      </div>

      {/* Sombra proyectada en el plano del suelo con deformación elíptica */}
      <div className="absolute -bottom-6 left-1/2 -translate-x-1/2 w-40 sm:w-44 h-8 bg-black/80 blur-md rounded-[100%] animate-shadow-pulse -z-10" />

    </div>
  );
}
