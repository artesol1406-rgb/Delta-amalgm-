import React, { useMemo } from "react";
import { NarrativeNode, DecisionPolarIA } from "../../narrative/types";
import { calcularDecisionPolarIA } from "../../narrative/math";
import {
  Scale,
  Activity,
  UserCheck,
  Zap,
  TrendingUp,
  AlertCircle,
  CheckCircle,
  HelpCircle,
  ArrowRight,
  ShieldAlert,
} from "lucide-react";

interface PolarityDecisionEngineProps {
  nodos: NarrativeNode[];
  atractor: string;
  onApplyDecision?: (camino: "e1" | "e2" | "e3" | "e4") => void;
}

export const PolarityDecisionEngine: React.FC<PolarityDecisionEngineProps> = ({
  nodos,
  atractor,
  onApplyDecision,
}) => {
  const decisionData: DecisionPolarIA = useMemo(() => {
    return calcularDecisionPolarIA(nodos, atractor);
  }, [nodos, atractor]);

  const lastNode = nodos[nodos.length - 1];

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 shadow-xl space-y-4">
      {/* Encabezado */}
      <div className="flex items-center justify-between border-b border-slate-800 pb-3">
        <div className="flex items-center gap-2">
          <Scale className="w-4 h-4 text-amber-400" />
          <div>
            <h3 className="text-xs font-semibold text-slate-200 uppercase tracking-wider font-mono">
              Motor de Decisión & Medición Polar de la IA
            </h3>
            <p className="text-[10px] text-slate-400">
              Evaluación del gradiente de potencial Δq, derivada de tensión dT/dt y bifurcación cuaternaria
            </p>
          </div>
        </div>
        <span className="text-[10px] px-2 py-0.5 rounded bg-amber-500/10 border border-amber-500/30 text-amber-300 font-mono">
          Decisión por Gradiente
        </span>
      </div>

      {/* 1. SECCIÓN DE MEDICIÓN: CÓMO MIDE LA IA */}
      <div className="space-y-2">
        <div className="text-[11px] font-mono text-slate-300 font-semibold flex items-center gap-1.5">
          <Activity className="w-3.5 h-3.5 text-sky-400" />
          <span>1. Diagnóstico de Fuerzas & Telemetría Polar</span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 text-xs font-mono">
          {/* Potencial Polar */}
          <div className="bg-slate-950 p-3 rounded-xl border border-slate-800 space-y-1.5">
            <div className="flex items-center justify-between text-slate-400 text-[10px]">
              <span>Gradiente Polar Δq:</span>
              <span className="text-amber-300 font-bold">
                {decisionData.potencialPolarGradiente.toFixed(2)}
              </span>
            </div>
            <div className="w-full bg-slate-900 h-2 rounded-full overflow-hidden">
              <div
                className="h-full bg-amber-500 transition-all duration-300"
                style={{ width: `${Math.min(decisionData.potencialPolarGradiente * 50, 100)}%` }}
              />
            </div>
            <div className="text-[10px] text-slate-500">
              {decisionData.potencialPolarGradiente < 0.25
                ? "Advertencia: Tensión polar plana (riesgo de monotonía)"
                : "Gradiente activo y suficiente"}
            </div>
          </div>

          {/* Agencia Dramática */}
          <div className="bg-slate-950 p-3 rounded-xl border border-slate-800 space-y-1.5">
            <div className="flex items-center justify-between text-slate-400 text-[10px]">
              <span>Agencia del Personaje:</span>
              <span className="text-emerald-300 font-bold">
                {decisionData.agenciaDramaticaPct}%
              </span>
            </div>
            <div className="w-full bg-slate-900 h-2 rounded-full overflow-hidden">
              <div
                className="h-full bg-emerald-500 transition-all duration-300"
                style={{ width: `${decisionData.agenciaDramaticaPct}%` }}
              />
            </div>
            <div className="text-[10px] text-slate-500">
              {decisionData.agenciaDramaticaPct >= 50
                ? "Las acciones provienen de decisiones del personaje"
                : "Predominio de accidentes o determinismo externo"}
            </div>
          </div>

          {/* Derivada de Tensión dT/dt */}
          <div className="bg-slate-950 p-3 rounded-xl border border-slate-800 space-y-1.5">
            <div className="flex items-center justify-between text-slate-400 text-[10px]">
              <span>Derivada Tensión dT/dt:</span>
              <span
                className={`font-bold ${
                  (lastNode?.dT || 0) >= 0 ? "text-amber-400" : "text-sky-400"
                }`}
              >
                {(lastNode?.dT || 0) >= 0 ? "+" : ""}
                {(lastNode?.dT || 0).toFixed(3)}
              </span>
            </div>
            <div className="text-[11px] font-semibold text-slate-200">
              Estado: <span className="text-amber-300">{lastNode?.tipoGradiente || "Neutro"}</span>
            </div>
            <div className="text-[10px] text-slate-500">
              {lastNode?.tipoGradiente === "Falso Alivio / Ironía"
                ? "Ironía dramática: distensión en superficie pero peligro latente"
                : lastNode?.tipoGradiente === "Carga (+)"
                ? "Cierre de salidas de escape hacia el clímax"
                : "Asimilación o catarsis de la escena"}
            </div>
          </div>
        </div>

        {/* Vector de Motivación del Personaje M_personaje */}
        <div className="bg-slate-950 p-3 rounded-xl border border-slate-800 text-xs font-mono space-y-1">
          <div className="text-slate-400 text-[10px]">
            Vector de Motivación del Personaje (M_personaje):
          </div>
          <div className="flex flex-wrap items-center gap-2 text-[11px]">
            <span className="text-amber-300 font-semibold">
              Deseo Consciente:
            </span>
            <span className="text-slate-200">
              "{decisionData.atractorDeseoVsNecesidad.deseoConsciente}"
            </span>
            <span className="text-slate-500">⟷</span>
            <span className="text-purple-300 font-semibold">
              Necesidad Inconsciente:
            </span>
            <span className="text-slate-200">
              "{decisionData.atractorDeseoVsNecesidad.necesidadInconsciente}"
            </span>
          </div>
        </div>
      </div>

      {/* 2. SECCIÓN DE DECISIÓN: CÓMO DECIDE LA IA */}
      <div className="space-y-3 pt-2 border-t border-slate-800">
        <div className="text-[11px] font-mono text-slate-300 font-semibold flex items-center gap-1.5">
          <Zap className="w-3.5 h-3.5 text-purple-400" />
          <span>2. Bifurcación Polar Recomendada por la IA</span>
        </div>

        {/* Tarjeta de recomendación primaria */}
        <div className="bg-gradient-to-r from-purple-950/40 via-slate-900 to-amber-950/30 p-3.5 rounded-xl border border-purple-800/40 space-y-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="px-2 py-0.5 rounded bg-purple-900 text-purple-200 font-mono font-bold text-xs">
                {decisionData.bifurcacionRecomendada.camino.toUpperCase()}
              </span>
              <span className="font-semibold text-slate-100 text-xs">
                {decisionData.bifurcacionRecomendada.nombre}
              </span>
            </div>
            <span className="text-amber-300 font-mono font-bold text-xs">
              {decisionData.bifurcacionRecomendada.pesoArmonico.toFixed(1)}% Coherencia
            </span>
          </div>

          <p className="text-xs text-slate-300 leading-relaxed font-serif">
            {decisionData.bifurcacionRecomendada.justificacion}
          </p>

          <div className="bg-slate-950/80 p-2.5 rounded-lg border border-slate-800 text-xs text-slate-200 font-mono flex items-center justify-between gap-3">
            <div>
              <span className="text-slate-400 text-[10px] block">Acción Polar Sugerida:</span>
              <span className="text-amber-200 text-[11px]">
                {decisionData.bifurcacionRecomendada.accionSugerida}
              </span>
            </div>
            {onApplyDecision && (
              <button
                onClick={() => onApplyDecision(decisionData.bifurcacionRecomendada.camino)}
                className="shrink-0 px-2.5 py-1.5 rounded bg-purple-600 hover:bg-purple-500 text-white text-[11px] font-mono flex items-center gap-1 transition-colors"
              >
                <span>Adoptar</span>
                <ArrowRight className="w-3 h-3" />
              </button>
            )}
          </div>
        </div>

        {/* Las 4 alternativas polares con pesos y vectores */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs font-mono">
          {decisionData.losCuatroCaminos.map((c) => (
            <div
              key={c.camino}
              className={`p-2.5 rounded-lg border transition-colors ${
                c.camino === decisionData.bifurcacionRecomendada.camino
                  ? "bg-slate-950 border-purple-700/80 shadow-sm"
                  : "bg-slate-950/60 border-slate-800 text-slate-400"
              }`}
            >
              <div className="flex justify-between items-center mb-1">
                <span className="font-bold text-[11px] text-slate-200">
                  {c.camino.toUpperCase()} · {c.nombre.split(" (")[0]}
                </span>
                <span className="text-amber-400 font-bold text-[10px]">
                  {c.peso.toFixed(1)}%
                </span>
              </div>
              <p className="text-[10px] text-slate-400 line-clamp-2 leading-relaxed font-sans">
                {c.accion}
              </p>
              <div className="mt-1 text-[9px] text-slate-500">
                Vector 4D: ({c.vector.map((v) => v.toFixed(2)).join(", ")})
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
