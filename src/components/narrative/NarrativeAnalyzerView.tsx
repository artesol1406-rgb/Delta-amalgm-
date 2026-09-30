import React, { useState, useMemo, useCallback } from "react";
import {
  NarrativeNode,
  StoryAnalysisOutput,
  PLANOS_DRAMATURGICOS,
  PLANO_COLORS,
  ESTACIONES_HEROE,
  ARQUETIPOS_FUNCIONALES,
} from "../../narrative/types";
import {
  procesarDinamicaFlujo,
  calcularTensorCausal,
  calcularCuatroProyeccion,
  getMandalaCoordinates,
} from "../../narrative/math";
import { getInitialNarrativeNodes, SAMPLE_NARRATIVE_TEXT } from "../../narrative/samples";
import { NarrativeMandala } from "./NarrativeMandala";
import { DramaticPulseChart } from "./DramaticPulseChart";
import { CausalTensorPanel } from "./CausalTensorPanel";
import { FourProjectionRadar } from "./FourProjectionRadar";
import { DialecticSynthesisPanel } from "./DialecticSynthesisPanel";
import { SocraticChat } from "./SocraticChat";
import { PolarityDecisionEngine } from "./PolarityDecisionEngine";
import {
  Upload,
  FileText,
  Sparkles,
  Compass,
  Play,
  RotateCcw,
  CheckCircle2,
  Layers,
  HelpCircle,
  Zap,
} from "lucide-react";

interface NarrativeAnalyzerViewProps {
  groqApiKey: string;
  onOpenGroqModal: () => void;
}

