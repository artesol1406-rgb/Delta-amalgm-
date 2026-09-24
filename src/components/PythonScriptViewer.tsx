import React, { useState, useMemo } from "react";
import { Copy, Check, Download, X, Terminal, Sparkles, RefreshCw } from "lucide-react";
import { CycleIteration, KernelSummary, MaestroGuidance } from "../amalgam/types";
import { generateFullAmalgamPythonScript, downloadPythonFile } from "../amalgam/exportPython";

interface PythonScriptViewerProps {
  isOpen: boolean;
  onClose: () => void;
  logs: CycleIteration[];
  summary: KernelSummary;
  baseText: string;
  guidance: MaestroGuidance | null;
  iteration: number;
}

export const PythonScriptViewer: React.FC<PythonScriptViewerProps> = ({
  isOpen,
  onClose,
  logs,
  summary,
  baseText,
  guidance,
  iteration,
}) => {
  const [copied, setCopied] = useState(false);

  // Generate real-time Python script that contains everything happening in the app
  const pythonCode = useMemo(() => {
    return generateFullAmalgamPythonScript({
      logs,
      currentSummary: summary,
      currentBaseText: baseText,
      currentGuidance: guidance,
      iteration,
    });
  }, [logs, summary, baseText, guidance, iteration]);

  if (!isOpen) return null;

  const handleCopy = () => {
    navigator.clipboard.writeText(pythonCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownload = () => {
    downloadPythonFile(
      pythonCode,
      `amalgam_meta_entorno_iter_${iteration}_${Date.now()}.py`
    );
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm">
      <div className="bg-slate-900 border border-slate-800 rounded-xl w-full max-w-4xl max-h-[88vh] flex flex-col shadow-2xl">
        {/* Header */}
        <div className="p-4 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Terminal className="w-5 h-5 text-amber-400" />
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-sm font-bold text-white font-mono">
                  amalgam_meta_entorno.py
                </h2>
                <span className="text-[10px] px-2 py-0.5 rounded bg-emerald-950/70 border border-emerald-800/60 text-emerald-400 font-mono">
                  Estado Dinámico: Ciclo #{iteration} ({logs.length} eventos)
                </span>
              </div>
              <p className="text-[11px] text-slate-400 mt-0.5">
                Script Python auto-contenido con todo lo que ocurre en la app: Kernel 12D + IA Simulada + LLM Contenedor Holográfico
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleCopy}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 text-xs font-mono transition-colors"
            >
              {copied ? (
                <>
                  <Check className="w-3.5 h-3.5 text-emerald-400" />
                  Copiado
                </>
              ) : (
                <>
                  <Copy className="w-3.5 h-3.5" />
                  Copiar Código
                </>
              )}
            </button>

            <button
              onClick={handleDownload}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-sky-600 hover:bg-sky-500 text-white text-xs font-mono transition-colors shadow-sm"
              title="Descargar script Python con todo el estado y la lógica de la app"
            >
              <Download className="w-3.5 h-3.5" />
              Descargar .py
            </button>

            <button
              onClick={onClose}
              className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Instructions banner */}
        <div className="bg-slate-950 px-4 py-2.5 border-b border-slate-800 text-[11px] font-mono text-slate-400 flex flex-wrap items-center gap-3">
          <span className="text-amber-400 font-semibold">Ejecutar localmente:</span>
          <code className="bg-slate-900 px-2 py-0.5 rounded text-sky-300 border border-slate-800">
            pip install google-genai numpy
          </code>
          <code className="bg-slate-900 px-2 py-0.5 rounded text-sky-300 border border-slate-800">
            export GEMINI_API_KEY="tu_clave"
          </code>
          <code className="bg-slate-900 px-2 py-0.5 rounded text-emerald-300 border border-slate-800">
            python amalgam_meta_entorno.py --steps 10
          </code>
        </div>

        {/* Code Content */}
        <div className="flex-1 overflow-auto p-4 bg-slate-950 font-mono text-xs text-slate-300 leading-relaxed select-text">
          <pre>{pythonCode}</pre>
        </div>
      </div>
    </div>
  );
};

