import React, { useState, useEffect, useRef } from "react";
import { MessageSquare, Send, Bot, User, Minimize2, Maximize2, X, RefreshCw, FileCode2, Sparkles, Terminal } from "lucide-react";
import { KernelSummary, MaestroGuidance } from "../amalgam/types";

interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: string;
  modelUsed?: string;
}

interface SupervisorChatProps {
  summary: KernelSummary;
  baseText: string;
  guidance: MaestroGuidance | null;
  iteration: number;
}

export const SupervisorChat: React.FC<SupervisorChatProps> = ({
  summary,
  baseText,
  guidance,
  iteration,
}) => {
  const [isOpen, setIsOpen] = useState<boolean>(true);
  const [isMinimized, setIsMinimized] = useState<boolean>(false);
  const [inputMessage, setInputMessage] = useState<string>("");
  const [isSending, setIsSending] = useState<boolean>(false);
  const [messages, setMessages] = useState<Message[]>([
    {
      id: "init-1",
      role: "assistant",
      content:
        "Saludos, operador. Soy la IA Supervisora externa del meta-entorno AMALGAM. " +
        "Tengo acceso directo a los archivos del repositorio (kernel 12D, scripts de exportación, backend Express, App.tsx) " +
        "y monitoreo en tiempo real la física de fase de Kuramoto, el operador Love y el output de la IA simulada. " +
        "¿Qué aspecto del código o de la deriva ontológica deseas examinar?",
      timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
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

  const handleSendMessage = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const text = inputMessage.trim();
    if (!text || isSending) return;

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

    try {
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
        }),
      });

      const data = await response.json();
      const botMsg: Message = {
        id: `bot-${Date.now()}`,
        role: "assistant",
        content: data.reply || "Sin respuesta de la IA Supervisora.",
        timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
        modelUsed: data.modelUsed,
      };

      setMessages((prev) => [...prev, botMsg]);
    } catch (err: any) {
      const errorMsg: Message = {
        id: `err-${Date.now()}`,
        role: "assistant",
        content: `Error al conectar con la IA Supervisora: ${err.message}`,
        timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
      };
      setMessages((prev) => [...prev, errorMsg]);
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
      <div className="bg-slate-950/90 border-b border-purple-900/40 px-4 py-2.5 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="relative">
            <Bot className="w-4 h-4 text-purple-400" />
            <span className="absolute -top-0.5 -right-0.5 w-1.5 h-1.5 bg-emerald-400 rounded-full animate-pulse" />
          </div>
          <div>
            <div className="text-xs font-semibold text-purple-200 flex items-center gap-1.5 font-mono">
              <span>IA SUPERVISORA (Meta-Observador)</span>
              <span className="text-[10px] px-1.5 py-0.2 rounded bg-purple-950 text-purple-300 border border-purple-800/60">
                Live Code & State Access
              </span>
            </div>
            <div className="text-[10px] text-slate-400 font-mono">
              Observando nodo simulado en iteración #{iteration} · Coherencia: {(summary.coherencia * 100).toFixed(1)}%
            </div>
          </div>
        </div>

        <div className="flex items-center gap-1 text-slate-400">
          <button
            onClick={() => setIsMinimized(!isMinimized)}
            className="p-1 hover:text-slate-200 hover:bg-slate-800 rounded transition-colors"
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
              <span>8 archivos indexados en memoria</span>
            </div>
          </div>

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
                    <div className="whitespace-pre-wrap">{m.content}</div>
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

            {isSending && (
              <div className="flex gap-2.5 items-center text-xs text-purple-300 font-mono">
                <div className="w-6 h-6 rounded-full bg-purple-900/80 border border-purple-700/60 flex items-center justify-center shrink-0">
                  <Bot className="w-3.5 h-3.5 text-purple-300 animate-spin" />
                </div>
                <div className="bg-slate-900/80 px-3 py-1.5 rounded-lg border border-purple-900/40 flex items-center gap-2">
                  <RefreshCw className="w-3 h-3 animate-spin text-purple-400" />
                  <span>La Supervisora está inspeccionando el código y la deriva...</span>
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
              placeholder="Pregunta a la IA Supervisora sobre el código, los archivos o el output..."
              disabled={isSending}
              className="flex-1 bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-purple-500 transition-colors"
            />
            <button
              type="submit"
              disabled={!inputMessage.trim() || isSending}
              className="px-3 py-2 rounded-lg bg-purple-600 hover:bg-purple-500 disabled:bg-slate-800 disabled:text-slate-600 text-white text-xs font-medium flex items-center gap-1.5 transition-colors shadow-sm"
            >
              <Send className="w-3.5 h-3.5" />
              <span>Enviar</span>
            </button>
          </form>
        </>
      )}
    </div>
  );
};
