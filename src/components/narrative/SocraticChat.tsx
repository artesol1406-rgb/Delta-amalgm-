import React, { useState, useRef, useEffect } from "react";
import { NarrativeNode, FourProjectionResult } from "../../narrative/types";
import { MessageSquare, Send, Bot, User, Sparkles, HelpCircle, RefreshCw, Zap } from "lucide-react";

interface SocraticMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: string;
  isStreaming?: boolean;
}

interface SocraticChatProps {
  nodos: NarrativeNode[];
  telos: string;
  atractor: string;
  cierre: string;
  fourProjection: FourProjectionResult;
  groqApiKey: string;
  onOpenGroqModal?: () => void;
}

export const SocraticChat: React.FC<SocraticChatProps> = ({
  nodos,
  telos,
  atractor,
  cierre,
  fourProjection,
  groqApiKey,
  onOpenGroqModal,
}) => {
  const [messages, setMessages] = useState<SocraticMessage[]>([
    {
      id: "soc-1",
      role: "assistant",
      content:
        "Bienvenido al Espejo Socrático. Mi rol no es juzgar tu historia como 'buena' o 'mala', sino contrastar tu intención declarada con las coordenadas y tensiones reales del flujo narrativo. " +
        `Actualmente observo ${nodos.length} escenas, con tendencia a cierre ${cierre || "no definido"} y atractor '${atractor || "en proceso"}'. ` +
        "¿Qué tensión suspendida o conflicto polar deseas examinar?",
      timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
    },
  ]);

  const [inputVal, setInputVal] = useState<string>("");
  const [isSending, setIsSending] = useState<boolean>(false);
  const [provider, setProvider] = useState<"groq" | "gemini">("groq");
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSendMessage = async (textToSend?: string) => {
    const text = (textToSend || inputVal).trim();
    if (!text || isSending) return;

    if (provider === "groq" && !groqApiKey && onOpenGroqModal) {
      onOpenGroqModal();
      return;
    }

    const userMsg: SocraticMessage = {
      id: `user-${Date.now()}`,
      role: "user",
      content: text,
      timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
    };

    const newHistory = [...messages, userMsg];
    setMessages(newHistory);
    setInputVal("");
    setIsSending(true);

    const botMsgId = `bot-${Date.now()}`;
    const initialBotMsg: SocraticMessage = {
      id: botMsgId,
      role: "assistant",
      content: "",
      timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
      isStreaming: true,
    };

    setMessages((prev) => [...prev, initialBotMsg]);

    try {
      const response = await fetch("/api/narrative/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: newHistory.map((m) => ({ role: m.role, content: m.content })),
          context: {
            escenasCount: nodos.length,
            escenasResumen: nodos.slice(0, 15).map((n) => `[#${n.i} est=${n.s}, c=${n.c}, a=${n.a}, q=${n.q.toFixed(2)}, T=${n.T.toFixed(2)}] ${n.resumen}`),
            telos,
            atractor,
            cierre,
            cuatroProyeccionPesos: fourProjection.weights,
          },
          provider,
          groqApiKey,
        }),
      });

      const data = await response.json();
      setMessages((prev) =>
        prev.map((m) =>
          m.id === botMsgId
            ? {
                ...m,
                content: data.reply || "Sin respuesta del Espejo Socrático.",
                isStreaming: false,
              }
            : m
        )
      );
    } catch (err: any) {
      setMessages((prev) =>
        prev.map((m) =>
          m.id === botMsgId
            ? {
                ...m,
                content: `Error al conectar con el Espejo Socrático: ${err.message}`,
                isStreaming: false,
              }
            : m
        )
      );
    } finally {
      setIsSending(false);
    }
  };

  const handleDemandaOpciones = () => {
    const promptOpciones = `¿Qué opciones tengo para resolver o continuar la historia en este punto? Presenta las cuatro rutas extremas (activa, receptiva, dinámica, estática) con sus pesos: Activo: ${fourProjection.weights[0].toFixed(1)}%, Receptivo: ${fourProjection.weights[1].toFixed(1)}%, Dinámico: ${fourProjection.weights[2].toFixed(1)}%, Estático: ${fourProjection.weights[3].toFixed(1)}%.`;
    handleSendMessage(promptOpciones);
  };

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 shadow-xl flex flex-col h-[480px]">
      {/* Header */}
      <div className="border-b border-slate-800 pb-3 flex items-center justify-between flex-wrap gap-2">
        <div className="flex items-center gap-2">
          <MessageSquare className="w-4 h-4 text-purple-400" />
          <div>
            <h3 className="text-xs font-semibold text-slate-200 uppercase tracking-wider font-mono">
              Chat Socrático (Espejo No Intervencionista)
            </h3>
            <p className="text-[10px] text-slate-500 font-mono">
              Sin juicios de valor · Contraste intención vs. efecto · Preguntas mayéuticas
            </p>
          </div>
        </div>

        {/* Engine switcher */}
        <div className="flex items-center bg-slate-950 border border-slate-800 rounded-lg p-0.5 text-[10px] font-mono">
          <button
            onClick={() => setProvider("groq")}
            className={`flex items-center gap-1 px-2 py-0.5 rounded transition-colors ${
              provider === "groq"
                ? "bg-amber-500/20 text-amber-300 font-semibold border border-amber-500/40"
                : "text-slate-400 hover:text-slate-200"
            }`}
          >
            <Zap className="w-3 h-3 text-amber-400" />
            <span>Groq 120b</span>
          </button>
          <button
            onClick={() => setProvider("gemini")}
            className={`flex items-center gap-1 px-2 py-0.5 rounded transition-colors ${
              provider === "gemini"
                ? "bg-purple-900/50 text-purple-300 font-semibold border border-purple-700/60"
                : "text-slate-400 hover:text-slate-200"
            }`}
          >
            <Sparkles className="w-3 h-3 text-purple-400" />
            <span>Gemini</span>
          </button>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-3 space-y-3 bg-slate-950/60 rounded-xl my-3 text-xs leading-relaxed">
        {messages.map((m) => {
          const isUser = m.role === "user";
          return (
            <div
              key={m.id}
              className={`flex gap-2.5 ${isUser ? "justify-end" : "justify-start"}`}
            >
              {!isUser && (
                <div className="w-6 h-6 rounded-full bg-purple-950 border border-purple-800 flex items-center justify-center shrink-0 mt-0.5">
                  <Bot className="w-3.5 h-3.5 text-purple-300" />
                </div>
              )}
              <div
                className={`max-w-[85%] rounded-lg p-2.5 shadow-sm ${
                  isUser
                    ? "bg-sky-950/80 border border-sky-800 text-sky-100 rounded-tr-none font-sans"
                    : "bg-slate-900 border border-slate-800 text-slate-200 rounded-tl-none font-serif"
                }`}
              >
                <div className="whitespace-pre-wrap">{m.content}</div>
                <div className="mt-1 text-[9px] text-slate-500 font-mono text-right">
                  {m.timestamp}
                </div>
              </div>
              {isUser && (
                <div className="w-6 h-6 rounded-full bg-sky-950 border border-sky-800 flex items-center justify-center shrink-0 mt-0.5">
                  <User className="w-3.5 h-3.5 text-sky-300" />
                </div>
              )}
            </div>
          );
        })}
        {isSending && (
          <div className="flex gap-2 items-center text-xs text-purple-400 font-mono">
            <RefreshCw className="w-3 h-3 animate-spin" />
            <span>El Espejo Socrático está procesando la tensión dramática...</span>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Quick Socratic triggers */}
      <div className="flex items-center gap-2 mb-2">
        <button
          type="button"
          onClick={handleDemandaOpciones}
          disabled={isSending}
          className="flex items-center gap-1.5 px-3 py-1 rounded-lg bg-amber-500/10 hover:bg-amber-500/20 text-amber-300 border border-amber-500/30 text-xs font-mono transition-colors"
        >
          <HelpCircle className="w-3 h-3 text-amber-400" />
          <span>¿Qué opciones tengo? (Cuatro-Proyección)</span>
        </button>
      </div>

      {/* Input */}
      <form
        onSubmit={(e) => {
          e.preventDefault();
          handleSendMessage();
        }}
        className="flex items-center gap-2"
      >
        <input
          type="text"
          value={inputVal}
          onChange={(e) => setInputVal(e.target.value)}
          placeholder="Plantea un dilema narrativo, un giro o pregunta por la coherencia..."
          disabled={isSending}
          className="flex-1 bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-slate-200 outline-none focus:border-purple-500 transition-colors"
        />
        <button
          type="submit"
          disabled={!inputVal.trim() || isSending}
          className="px-3.5 py-2 rounded-lg bg-purple-600 hover:bg-purple-500 disabled:opacity-50 text-white text-xs font-medium flex items-center gap-1 transition-colors"
        >
          <Send className="w-3.5 h-3.5" />
          <span>Enviar</span>
        </button>
      </form>
    </div>
  );
};
