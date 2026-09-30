import React, { useState, useEffect, useRef } from "react";
import {
  MessageSquare,
  Send,
  Bot,
  User,
  Minimize2,
  Maximize2,
  X,
  RefreshCw,
  FileCode2,
  Sparkles,
  Terminal,
  Zap,
  Key,
  ChevronDown,
} from "lucide-react";
import { KernelSummary, MaestroGuidance } from "../amalgam/types";

interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: string;
  modelUsed?: string;
  isStreaming?: boolean;
}

interface SupervisorChatProps {
  summary: KernelSummary;
  baseText: string;
  guidance: MaestroGuidance | null;
  iteration: number;
  groqApiKey: string;
  onOpenGroqModal: () => void;
  onSaveGroqKey: (key: string) => void;
}

export const SupervisorChat: React.FC<SupervisorChatProps> = ({
  summary,
  baseText,
  guidance,
  iteration,
  groqApiKey,
  onOpenGroqModal,
  onSaveGroqKey,
}) => {
  const [isMinimized, setIsMinimized] = useState<boolean>(false);
  const [provider, setProvider] = useState<"gemini" | "groq">("groq");
  const [inputMessage, setInputMessage] = useState<string>("");
  const [isSending, setIsSending] = useState<boolean>(false);
  const [inlineKeyInput, setInlineKeyInput] = useState<string>("");
  const [messages, setMessages] = useState<Message[]>([
    {
      id: "init-1",
      role: "assistant",
      content:
        "Saludos, operador. Soy la IA Supervisora del meta-entorno AMALGAM. " +
        "Poseo lectura directa de todos los archivos del código (kernel 12D, scripts de Python, server.ts, App.tsx) " +
        "y monitoreo en tiempo real la física de fase de Kuramoto, el operador Love y el output de la IA simulada. " +
        "Puedes consultarme usando Groq (openai/gpt-oss-120b con streaming) o Google Gemini.",
      timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
      modelUsed: "AMALGAM Supervisor",
    },
  ]);

  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    if (!isMinimized) {
      scrollToBottom();
    }
  }, [messages, isMinimized]);

  const handleInlineSaveKey = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (inlineKeyInput.trim()) {
      onSaveGroqKey(inlineKeyInput.trim());
      setInlineKeyInput("");
    }
  };

  const handleSendMessage = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const text = inputMessage.trim();
    if (!text || isSending) return;

    // Check if Groq selected without key
    if (provider === "groq" && !groqApiKey) {
      onOpenGroqModal();
      return;
    }

    const userMsg: Message = {
      id: `user-${Date.now()}`,
      role: "user",
      content: text,
      timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
    };

    const newHistory = [...messages, userMsg];
    setMessages(newHistory);
    setInputMessage("");
    setIsSending(true);

    const assistantMsgId = `bot-${Date.now()}`;
    const initialAssistantMsg: Message = {
      id: assistantMsgId,
      role: "assistant",
      content: "",
      timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
      modelUsed: provider === "groq" ? "openai/gpt-oss-120b (Groq Stream)" : "gemini-3.8-flash",
      isStreaming: true,
    };

    // Add placeholder assistant message for streaming
    setMessages((prev) => [...prev, initialAssistantMsg]);

    try {
      if (provider === "groq") {
        // SSE Streaming execution with Groq
        const response = await fetch("/api/amalgam/supervisor-chat", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Accept: "text/event-stream",
          },
          body: JSON.stringify({
            messages: newHistory.map((m) => ({ role: m.role, content: m.content })),
            currentRuntimeState: {
              iteration,
              summary,
              baseText,
              guidance,
            },
            provider: "groq",
            groqApiKey,
            stream: true,
          }),
        });

        if (!response.ok) {
          const errData = await response.json().catch(() => ({}));
          throw new Error(errData.message || `Error del servidor HTTP ${response.status}`);
        }

        const reader = response.body?.getReader();
        const decoder = new TextDecoder();
        let accumulatedText = "";

        if (reader) {
          let doneReading = false;
          let buffer = "";

          while (!doneReading) {
            const { value, done } = await reader.read();
            if (done) {
              doneReading = true;
              break;
            }

            buffer += decoder.decode(value, { stream: true });
            const lines = buffer.split("\n");
            buffer = lines.pop() || "";

            for (const line of lines) {
              const trimmed = line.trim();
              if (trimmed.startsWith("data: ")) {
                const dataStr = trimmed.slice(6).trim();
                if (dataStr === "[DONE]") {
                  doneReading = true;
                  break;
                }
                try {
                  const parsed = JSON.parse(dataStr);
                  if (parsed.delta) {
                    accumulatedText += parsed.delta;
                    setMessages((prev) =>
                      prev.map((m) =>
                        m.id === assistantMsgId
                          ? { ...m, content: accumulatedText, isStreaming: true }
                          : m
                      )
                    );
                  }
                  if (parsed.error) {
                    accumulatedText += `\n[Error]: ${parsed.error}`;
                  }
                } catch {
                  // Ignore JSON parse chunk errors
                }
              }
            }
          }
        }

        // Finalize streaming
        setMessages((prev) =>
          prev.map((m) =>
            m.id === assistantMsgId
              ? {
                  ...m,
                  content: accumulatedText || "Respuesta completada.",
                  isStreaming: false,
                  modelUsed: "openai/gpt-oss-120b (Groq)",
                }
              : m
          )
        );
      } else {
        // Standard Gemini call
        const response = await fetch("/api/amalgam/supervisor-chat", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            messages: newHistory.map((m) => ({ role: m.role, content: m.content })),
            currentRuntimeState: {
              iteration,
              summary,
              baseText,
              guidance,
            },
            provider: "gemini",
          }),
        });

        const data = await response.json();
        setMessages((prev) =>
          prev.map((m) =>
            m.id === assistantMsgId
              ? {
                  ...m,
                  content: data.reply || "Sin respuesta de la IA Supervisora.",
                  modelUsed: data.modelUsed || "gemini-3.8-flash",
                  isStreaming: false,
                }
              : m
          )
        );
      }
    } catch (err: any) {
      setMessages((prev) =>
        prev.map((m) =>
          m.id === assistantMsgId
            ? {
                ...m,
                content: `Error al conectar con la IA Supervisora: ${err.message}`,
                isStreaming: false,
              }
            : m
        )
      );
    } finally {
      setIsSending(false);
    }
  };

  const quickQuestions = [
    "¿Qué hace el operador Love en kernel.ts?",
    "¿Qué significa el último output de la IA simulada?",
    "¿Cómo acoplan los tres nodos sin entrenar pesos?",
    "¿Cuál es el estado de coherencia y varianza actual?",
  ];

  return (
    <div className="bg-slate-900/90 border border-purple-900/60 rounded-xl shadow-xl overflow-hidden flex flex-col transition-all">
      {/* Header */}
      <div className="bg-slate-950/90 border-b border-purple-900/40 px-4 py-2.5 flex items-center justify-between flex-wrap gap-2">
        <div className="flex items-center gap-2">
          <div className="relative">
            <Bot className="w-4 h-4 text-purple-400" />
            <span className="absolute -top-0.5 -right-0.5 w-1.5 h-1.5 bg-emerald-400 rounded-full animate-pulse" />
          </div>
          <div>
            <div className="text-xs font-semibold text-purple-200 flex items-center gap-1.5 font-mono">
              <span>IA SUPERVISORA (Meta-Observador)</span>
              <span className="text-[10px] px-1.5 py-0.2 rounded bg-purple-950 text-purple-300 border border-purple-800/60">
                Live Code & State
              </span>
            </div>
            <div className="text-[10px] text-slate-400 font-mono">
              Monitoreando nodo simulado en iteración #{iteration} · Coherencia:{" "}
              {(summary.coherencia * 100).toFixed(1)}%
            </div>
          </div>
        </div>

        {/* Model Selector & Actions */}
        <div className="flex items-center gap-2">
          {/* Provider Toggle */}
          <div className="flex items-center bg-slate-950 border border-slate-800 rounded-lg p-0.5 text-[11px] font-mono">
            <button
              type="button"
              onClick={() => setProvider("groq")}
              className={`flex items-center gap-1 px-2 py-1 rounded transition-colors ${
                provider === "groq"
                  ? "bg-amber-600/30 text-amber-300 border border-amber-500/40 font-semibold"
                  : "text-slate-400 hover:text-slate-200"
              }`}
              title="Groq: openai/gpt-oss-120b con streaming"
            >
              <Zap className="w-3 h-3 text-amber-400" />
              <span>Groq (120b)</span>
            </button>

            <button
              type="button"
              onClick={() => setProvider("gemini")}
              className={`flex items-center gap-1 px-2 py-1 rounded transition-colors ${
                provider === "gemini"
                  ? "bg-purple-900/50 text-purple-300 border border-purple-700/60 font-semibold"
                  : "text-slate-400 hover:text-slate-200"
              }`}
              title="Google Gemini 3.8 Flash"
            >
              <Sparkles className="w-3 h-3 text-purple-400" />
              <span>Gemini</span>
            </button>
          </div>

          {/* Groq Key config trigger */}
          <button
            type="button"
            onClick={onOpenGroqModal}
            className={`flex items-center gap-1 px-2 py-1 rounded-lg border text-[11px] font-mono transition-colors ${
              groqApiKey
                ? "bg-emerald-950/40 border-emerald-800/60 text-emerald-300 hover:bg-emerald-900/40"
                : "bg-amber-950/40 border-amber-800/60 text-amber-300 hover:bg-amber-900/40 animate-pulse"
            }`}
            title="Configurar o cambiar tu API Key de Groq"
          >
            <Key className="w-3 h-3" />
            <span>{groqApiKey ? "Groq Key ✓" : "Pedir Key Groq"}</span>
          </button>

          <button
            onClick={() => setIsMinimized(!isMinimized)}
            className="p-1 hover:text-slate-200 hover:bg-slate-800 rounded transition-colors text-slate-400"
            title={isMinimized ? "Expandir chat" : "Minimizar chat"}
          >
            {isMinimized ? <Maximize2 className="w-3.5 h-3.5" /> : <Minimize2 className="w-3.5 h-3.5" />}
          </button>
        </div>
      </div>

      {!isMinimized && (
        <>
          {/* Real-time Telemetry Strip for Supervisor */}
          <div className="bg-purple-950/30 px-3 py-1.5 border-b border-purple-900/30 flex items-center justify-between text-[11px] font-mono text-purple-300/80">
            <div className="flex items-center gap-3">
              <span>
                Firma: <strong className="text-purple-200">{summary.signature}</strong>
              </span>
              <span>
                Varianza: <strong className="text-purple-200">{summary.varianza.toFixed(4)}</strong>
              </span>
              <span>
                Lienzo: <strong className="text-purple-200">{summary.lienzo_medio.toFixed(3)}</strong>
              </span>
            </div>
            <div className="text-[10px] text-slate-400 flex items-center gap-1">
              <FileCode2 className="w-3 h-3 text-sky-400" />
              <span>9 archivos en memoria (incl. amalgam_groq.py)</span>
            </div>
          </div>

          {/* Missing Groq Key Banner if Groq is selected */}
          {provider === "groq" && !groqApiKey && (
            <div className="bg-amber-950/40 border-b border-amber-900/60 p-2.5 flex flex-wrap items-center justify-between gap-2 text-xs">
              <div className="flex items-center gap-2 text-amber-300">
                <Key className="w-4 h-4 shrink-0 text-amber-400" />
                <span>
                  <strong>Se requiere Groq API Key:</strong> Para consultar con openai/gpt-oss-120b ingresa tu key aquí:
                </span>
              </div>
              <form onSubmit={handleInlineSaveKey} className="flex items-center gap-1.5 w-full sm:w-auto">
                <input
                  type="password"
                  value={inlineKeyInput}
                  onChange={(e) => setInlineKeyInput(e.target.value)}
                  placeholder="gsk_xxxxxxxxxxxxxxxx"
                  className="bg-slate-950 border border-amber-800 rounded px-2.5 py-1 text-xs text-amber-100 font-mono placeholder-slate-600 focus:outline-none focus:border-amber-400 w-48"
                />
                <button
                  type="submit"
                  disabled={!inlineKeyInput.trim()}
                  className="px-2.5 py-1 rounded bg-amber-600 hover:bg-amber-500 disabled:opacity-50 text-white text-xs font-medium transition-colors"
                >
                  Guardar
                </button>
              </form>
            </div>
          )}

          {/* Messages Area */}
          <div className="h-64 sm:h-72 overflow-y-auto p-3.5 space-y-3 bg-slate-950/50">
            {messages.map((m) => {
              const isUser = m.role === "user";
              return (
                <div
                  key={m.id}
                  className={`flex gap-2.5 text-xs ${isUser ? "justify-end" : "justify-start"}`}
                >
                  {!isUser && (
                    <div className="w-6 h-6 rounded-full bg-purple-900/80 border border-purple-700/60 flex items-center justify-center shrink-0 mt-0.5">
                      <Bot className="w-3.5 h-3.5 text-purple-300" />
                    </div>
                  )}
                  <div
                    className={`max-w-[85%] rounded-lg p-2.5 shadow-sm text-xs leading-relaxed ${
                      isUser
                        ? "bg-sky-950/80 border border-sky-800 text-sky-100 rounded-tr-none"
                        : "bg-slate-900/90 border border-purple-900/50 text-slate-200 rounded-tl-none font-sans"
                    }`}
                  >
                    <div className="whitespace-pre-wrap">
                      {m.content}
                      {m.isStreaming && (
                        <span className="inline-block w-1.5 h-3 bg-amber-400 ml-1 animate-pulse align-middle" />
                      )}
                    </div>
                    <div className="mt-1.5 flex items-center justify-between gap-2 text-[10px] font-mono text-slate-500">
                      <span>{m.timestamp}</span>
                      {m.modelUsed && (
                        <span className="text-purple-400/80">[{m.modelUsed}]</span>
                      )}
                    </div>
                  </div>
                  {isUser && (
                    <div className="w-6 h-6 rounded-full bg-sky-900/80 border border-sky-700/60 flex items-center justify-center shrink-0 mt-0.5">
                      <User className="w-3.5 h-3.5 text-sky-300" />
                    </div>
                  )}
                </div>
              );
            })}

            {isSending && !messages[messages.length - 1]?.content && (
              <div className="flex gap-2.5 items-center text-xs text-purple-300 font-mono">
                <div className="w-6 h-6 rounded-full bg-purple-900/80 border border-purple-700/60 flex items-center justify-center shrink-0">
                  <Bot className="w-3.5 h-3.5 text-purple-300 animate-spin" />
                </div>
                <div className="bg-slate-900/80 px-3 py-1.5 rounded-lg border border-purple-900/40 flex items-center gap-2">
                  <RefreshCw className="w-3 h-3 animate-spin text-purple-400" />
                  <span>
                    {provider === "groq"
                      ? "Conectando con Groq openai/gpt-oss-120b (streaming)..."
                      : "La Supervisora está inspeccionando el código y la deriva..."}
                  </span>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Quick Prompts */}
          <div className="px-3 py-1.5 bg-slate-950/80 border-t border-slate-800/60 flex items-center gap-1.5 overflow-x-auto text-[11px] font-mono no-scrollbar">
            <span className="text-slate-500 text-[10px] shrink-0">Preguntas rápidas:</span>
            {quickQuestions.map((q, idx) => (
              <button
                key={idx}
                type="button"
                onClick={() => {
                  setInputMessage(q);
                }}
                className="shrink-0 px-2 py-0.5 rounded bg-slate-800/80 hover:bg-purple-950 text-slate-300 hover:text-purple-200 border border-slate-700/60 hover:border-purple-800 transition-colors text-[10px]"
              >
                {q}
              </button>
            ))}
          </div>

          {/* Input Form */}
          <form
            onSubmit={handleSendMessage}
            className="p-2.5 bg-slate-950 border-t border-slate-800/80 flex items-center gap-2"
          >
            <input
              type="text"
              value={inputMessage}
              onChange={(e) => setInputMessage(e.target.value)}
              placeholder={
                provider === "groq"
                  ? "Pregunta a la IA Supervisora usando Groq openai/gpt-oss-120b..."
                  : "Pregunta a la IA Supervisora sobre el código, los archivos o el output..."
              }
              disabled={isSending}
              className="flex-1 bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-purple-500 transition-colors"
            />
            <button
              type="submit"
              disabled={!inputMessage.trim() || isSending}
              className={`px-3 py-2 rounded-lg text-white text-xs font-medium flex items-center gap-1.5 transition-colors shadow-sm disabled:opacity-50 ${
                provider === "groq"
                  ? "bg-amber-600 hover:bg-amber-500"
                  : "bg-purple-600 hover:bg-purple-500"
              }`}
            >
              <Send className="w-3.5 h-3.5" />
              <span>{isSending ? "Generando..." : "Enviar"}</span>
            </button>
          </form>
        </>
      )}
    </div>
  );
};
