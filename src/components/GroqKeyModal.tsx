import React, { useState } from "react";
import { Key, Eye, EyeOff, Check, X, ExternalLink, Zap, Shield, AlertCircle } from "lucide-react";

interface GroqKeyModalProps {
  isOpen: boolean;
  onClose: () => void;
  apiKey: string;
  onSaveKey: (key: string) => void;
}

export const GroqKeyModal: React.FC<GroqKeyModalProps> = ({
  isOpen,
  onClose,
  apiKey,
  onSaveKey,
}) => {
  const [inputVal, setInputVal] = useState<string>(apiKey);
  const [showKey, setShowKey] = useState<boolean>(false);
  const [isVerifying, setIsVerifying] = useState<boolean>(false);
  const [verifyStatus, setVerifyStatus] = useState<{
    valid?: boolean;
    message?: string;
  } | null>(null);

  if (!isOpen) return null;

  const handleSave = () => {
    onSaveKey(inputVal.trim());
    onClose();
  };

  const handleTestKey = async () => {
    const keyToTest = inputVal.trim();
    if (!keyToTest) {
      setVerifyStatus({ valid: false, message: "Por favor ingresa una API Key" });
      return;
    }

    setIsVerifying(true);
    setVerifyStatus(null);
    try {
      const res = await fetch("/api/groq/verify-key", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ apiKey: keyToTest }),
      });
      const data = await res.json();
      if (res.ok && data.valid) {
        setVerifyStatus({
          valid: true,
          message: `Conexión exitosa con Groq. Modelo ${data.model} disponible.`,
        });
        onSaveKey(keyToTest);
      } else {
        setVerifyStatus({
          valid: false,
          message: data.error || "No se pudo validar la API Key con Groq",
        });
      }
    } catch (err: any) {
      setVerifyStatus({
        valid: false,
        message: err.message || "Error al verificar la clave",
      });
    } finally {
      setIsVerifying(false);
    }
  };

  const handleClear = () => {
    setInputVal("");
    onSaveKey("");
    setVerifyStatus(null);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-slate-900 border border-slate-700/80 rounded-2xl w-full max-w-lg shadow-2xl overflow-hidden flex flex-col">
        {/* Header */}
        <div className="bg-slate-950 px-6 py-4 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400">
              <Zap className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-semibold text-white flex items-center gap-2">
                <span>Configurar Groq API Key</span>
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-300 border border-amber-500/30 font-mono">
                  openai/gpt-oss-120b
                </span>
              </h3>
              <p className="text-xs text-slate-400">
                Inferencia ultrarrápida con reasoning_effort medium y streaming
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-4">
          <div className="bg-slate-950/60 rounded-xl p-3.5 border border-slate-800 text-xs text-slate-300 space-y-2">
            <div className="flex items-center gap-1.5 font-medium text-slate-200">
              <Shield className="w-3.5 h-3.5 text-emerald-400" />
              <span>Especificación activa de Groq:</span>
            </div>
            <div className="font-mono text-[11px] text-amber-300/90 bg-slate-900/90 p-2.5 rounded border border-slate-800/80 space-y-1">
              <div><strong>Model:</strong> openai/gpt-oss-120b</div>
              <div><strong>Tokens max:</strong> 2048 | <strong>Temp:</strong> 1 | <strong>Top-p:</strong> 1</div>
              <div><strong>Reasoning effort:</strong> medium | <strong>Stream:</strong> True</div>
            </div>
            <p className="text-[11px] text-slate-400 leading-relaxed">
              Tu clave se almacena de forma segura en tu navegador y se envía directamente al proxy backend para comunicarse con Groq.
            </p>
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1.5 font-mono">
              Groq API Key (gsk_...)
            </label>
            <div className="relative flex items-center">
              <div className="absolute left-3 text-slate-500">
                <Key className="w-4 h-4" />
              </div>
              <input
                type={showKey ? "text" : "password"}
                value={inputVal}
                onChange={(e) => setInputVal(e.target.value)}
                placeholder="gsk_xxxxxxxxxxxxxxxxxxxxxxxx"
                className="w-full bg-slate-950 border border-slate-700 rounded-lg pl-9 pr-20 py-2.5 text-xs text-slate-200 font-mono placeholder-slate-600 focus:outline-none focus:border-amber-500 transition-colors"
              />
              <button
                type="button"
                onClick={() => setShowKey(!showKey)}
                className="absolute right-2 px-2 py-1 text-slate-400 hover:text-slate-200 text-xs flex items-center gap-1"
              >
                {showKey ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                <span className="text-[10px]">{showKey ? "Ocultar" : "Ver"}</span>
              </button>
            </div>
          </div>

          {verifyStatus && (
            <div
              className={`p-3 rounded-lg text-xs flex items-start gap-2 border ${
                verifyStatus.valid
                  ? "bg-emerald-950/40 border-emerald-800 text-emerald-300"
                  : "bg-rose-950/40 border-rose-800 text-rose-300"
              }`}
            >
              {verifyStatus.valid ? (
                <Check className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
              ) : (
                <AlertCircle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
              )}
              <span className="leading-snug">{verifyStatus.message}</span>
            </div>
          )}

          <div className="flex items-center justify-between text-xs pt-1">
            <a
              href="https://console.groq.com/keys"
              target="_blank"
              rel="noopener noreferrer"
              className="text-amber-400 hover:text-amber-300 flex items-center gap-1 transition-colors font-mono"
            >
              <span>Obtener API Key en console.groq.com</span>
              <ExternalLink className="w-3 h-3" />
            </a>

            {inputVal && (
              <button
                type="button"
                onClick={handleClear}
                className="text-slate-500 hover:text-rose-400 text-xs transition-colors"
              >
                Eliminar key
              </button>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="bg-slate-950 px-6 py-3.5 border-t border-slate-800 flex items-center justify-end gap-2.5">
          <button
            type="button"
            onClick={handleTestKey}
            disabled={isVerifying || !inputVal.trim()}
            className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 text-xs font-medium transition-colors disabled:opacity-50"
          >
            {isVerifying ? "Verificando..." : "Probar Conexión"}
          </button>
          <button
            type="button"
            onClick={handleSave}
            className="px-4 py-1.5 rounded-lg bg-amber-600 hover:bg-amber-500 text-white text-xs font-medium transition-colors shadow-sm"
          >
            Guardar y Aplicar
          </button>
        </div>
      </div>
    </div>
  );
};
