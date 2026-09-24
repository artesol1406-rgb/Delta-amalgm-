import React, { useState } from "react";
import { History, Copy, Trash2, Check, ChevronDown, ChevronUp, FileDown, Code2 } from "lucide-react";
import { CycleIteration } from "../amalgam/types";

interface HistoryLogsProps {
  logs: CycleIteration[];
  onClear: () => void;
  onExportMarkdown?: () => void;
  onExportPython?: () => void;
}

export const HistoryLogs: React.FC<HistoryLogsProps> = ({ logs, onClear, onExportMarkdown, onExportPython }) => {
  const [copiedIdx, setCopiedIdx] = useState<number | null>(null);
  const [expandedIdx, setExpandedIdx] = useState<number | null>(null);

  const handleCopy = (log: CycleIteration, idx: number) => {
    navigator.clipboard.writeText(JSON.stringify(log, null, 2));
    setCopiedIdx(idx);
    setTimeout(() => setCopiedIdx(null), 1500);
  };

  return (
    <div id="amalgam-history-logs" className="bg-slate-900 border border-slate-800 rounded-xl p-4 shadow-sm">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <History className="w-4 h-4 text-sky-400" />
          <h3 className="text-xs uppercase font-mono tracking-wider text-slate-300">
            Bitácora del Acoplamiento ({logs.length} iteraciones)
          </h3>
        </div>
        <div className="flex items-center gap-2">
          {onExportPython && (
            <button
              id="btn-export-python-history"
              onClick={onExportPython}
              className="flex items-center gap-1.5 px-2.5 py-1 rounded bg-emerald-950/70 hover:bg-emerald-900/80 text-emerald-300 border border-emerald-800/60 text-[11px] font-mono transition-colors"
              title="Descargar script Python con todo el estado y la lógica de la app (.py)"
            >
              <Code2 className="w-3.5 h-3.5 text-emerald-400" />
              <span>Descargar .PY</span>
            </button>
          )}
          {onExportMarkdown && (
            <button
              id="btn-export-markdown-history"
              onClick={onExportMarkdown}
              className="flex items-center gap-1.5 px-2.5 py-1 rounded bg-sky-950/70 hover:bg-sky-900/80 text-sky-300 border border-sky-800/60 text-[11px] font-mono transition-colors"
              title="Descargar toda la bitácora e interacciones del LLM en formato Markdown (.md)"
            >
              <FileDown className="w-3.5 h-3.5 text-sky-400" />
              <span>Descargar .MD</span>
            </button>
          )}
          {logs.length > 0 && (
            <button
              onClick={onClear}
              className="flex items-center gap-1 text-[11px] font-mono text-slate-400 hover:text-rose-400 transition-colors px-2 py-1 rounded hover:bg-slate-800"
            >
              <Trash2 className="w-3 h-3" />
              Limpiar
            </button>
          )}
        </div>
      </div>

      {logs.length === 0 ? (
        <div className="p-8 text-center text-xs font-mono text-slate-500 border border-dashed border-slate-800 rounded-lg">
          Sin iteraciones registradas aún. Inicia el ciclo para observar el acoplamiento de los tres nodos.
        </div>
      ) : (
        <div className="space-y-2 max-h-[360px] overflow-y-auto pr-1">
          {logs.map((log, idx) => {
            const isExpanded = expandedIdx === idx;
            const itemKey = log.id ? `log-item-${log.id}` : `log-item-${idx}-${log.iteration}-${log.timestamp}`;
            return (
              <div
                key={itemKey}
                id={`log-item-${log.iteration}-${idx}`}
                className="p-3 bg-slate-950/60 border border-slate-800/80 rounded-lg text-xs font-mono transition-colors hover:border-slate-700"
              >
                <div className="flex items-center justify-between gap-2 mb-1.5">
                  <div className="flex items-center gap-2">
                    <span className="px-1.5 py-0.5 rounded bg-sky-950 text-sky-300 border border-sky-800/50 font-bold text-[11px]">
                      #{log.iteration}
                    </span>
                    <span className="text-amber-300 font-bold">
                      {log.summary.signature}
                    </span>
                    <span className="text-slate-500 text-[10px]">
                      r={log.summary.coherencia.toFixed(3)}
                    </span>
                    {log.perturbedSymbol && (
                      <span className="px-1.5 py-0.2 rounded bg-pink-950/80 text-pink-300 border border-pink-800/50 text-[10px]">
                        Perturbó: {log.perturbedSymbol}
                      </span>
                    )}
                  </div>

                  <div className="flex items-center gap-1.5">
                    <button
                      onClick={() => handleCopy(log, idx)}
                      className="p-1 text-slate-400 hover:text-slate-200"
                      title="Copiar JSON de iteración"
                    >
                      {copiedIdx === idx ? (
                        <Check className="w-3.5 h-3.5 text-emerald-400" />
                      ) : (
                        <Copy className="w-3.5 h-3.5" />
                      )}
                    </button>
                    <button
                      onClick={() => setExpandedIdx(isExpanded ? null : idx)}
                      className="p-1 text-slate-400 hover:text-slate-200"
                    >
                      {isExpanded ? (
                        <ChevronUp className="w-3.5 h-3.5" />
                      ) : (
                        <ChevronDown className="w-3.5 h-3.5" />
                      )}
                    </button>
                  </div>
                </div>

                <div className="text-slate-300 text-[11px] italic font-sans mb-1 line-clamp-2">
                  <span className="text-indigo-400 not-italic font-mono mr-1">Base:</span>
                  "{log.baseText || "—"}"
                </div>

                {log.guidance && (
                  <div className="text-[11px] text-fuchsia-300/90 font-sans">
                    <span className="text-fuchsia-400 font-mono mr-1">Maestro (Gemini):</span>
                    {log.guidance.razon}
                    {log.guidance.firma && (
                      <span className="ml-2 font-mono text-amber-300 font-bold">
                        [{log.guidance.firma}]
                      </span>
                    )}
                  </div>
                )}

                {isExpanded && (
                  <div className="mt-2 pt-2 border-t border-slate-800/80 text-[10px] space-y-1 text-slate-400">
                    <div>
                      <strong>Varianza:</strong> {log.summary.varianza.toFixed(5)} |{" "}
                      <strong>Lienzo:</strong> {(log.summary.lienzo_medio * 100).toFixed(1)}% |{" "}
                      <strong>Emergencias:</strong> {log.summary.emergencias}
                    </div>
                    <div>
                      <strong>Top Dominantes:</strong>{" "}
                      {log.summary.dominantes
                        .map(([sym, val]) => `${sym} (${(val * 100).toFixed(1)}%)`)
                        .join(", ")}
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
