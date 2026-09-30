import React, { useState, useMemo } from "react";
import { NarrativeNode, ARQUETIPOS_FUNCIONALES, PLANOS_DRAMATURGICOS } from "../../narrative/types";
import { calcOmega, calcularSintesisDialectica } from "../../narrative/math";
import { GitPullRequest, ArrowRight, CheckCircle2, XCircle } from "lucide-react";

interface DialecticSynthesisPanelProps {
  nodos: NarrativeNode[];
}

export const DialecticSynthesisPanel: React.FC<DialecticSynthesisPanelProps> = ({ nodos }) => {
  // Preselección o valores por defecto basados en Ejemplo 1 del PDF
  const [nodeXIdx, setNodeXIdx] = useState<number>(0);
  const [nodeYIdx, setNodeYIdx] = useState<number>(Math.min(1, nodos.length - 1));

  const nodeX = nodos[nodeXIdx] || nodos[0];
  const nodeY = nodos[nodeYIdx] || nodos[1] || nodos[0];

  // Candidato Z en estación s + 1
  const candidateZ = useMemo(() => {
    return {
      s: (nodeX.s + 1) % 12,
      c: (nodeX.c + 1) % 7,
      a: (nodeX.a + 1) % 22,
      D: 0.08,
      delta: 0.8,
      iota: 0.85,
    };
  }, [nodeX]);

  const synthesis = useMemo(() => {
    return calcularSintesisDialectica(nodeX, nodeY, candidateZ);
  }, [nodeX, nodeY, candidateZ]);

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 shadow-xl space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <GitPullRequest className="w-4 h-4 text-emerald-400" />
          <h3 className="text-xs font-semibold text-slate-200 uppercase tracking-wider font-mono">
            Síntesis Dialéctica de Opuestos en el Círculo
          </h3>
        </div>
        <span className="text-[10px] px-2 py-0.5 rounded bg-slate-800 text-slate-400 font-mono">
          Estación s → Estación s+1
        </span>
      </div>

      <p className="text-xs text-slate-400 leading-relaxed">
        Dos polos complementarios en conflicto en una estación colapsan mediante integración dialéctica para generar el nodo de avance en la estación siguiente:
        <code className="text-amber-300 font-mono ml-1">S(X, Y → Z) = 0.45·Ω + 0.35·Φ + 0.20·(1 - |Δ_z - Δ_media|)</code>
      </p>

      {/* Selectores de Nodos X e Y */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs font-mono">
        <div className="bg-slate-950 p-3 rounded-xl border border-slate-800 space-y-1.5">
          <label className="text-amber-400 font-semibold text-[11px] block">
            Polo Activo X (q &gt; 0):
          </label>
          <select
            value={nodeXIdx}
            onChange={(e) => setNodeXIdx(parseInt(e.target.value))}
            className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2 text-xs text-slate-200 outline-none"
          >
            {nodos.map((n, idx) => (
              <option key={n.id} value={idx}>
                #{n.i} {n.resumen.slice(0, 35)}... (s={n.s}, q={n.q.toFixed(2)})
              </option>
            ))}
          </select>
          <div className="text-[10px] text-slate-400 pt-1 space-y-0.5">
            <div>Plano: {PLANOS_DRAMATURGICOS[nodeX.c]}</div>
            <div>Arquetipo: {ARQUETIPOS_FUNCIONALES[nodeX.a]}</div>
            <div>Carga Polar q: {nodeX.q.toFixed(2)} | Inercia Δ: {nodeX.D.toFixed(3)}</div>
          </div>
        </div>

        <div className="bg-slate-950 p-3 rounded-xl border border-slate-800 space-y-1.5">
          <label className="text-sky-400 font-semibold text-[11px] block">
            Polo Receptivo Y (q &lt; 0):
          </label>
          <select
            value={nodeYIdx}
            onChange={(e) => setNodeYIdx(parseInt(e.target.value))}
            className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2 text-xs text-slate-200 outline-none"
          >
            {nodos.map((n, idx) => (
              <option key={n.id} value={idx}>
                #{n.i} {n.resumen.slice(0, 35)}... (s={n.s}, q={n.q.toFixed(2)})
              </option>
            ))}
          </select>
          <div className="text-[10px] text-slate-400 pt-1 space-y-0.5">
            <div>Plano: {PLANOS_DRAMATURGICOS[nodeY.c]}</div>
            <div>Arquetipo: {ARQUETIPOS_FUNCIONALES[nodeY.a]}</div>
            <div>Carga Polar q: {nodeY.q.toFixed(2)} | Inercia Δ: {nodeY.D.toFixed(3)}</div>
          </div>
        </div>
      </div>

      {/* Métricas de Oposición y Puntuación S */}
      <div className="bg-slate-950 p-3.5 rounded-xl border border-slate-800 space-y-3 font-mono text-xs">
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-center">
          <div className="bg-slate-900 p-2 rounded-lg border border-slate-800">
            <div className="text-slate-500 text-[10px]">Índice Oposición (Ω)</div>
            <div className="text-sm font-bold text-slate-200 mt-0.5">
              {synthesis.omega.toFixed(4)}
            </div>
            <div className="text-[9px] text-slate-400">Umbral: ≥ 0.35</div>
          </div>

          <div className="bg-slate-900 p-2 rounded-lg border border-slate-800">
            <div className="text-slate-500 text-[10px]">Neutralización (Φ)</div>
            <div className="text-sm font-bold text-slate-200 mt-0.5">
              {synthesis.phi.toFixed(4)}
            </div>
            <div className="text-[9px] text-slate-400">1 - |qx+qy|/2</div>
          </div>

          <div className="bg-slate-900 p-2 rounded-lg border border-slate-800">
            <div className="text-slate-500 text-[10px]">¿Oposición Válida?</div>
            <div className="text-sm font-bold mt-0.5 flex items-center justify-center gap-1">
              {synthesis.isOposicionValida ? (
                <>
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                  <span className="text-emerald-400">Fértil</span>
                </>
              ) : (
                <>
                  <XCircle className="w-3.5 h-3.5 text-rose-400" />
                  <span className="text-rose-400">&lt; 0.35</span>
                </>
              )}
            </div>
          </div>

          <div className="bg-slate-900 p-2 rounded-lg border border-slate-800">
            <div className="text-slate-500 text-[10px]">Puntuación Síntesis S</div>
            <div className="text-sm font-bold text-amber-300 mt-0.5">
              {(synthesis.score * 100).toFixed(1)}%
            </div>
            <div className="text-[9px] text-amber-400">Coherencia</div>
          </div>
        </div>

        {/* Nodo resultante propuesto */}
        <div className="pt-2 border-t border-slate-900 flex items-center justify-between text-[11px] text-slate-400 flex-wrap gap-2">
          <div>
            Generación Nodo Síntesis Z en Estación #{candidateZ.s}:
            <span className="text-emerald-300 ml-1 font-semibold">
              Plano {PLANOS_DRAMATURGICOS[candidateZ.c!]}, Arquetipo {ARQUETIPOS_FUNCIONALES[candidateZ.a!].split("/")[0]}
            </span>
          </div>
          <div className="text-[10px] text-slate-500">
            Delta inercial previsto: {candidateZ.D}
          </div>
        </div>
      </div>
    </div>
  );
};
