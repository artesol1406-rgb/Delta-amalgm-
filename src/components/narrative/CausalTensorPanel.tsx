import React from "react";
import { NarrativeNode, CausalTensorResult } from "../../narrative/types";
import { Sparkles, GitCommit, AlertTriangle, ArrowRight, ShieldCheck, Zap } from "lucide-react";

interface CausalTensorPanelProps {
  nodos: NarrativeNode[];
  tensor: CausalTensorResult;
  onHighlightPair: (pair: [number, number]) => void;
}

export const CausalTensorPanel: React.FC<CausalTensorPanelProps> = ({
  nodos,
  tensor,
  onHighlightPair,
}) => {
  return (
    <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 shadow-xl space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <GitCommit className="w-4 h-4 text-amber-400" />
          <h3 className="text-xs font-semibold text-slate-200 uppercase tracking-wider font-mono">
            Tensor Causal & Patrones Profundos
          </h3>
        </div>
        <span className="text-[10px] px-2 py-0.5 rounded bg-slate-800 text-slate-400 font-mono">
          Efectos no lineales
        </span>
      </div>

      <div className="space-y-3 text-xs">
        {/* 1. Efecto Mariposa */}
        <div className="bg-slate-950 p-3 rounded-xl border border-slate-800 space-y-2">
          <div className="flex items-center justify-between font-mono">
            <span className="text-amber-300 font-semibold flex items-center gap-1.5">
              <Zap className="w-3.5 h-3.5 text-amber-400" />
              Efecto Mariposa (M_i→j)
            </span>
            <span className="text-slate-500 text-[10px]">
              {tensor.M.length} detectados
            </span>
          </div>
          <p className="text-[11px] text-slate-400 leading-relaxed">
            Una perturbación de baja tensión inicial (T ≤ 0.45) detona una catástrofe en el clímax (T ≥ 0.85 con salto &gt; 0.45 y valle intermedio).
          </p>

          {tensor.M.length > 0 ? (
            <div className="space-y-1.5">
              {tensor.M.slice(0, 3).map((m, idx) => (
                <button
                  key={`mariposa-${idx}`}
                  onClick={() => onHighlightPair([m.i, m.j])}
                  className="w-full text-left p-2 rounded-lg bg-amber-500/10 hover:bg-amber-500/20 border border-amber-500/30 text-amber-200 text-xs font-mono transition-colors flex items-center justify-between"
                >
                  <span className="truncate">
                    Escena #{nodos[m.i].i} → Escena #{nodos[m.j].i} (+{m.v.toFixed(3)})
                  </span>
                  <ArrowRight className="w-3.5 h-3.5 shrink-0 ml-2 text-amber-400" />
                </button>
              ))}
            </div>
          ) : (
            <div className="text-[11px] text-slate-500 font-mono italic">
              No se hallaron pares con los umbrales extremos estrictos.
              {tensor.bestJump && (
                <button
                  onClick={() => onHighlightPair([tensor.bestJump!.i, tensor.bestJump!.j])}
                  className="mt-1 block text-amber-400 underline"
                >
                  Ver mayor salto relativo: Escena #{nodos[tensor.bestJump.i].i} a #{nodos[tensor.bestJump.j].i} (+{tensor.bestJump.v.toFixed(2)})
                </button>
              )}
            </div>
          )}
        </div>

        {/* 2. Retrocausalidad */}
        <div className="bg-slate-950 p-3 rounded-xl border border-slate-800 space-y-2">
          <div className="flex items-center justify-between font-mono">
            <span className="text-sky-300 font-semibold flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-sky-400" />
              Retrocausalidad Legítima (R_j→i)
            </span>
            <span className="text-slate-500 text-[10px]">
              {tensor.R.length} detectados
            </span>
          </div>
          <p className="text-[11px] text-slate-400 leading-relaxed">
            Una escena futura en otro acto invierte el signo de la carga polar de una anterior compartiendo plano o arquetipo, obligando a una relectura retroactiva.
          </p>

          {tensor.R.length > 0 ? (
            <div className="space-y-1.5">
              {tensor.R.slice(0, 3).map((r, idx) => (
                <button
                  key={`retro-${idx}`}
                  onClick={() => onHighlightPair([r.i, r.j])}
                  className="w-full text-left p-2 rounded-lg bg-sky-500/10 hover:bg-sky-500/20 border border-sky-500/30 text-sky-200 text-xs font-mono transition-colors flex items-center justify-between"
                >
                  <span className="truncate">
                    Escena #{nodos[r.j].i} resignifica Escena #{nodos[r.i].i} (R={r.v.toFixed(3)})
                  </span>
                  <ArrowRight className="w-3.5 h-3.5 shrink-0 ml-2 text-sky-400" />
                </button>
              ))}
            </div>
          ) : (
            <div className="text-[11px] text-slate-500 font-mono italic">
              Ninguna escena invierte la polaridad con función compartida en actos no contiguos.
            </div>
          )}
        </div>

        {/* 3. Presagios y Mayor Oposición */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
          <div className="bg-slate-950 p-3 rounded-xl border border-slate-800 space-y-1">
            <div className="text-slate-300 font-mono font-semibold text-[11px]">
              Presagios (Foreshadowing)
            </div>
            <div className="text-[10px] text-slate-400">
              {tensor.F.length} semillas tempranas con eco a distancia.
            </div>
            {tensor.F.length > 0 && (
              <button
                onClick={() => onHighlightPair([tensor.F[0].i, tensor.F[0].j])}
                className="mt-1.5 text-emerald-400 hover:text-emerald-300 underline font-mono text-[11px] block truncate"
              >
                Ver mayor presagio: #{nodos[tensor.F[0].i].i} → #{nodos[tensor.F[0].j].i}
              </button>
            )}
          </div>

          <div className="bg-slate-950 p-3 rounded-xl border border-slate-800 space-y-1">
            <div className="text-slate-300 font-mono font-semibold text-[11px]">
              Mayor Oposición (Ω)
            </div>
            <div className="text-[10px] text-slate-400">
              {tensor.om ? `Omega = ${tensor.om.v.toFixed(3)}` : "N/A"}
            </div>
            {tensor.om && (
              <button
                onClick={() => onHighlightPair([tensor.om!.i, tensor.om!.j])}
                className="mt-1.5 text-purple-400 hover:text-purple-300 underline font-mono text-[11px] block truncate"
              >
                Ver dipolo más opuesto: #{nodos[tensor.om.i].i} vs #{nodos[tensor.om.j].i}
              </button>
            )}
          </div>
        </div>

        {/* 4. Diagnóstico Deus ex Machina vs Deus ex Nihil */}
        <div className="bg-slate-950/60 p-3 rounded-xl border border-slate-800 space-y-1 text-[11px]">
          <div className="text-slate-300 font-mono font-semibold flex items-center gap-1.5">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
            <span>Topología del Clímax: Deus ex Nihil vs. Deus ex Machina</span>
          </div>
          <p className="text-slate-400 leading-relaxed text-[10px]">
            <strong>Deus ex Nihil (Legítimo):</strong> El nodo estuvo siempre en el subgrafo como polo receptivo/silente; el clímax solo conmuta el marco epistémico del observador (sorpresa coherente).
            <br />
            <strong>Deus ex Machina (Ruptura):</strong> El nodo resolutivo aparece sin antecedentes causales en el subgrafo (InDegree = 0).
          </p>
        </div>
      </div>
    </div>
  );
};
