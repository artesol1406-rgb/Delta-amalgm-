import React from "react";
import {
  NarrativeNode,
  CausalTensorResult,
  PLANOS_DRAMATURGICOS,
  PLANO_COLORS,
  ESTACIONES_HEROE,
  ARQUETIPOS_FUNCIONALES,
} from "../../narrative/types";

interface NarrativeMandalaProps {
  nodos: NarrativeNode[];
  causalTensor: CausalTensorResult;
  selectedNodeId: string | null;
  onSelectNode: (nodo: NarrativeNode | null) => void;
  highlightedPair: [number, number] | null;
  onClearHighlight: () => void;
}

export const NarrativeMandala: React.FC<NarrativeMandalaProps> = ({
  nodos,
  causalTensor,
  selectedNodeId,
  onSelectNode,
  highlightedPair,
  onClearHighlight,
}) => {
  const CX = 200;
  const CY = 200;

  // Anillos concéntricos de los 7 planos dramatúrgicos
  const rings = [0, 1, 2, 3, 4, 5, 6].map((c) => ({
    c,
    r: 48 + c * 21,
    nombre: PLANOS_DRAMATURGICOS[c],
    color: PLANO_COLORS[c],
  }));

  // Sectores de las 12 estaciones
  const sectors = Array.from({ length: 12 }, (_, s) => {
    const angleRad = (s / 12) * 2 * Math.PI - Math.PI / 2;
    const midAngle = angleRad + Math.PI / 12;
    return {
      s,
      angleRad,
      lineX: CX + 190 * Math.cos(angleRad),
      lineY: CY + 190 * Math.sin(angleRad),
      labelX: CX + 194 * Math.cos(midAngle),
      labelY: CY + 194 * Math.sin(midAngle) + 3,
      nombre: ESTACIONES_HEROE[s],
    };
  });

  return (
    <div className="bg-slate-950 border border-slate-800 rounded-2xl p-4 shadow-xl flex flex-col items-center">
      <div className="w-full flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <div className="w-2.5 h-2.5 rounded-full bg-amber-400 animate-pulse" />
          <h3 className="text-xs font-semibold text-slate-200 uppercase tracking-wider font-mono">
            Mándala Fractal de Polaridades (12 Estaciones × 7 Planos)
          </h3>
        </div>
        <div className="text-[11px] font-mono text-slate-400">
          Nodos iluminados: <span className="text-amber-400 font-bold">{nodos.length}</span> (zonas oscuras = elipsis)
        </div>
      </div>

      <div className="relative w-full max-w-[440px] aspect-square bg-[#07060b] rounded-xl overflow-hidden border border-slate-900 shadow-inner flex items-center justify-center p-2">
        <svg
          viewBox="0 0 400 400"
          className="w-full h-full select-none"
          role="img"
          aria-label="Mándala fractal narrativo"
        >
          {/* Fondo y rejilla circular de los 7 Planos */}
          {rings.map((ring) => (
            <circle
              key={ring.c}
              cx={CX}
              cy={CY}
              r={ring.r}
              fill="none"
              stroke="#ffffff"
              strokeOpacity="0.08"
              strokeDasharray="2 3"
            />
          ))}

          {/* Radios de las 12 Estaciones */}
          {sectors.map((sec) => (
            <g key={sec.s}>
              <line
                x1={CX}
                y1={CY}
                x2={sec.lineX}
                y2={sec.lineY}
                stroke="#ffffff"
                strokeOpacity="0.1"
              />
              <text
                x={sec.labelX}
                y={sec.labelY}
                fill="#ffffff"
                fillOpacity="0.35"
                fontSize="8.5"
                fontFamily="monospace"
                textAnchor="middle"
              >
                {sec.s}
              </text>
            </g>
          ))}

          {/* Trayectorias consecutivas entre nodos */}
          {nodos.map((n, idx) => {
            if (idx === 0) return null;
            const prev = nodos[idx - 1];
            if (!n.xy || !prev.xy) return null;
            const isHighlight =
              highlightedPair &&
              ((highlightedPair[0] === prev.i - 1 && highlightedPair[1] === n.i - 1) ||
                (highlightedPair[1] === prev.i - 1 && highlightedPair[0] === n.i - 1));

            return (
              <line
                key={`path-${prev.id}-${n.id}`}
                x1={prev.xy[0]}
                y1={prev.xy[1]}
                x2={n.xy[0]}
                y2={n.xy[1]}
                stroke={isHighlight ? "#f59e0b" : n.p > 0 ? "#ffd9a0" : "#9fc6ff"}
                strokeWidth={isHighlight ? 2.5 : 1.2}
                strokeOpacity={isHighlight ? 1 : 0.45}
              />
            );
          })}

          {/* Aristas del Efecto Mariposa */}
          {causalTensor.M.slice(0, 3).map((m, idx) => {
            const a = nodos[m.i]?.xy;
            const b = nodos[m.j]?.xy;
            if (!a || !b) return null;
            return (
              <line
                key={`butterfly-${idx}`}
                x1={a[0]}
                y1={a[1]}
                x2={b[0]}
                y2={b[1]}
                stroke="#d6b25e"
                strokeWidth="1.5"
                strokeDasharray="4 3"
                strokeOpacity="0.8"
              />
            );
          })}

          {/* Aristas de selección o contraste destacado */}
          {highlightedPair &&
            nodos[highlightedPair[0]]?.xy &&
            nodos[highlightedPair[1]]?.xy && (
              <g>
                <line
                  x1={nodos[highlightedPair[0]].xy![0]}
                  y1={nodos[highlightedPair[0]].xy![1]}
                  x2={nodos[highlightedPair[1]].xy![0]}
                  y2={nodos[highlightedPair[1]].xy![1]}
                  stroke="#fbbf24"
                  strokeWidth="2.2"
                />
                <circle
                  cx={nodos[highlightedPair[0]].xy![0]}
                  cy={nodos[highlightedPair[0]].xy![1]}
                  r={12}
                  fill="none"
                  stroke="#fbbf24"
                  strokeWidth="1.5"
                  className="animate-ping origin-center"
                />
                <circle
                  cx={nodos[highlightedPair[1]].xy![0]}
                  cy={nodos[highlightedPair[1]].xy![1]}
                  r={12}
                  fill="none"
                  stroke="#fbbf24"
                  strokeWidth="1.5"
                  className="animate-ping origin-center"
                />
              </g>
            )}

          {/* Nodos Activos */}
          {nodos.map((n) => {
            if (!n.xy) return null;
            const isSelected = selectedNodeId === n.id;
            const isPairMember =
              highlightedPair &&
              (n.i - 1 === highlightedPair[0] || n.i - 1 === highlightedPair[1]);
            const radius = 3.5 + n.iota * 5;
            const color = PLANO_COLORS[n.c] || "#a855f7";

            return (
              <g
                key={n.id}
                onClick={() => onSelectNode(isSelected ? null : n)}
                className="cursor-pointer transition-transform hover:scale-125"
              >
                {/* Glow aureola */}
                {(isSelected || isPairMember) && (
                  <circle
                    cx={n.xy[0]}
                    cy={n.xy[1]}
                    r={radius + 6}
                    fill="none"
                    stroke="#fbbf24"
                    strokeWidth="1.5"
                  />
                )}

                <circle
                  cx={n.xy[0]}
                  cy={n.xy[1]}
                  r={radius}
                  fill={color}
                  stroke={n.p > 0 ? "#fef08a" : "#bae6fd"}
                  strokeWidth={1}
                  className="transition-all"
                />

                {/* Número de escena */}
                <text
                  x={n.xy[0]}
                  y={n.xy[1] - radius - 2}
                  fill="#ffffff"
                  fontSize="7.5"
                  fontFamily="monospace"
                  textAnchor="middle"
                  fillOpacity="0.8"
                >
                  {n.i}
                </text>
              </g>
            );
          })}
        </svg>
      </div>

      {/* Leyenda de Planos y Código */}
      <div className="w-full mt-3 pt-2.5 border-t border-slate-900 flex flex-wrap items-center justify-between gap-2 text-[11px] font-mono text-slate-400">
        <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
          {rings.map((r) => (
            <div key={r.c} className="flex items-center gap-1.5">
              <span
                className="w-2 h-2 rounded-full inline-block"
                style={{ backgroundColor: r.color }}
              />
              <span className="text-slate-300 text-[10px]">{r.nombre.split(" / ")[0]}</span>
            </div>
          ))}
        </div>

        {highlightedPair && (
          <button
            onClick={onClearHighlight}
            className="px-2 py-0.5 rounded bg-slate-800 hover:bg-slate-700 text-amber-300 text-[10px] font-mono border border-slate-700 transition-colors"
          >
            Limpiar selección
          </button>
        )}
      </div>
    </div>
  );
};
