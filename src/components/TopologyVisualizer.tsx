import React, { useMemo } from "react";
import { DIMS, DIMENSION_METAS, DimSymbol, KernelSummary } from "../amalgam/types";

interface TopologyVisualizerProps {
  kernelState: {
    s: number[];
    theta: number[];
    lienzo: number[];
    orderParameter: { r: number; psi: number };
  };
  summary: KernelSummary;
  activePerturbation: string | null;
  onPerturb: (symbol: DimSymbol) => void;
}

export const TopologyVisualizer: React.FC<TopologyVisualizerProps> = ({
  kernelState,
  summary,
  activePerturbation,
  onPerturb,
}) => {
  const size = 440;
  const center = size / 2;
  const radius = 150;

  // Identify top dominant dimensions
  const topSymbols = useMemo(() => {
    return new Set(summary.dominantes.slice(0, 3).map(([s]) => s));
  }, [summary.dominantes]);

  // Coordinates for the 12 dimensions
  const nodePositions = useMemo(() => {
    return DIMS.map((symbol, i) => {
      const angle = (i * 2 * Math.PI) / DIMS.length - Math.PI / 2;
      const x = center + radius * Math.cos(angle);
      const y = center + radius * Math.sin(angle);
      return { symbol, index: i, x, y, angle };
    });
  }, [center, radius]);

  // Neighbor connections
  const connections = useMemo(() => {
    const lines: { x1: number; y1: number; x2: number; y2: number; weight: number }[] = [];
    for (let i = 0; i < nodePositions.length; i++) {
      const next = (i + 1) % nodePositions.length;
      const p1 = nodePositions[i];
      const p2 = nodePositions[next];
      const avgEnergy = (kernelState.s[i] + kernelState.s[next]) / 2;
      lines.push({
        x1: p1.x,
        y1: p1.y,
        x2: p2.x,
        y2: p2.y,
        weight: avgEnergy,
      });
    }
    // Cross connections for icosahedral chord topology (i to i+4)
    for (let i = 0; i < nodePositions.length; i++) {
      const chord = (i + 4) % nodePositions.length;
      if (i < chord) {
        lines.push({
          x1: nodePositions[i].x,
          y1: nodePositions[i].y,
          x2: nodePositions[chord].x,
          y2: nodePositions[chord].y,
          weight: (kernelState.s[i] + kernelState.s[chord]) / 4,
        });
      }
    }
    return lines;
  }, [nodePositions, kernelState.s]);

  // Order parameter vector (global Kuramoto centroid)
  const orderVector = useMemo(() => {
    const vectorLength = Math.min(kernelState.orderParameter.r * 120, 110);
    const vx = center + vectorLength * Math.cos(kernelState.orderParameter.psi - Math.PI / 2);
    const vy = center + vectorLength * Math.sin(kernelState.orderParameter.psi - Math.PI / 2);
    return { vx, vy };
  }, [center, kernelState.orderParameter]);

  return (
    <div id="amalgam-topology-card" className="relative flex flex-col items-center justify-center p-4 bg-slate-900 border border-slate-800 rounded-xl shadow-lg">
      <div className="w-full flex items-center justify-between mb-2 px-2">
        <div>
          <span className="text-xs uppercase tracking-wider font-mono text-slate-400">
            Topología 12D · Fases de Kuramoto
          </span>
          <h3 className="text-sm font-semibold text-slate-200">
            Acoplamiento Circular & Lienzo Térmico
          </h3>
        </div>
        <div className="flex items-center gap-2 text-xs font-mono">
          <span className="px-2 py-0.5 rounded bg-slate-800 text-sky-400 border border-slate-700">
            r = {kernelState.orderParameter.r.toFixed(3)}
          </span>
          <span className="px-2 py-0.5 rounded bg-slate-800 text-amber-400 border border-slate-700">
            Lienzo: {(summary.lienzo_medio * 100).toFixed(1)}%
          </span>
        </div>
      </div>

      <svg
        id="amalgam-topology-svg"
        viewBox={`0 0 ${size} ${size}`}
        className="w-full max-w-[420px] aspect-square overflow-visible select-none"
      >
        <defs>
          <radialGradient id="centerGlow" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="#38bdf8" stopOpacity="0.2" />
            <stop offset="60%" stopColor="#0284c7" stopOpacity="0.05" />
            <stop offset="100%" stopColor="#0f172a" stopOpacity="0" />
          </radialGradient>
          <filter id="glowEffect" x="-20%" y="-20%" width="140%" height="140%">
            <feGaussianBlur stdDeviation="3" result="blur" />
            <feComposite in="SourceGraphic" in2="blur" operator="over" />
          </filter>
        </defs>

        {/* Outer Ring representing Lienzo boundary */}
        <circle
          cx={center}
          cy={center}
          r={radius + 32}
          fill="none"
          stroke="#1e293b"
          strokeWidth="1.5"
          strokeDasharray="4 4"
        />

        {/* Central Glow Field */}
        <circle cx={center} cy={center} r={radius} fill="url(#centerGlow)" />

        {/* Concentric Guide Circles */}
        <circle cx={center} cy={center} r={radius * 0.4} fill="none" stroke="#334155" strokeWidth="1" strokeOpacity="0.4" />
        <circle cx={center} cy={center} r={radius * 0.75} fill="none" stroke="#334155" strokeWidth="1" strokeOpacity="0.4" />
        <circle cx={center} cy={center} r={radius} fill="none" stroke="#334155" strokeWidth="1.5" strokeOpacity="0.6" />

        {/* Internal Couplings & Chords */}
        {connections.map((c, i) => (
          <line
            key={`conn-${i}`}
            x1={c.x1}
            y1={c.y1}
            x2={c.x2}
            y2={c.y2}
            stroke="#38bdf8"
            strokeOpacity={Math.min(0.12 + c.weight * 3, 0.65)}
            strokeWidth={0.8 + c.weight * 12}
            strokeLinecap="round"
          />
        ))}

        {/* Kuramoto Order Parameter Vector (Central Synchronizer) */}
        <line
          x1={center}
          y1={center}
          x2={orderVector.vx}
          y2={orderVector.vy}
          stroke="#f59e0b"
          strokeWidth="2.5"
          strokeLinecap="round"
          filter="url(#glowEffect)"
        />
        <circle
          cx={orderVector.vx}
          cy={orderVector.vy}
          r="4.5"
          fill="#f59e0b"
        />
        <circle
          cx={center}
          cy={center}
          r="3"
          fill="#94a3b8"
        />

        {/* 12 Nodes */}
        {nodePositions.map(({ symbol, index, x, y }) => {
          const meta = DIMENSION_METAS[symbol];
          const weight = kernelState.s[index] ?? 0.083;
          const theta = kernelState.theta[index] ?? 0;
          const lienzoVal = kernelState.lienzo[index] ?? 0.1;
          const isDominant = topSymbols.has(symbol);
          const isPerturbed = activePerturbation === symbol;

          // Node radius scales with energy weight
          const baseR = 14 + weight * 90;
          const phaseIndicatorLength = baseR - 3;
          const phaseX = x + phaseIndicatorLength * Math.cos(theta);
          const phaseY = y + phaseIndicatorLength * Math.sin(theta);

          return (
            <g
              key={symbol}
              className="cursor-pointer transition-transform duration-200 hover:scale-110"
              onClick={() => onPerturb(symbol)}
            >
              {/* Thermal Lienzo aura */}
              <circle
                cx={x}
                cy={y}
                r={baseR + 8 + lienzoVal * 16}
                fill={meta.color}
                fillOpacity={0.06 + lienzoVal * 0.25}
              />

              {/* Perturbation pulse */}
              {isPerturbed && (
                <circle
                  cx={x}
                  cy={y}
                  r={baseR + 18}
                  fill="none"
                  stroke="#ec4899"
                  strokeWidth="2.5"
                  className="animate-ping"
                  opacity={0.8}
                />
              )}

              {/* Main Node Body */}
              <circle
                cx={x}
                cy={y}
                r={baseR}
                fill="#0f172a"
                stroke={isDominant ? "#38bdf8" : meta.color}
                strokeWidth={isDominant ? 3 : 1.8}
                filter={isDominant ? "url(#glowEffect)" : undefined}
              />

              {/* Internal Phase Vector indicator (Kuramoto individual phase) */}
              <line
                x1={x}
                y1={y}
                x2={phaseX}
                y2={phaseY}
                stroke={meta.color}
                strokeWidth="2"
                strokeLinecap="round"
              />
              <circle cx={phaseX} cy={phaseY} r="2" fill="#ffffff" />

              {/* Dimension Symbol */}
              <text
                x={x}
                y={y + 5}
                textAnchor="middle"
                fontSize={isDominant ? "14" : "12"}
                fontWeight="bold"
                fill={isDominant ? "#ffffff" : "#cbd5e1"}
                fontFamily="ui-monospace, monospace"
                className="pointer-events-none"
              >
                {symbol}
              </text>
            </g>
          );
        })}
      </svg>

      <div className="w-full mt-3 pt-2 border-t border-slate-800 flex items-center justify-between text-[11px] text-slate-400">
        <span className="flex items-center gap-1.5">
          <span className="w-2 h-2 rounded-full bg-amber-400 inline-block"></span>
          Vector Coherencia Kuramoto (r, ψ)
        </span>
        <span className="text-slate-500 italic">
          Haz clic en cualquier nodo para perturbar
        </span>
      </div>
    </div>
  );
};