export const NarrativeAnalyzerView: React.FC<NarrativeAnalyzerViewProps> = ({
  groqApiKey,
  onOpenGroqModal,
}) => {
  // Estado principal de nodos y análisis
  const [nodos, setNodos] = useState<NarrativeNode[]>(() => getInitialNarrativeNodes());
  const [selectedNode, setSelectedNode] = useState<NarrativeNode | null>(null);
  const [highlightedPair, setHighlightedPair] = useState<[number, number] | null>(null);

  // Metadatos de análisis
  const [telosDeclarado, setTelosDeclarado] = useState<string>("Mostrar");
  const [telosManifestado, setTelosManifestado] = useState<string>("Mostrar");
  const [atractor, setAtractor] = useState<string>("Reconciliación y transmutación de la pérdida");
  const [cierre, setCierre] = useState<"trágico" | "redentor" | "circular" | "abierto">("redentor");
  const [personajes, setPersonajes] = useState<string[]>(["El Héroe", "El Guardián", "El Mentor"]);
  const [personajeFoco, setPersonajeFoco] = useState<string>("");

  // Input de texto para análisis
  const [inputText, setInputText] = useState<string>(SAMPLE_NARRATIVE_TEXT);
  const [contextoExtra, setContextoExtra] = useState<string>("");
  const [isAnalyzing, setIsAnalyzing] = useState<boolean>(false);
  const [activeTab, setActiveTab] = useState<"analisis" | "creacion">("analisis");

  // Cálculos reactivos de métricas
  const causalTensor = useMemo(() => calcularTensorCausal(nodos), [nodos]);

  const fourProjection = useMemo(() => {
    const last = nodos[nodos.length - 1];
    return calcularCuatroProyeccion(
      last ? [1.0, last.D, last.delta, last.iota] : [1.0, 0.9, 0.95, 0.9]
    );
  }, [nodos]);

  // Manejo de archivo (.txt o .md)
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result as string;
      if (content) {
        setInputText(content);
      }
    };
    reader.readAsText(file);
  };

  // Ejecución de análisis inteligente vía endpoint
  const handleRunAnalysis = async () => {
    if (!inputText.trim() || isAnalyzing) return;
    setIsAnalyzing(true);

    try {
      const res = await fetch("/api/narrative/analizar", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          text: inputText,
          telos: telosDeclarado,
          contexto: contextoExtra,
          personajeFoco,
          groqApiKey,
        }),
      });

      if (!res.ok) {
        throw new Error(`HTTP ${res.status}`);
      }

      const data: StoryAnalysisOutput = await res.json();
      if (data.escenas && data.escenas.length > 0) {
        const processed = procesarDinamicaFlujo(data.escenas).map((n) => ({
          ...n,
          xy: getMandalaCoordinates(n.s, n.c, n.a),
        }));

        setNodos(processed);
        setCierre(data.cierre || "redentor");
        setAtractor(data.atractor || "Equilibrio");
        setTelosManifestado(data.telos_manifestado || "Mostrar");
        if (data.personajes) setPersonajes(data.personajes);
      }
    } catch (err: any) {
      console.warn("Fallo análisis de API, regenerando con motor determinista local:", err);
      // Fallback seguro: procesar texto localmente
      const lines = inputText.split("\n").filter((l) => l.trim().length > 15);
      const generated = lines.slice(0, 12).map((line, idx) => ({
        id: `gen-${idx}`,
        i: idx + 1,
        resumen: line.slice(0, 60),
        s: idx % 12,
        c: (idx * 2) % 7,
        a: (idx * 3) % 22,
        p: (idx % 2 === 0 ? 1 : -1) as 1 | -1,
        delta: 0.2 + (idx / 12) * 0.7,
        iota: 0.3 + (idx % 3) * 0.25,
      }));

      const processed = procesarDinamicaFlujo(
        generated.map((g) => ({ ...g, q: 0, tau: 0, t: 0, T: 0, D: 0 }))
      ).map((n) => ({
        ...n,
        xy: getMandalaCoordinates(n.s, n.c, n.a),
      }));

      setNodos(processed);
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleResetToSample = () => {
    setNodos(getInitialNarrativeNodes());
    setSelectedNode(null);
    setHighlightedPair(null);
  };

  const handleApplyDecision = (camino: "e1" | "e2" | "e3" | "e4") => {
    const last = nodos[nodos.length - 1];
    const newStation = (last.s + 1) % 12;
    const newIdx = nodos.length + 1;

    const isAct = camino === "e1" || camino === "e3";
    const pVal: 1 | -1 = isAct ? 1 : -1;
    const cVal = camino === "e1" ? 2 : camino === "e2" ? 3 : camino === "e3" ? 5 : 4;
    const aVal = camino === "e1" ? 1 : camino === "e2" ? 12 : camino === "e3" ? 16 : 4;
    const deltaVal = camino === "e1" || camino === "e3" ? 0.85 : 0.45;
    const iotaVal = camino === "e1" ? 0.9 : camino === "e2" ? 0.75 : camino === "e3" ? 0.8 : 0.5;

    const labels: Record<string, string> = {
      e1: "Ataque frontal o confrontación directa (Choque Activo)",
      e2: "Asimilación táctica o rendición voluntaria (Entrega Receptiva)",
      e3: "Ruptura imprevista de reglas o quiebre de alianza (Crisis Dinámica)",
      e4: "Atrincheramiento defensivo y resistencia en ancla (Contención Estática)",
    };

    const newNode: NarrativeNode = {
      id: `dec-${Date.now()}`,
      i: newIdx,
      resumen: `Decisión ${camino.toUpperCase()}: ${labels[camino]}`,
      s: newStation,
      c: cVal,
      a: aVal,
      p: pVal,
      delta: deltaVal,
      iota: iotaVal,
      q: 0,
      tau: 0,
      t: 0,
      T: 0,
      D: 0,
    };

    const updated = procesarDinamicaFlujo([...nodos, newNode]).map((n) => ({
      ...n,
      xy: getMandalaCoordinates(n.s, n.c, n.a),
    }));

    setNodos(updated);
  };

  return (
    <div className="space-y-6">
      {/* Selector de Modo */}
      <div className="flex flex-wrap items-center justify-between gap-3 bg-slate-900/90 border border-slate-800 p-3 rounded-2xl shadow-md">
        <div className="flex items-center gap-2">
          <button
            onClick={() => setActiveTab("analisis")}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-mono font-medium transition-colors ${
              activeTab === "analisis"
                ? "bg-amber-600 text-white shadow-sm"
                : "text-slate-400 hover:text-slate-200 bg-slate-800/60"
            }`}
          >
            <FileText className="w-3.5 h-3.5" />
            <span>Modo Análisis (Encontrar Flujo)</span>
          </button>

          <button
            onClick={() => setActiveTab("creacion")}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-mono font-medium transition-colors ${
              activeTab === "creacion"
                ? "bg-purple-600 text-white shadow-sm"
                : "text-slate-400 hover:text-slate-200 bg-slate-800/60"
            }`}
          >
            <Compass className="w-3.5 h-3.5" />
            <span>Modo Creación (Bucle & Síntesis)</span>
          </button>
        </div>

        <div className="flex items-center gap-2 text-xs font-mono">
          <button
            onClick={handleResetToSample}
            className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs border border-slate-700 transition-colors"
          >
            <RotateCcw className="w-3 h-3" />
            <span>Cargar Muestra 12D</span>
          </button>
        </div>
      </div>

      {/* Contenido según Modo Activo */}
      {activeTab === "analisis" && (
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-xl space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Upload className="w-4 h-4 text-amber-400" />
              <h3 className="text-xs font-semibold text-slate-200 uppercase tracking-wider font-mono">
                Ingestión de Manuscrito (.txt, .md, .pdf) & Calibración del Tensor
              </h3>
            </div>
            <label className="cursor-pointer px-3 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-mono border border-slate-700 transition-colors">
              <span>Subir Archivo</span>
              <input
                type="file"
                accept=".txt,.md,.text"
                onChange={handleFileUpload}
                className="hidden"
              />
            </label>
          </div>

          <textarea
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            placeholder="Pega aquí tu novela, guion, cuento o ensayo para descomponer su flujo fractal en 7 dimensiones..."
            rows={5}
            className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-xs text-slate-200 font-serif leading-relaxed outline-none focus:border-amber-500 transition-colors"
          />

          {/* Opciones de Calibración: Telos, Contexto y Personaje Foco */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs font-mono">
            <div>
              <label className="text-slate-400 text-[11px] block mb-1">
                Telos / Efecto deseado:
              </label>
              <select
                value={telosDeclarado}
                onChange={(e) => setTelosDeclarado(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2 text-xs text-slate-200 outline-none"
              >
                <option value="Generar">Generar (Catarsis emocional)</option>
                <option value="Mostrar">Mostrar (Epifanía / Revelación)</option>
                <option value="Explicar">Explicar (Comprensión dialéctica)</option>
                <option value="Describir">Describir (Inmersión sensible)</option>
              </select>
            </div>

            <div>
              <label className="text-slate-400 text-[11px] block mb-1">
                Personaje Foco (opcional):
              </label>
              <input
                type="text"
                value={personajeFoco}
                onChange={(e) => setPersonajeFoco(e.target.value)}
                placeholder="Ej. El Protagonista, Neo, Irina..."
                className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2 text-xs text-slate-200 outline-none"
              />
            </div>

            <div>
              <label className="text-slate-400 text-[11px] block mb-1">
                Contexto / Tensión preliminar:
              </label>
              <input
                type="text"
                value={contextoExtra}
                onChange={(e) => setContextoExtra(e.target.value)}
                placeholder="Ej. Obra inconclusa, búsqueda de redención..."
                className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2 text-xs text-slate-200 outline-none"
              />
            </div>
          </div>

          <div className="flex items-center justify-between pt-2">
            <div className="text-[11px] text-slate-400 font-mono">
              El análisis extrae las 7 coordenadas discretas $n = (s, c, a, p, \delta, \iota, d)$ e ilumina el Mándala en tiempo real.
            </div>
            <button
              onClick={handleRunAnalysis}
              disabled={isAnalyzing || !inputText.trim()}
              className="flex items-center gap-1.5 px-4 py-2 rounded-lg bg-amber-600 hover:bg-amber-500 disabled:opacity-50 text-white text-xs font-semibold font-mono transition-colors shadow-sm"
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>{isAnalyzing ? "Analizando Flujo..." : "Encontrar Flujo"}</span>
            </button>
          </div>
        </div>
      )}

      {/* Resumen de Comparación: Intención Declarada vs. Flujo Manifestado */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs font-mono">
        <div className="bg-slate-900 p-3 rounded-xl border border-slate-800 space-y-1">
          <span className="text-slate-500 text-[10px] block">Intención Declarada</span>
          <span className="font-bold text-amber-300 text-sm">{telosDeclarado}</span>
        </div>

        <div className="bg-slate-900 p-3 rounded-xl border border-slate-800 space-y-1">
          <span className="text-slate-500 text-[10px] block">Flujo Manifestado</span>
          <span className="font-bold text-sky-300 text-sm">{telosManifestado}</span>
        </div>

        <div className="bg-slate-900 p-3 rounded-xl border border-slate-800 space-y-1">
          <span className="text-slate-500 text-[10px] block">Tipo de Cierre</span>
          <span className="font-bold text-emerald-300 text-sm capitalize">{cierre}</span>
        </div>

        <div className="bg-slate-900 p-3 rounded-xl border border-slate-800 space-y-1">
          <span className="text-slate-500 text-[10px] block">Atractor Terminal</span>
          <span className="font-bold text-purple-300 text-xs truncate block" title={atractor}>
            {atractor}
          </span>
        </div>
      </div>

      {/* Disposición Principal: Mándala a la izquierda, Gráfico de Pulso e Inspector a la derecha */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Columna Izquierda: Mándala Fractal (5 cols) */}
        <div className="lg:col-span-5 space-y-4">
          <NarrativeMandala
            nodos={nodos}
            causalTensor={causalTensor}
            selectedNodeId={selectedNode?.id || null}
            onSelectNode={setSelectedNode}
            highlightedPair={highlightedPair}
            onClearHighlight={() => setHighlightedPair(null)}
          />

          {/* Inspector de Nodo Seleccionado */}
          {selectedNode && (
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 shadow-xl space-y-3 font-mono text-xs">
              <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                <span className="text-amber-400 font-bold text-sm">
                  Escena #{selectedNode.i} · Detalle de Fase
                </span>
                <span className="px-2 py-0.5 rounded bg-slate-800 text-slate-300 text-[10px]">
                  {selectedNode.estadoInercia} (Δ = {selectedNode.D.toFixed(3)})
                </span>
              </div>

              <p className="text-slate-200 font-serif leading-relaxed text-xs">
                "{selectedNode.resumen}"
              </p>

              <div className="grid grid-cols-2 gap-2 text-[11px] pt-1 text-slate-300">
                <div>Estación s: <strong className="text-white">{ESTACIONES_HEROE[selectedNode.s]}</strong></div>
                <div>Plano c: <strong className="text-white">{PLANOS_DRAMATURGICOS[selectedNode.c]}</strong></div>
                <div>Arquetipo a: <strong className="text-white">{ARQUETIPOS_FUNCIONALES[selectedNode.a]}</strong></div>
                <div>Polaridad: <strong className="text-white">{selectedNode.p > 0 ? "Activo (+1)" : "Receptivo (-1)"}</strong></div>
                <div>Carga Polar q: <strong className="text-white">{selectedNode.q.toFixed(2)}</strong></div>
                <div>Tensión T: <strong className="text-white">{selectedNode.T.toFixed(3)}</strong></div>
                <div>Progresión t: <strong className="text-white">{(selectedNode.t * 100).toFixed(1)}%</strong></div>
                <div>Dimensión D: <strong className="text-white">{selectedNode.D_dim || 4}D</strong></div>
              </div>
            </div>
          )}
        </div>

        {/* Columna Derecha: Gráfico de Pulso, Tensores y Proyección (7 cols) */}
        <div className="lg:col-span-7 space-y-5">
          <DramaticPulseChart
            nodos={nodos}
            highlightedPair={highlightedPair}
            onSelectNode={setSelectedNode}
          />

          <CausalTensorPanel
            nodos={nodos}
            tensor={causalTensor}
            onHighlightPair={setHighlightedPair}
          />

          {/* Motor de Decisión & Medición Polar de la IA */}
          <PolarityDecisionEngine
            nodos={nodos}
            atractor={atractor}
            onApplyDecision={handleApplyDecision}
          />

          {activeTab === "creacion" ? (
            <div className="space-y-5">
              <FourProjectionRadar />
              <DialecticSynthesisPanel nodos={nodos} />
            </div>
          ) : (
            <SocraticChat
              nodos={nodos}
              telos={telosDeclarado}
              atractor={atractor}
              cierre={cierre}
              fourProjection={fourProjection}
              groqApiKey={groqApiKey}
              onOpenGroqModal={onOpenGroqModal}
            />
          )}
        </div>
      </div>

      {/* Tabla Completa de Escenas y Fuerzas */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 shadow-xl space-y-3">
        <h4 className="text-xs font-semibold text-slate-200 uppercase tracking-wider font-mono">
          Matriz de Escenas y Fuerzas del Manuscrito ({nodos.length} Nodos)
        </h4>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs font-mono border-collapse">
            <thead>
              <tr className="border-b border-slate-800 text-slate-400 text-[11px]">
                <th className="p-2">#</th>
                <th className="p-2">Escena / Acontecimiento</th>
                <th className="p-2">Estación (s)</th>
                <th className="p-2">Plano (c)</th>
                <th className="p-2">Arquetipo (a)</th>
                <th className="p-2">Polaridad (p, ι)</th>
                <th className="p-2">Tensión (T)</th>
                <th className="p-2">Inercia (Δ)</th>
              </tr>
            </thead>
            <tbody>
              {nodos.map((n) => (
                <tr
                  key={n.id}
                  onClick={() => setSelectedNode(n)}
                  className={`border-b border-slate-800/60 hover:bg-slate-800/50 cursor-pointer transition-colors ${
                    selectedNode?.id === n.id ? "bg-slate-800/80 text-amber-200" : "text-slate-300"
                  }`}
                >
                  <td className="p-2 font-bold">{n.i}</td>
                  <td className="p-2 font-serif text-slate-200 max-w-xs truncate">{n.resumen}</td>
                  <td className="p-2 text-slate-400">{n.s} ({ESTACIONES_HEROE[n.s].split(". ")[1]?.slice(0, 10)})</td>
                  <td className="p-2">
                    <span className="flex items-center gap-1.5">
                      <span className="w-2 h-2 rounded-full" style={{ backgroundColor: PLANO_COLORS[n.c] }} />
                      <span>{PLANOS_DRAMATURGICOS[n.c].split(" / ")[0]}</span>
                    </span>
                  </td>
                  <td className="p-2 text-slate-400 truncate max-w-[120px]">{ARQUETIPOS_FUNCIONALES[n.a].split(". ")[1]}</td>
                  <td className="p-2">
                    <span className={n.p > 0 ? "text-amber-400" : "text-sky-400"}>
                      {n.p > 0 ? "Activo" : "Receptivo"} ({n.q.toFixed(2)})
                    </span>
                  </td>
                  <td className="p-2 text-slate-200 font-bold">{n.T.toFixed(3)}</td>
                  <td className="p-2 text-slate-400">
                    <span className={n.D > 0.12 ? "text-amber-300" : "text-emerald-300"}>
                      {n.estadoInercia} ({n.D.toFixed(3)})
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
