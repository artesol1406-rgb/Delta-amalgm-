import React from "react";
import { Cpu, MessageSquareText, Compass, ArrowRight, Zap, RefreshCw } from "lucide-react";
import { KernelSummary, MaestroGuidance } from "../amalgam/types";

interface CycleDiagramProps {
  currentStage: "idle" | "kernel" | "base" | "maestro";
  summary: KernelSummary;
  baseText: string;
  guidance: MaestroGuidance | null;
  geminiActive: boolean;
}

export const CycleDiagram: React.FC<CycleDiagramProps> = ({
  currentStage,
  summary,
  baseText,
  guidance,
  geminiActive,
}) => {
  return (
    <div id="amalgam-cycle-diagram" className="bg-slate-900/90 border border-slate-800 rounded-xl p-4 shadow-md">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <div className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse" />
          <h2 className="text-xs uppercase font-mono tracking-wider text-slate-300">
            Ciclo de Tres Nodos Acoplados por Firma Δ
          </h2>
        </div>
        <span className="text-[11px] font-mono px-2 py-0.5 rounded bg-slate-800 border border-slate-700 text-sky-300">
          "No entrena. Acopla."
        </span>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-3 relative">
        {/* Node 1: Kernel */}
        <div
          id="node-kernel"
          className={`relative p-3 rounded-lg border transition-all duration-300 ${
            currentStage === "kernel"
              ? "bg-sky-950/40 border-sky-500 shadow-sm shadow-sky-500/20 ring-1 ring-sky-500"
              : "bg-slate-800/60 border-slate-700/80"
          }`}
        >
          <div className="flex items-center justify-between mb-2">
            <span className="flex items-center gap-1.5 text-xs font-semibold text-sky-400">
              <Cpu className="w-3.5 h-3.5" />
              1. KERNEL
            </span>
            <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-sky-950/60 text-sky-300 border border-sky-800/40">
              12D + Fases
            </span>
          </div>
          <p className="text-[11px] text-slate-300 line-clamp-2 mb-2 font-mono">
            Estado dinámico, subnodos (5), subsubnodos (3) y lienzo térmico.
          </p>
          <div className="pt-2 border-t border-slate-700/60 flex items-center justify-between text-xs font-mono">
            <span className="text-slate-400">Firma Δ:</span>
            <span className="text-amber-300 font-bold tracking-wider">
              {summary.signature}
            </span>
          </div>
        </div>

        {/* Node 2: Base */}
        <div
          id="node-base"
          className={`relative p-3 rounded-lg border transition-all duration-300 ${
            currentStage === "base"
              ? "bg-indigo-950/40 border-indigo-500 shadow-sm shadow-indigo-500/20 ring-1 ring-indigo-500"
              : "bg-slate-800/60 border-slate-700/80"
          }`}
        >
          <div className="flex items-center justify-between mb-2">
            <span className="flex items-center gap-1.5 text-xs font-semibold text-indigo-400">
              <MessageSquareText className="w-3.5 h-3.5" />
              2. MODELO BASE
            </span>
            <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-indigo-950/60 text-indigo-300 border border-indigo-800/40">
              Sin RLHF
            </span>
          </div>
          <p className="text-[11px] text-slate-300 line-clamp-2 mb-2">
            {baseText ? `"${baseText.slice(0, 90)}..."` : "Esperando emisión desde la firma..."}
          </p>
          <div className="pt-2 border-t border-slate-700/60 flex items-center justify-between text-xs font-mono">
            <span className="text-slate-400">Entrada:</span>
            <span className="text-indigo-300 text-[11px] truncate max-w-[140px]">
              Firma {summary.signature} (coh {summary.coherencia.toFixed(2)})
            </span>
          </div>
        </div>

        {/* Node 3: Maestro (Gemini API) */}
        <div
          id="node-maestro"
          className={`relative p-3 rounded-lg border transition-all duration-300 ${
            currentStage === "maestro"
              ? "bg-fuchsia-950/40 border-fuchsia-500 shadow-sm shadow-fuchsia-500/20 ring-1 ring-fuchsia-500"
              : "bg-slate-800/60 border-slate-700/80"
          }`}
        >
          <div className="flex items-center justify-between mb-2">
            <span className="flex items-center gap-1.5 text-xs font-semibold text-fuchsia-400">
              <Compass className="w-3.5 h-3.5" />
              3. MAESTRO (GEMINI)
            </span>
            <span className={`text-[10px] font-mono px-1.5 py-0.5 rounded border ${
              geminiActive
                ? "bg-fuchsia-950/60 text-fuchsia-300 border-fuchsia-800/50"
                : "bg-amber-950/40 text-amber-300 border-amber-800/40"
            }`}>
              {geminiActive ? "Gemini 3.8 Flash" : "Fallback Heurístico"}
            </span>
          </div>
          <p className="text-[11px] text-slate-300 line-clamp-2 mb-2">
            {guidance ? guidance.razon : "Supervisa la deriva y emite corrección por perturbación..."}
          </p>
          <div className="pt-2 border-t border-slate-700/60 flex items-center justify-between text-xs font-mono">
            <span className="text-slate-400">Perturba:</span>
            <span className="text-pink-400 font-bold">
              {guidance?.perturbar ? `Reforzar ${guidance.perturbar}` : "Estado en Reposo"}
            </span>
          </div>
        </div>
      </div>

      {/* Cycle Feedbacks arrows indicator */}
      <div className="mt-3 pt-2 border-t border-slate-800/80 flex items-center justify-center gap-4 text-[11px] font-mono text-slate-400">
        <span className="flex items-center gap-1 text-sky-400">
          Kernel <ArrowRight className="w-3 h-3 text-slate-500" /> Base
        </span>
        <span className="flex items-center gap-1 text-indigo-400">
          Base <ArrowRight className="w-3 h-3 text-slate-500" /> Maestro (Gemini)
        </span>
        <span className="flex items-center gap-1 text-fuchsia-400">
          Maestro <RefreshCw className="w-3 h-3 text-slate-500" /> Kernel (Perturbación)
        </span>
      </div>
    </div>
  );
};
