import { Thermometer, Activity, SunMedium, RefreshCw } from 'lucide-react';
import type { CellarTelemetry } from '../types';

interface VaultTelemetryModuleProps {
  telemetry: CellarTelemetry;
}

export default function VaultTelemetryModule({ telemetry }: VaultTelemetryModuleProps) {
  return (
    <div className="bg-[#121216] border border-neutral-800/80 rounded-xl p-5 sm:p-6 shadow-md flex flex-col justify-between group hover:border-neutral-700 transition-colors">
      <div className="space-y-4">
        {/* Header */}
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <Thermometer className="w-4 h-4 text-neutral-400" />
            <span className="font-mono text-[11px] tracking-widest text-neutral-200 uppercase">
              Telemetría de Guarda
            </span>
          </div>

          <span className="inline-flex items-center gap-1.5 font-mono text-[10px] text-[#fbbf24] bg-[#201f25] px-2 py-0.5 rounded border border-[#fbbf24]/20">
            <span className="w-1.5 h-1.5 rounded-full bg-[#fbbf24] animate-pulse" />
            SENSORES ACTIVOS
          </span>
        </div>

        {/* Dials & Gauges */}
        <div className="grid grid-cols-2 gap-3 pt-1">
          {/* Temperature gauge */}
          <div className="bg-[#18181f] border border-neutral-800/70 rounded-lg p-3.5 space-y-2">
            <span className="font-mono text-[10px] text-neutral-400 block uppercase tracking-wider">
              Temp. Media
            </span>
            <div className="flex items-baseline gap-1">
              <span className="font-serif text-2xl sm:text-3xl text-neutral-100 font-semibold">
                {telemetry.averageTemperature}
              </span>
              <span className="text-[#fbbf24] font-serif text-base sm:text-lg">°C</span>
            </div>
            <div className="w-full bg-[#26252d] h-1.5 rounded-full overflow-hidden">
              <div
                className="bg-[#fbbf24] h-full rounded-full transition-all duration-500"
                style={{ width: `${(telemetry.averageTemperature / 20) * 100}%` }}
              />
            </div>
            <span className="font-mono text-[9px] sm:text-[10px] text-neutral-400 block">
              Rango ideal: {telemetry.idealTempRange}
            </span>
          </div>

          {/* Humidity gauge */}
          <div className="bg-[#18181f] border border-neutral-800/70 rounded-lg p-3.5 space-y-2">
            <span className="font-mono text-[10px] text-neutral-400 block uppercase tracking-wider">
              Humedad Rel.
            </span>
            <div className="flex items-baseline gap-1">
              <span className="font-serif text-2xl sm:text-3xl text-neutral-100 font-semibold">
                {telemetry.relativeHumidity}
              </span>
              <span className="text-[#ffb2b8] font-serif text-base sm:text-lg">%</span>
            </div>
            <div className="w-full bg-[#26252d] h-1.5 rounded-full overflow-hidden">
              <div
                className="bg-[#722F37] h-full rounded-full transition-all duration-500"
                style={{ width: `${telemetry.relativeHumidity}%` }}
              />
            </div>
            <span className="font-mono text-[9px] sm:text-[10px] text-neutral-400 block">
              {telemetry.corkProtectionLabel}
            </span>
          </div>
        </div>

        {/* Inert Gas & Vibration Monitor */}
        <div className="space-y-2 pt-1 border-t border-neutral-800/60">
          <div className="flex items-center justify-between text-xs font-sans">
            <span className="text-neutral-400 flex items-center gap-1.5">
              <Activity className="w-3.5 h-3.5 text-neutral-500" />
              Aislamiento de Vibraciones
            </span>
            <span className="font-mono text-[11px] text-[#fbbf24]">
              {telemetry.vibrationIsolation}
            </span>
          </div>

          <div className="flex items-center justify-between text-xs font-sans">
            <span className="text-neutral-400 flex items-center gap-1.5">
              <SunMedium className="w-3.5 h-3.5 text-neutral-500" />
              Exposición UV
            </span>
            <span className="font-mono text-[11px] text-[#fbbf24]">
              {telemetry.uvExposure}
            </span>
          </div>
        </div>
      </div>

      {/* Sync Footer */}
      <div className="pt-4 mt-4 border-t border-neutral-800/60">
        <div className="bg-[#18181f] rounded p-2 flex items-center justify-between text-neutral-400 font-mono text-[10px] border border-neutral-800/80">
          <span className="flex items-center gap-1.5">
            <RefreshCw className="w-3 h-3 text-neutral-500" />
            ÚLTIMA SINCRONIZACIÓN CAVA
          </span>
          <span className="text-neutral-200 uppercase">{telemetry.lastSync}</span>
        </div>
      </div>
    </div>
  );
}

