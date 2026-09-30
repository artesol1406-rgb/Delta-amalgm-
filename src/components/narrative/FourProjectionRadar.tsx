import React, { useState, useMemo } from "react";
import { calcularCuatroProyeccion } from "../../narrative/math";
import { Compass, Sliders, CheckCircle2, RotateCcw } from "lucide-react";

export const FourProjectionRadar: React.FC = () => {
  // Estado del Futuro Deseado F = (t_F, Delta_F, delta_F, iota_F)
  const [tF, setTF] = useState<number>(1.0);
  const [deltaF_inert, setDeltaF_inert] = useState<number>(0.9);
  const [deltaF_dens, setDeltaF_dens] = useState<number>(0.95);
  const [iotaF, setIotaF] = useState<number>(0.9);

  const projection = useMemo(() => {
    return calcularCuatroProyeccion([tF, deltaF_inert, deltaF_dens, iotaF], 0.05);
  }, [tF, deltaF_inert, deltaF_dens, iotaF]);

  const presets = [
    {
      name: "Clímax Épico (Ejemplo 2 PDF)",
      F: [1.0, 0.9, 0.95, 0.9],
      desc: "Victoria expansiva con alta tensión y ruptura del statu quo",
    },
    {
      name: "Tragedia Inevitable",
      F: [1.0, 0.2, 0.95, 0.85],
      desc: "Colapso de alta densidad dramática respetando la inercia del arco",
    },
    {
      name: "Epifanía Contemplativa",
      F: [1.0, 0.1, 0.3, 0.8],
      desc: "Asimilación íntima en punto estático con baja densidad",
    },
    {
      name: "Giro Psicológico Agridulce",
      F: [0.95, 0.85, 0.7, 0.65],
      desc: "Ruptura imprevista equilibrada con asimilación receptiva",
    },
  ];

  const extNames = [
    { label: "e1 · Activo (Intervención / Choque)", color: "#f59e0b", w: projection.weights[0] },
    { label: "e2 · Receptivo (Asimilación / Entrega)", color: "#38bdf8", w: projection.weights[1] },
    { label: "e3 · Dinámico (Ruptura de reglas)", color: "#a855f7", w: projection.weights[2] },
    { label: "e4 · Estático (Anclaje / Contención)", color: "#10b981", w: projection.weights[3] },
  ];

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 shadow-xl space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Compass className="w-4 h-4 text-purple-400" />
          <h3 className="text-xs font-semibold text-slate-200 uppercase tracking-wider font-mono">
            Mecánica de Decisión: Cuatro-Proyección Cuaternaria
          </h3>
        </div>
        <span className="text-[10px] px-2 py-0.5 rounded bg-purple-950/60 border border-purple-800/40 text-purple-300 font-mono">
          Inversión Polar P = 1 - F
        </span>
      </div>

      <p className="text-xs text-slate-400 leading-relaxed">
        Cuando un autor o personaje fija un <strong>Futuro Deseado (F)</strong>, el sistema redefine el presente como su opuesto complementario <strong>(P)</strong> para generar gradiente de potencial dramático, calculando los 4 extremos polares y sus pesos armónicos gaussianos.
      </p>

      {/* Presets */}
      <div className="flex flex-wrap gap-1.5 text-xs font-mono">
        <span className="text-slate-500 text-[10px] self-center mr-1">Presets:</span>
        {presets.map((p, idx) => (
          <button
            key={idx}
            onClick={() => {
              setTF(p.F[0]);
              setDeltaF_inert(p.F[1]);
              setDeltaF_dens(p.F[2]);
              setIotaF(p.F[3]);
            }}
            className="px-2 py-0.5 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white border border-slate-700 text-[10px] transition-colors"
          >
            {p.name}
          </button>
        ))}
      </div>

      {/* Sliders para F = (t_F, Delta_F, delta_F, iota_F) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 bg-slate-950 p-3 rounded-xl border border-slate-800 text-xs font-mono">
        <div className="space-y-1">
          <div className="flex justify-between text-slate-400 text-[11px]">
            <span>Progresión Temporal t_F (0..1):</span>
            <span className="text-purple-300 font-bold">{tF.toFixed(2)}</span>
          </div>
          <input
            type="range"
            min="0"
            max="1"
            step="0.05"
            value={tF}
            onChange={(e) => setTF(parseFloat(e.target.value))}
            className="w-full accent-purple-500"
          />
        </div>

        <div className="space-y-1">
          <div className="flex justify-between text-slate-400 text-[11px]">
            <span>Desviación Inercia Δ_F (0..1):</span>
            <span className="text-purple-300 font-bold">{deltaF_inert.toFixed(2)}</span>
          </div>
          <input
            type="range"
            min="0"
            max="1"
            step="0.05"
            value={deltaF_inert}
            onChange={(e) => setDeltaF_inert(parseFloat(e.target.value))}
            className="w-full accent-purple-500"
          />
        </div>

        <div className="space-y-1">
          <div className="flex justify-between text-slate-400 text-[11px]">
            <span>Densidad Dramática δ_F (0..1):</span>
            <span className="text-purple-300 font-bold">{deltaF_dens.toFixed(2)}</span>
          </div>
          <input
            type="range"
            min="0"
            max="1"
            step="0.05"
            value={deltaF_dens}
            onChange={(e) => setDeltaF_dens(parseFloat(e.target.value))}
            className="w-full accent-purple-500"
          />
        </div>

        <div className="space-y-1">
          <div className="flex justify-between text-slate-400 text-[11px]">
            <span>Intensidad Polar ι_F (0..1):</span>
            <span className="text-purple-300 font-bold">{iotaF.toFixed(2)}</span>
          </div>
          <input
            type="range"
            min="0"
            max="1"
            step="0.05"
            value={iotaF}
            onChange={(e) => setIotaF(parseFloat(e.target.value))}
            className="w-full accent-purple-500"
          />
        </div>
      </div>

      {/* Diagnóstico del Presente Invertido P */}
      <div className="bg-slate-950/70 p-3 rounded-xl border border-slate-800 text-xs font-mono flex items-center justify-between flex-wrap gap-2">
        <div className="text-slate-400 text-[11px]">
          Presente Invertido P = (1 - F):
          <span className="text-slate-200 ml-2">
            ({projection.P[0].toFixed(2)}, {projection.P[1].toFixed(2)}, {projection.P[2].toFixed(2)}, {projection.P[3].toFixed(2)})
          </span>
        </div>
        <div className="text-[11px] text-amber-300">
          σ Gaussiano: {projection.sigma.toFixed(3)}
        </div>
      </div>

      {/* Distribución Armónica del Abanico (Pesos Gaussianos w_k) */}
      <div className="space-y-2">
        <div className="text-xs font-mono text-slate-300 font-semibold">
          Abanico Coherente de 4 Caminos (Combinación Lineal no excluyente):
        </div>

        <div className="space-y-2">
          {extNames.map((ext, idx) => (
            <div key={idx} className="bg-slate-950 p-2.5 rounded-lg border border-slate-800 space-y-1">
              <div className="flex justify-between text-xs font-mono">
                <span className="text-slate-300 text-[11px]">{ext.label}</span>
                <span className="font-bold text-[11px]" style={{ color: ext.color }}>
                  {ext.w.toFixed(1)}%
                </span>
              </div>
              <div className="w-full bg-slate-900 rounded-full h-2 overflow-hidden">
                <div
                  className="h-full rounded-full transition-all duration-300"
                  style={{ width: `${ext.w}%`, backgroundColor: ext.color }}
                />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
