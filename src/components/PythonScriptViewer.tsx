import React, { useState, useMemo, useEffect } from "react";
import { Copy, Check, Download, X, Terminal, Sparkles, Zap, RefreshCw } from "lucide-react";
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
  const [activeTab, setActiveTab] = useState<"groq" | "gemini">("groq");
  const [copied, setCopied] = useState(false);
  const [groqCode, setGroqCode] = useState<string>("");
  const [isLoadingGroq, setIsLoadingGroq] = useState<boolean>(false);

  // Load Groq Python script from server
  useEffect(() => {
    if (isOpen) {
      setIsLoadingGroq(true);
      fetch("/api/amalgam/groq-script")
        .then((res) => res.text())
        .then((text) => {
          setGroqCode(text);
        })
        .catch(() => {
          setGroqCode("# Error al cargar script de Groq");
        })
        .finally(() => {
          setIsLoadingGroq(false);
        });
    }
  }, [isOpen]);

  // Generate real-time Python script for Gemini
  const geminiCode = useMemo(() => {
    return generateFullAmalgamPythonScript({
      logs,
      currentSummary: summary,
      currentBaseText: baseText,
      currentGuidance: guidance,
      iteration,
    });
  }, [logs, summary, baseText, guidance, iteration]);

  const currentCode = activeTab === "groq" ? groqCode : geminiCode;

  if (!isOpen) return null;

  const handleCopy = () => {
    navigator.clipboard.writeText(currentCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownload = () => {
    if (activeTab === "groq") {
      downloadPythonFile(groqCode, `amalgam_groq_120b_iter_${iteration}.py`);
    } else {
      downloadPythonFile(geminiCode, `amalgam_gemini_iter_${iteration}_${Date.now()}.py`);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm">
      <div className="bg-slate-900 border border-slate-800 rounded-xl w-full max-w-4xl max-h-[88vh] flex flex-col shadow-2xl">
        {/* Header */}
        <div className="p-4 border-b border-slate-800 flex items-center justify-between flex-wrap gap-2">
          <div className="flex items-center gap-3">
            <Terminal className="w-5 h-5 text-amber-400" />
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-sm font-bold text-white font-mono">
                  {activeTab === "groq" ? "amalgam_groq.py" : "amalgam_meta_entorno.py"}
                </h2>
                <span className="text-[10px] px-2 py-0.5 rounded bg-emerald-950/70 border border-emerald-800/60 text-emerald-400 font-mono">
                  Ciclo #{iteration} ({logs.length} eventos)
                </span>
              </div>
              <p className="text-[11px] text-slate-400 mt-0.5">
                {activeTab === "groq"
                  ? "Script con cliente Groq (openai/gpt-oss-120b, streaming y reasoning_effort medium)"
                  : "Script auto-contenido con Kernel 12D + IA Simulada + LLM Contenedor Holográfico (Gemini)"}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* Tabs switcher */}
            <div className="flex items-center bg-slate-950 border border-slate-800 rounded-lg p-0.5 text-xs font-mono mr-2">
              <button
                type="button"
                onClick={() => setActiveTab("groq")}
                className={`flex items-center gap-1.5 px-2.5 py-1 rounded transition-colors ${
                  activeTab === "groq"
                    ? "bg-amber-600/30 text-amber-300 border border-amber-500/40 font-semibold"
                    : "text-slate-400 hover:text-slate-200"
                }`}
              >
                <Zap className="w-3.5 h-3.5 text-amber-400" />
                <span>Groq (120b)</span>
              </button>
              <button
                type="button"
                onClick={() => setActiveTab("gemini")}
                className={`flex items-center gap-1.5 px-2.5 py-1 rounded transition-colors ${
                  activeTab === "gemini"
                    ? "bg-purple-900/50 text-purple-300 border border-purple-700/60 font-semibold"
                    : "text-slate-400 hover:text-slate-200"
                }`}
              >
                <Sparkles className="w-3.5 h-3.5 text-purple-400" />
                <span>Gemini API</span>
              </button>
            </div>

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
              title="Descargar script Python"
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
          {activeTab === "groq" ? (
            <>
              <code className="bg-slate-900 px-2 py-0.5 rounded text-amber-300 border border-slate-800">
                pip install groq
              </code>
              <code className="bg-slate-900 px-2 py-0.5 rounded text-sky-300 border border-slate-800">
                export GROQ_API_KEY="gsk_..."
              </code>
              <code className="bg-slate-900 px-2 py-0.5 rounded text-emerald-300 border border-slate-800">
                python amalgam_groq.py
              </code>
            </>
          ) : (
            <>
              <code className="bg-slate-900 px-2 py-0.5 rounded text-sky-300 border border-slate-800">
                pip install google-genai numpy
              </code>
              <code className="bg-slate-900 px-2 py-0.5 rounded text-sky-300 border border-slate-800">
                export GEMINI_API_KEY="tu_clave"
              </code>
              <code className="bg-slate-900 px-2 py-0.5 rounded text-emerald-300 border border-slate-800">
                python amalgam_meta_entorno.py --steps 10
              </code>
            </>
          )}
        </div>

        {/* Code Content */}
        <div className="flex-1 overflow-auto p-4 bg-slate-950 font-mono text-xs text-slate-300 leading-relaxed select-text">
          {isLoadingGroq && activeTab === "groq" ? (
            <div className="flex items-center gap-2 text-slate-400 py-8 justify-center">
              <RefreshCw className="w-4 h-4 animate-spin text-amber-400" />
              <span>Cargando script de Groq...</span>
            </div>
          ) : (
            <pre>{currentCode}</pre>
          )}
        </div>
      </div>
    </div>
  );
};


