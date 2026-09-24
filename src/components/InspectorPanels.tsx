import React from "react";
import { Activity, Radio, Sparkles, AlertCircle, Compass, Zap } from "lucide-react";
import { DIMS, DIMENSION_METAS, KernelSummary, MaestroGuidance } from "../amalgam/types";

interface InspectorPanelsProps {
  summary: KernelSummary;
  kernelValues: number[];
  baseText: string;
  guidance: MaestroGuidance | null;
  iteration: number;
}

export const InspectorPanels: React.FC<InspectorPanelsProps> = ({
  summary,
  kernelValues,
  baseText,
  guidance,
  iteration,
}) => {
  return (
    <div id="amalgam-inspector-panels" className="grid grid-cols-1 md:grid-cols-2 gap-4">
      {/* 1. Panel de Estado Kernel */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 shadow-sm flex flex-col justify-between">
        <div>
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs uppercase font-mono tracking-wider text-slate-400 flex items-center gap-1.5">
              <Activity className="w-3.5 h-3.5 text-sky-400" />
              Estado del Kernel (Iteración #{iteration})
            </span>
            <span className="text-xs font-mono px-2 py-0.5 rounded bg-sky-950/70 border border-sky-800/60 text-sky-300">
              Firma: <strong className="text-white ml-1">{summary.signature}</strong>
            </span>
          </div>

          {/* Quick Metrics */}
          <div className="grid grid-cols-4 gap-2 mb-4 text-center font-mono">
            <div className="p-2 rounded bg-slate-800/70 border border-slate-700/60">
              <div className="text-[10px] text-slate-400 uppercase">Coherencia</div>
              <div className="text-sm font-semibold text-emerald-400">
                {summary.coherencia.toFixed(3)}
              </div>
            </div>
            <div className="p-2 rounded bg-slate-800/70 border border-slate-700/60">
              <div className="text-[10px] text-slate-400 uppercase">Varianza</div>
              <div className="text-sm font-semibold text-amber-400">
                {summary.varianza.toFixed(4)}
              </div>
            </div>
            <div className="p-2 rounded bg-slate-800/70 border border-slate-700/60">
              <div className="text-[10px] text-slate-400 uppercase">Lienzo</div>
              <div className="text-sm font-semibold text-cyan-400">
                {(summary.lienzo_medio * 100).toFixed(1)}%
              </div>
            </div>
            <div className="p-2 rounded bg-slate-800/70 border border-slate-700/60">
              <div className="text-[10px] text-slate-400 uppercase">Emergencias</div>
              <div className="text-sm font-semibold text-rose-400">
                {summary.emergencias}
              </div>
            </div>
          </div>

          {/* 12 Dimensions Mini-Bars */}
          <div className="space-y-1.5">
            <div className="text-[11px] font-mono text-slate-400 mb-1 flex items-center justify-between">
              <span>Distribución Energética (s_i):</span>
              <span className="text-[10px] text-slate-500">Σ s_i = 1.000</span>
            </div>
            <div className="grid grid-cols-2 gap-x-3 gap-y-1">
              {DIMS.map((symbol, idx) => {
                const meta = DIMENSION_METAS[symbol];
                const val = kernelValues[idx] ?? 0.083;
                const isDominant = summary.dominantes.some(([d]) => d === symbol);

                return (
                  <div key={symbol} className="flex items-center gap-1.5 text-[11px] font-mono">
                    <span
                      style={{ color: meta.color }}
                      className={`w-6 text-right font-bold ${
                        isDominant ? "underline decoration-sky-400 underline-offset-2" : ""
                      }`}
                    >
                      {symbol}
                    </span>
                    <div className="flex-1 h-2 bg-slate-800 rounded-full overflow-hidden">
                      <div
                        className="h-full rounded-full transition-all duration-300"
                        style={{
                          width: `${Math.min(val * 400, 100)}%`,
                          backgroundColor: meta.color,
                        }}
                      />
                    </div>
                    <span className="w-9 text-right text-slate-400 text-[10px]">
                      {(val * 100).toFixed(1)}%
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>

      {/* 2. Panel Base & Maestro */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 shadow-sm flex flex-col justify-between space-y-4">
        {/* Base text section */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs uppercase font-mono tracking-wider text-slate-400 flex items-center gap-1.5">
              <Radio className="w-3.5 h-3.5 text-indigo-400" />
              Emisión del Modelo Base
            </span>
            <span className="text-[11px] font-mono text-indigo-300 bg-indigo-950/60 px-2 py-0.5 rounded border border-indigo-900/60">
              Prompt: Firma {summary.signature}
            </span>
          </div>
          <div className="p-3 bg-slate-950/80 border border-slate-800 rounded-lg min-h-[76px] flex items-center">
            <p className="text-xs text-slate-200 leading-relaxed font-sans italic">
              {baseText ? (
                `"${baseText}"`
              ) : (
                <span className="text-slate-500 font-mono not-italic">
                  Aún no se ha ejecutado el ciclo. Pulsa "Paso a Paso" o "Iniciar Ciclo".
                </span>
              )}
            </p>
          </div>
        </div>

        {/* Maestro decision section */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs uppercase font-mono tracking-wider text-slate-400 flex items-center gap-1.5">
              <Compass className="w-3.5 h-3.5 text-fuchsia-400" />
              Intervención del Maestro (Gemini API)
            </span>
            <span className="text-[11px] font-mono text-fuchsia-300 bg-fuchsia-950/60 px-2 py-0.5 rounded border border-fuchsia-900/60">
              Supervisión de Deriva
            </span>
          </div>

          <div className="p-3 bg-slate-950/80 border border-slate-800 rounded-lg space-y-2 text-xs">
            <div className="flex items-center justify-between font-mono">
              <span className="text-slate-400">Firma Guía Propuesta:</span>
              <span className="text-amber-300 font-bold bg-amber-950/40 px-2 py-0.5 rounded border border-amber-800/40">
                {guidance?.firma || "—"}
              </span>
            </div>

            <div className="flex items-center justify-between font-mono">
              <span className="text-slate-400">Acción de Perturbación:</span>
              <span className="text-pink-400 font-semibold flex items-center gap-1">
                {guidance?.perturbar ? (
                  <>
                    <Zap className="w-3 h-3 text-pink-400" />
                    Refuerzo de {guidance.perturbar} (+0.25)
                  </>
                ) : (
                  <span className="text-slate-500">Ninguna (Reposo)</span>
                )}
              </span>
            </div>

            <div className="pt-2 border-t border-slate-800/80 text-slate-300 text-[11px] leading-relaxed">
              <strong className="text-slate-400 font-mono">Diagnóstico: </strong>
              {guidance?.razon || "En espera de la lectura del estado dinámico..."}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
