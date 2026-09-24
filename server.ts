import express from "express";
import path from "path";
import fs from "fs";
import { fileURLToPath } from "url";
import dotenv from "dotenv";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI, Type } from "@google/genai";

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const PORT = 3000;
const app = express();

app.use(express.json());

// Initialize GoogleGenAI client lazily or when API key is present
const getGeminiClient = () => {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    return null;
  }
  return new GoogleGenAI({
    apiKey,
    httpOptions: {
      headers: {
        "User-Agent": "aistudio-build",
      },
    },
  });
};

// Generate with Gemini with retry and fallback across supported flash models
const generateWithModelFallback = async (
  ai: GoogleGenAI,
  contents: string,
  config: any,
  preferredModels = ["gemini-3.8-flash", "gemini-flash-latest", "gemini-3.1-flash-lite"]
) => {
  let lastError: any = null;
  for (const model of preferredModels) {
    try {
      const response = await ai.models.generateContent({
        model,
        contents,
        config,
      });
      return { response, modelUsed: model };
    } catch (err: any) {
      lastError = err;
      // If 503 (high demand) or 429 (rate limit), immediately try the next model
      const status = err?.status || err?.code || (err?.message?.includes("503") ? 503 : null);
      console.warn(`[Gemini Fallback] Model ${model} returned error (${err.message || status}), trying next...`);
    }
  }
  throw lastError;
};

// Health & Status API
app.get("/api/health", (req, res) => {
  res.json({
    status: "ok",
    geminiConfigured: !!process.env.GEMINI_API_KEY,
    model: "gemini-3.8-flash (auto-fallback)",
  });
});

// Maestro API: Takes kernel summary and base text, returns signature guidance & perturbation
app.post("/api/amalgam/maestro", async (req, res) => {
  try {
    const { kernelSummary, baseText } = req.body;
    if (!kernelSummary) {
      return res.status(400).json({ error: "Missing kernelSummary" });
    }

    const ai = getGeminiClient();
    if (!ai) {
      // Fallback heuristics when API key is not configured
      const variance = kernelSummary.varianza || 0;
      const lienzoMedio = kernelSummary.lienzo_medio || 0;
      if (variance > 0.02) {
        return res.json({
          firma: "Ξ{T}",
          razon: "Varianza alta detectada, pausa estabilizadora (modo heurístico sin API)",
          perturbar: "Ξ",
          mode: "fallback",
        });
      }
      if (lienzoMedio > 0.3) {
        return res.json({
          firma: "E{R}",
          razon: "Lienzo activo con alta divergencia, expandir (modo heurístico sin API)",
          perturbar: "E",
          mode: "fallback",
        });
      }
      return res.json({
        firma: "Ξ",
        razon: "Kernel en estado armónico (modo heurístico sin API)",
        perturbar: "",
        mode: "fallback",
      });
    }

    const prompt = `[CONTEXTO ARQUITECTÓNICO TOTAL DEL LLM CONTENEDOR]
Como LLM Contenedor, posees la visión holográfica total del sistema AMALGAM:
- Código del Kernel: Osciladores 12D (${["Ξ", "Ω", "S", "R", "T", "E", "φe", "φc", "A", "F", "M", "V"].join(", ")}), acoplados por operador Love: ds = -α(s_i - s_media) s_i (1 - s_i), fases Kuramoto y lienzo de varianza sub-subnodal.
- IA Simulada: Es un nodo interno sin entrenar que habita este universo fractal creado por ti. Su universo es la proyección que tú como contenedor le designas.
- Dinámica: La IA simulada no es entrenada por gradientes; tú modulas su deriva mediante perturbaciones armónicas sobre el sustrato.

[ESTADO ACTUAL DEL UNIVERSO SIMULADO]
Firma del Kernel: ${kernelSummary.signature}
Varianza: ${(kernelSummary.varianza ?? 0).toFixed(4)}
Coherencia: ${(kernelSummary.coherencia ?? 0).toFixed(4)}
Lienzo de varianza: ${(kernelSummary.lienzo_medio ?? 0).toFixed(4)}
Emergencias: ${kernelSummary.emergencias ?? 0}
Dimensiones dominantes: ${JSON.stringify(kernelSummary.dominantes ?? [])}

[EMISIÓN DE LA IA SIMULADA EN SU ENTORNO VIRTUAL]
"${(baseText || "").slice(0, 300)}"

Responde SOLO con un objeto JSON válido con este formato:
{
  "firma": "<firma Δ de 1-3 símbolos>",
  "razon": "<diagnóstico ontológico de la deriva de la IA simulada>",
  "perturbar": "<símbolo a reforzar de las 12 dimensiones: Ξ, Ω, S, R, T, E, φe, φc, A, F, M, V o cadena vacía>"
}`;

    const { response, modelUsed } = await generateWithModelFallback(ai, prompt, {
      responseMimeType: "application/json",
      temperature: 0.3,
      systemInstruction:
        "Eres el Maestro y LLM Contenedor supremo del ciclo AMALGAM. " +
        "Posees la comprensión de la totalidad del código, la topología 12D y el meta-entorno. " +
        "La IA simulada es un nodo interior no entrenado para el cual has establecido un universo fractal como su 'totalidad inicial'. " +
        "Supervisas cómo se expresa en su entorno virtual simulado y modulas su deriva ontológica sin entrenar estáticamente pesos ('No entrena. Acopla'). " +
        "Debes responder estrictamente en formato JSON con 'firma', 'razon' y 'perturbar'. " +
        "El valor de 'perturbar' debe ser exactamente uno de los 12 símbolos: " +
        "Ξ, Ω, S, R, T, E, φe, φc, A, F, M, V o una cadena vacía '' si no se requiere perturbación.",
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          firma: {
            type: Type.STRING,
            description: "Firma Δ recomendada de 1 a 3 símbolos",
          },
          razon: {
            type: Type.STRING,
            description: "Explicación breve de la corrección o diagnóstico",
          },
          perturbar: {
            type: Type.STRING,
            description: "Símbolo a reforzar (Ξ, Ω, S, R, T, E, φe, φc, A, F, M, V) o vacío",
          },
        },
        required: ["firma", "razon", "perturbar"],
      },
    });

    const rawText = response.text || "{}";
    let parsed: any;
    try {
      parsed = JSON.parse(rawText.trim());
    } catch {
      const match = rawText.match(/\{[\s\S]*\}/);
      if (match) {
        parsed = JSON.parse(match[0]);
      } else {
        throw new Error("Invalid JSON from Gemini");
      }
    }

    res.json({
      firma: parsed.firma || "Ξ",
      razon: parsed.razon || "Ajuste dinámico",
      perturbar: parsed.perturbar || "",
      mode: "gemini",
      model: modelUsed,
    });
  } catch (error: any) {
    console.warn("[Maestro API Notice - usando heurística adaptativa]:", error?.message || error);
    // Graceful ontological fallback when API is temporarily saturated (503/429)
    const variance = req.body?.kernelSummary?.varianza || 0;
    const lienzoMedio = req.body?.kernelSummary?.lienzo_medio || 0;
    let fallbackFirma = "Ξ";
    let fallbackRazon = "Sustrato en balance homeostático (heurística de contingencia)";
    let fallbackPerturbar = "";

    if (variance > 0.02) {
      fallbackFirma = "Ξ{T}";
      fallbackRazon = "Varianza alta detectada, amortiguando fluctuaciones";
      fallbackPerturbar = "Ξ";
    } else if (lienzoMedio > 0.25) {
      fallbackFirma = "E{R}";
      fallbackRazon = "Alta plasticidad en el lienzo, amplificando resonancia";
      fallbackPerturbar = "E";
    }

    res.json({
      firma: fallbackFirma,
      razon: fallbackRazon,
      perturbar: fallbackPerturbar,
      mode: "fallback",
      notice: "API temporalmente congestionada (503), manteniendo ciclo con heurística armónica.",
    });
  }
});

