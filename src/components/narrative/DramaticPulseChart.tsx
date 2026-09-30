import React from "react";
import { NarrativeNode, PLANO_COLORS } from "../../narrative/types";

interface DramaticPulseChartProps {
  nodos: NarrativeNode[];
  highlightedPair: [number, number] | null;
  onSelectNode: (nodo: NarrativeNode) => void;
}

export const DramaticPulseChart: React.FC<DramaticPulseChartProps> = ({
  nodos,
  highlightedPair,
  onSelectNode,
}) => {
  if (nodos.length === 0) return null;

  const sortedNodes = [...nodos].sort((a, b) => a.tau - b.tau);
  const X = (t: number) => 35 + (t / 12) * 335;
  const Y = (v: number) => 135 - v * 115;

  // Act breakdowns: Act I (0..3), Act II (4..8), Act III (9..11)
  const actI = nodos.filter((n) => n.s >= 0 && n.s <= 3);
  const actII = nodos.filter((n) => n.s >= 4 && n.s <= 8);
  const actIII = nodos.filter((n) => n.s >= 9 && n.s <= 11);

  const meanT = (list: NarrativeNode[]) =>
    list.length > 0
      ? (list.reduce((acc, curr) => acc + curr.T, 0) / list.length).toFixed(2)
      : null;

  const meanI = meanT(actI);
  const meanII = meanT(actII);
  const meanIII = meanT(actIII);

  const peakNode = nodos.reduce((prev, curr) => (curr.T > prev.T ? curr : prev), nodos[0]);
  const lastNode = nodos[nodos.length - 1];

  const polylinePoints = sortedNodes.map((n) => `${X(n.tau)},${Y(n.T)}`).join(" ");

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 shadow-xl space-y-3">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-xs font-semibold text-slate-200 uppercase tracking-wider font-mono">
            Pulso Dramático: T(n) = 0.65·δ + 0.35·ι
          </h3>
          <p className="text-[11px] text-slate-400">
            Tensión a lo largo de las 12 estaciones. Clímax pico: Escena #{peakNode.i} (T={peakNode.T.toFixed(2)})
          </p>
        </div>
        <div className="text-[11px] font-mono text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded border border-amber-500/20">
          {lastNode.T < 0.6 * peakNode.T ? "Descarga armónica" : "Tensión abierta / Suspendida"}
        </div>
      </div>

      {/* SVG Curve */}
      <div className="w-full bg-slate-950/80 rounded-xl p-2 border border-slate-800/80 overflow-hidden">
        <svg viewBox="0 0 400 160" className="w-full h-auto select-none">
          {/* Ejes horizontales y estaciones */}
          {Array.from({ length: 12 }, (_, s) => (
            <text
              key={`tick-${s}`}
              x={X(s + 0.5)}
              y="152"
              fontSize="8.5"
              fill="#94a3b8"
              fontFamily="monospace"
              textAnchor="middle"
            >
              {s}
            </text>
          ))}

          {/* Líneas guía */}
          <line x1="35" y1="135" x2="380" y2="135" stroke="#334155" strokeWidth="1" />
          <line
            x1="35"
            y1={Y(0.5)}
            x2="380"
            y2={Y(0.5)}
            stroke="#1e293b"
            strokeWidth="1"
            strokeDasharray="2 4"
          />
          <line
            x1="35"
            y1={Y(0.85)}
            x2="380"
            y2={Y(0.85)}
            stroke="#dc2626"
            strokeWidth="0.8"
            strokeOpacity="0.4"
            strokeDasharray="3 3"
          />

          {/* Curva de Tensión */}
          <polyline
            fill="none"
            stroke="#38bdf8"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            points={polylinePoints}
          />

          {/* Conexión de pares destacados */}
          {highlightedPair && (
            <line
              x1={X(nodos[highlightedPair[0]].tau)}
              y1={Y(nodos[highlightedPair[0]].T)}
              x2={X(nodos[highlightedPair[1]].tau)}
              y2={Y(nodos[highlightedPair[1]].T)}
              stroke="#fbbf24"
              strokeWidth="2"
              strokeDasharray="4 3"
            />
          )}

          {/* Nodos de Tensión */}
          {sortedNodes.map((n) => {
            const isPairMember =
              highlightedPair &&
              (n.i - 1 === highlightedPair[0] || n.i - 1 === highlightedPair[1]);
            const isPeak = n.id === peakNode.id;
            const xPos = X(n.tau);
            const yPos = Y(n.T);

            return (
              <g
                key={`pulse-node-${n.id}`}
                onClick={() => onSelectNode(n)}
                className="cursor-pointer"
              >
                <circle
                  cx={xPos}
                  cy={yPos}
                  r={isPairMember || isPeak ? 6 : 3.8}
                  fill={PLANO_COLORS[n.c]}
                  stroke={isPairMember ? "#fbbf24" : isPeak ? "#f59e0b" : "#ffffff"}
                  strokeWidth={isPairMember || isPeak ? 2 : 1}
                />
                {(isPairMember || isPeak) && (
                  <text
                    x={xPos}
                    y={yPos - 9}
                    fontSize="9"
                    fontFamily="monospace"
                    fill="#fbbf24"
                    fontWeight="bold"
                    textAnchor="middle"
                  >
                    #{n.i}
                  </text>
                )}
              </g>
            );
          })}
        </svg>
      </div>

      {/* Desglose por Actos */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 text-xs font-mono">
        <div className="bg-slate-950 p-2.5 rounded-lg border border-slate-800">
          <div className="text-slate-400 text-[10px]">Acto I (Planteamiento: 0..3)</div>
          <div className="text-sm font-bold text-sky-300 mt-0.5">
            {meanI ? `T media: ${meanI}` : "Elipsis"}
          </div>
          <div className="text-[10px] text-slate-500 mt-1">{actI.length} escenas registradas</div>
        </div>

        <div className="bg-slate-950 p-2.5 rounded-lg border border-slate-800">
          <div className="text-slate-400 text-[10px]">Acto II (Confrontación: 4..8)</div>
          <div className="text-sm font-bold text-amber-300 mt-0.5">
            {meanII ? `T media: ${meanII}` : "Elipsis"}
          </div>
          <div className="text-[10px] text-slate-500 mt-1">{actII.length} escenas registradas</div>
        </div>

        <div className="bg-slate-950 p-2.5 rounded-lg border border-slate-800">
          <div className="text-slate-400 text-[10px]">Acto III (Resolución: 9..11)</div>
          <div className="text-sm font-bold text-emerald-300 mt-0.5">
            {meanIII ? `T media: ${meanIII}` : "Elipsis"}
          </div>
          <div className="text-[10px] text-slate-500 mt-1">{actIII.length} escenas registradas</div>
        </div>
      </div>
    </div>
  );
};
