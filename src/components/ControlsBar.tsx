import React from "react";
import { Play, Pause, StepForward, RotateCcw, Sparkles, Terminal, FileDown, Code2, Archive } from "lucide-react";
import { DIMS, DIMENSION_METAS, DimSymbol } from "../amalgam/types";

interface ControlsBarProps {
  isRunning: boolean;
  onTogglePlay: () => void;
  onStep: () => void;
  onReset: () => void;
  onManualPerturb: (symbol: DimSymbol) => void;
  speedMs: number;
  onChangeSpeed: (ms: number) => void;
  baseSource: "gemini" | "simulated";
  onToggleBaseSource: (src: "gemini" | "simulated") => void;
  isProcessing: boolean;
  onOpenPythonCode: () => void;
  onExportMarkdown: () => void;
  onExportPython?: () => void;
  onDownloadZip?: () => void;
}

export const ControlsBar: React.FC<ControlsBarProps> = ({
  isRunning,
  onTogglePlay,
  onStep,
  onReset,
  onManualPerturb,
  speedMs,
  onChangeSpeed,
  baseSource,
  onToggleBaseSource,
  isProcessing,
  onOpenPythonCode,
  onExportMarkdown,
  onExportPython,
  onDownloadZip,
}) => {
  return (
    <div id="amalgam-controls-bar" className="bg-slate-900 border border-slate-800 rounded-xl p-3.5 shadow-md flex flex-col gap-3">
      <div className="flex flex-wrap items-center justify-between gap-3">
        {/* Playback Controls */}
        <div className="flex items-center gap-2">
          <button
            id="btn-toggle-cycle"
            onClick={onTogglePlay}
            disabled={isProcessing && !isRunning}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium text-xs transition-colors shadow-sm ${
              isRunning
                ? "bg-amber-600 hover:bg-amber-500 text-white"
                : "bg-sky-600 hover:bg-sky-500 text-white"
            }`}
          >
            {isRunning ? (
              <>
                <Pause className="w-3.5 h-3.5" />
                Pausar Ciclo
              </>
            ) : (
              <>
                <Play className="w-3.5 h-3.5" />
                Iniciar Ciclo Continuo
              </>
            )}
          </button>

          <button
            id="btn-single-step"
            onClick={onStep}
            disabled={isRunning || isProcessing}
            className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 text-xs font-medium transition-colors disabled:opacity-50"
            title="Avanza exactamente 1 iteración acoplada"
          >
            <StepForward className="w-3.5 h-3.5 text-sky-400" />
            Paso a Paso
          </button>

          <button
            id="btn-reset-kernel"
            onClick={onReset}
            disabled={isRunning || isProcessing}
            className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-slate-200 border border-slate-700 text-xs font-medium transition-colors disabled:opacity-50"
            title="Reiniciar estado aleatorio del Kernel"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            Reiniciar
          </button>
        </div>

        {/* Speed & Base Selection */}
        <div className="flex flex-wrap items-center gap-3 text-xs">
          <div className="flex items-center gap-1.5 bg-slate-800/80 px-2.5 py-1.5 rounded-lg border border-slate-700/80">
            <span className="text-slate-400">Cadencia:</span>
            <select
              id="select-speed"
              value={speedMs}
              onChange={(e) => onChangeSpeed(Number(e.target.value))}
              className="bg-slate-900 text-slate-200 text-xs font-mono rounded px-1.5 py-0.5 border border-slate-700 outline-none"
            >
              <option value={800}>Rápido (800ms)</option>
              <option value={1500}>Normal (1.5s)</option>
              <option value={3000}>Lento (3s)</option>
            </select>
          </div>

          <div className="flex items-center gap-1.5 bg-slate-800/80 px-2.5 py-1.5 rounded-lg border border-slate-700/80">
            <span className="text-slate-400">Modelo Base:</span>
            <button
              id="btn-toggle-base-source"
              onClick={() => onToggleBaseSource(baseSource === "gemini" ? "simulated" : "gemini")}
              className={`px-2 py-0.5 rounded text-xs font-mono transition-colors border ${
                baseSource === "gemini"
                  ? "bg-indigo-950 text-indigo-300 border-indigo-700"
                  : "bg-slate-700 text-slate-300 border-slate-600"
              }`}
            >
              {baseSource === "gemini" ? "Gemini Base Mode" : "Estocástico Rápido"}
            </button>
          </div>

          {/* Python Script Direct Access */}
          <button
            id="btn-view-python-script"
            onClick={onOpenPythonCode}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-amber-300 border border-amber-900/60 text-xs font-mono transition-colors"
          >
            <Terminal className="w-3.5 h-3.5" />
            Ver Código Python
          </button>

          {/* Download Full Python Script */}
          {onExportPython && (
            <button
              id="btn-export-python-controls"
              onClick={onExportPython}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-950/80 hover:bg-emerald-900/80 text-emerald-300 border border-emerald-800/80 text-xs font-mono transition-colors shadow-sm"
              title="Descargar script Python con todo el estado dinámico y arquitectura del meta-entorno"
            >
              <Code2 className="w-3.5 h-3.5 text-emerald-400" />
              <span>Descargar .PY</span>
            </button>
          )}

          {/* Export Full Markdown Output */}
          <button
            id="btn-export-markdown-controls"
            onClick={onExportMarkdown}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-sky-950/80 hover:bg-sky-900/80 text-sky-300 border border-sky-800/80 text-xs font-mono transition-colors shadow-sm"
            title="Descargar reporte Markdown completo del meta-entorno, sustrato e interacciones LLM"
          >
            <FileDown className="w-3.5 h-3.5 text-sky-400" />
            <span>Descargar .MD</span>
          </button>

          {/* Download Entire Project ZIP */}
          {onDownloadZip && (
            <button
              id="btn-download-zip-controls"
              onClick={onDownloadZip}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-purple-950/80 hover:bg-purple-900/80 text-purple-300 border border-purple-800/80 text-xs font-mono transition-colors shadow-sm"
              title="Descargar archivo .ZIP con todo el código fuente del proyecto (TypeScript, React, scripts Python y configuración)"
            >
              <Archive className="w-3.5 h-3.5 text-purple-400" />
              <span>Descargar Proyecto .ZIP</span>
            </button>
          )}
        </div>
      </div>

      {/* Manual Perturbation Palette */}
      <div className="pt-2 border-t border-slate-800/80 flex flex-wrap items-center gap-1.5">
        <span className="text-[11px] font-mono text-slate-400 mr-1 flex items-center gap-1">
          <Sparkles className="w-3 h-3 text-pink-400" />
          Perturbar Símbolo:
        </span>
        {DIMS.map((symbol) => {
          const meta = DIMENSION_METAS[symbol];
          return (
            <button
              key={`perturb-btn-${symbol}`}
              id={`btn-perturb-${symbol}`}
              onClick={() => onManualPerturb(symbol)}
              title={`${symbol}: ${meta.name} (${meta.description})`}
              className="px-2 py-1 rounded bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-300 hover:text-white text-xs font-mono transition-transform hover:scale-105 active:scale-95"
            >
              <span style={{ color: meta.color }} className="font-bold mr-1">
                {symbol}
              </span>
              <span className="text-[10px] text-slate-400">{meta.name.split("/")[0].trim()}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
};