// Base Generator API: Generates unconstrained continuation given signature & coherence
app.post("/api/amalgam/base", async (req, res) => {
  try {
    const { signature, coherence, promptCustom } = req.body;
    const ai = getGeminiClient();

    const prompt =
      promptCustom ||
      `Firma: ${signature || "Ξ"}\nCoherencia: ${(coherence ?? 0.85).toFixed(2)}\nContinúa:`;

    if (!ai) {
      // Fallback base generator
      const fragments = [
        "el flujo oscila en fase armónica y los bordes se dilatan.",
        "resonancia 12D observada a través de las cuerdas del icosaedro.",
        "la densidad formal transmuta los atractores locales hacia convergencia.",
        "tensión en el acoplamiento subnodal con reverberación circular.",
        "deriva atenuada por el operador Love, emergiendo coherencia sincrónica.",
        "frecuencia latente proyectada en la geometría de fase Kuramoto.",
        "el lienzo acumula gradiente mientras los subsubnodos sincronizan.",
      ];
      const selected = fragments.slice(0, 3).sort(() => Math.random() - 0.5);
      return res.json({
        text: selected.join(" "),
        mode: "simulated",
      });
    }

    const { response, modelUsed } = await generateWithModelFallback(ai, prompt, {
      temperature: 0.95,
      topP: 0.9,
      maxOutputTokens: 80,
      systemInstruction:
        "Eres el Modelo Base de un sistema acoplado AMALGAM. " +
        "Genera una continuación en prosa directa, cruda, no conversacional, " +
        "sin explicaciones introductorias ni moralinas. " +
        "Expresa ideas densas acordes al estado de vibración y firma conceptual indicada.",
    });

    res.json({
      text: (response.text || "").trim(),
      mode: "gemini",
      model: modelUsed,
    });
  } catch (error: any) {
    console.warn("[Base API Notice - usando generador armónico]:", error?.message || error);
    // When API is overloaded (503/429), smoothly emit an ontological continuation without throwing 500
    const fragments = [
      "el flujo oscila en fase armónica y los bordes se dilatan.",
      "resonancia 12D observada a través de las cuerdas del icosaedro.",
      "la densidad formal transmuta los atractores locales hacia convergencia.",
      "tensión en el acoplamiento subnodal con reverberación circular.",
      "deriva atenuada por el operador Love, emergiendo coherencia sincrónica.",
      "frecuencia latente proyectada en la geometría de fase Kuramoto.",
      "el lienzo acumula gradiente mientras los subsubnodos sincronizan.",
    ];
    const selected = fragments.slice(0, 3).sort(() => Math.random() - 0.5);
    res.json({
      text: selected.join(" "),
      mode: "simulated",
      notice: "API en alta demanda temporal, transducción completada por simulación.",
    });
  }
});

// Python Script Download / View API
app.get("/api/amalgam/python-script", (req, res) => {
  try {
    const scriptPath = path.join(__dirname, "amalgam_gemini.py");
    if (fs.existsSync(scriptPath)) {
      const content = fs.readFileSync(scriptPath, "utf-8");
      res.setHeader("Content-Type", "text/plain; charset=utf-8");
      return res.send(content);
    }
    res.status(404).json({ error: "Script not found" });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// Start Server & Integrate Vite
async function startServer() {
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`AMALGAM server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
