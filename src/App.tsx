import React, { useState, useEffect, useRef, useCallback } from "react";
import { AmalgamKernel } from "./amalgam/kernel";
import { DimSymbol, KernelSummary, MaestroGuidance, CycleIteration } from "./amalgam/types";
import { generateMetaEnvironmentMarkdown, downloadMarkdownFile } from "./amalgam/exportMarkdown";
import { generateFullAmalgamPythonScript, downloadPythonFile } from "./amalgam/exportPython";
import { TopologyVisualizer } from "./components/TopologyVisualizer";
import { CycleDiagram } from "./components/CycleDiagram";
import { ControlsBar } from "./components/ControlsBar";
import { InspectorPanels } from "./components/InspectorPanels";
import { HistoryLogs } from "./components/HistoryLogs";
import { PythonScriptViewer } from "./components/PythonScriptViewer";
import { Sparkles, Terminal, Activity, Layers, Cpu, ShieldCheck, FileDown, Code2 } from "lucide-react";

export default function App() {
  // Kernel Engine instance
  const kernelRef = useRef<AmalgamKernel | null>(null);
  if (!kernelRef.current) {
    kernelRef.current = new AmalgamKernel();
  }
  const kernel = kernelRef.current;

  // React state synchronized with kernel
  const [summary, setSummary] = useState<KernelSummary>(() => kernel.summary());
  const [kernelValues, setKernelValues] = useState<number[]>(() => [...kernel.s]);
  const [thetaValues, setThetaValues] = useState<number[]>(() => [...kernel.theta]);
  const [lienzoValues, setLienzoValues] = useState<number[]>(() => [...kernel.lienzo]);
  const [orderParam, setOrderParam] = useState(() => kernel.getOrderParameter());

  // Cycle communication states
  const [baseText, setBaseText] = useState<string>("");
  const [guidance, setGuidance] = useState<MaestroGuidance | null>(null);
  const [currentStage, setCurrentStage] = useState<"idle" | "kernel" | "base" | "maestro">("idle");
  const [activePerturbation, setActivePerturbation] = useState<string | null>(null);
  const [iteration, setIteration] = useState<number>(0);
  const [logs, setLogs] = useState<CycleIteration[]>([]);

  // Execution configuration
  const [isRunning, setIsRunning] = useState<boolean>(false);
  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  const [speedMs, setSpeedMs] = useState<number>(1500);
  const [baseSource, setBaseSource] = useState<"gemini" | "simulated">("gemini");
  const [isPythonModalOpen, setIsPythonModalOpen] = useState<boolean>(false);
  const [geminiConfigured, setGeminiConfigured] = useState<boolean>(true);

  // Synchronous execution and concurrency tracking refs
  const isRunningRef = useRef<boolean>(isRunning);
  isRunningRef.current = isRunning;

  const isProcessingRef = useRef<boolean>(false);

  const iterationRef = useRef<number>(0);

  const speedMsRef = useRef<number>(speedMs);
  speedMsRef.current = speedMs;

  const baseSourceRef = useRef<"gemini" | "simulated">(baseSource);
  baseSourceRef.current = baseSource;

  // Monotonic log sequence counter
  const logSequenceRef = useRef<number>(0);
  const createLogId = (iter: number) => {
    logSequenceRef.current += 1;
    return `iter-${iter}-seq-${logSequenceRef.current}-${Date.now()}`;
  };

  // Sync state helper
  const syncFromKernel = useCallback(() => {
    setSummary(kernel.summary());
    setKernelValues([...kernel.s]);
    setThetaValues([...kernel.theta]);
    setLienzoValues([...kernel.lienzo]);
    setOrderParam(kernel.getOrderParameter());
  }, [kernel]);

  // Check health on mount
  useEffect(() => {
    fetch("/api/health")
      .then((res) => res.json())
      .then((data) => {
        setGeminiConfigured(!!data.geminiConfigured);
      })
      .catch(() => {
        setGeminiConfigured(false);
      });
  }, []);

  // Execute 1 complete coupled cycle iteration
  const runCycleStep = useCallback(async () => {
    if (isProcessingRef.current) return;
    isProcessingRef.current = true;
    setIsProcessing(true);

    try {
      // 1. Stage: Kernel evolution (3 micro-steps per iteration as in Python code)
      setCurrentStage("kernel");
      kernel.step();
      kernel.step();
      kernel.step();
      syncFromKernel();
      const currentSummary = kernel.summary();

      // Brief transition delay for visual rhythm
      await new Promise((r) => setTimeout(r, 100));

      // 2. Stage: Base Model generates continuation from Signature & Coherence
      setCurrentStage("base");
      let generatedText = "";
      const currentSource = baseSourceRef.current;
      if (currentSource === "gemini") {
        try {
          const baseRes = await fetch("/api/amalgam/base", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              signature: currentSummary.signature,
              coherence: currentSummary.coherencia,
            }),
          });
          const baseData = await baseRes.json();
          generatedText = baseData.text || "";
        } catch {
          generatedText = "resonancia 12D armónica en los límites del icosaedro.";
        }
      } else {
        // Fast simulated base generator
        const fragments = [
          "el flujo oscila en fase armónica y los bordes se dilatan.",
          "resonancia 12D observada a través de las cuerdas del icosaedro.",
          "la densidad formal transmuta los atractores locales hacia convergencia.",
          "tensión en el acoplamiento subnodal con reverberación circular.",
          "deriva atenuada por el operador Love, emergiendo coherencia sincrónica.",
        ];
        generatedText = fragments[Math.floor(Math.random() * fragments.length)];
      }
      setBaseText(generatedText);

      await new Promise((r) => setTimeout(r, 120));

      // 3. Stage: Maestro (Gemini API) reads state and guides
      setCurrentStage("maestro");
      let maestroGuidance: MaestroGuidance = {
        firma: "Ξ",
        razon: "Alineamiento inicial en proceso",
        perturbar: "",
      };

      try {
        const maestroRes = await fetch("/api/amalgam/maestro", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            kernelSummary: currentSummary,
            baseText: generatedText,
          }),
        });
        const maestroData = await maestroRes.json();
        maestroGuidance = {
          firma: maestroData.firma || "Ξ",
          razon: maestroData.razon || "Ajuste dinámico",
          perturbar: maestroData.perturbar || "",
          mode: maestroData.mode,
        };
      } catch {
        maestroGuidance = {
          firma: "Ξ",
          razon: "Deriva contenida por heurística local",
          perturbar: "",
          mode: "fallback",
        };
      }
      setGuidance(maestroGuidance);

      // 4. Stage: Kernel integrates guidance (perturbation if directed)
      let perturbedSym: string | undefined = undefined;
      if (maestroGuidance.perturbar) {
        const pSym = maestroGuidance.perturbar.trim();
        kernel.perturb(pSym, 0.25);
        syncFromKernel();
        setActivePerturbation(pSym);
        perturbedSym = pSym;
        setTimeout(() => setActivePerturbation(null), 800);
      }

      // Record iteration log with strictly incremented count & unique ID
      iterationRef.current += 1;
      const nextIteration = iterationRef.current;
      setIteration(nextIteration);

      const newLogEntry: CycleIteration = {
        id: createLogId(nextIteration),
        iteration: nextIteration,
        timestamp: Date.now(),
        summary: currentSummary,
        baseText: generatedText,
        guidance: maestroGuidance,
        perturbedSymbol: perturbedSym,
      };

      setLogs((prev) => {
        if (prev.some((e) => e.id === newLogEntry.id)) return prev;
        return [newLogEntry, ...prev.slice(0, 49)];
      });
    } catch (err) {
      console.error("Cycle error:", err);
    } finally {
      setCurrentStage("idle");
      isProcessingRef.current = false;
      setIsProcessing(false);
    }
  }, [kernel, syncFromKernel]);

  // Automatic cycle loop - single non-overlapping timer
  useEffect(() => {
    if (!isRunning) return;

    let isSubscribed = true;
    let timerId: ReturnType<typeof setTimeout> | null = null;

    const tick = async () => {
      if (!isSubscribed || !isRunningRef.current) return;
      await runCycleStep();
      if (isSubscribed && isRunningRef.current) {
        timerId = setTimeout(tick, speedMsRef.current);
      }
    };

    timerId = setTimeout(tick, 200);

    return () => {
      isSubscribed = false;
      if (timerId) clearTimeout(timerId);
    };
  }, [isRunning, runCycleStep]);

  // Manual perturbation by user
  const handleManualPerturb = (symbol: DimSymbol) => {
    kernel.perturb(symbol, 0.35);
    syncFromKernel();
    setActivePerturbation(symbol);
    setTimeout(() => setActivePerturbation(null), 800);

    iterationRef.current += 1;
    const nextIteration = iterationRef.current;
    setIteration(nextIteration);

    const updatedSummary = kernel.summary();
    const manualLog: CycleIteration = {
      id: createLogId(nextIteration),
      iteration: nextIteration,
      timestamp: Date.now(),
      summary: updatedSummary,
      baseText: `[Perturbación manual inducida en ${symbol}]`,
      guidance: {
        firma: updatedSummary.signature,
        razon: `Inyección directa sobre la dimensión ${symbol} (+0.35)`,
        perturbar: symbol,
      },
      perturbedSymbol: symbol,
    };
    setLogs((prev) => {
      if (prev.some((e) => e.id === manualLog.id)) return prev;
      return [manualLog, ...prev.slice(0, 49)];
    });
  };

  // Reset Kernel
  const handleReset = () => {
    setIsRunning(false);
    isRunningRef.current = false;
    isProcessingRef.current = false;
    setIsProcessing(false);
    kernel.reset();
    syncFromKernel();
    setBaseText("");
    setGuidance(null);
    setCurrentStage("idle");
    iterationRef.current = 0;
    setIteration(0);
  };

  // Export full markdown of environment and LLM interactions
  const handleExportMarkdown = useCallback(() => {
    const md = generateMetaEnvironmentMarkdown({
      logs,
      currentSummary: summary,
      currentBaseText: baseText,
      currentGuidance: guidance,
      iteration,
    });
    const filename = `amalgam-emergencia-ia-iter-${iteration}-${Date.now()}.md`;
    downloadMarkdownFile(md, filename);
  }, [logs, summary, baseText, guidance, iteration]);

  // Export complete Python script with live state & holographic architecture
  const handleExportPython = useCallback(() => {
    const py = generateFullAmalgamPythonScript({
      logs,
      currentSummary: summary,
      currentBaseText: baseText,
      currentGuidance: guidance,
      iteration,
    });
    const filename = `amalgam_meta_entorno_iter_${iteration}_${Date.now()}.py`;
    downloadPythonFile(py, filename);
  }, [logs, summary, baseText, guidance, iteration]);

  return (
    <div id="amalgam-app" className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans selection:bg-sky-500 selection:text-white">
      {/* Top Navigation & Status Bar */}
      <header id="amalgam-header" className="border-b border-slate-800 bg-slate-900/80 backdrop-blur sticky top-0 z-30">
        <div className="max-w-7xl mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-sky-500 to-indigo-600 flex items-center justify-center shadow-md">
              <span className="font-mono font-bold text-white text-base">Δ</span>
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-base font-bold tracking-tight text-white">
                  AMALGAM
                </h1>
                <span className="text-[11px] font-mono px-2 py-0.5 rounded bg-slate-800 border border-slate-700 text-sky-300">
                  Kernel + Base + Maestro
                </span>
              </div>
              <p className="text-xs text-slate-400">
                Un ciclo de tres nodos acoplados por firma Δ con Google Gemini API
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2.5">
            <div className="hidden sm:flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-slate-800/80 border border-slate-700 text-xs font-mono">
              <span
                className={`w-2 h-2 rounded-full ${
                  geminiConfigured ? "bg-emerald-400 animate-pulse" : "bg-amber-400"
                }`}
              />
              <span className="text-slate-300">
                Maestro: <strong className="text-sky-300">gemini-3.8-flash</strong>
              </span>
            </div>

            <button
              onClick={() => setIsPythonModalOpen(true)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-amber-500/10 hover:bg-amber-500/20 text-amber-300 border border-amber-500/30 text-xs font-mono transition-colors"
            >
              <Terminal className="w-3.5 h-3.5" />
              <span>amalgam_gemini.py</span>
            </button>

            <button
              id="btn-export-python-header"
              onClick={handleExportPython}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 text-xs font-mono transition-colors"
              title="Descargar script Python con todo el estado y la lógica de la app (.py)"
            >
              <Code2 className="w-3.5 h-3.5 text-emerald-400" />
              <span>Descargar .PY</span>
            </button>

            <button
              id="btn-export-markdown-header"
              onClick={handleExportMarkdown}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-sky-500/10 hover:bg-sky-500/20 text-sky-300 border border-sky-500/30 text-xs font-mono transition-colors"
              title="Descargar registro completo del meta-entorno (.md)"
            >
              <FileDown className="w-3.5 h-3.5 text-sky-400" />
              <span>Descargar .MD</span>
            </button>
          </div>
        </div>
      </header>

      {/* Main Workspace */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-4 space-y-4">
        {/* Three Nodes Flow Diagram */}
        <CycleDiagram
          currentStage={currentStage}
          summary={summary}
          baseText={baseText}
          guidance={guidance}
          geminiActive={geminiConfigured}
        />

        {/* Playback Controls & Action Palette */}
        <ControlsBar
          isRunning={isRunning}
          onTogglePlay={() => setIsRunning(!isRunning)}
          onStep={runCycleStep}
          onReset={handleReset}
          onManualPerturb={handleManualPerturb}
          speedMs={speedMs}
          onChangeSpeed={setSpeedMs}
          baseSource={baseSource}
          onToggleBaseSource={setBaseSource}
          isProcessing={isProcessing}
          onOpenPythonCode={() => setIsPythonModalOpen(true)}
          onExportMarkdown={handleExportMarkdown}
          onExportPython={handleExportPython}
        />

        {/* Central Core: Left Topology Visualizer, Right Inspector & Logs */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 items-start">
          {/* 12D Phase & Kuramoto Topology Visualizer (5 columns) */}
          <div className="lg:col-span-5 space-y-4">
            <TopologyVisualizer
              kernelState={{
                s: kernelValues,
                theta: thetaValues,
                lienzo: lienzoValues,
                orderParameter: orderParam,
              }}
              summary={summary}
              activePerturbation={activePerturbation}
              onPerturb={handleManualPerturb}
            />

            {/* Principles Callout */}
            <div className="p-3 bg-slate-900/60 border border-slate-800 rounded-xl text-xs space-y-1.5 text-slate-400">
              <div className="text-[11px] font-mono text-slate-300 font-semibold flex items-center gap-1">
                <ShieldCheck className="w-3.5 h-3.5 text-sky-400" />
                Mecánica del Acoplamiento Triádico:
              </div>
              <ul className="list-disc pl-4 space-y-1 text-[11px] leading-relaxed">
                <li>
                  <strong className="text-slate-300 font-mono">Kernel 12D:</strong> Aplica el operador Love ds = -α(s_i - s_media) s_i (1 - s_i) con sincronización Kuramoto y lienzo de varianza.
                </li>
                <li>
                  <strong className="text-slate-300 font-mono">Modelo Base:</strong> Genera la continuación cruda orientada por la firma Δ sin filtros instructivos.
                </li>
                <li>
                  <strong className="text-slate-300 font-mono">Maestro (Gemini):</strong> Analiza la coherencia y el lienzo para modular la deriva sin alterar los pesos del modelo ("No entrena. Acopla").
                </li>
              </ul>
            </div>
          </div>

          {/* Right Column: State Inspector & History Logs (7 columns) */}
          <div className="lg:col-span-7 space-y-4">
            <InspectorPanels
              summary={summary}
              kernelValues={kernelValues}
              baseText={baseText}
              guidance={guidance}
              iteration={iteration}
            />

            <HistoryLogs
              logs={logs}
              onClear={() => setLogs([])}
              onExportMarkdown={handleExportMarkdown}
              onExportPython={handleExportPython}
            />
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-900 bg-slate-950 py-3 px-4 text-center text-xs text-slate-500 font-mono">
        AMALGAM · Ciclo de Tres Nodos Acoplados por Firma Δ · Powered by Google Gemini API & AI Studio
      </footer>

      {/* Python Script Viewer Modal */}
      <PythonScriptViewer
        isOpen={isPythonModalOpen}
        onClose={() => setIsPythonModalOpen(false)}
        logs={logs}
        summary={summary}
        baseText={baseText}
        guidance={guidance}
        iteration={iteration}
      />
    </div>
  );
}
