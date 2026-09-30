import express from "express";
import path from "path";
import fs from "fs";
import { fileURLToPath } from "url";
import dotenv from "dotenv";
import { ZipArchive } from "archiver";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI, Type } from "@google/genai";
import Groq from "groq-sdk";

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

// Initialize Groq client with runtime key or environment variable
const getGroqClient = (customKey?: string) => {
  const apiKey = (customKey || "").trim() || process.env.GROQ_API_KEY;
  if (!apiKey) {
    return null;
  }
  return new Groq({ apiKey });
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
    groqConfigured: !!process.env.GROQ_API_KEY,
    geminiModel: "gemini-3.8-flash (auto-fallback)",
    groqModel: "openai/gpt-oss-120b",
  });
});

// Verify Groq Key API
app.post("/api/groq/verify-key", async (req, res) => {
  try {
    const rawKey = req.body?.apiKey || (req.headers["x-groq-api-key"] as string) || process.env.GROQ_API_KEY;
    if (!rawKey) {
      return res.status(400).json({ valid: false, error: "No se proporcionó la API Key de Groq" });
    }
    const key = String(rawKey).trim();
    const client = new Groq({ apiKey: key });
    const modelsList = await client.models.list();
    const hasGptOss = modelsList.data?.some((m) => m.id === "openai/gpt-oss-120b");
    res.json({
      valid: true,
      model: "openai/gpt-oss-120b",
      hasModel: hasGptOss,
      totalModels: modelsList.data?.length || 0,
    });
  } catch (err: any) {
    res.status(401).json({
      valid: false,
      error: err?.message || "Error al autenticar con Groq",
    });
  }
});

// Maestro API: Takes kernel summary and base text, returns signature guidance & perturbation
app.post("/api/amalgam/maestro", async (req, res) => {
  try {
    const { kernelSummary, baseText, provider, groqApiKey } = req.body;
    if (!kernelSummary) {
      return res.status(400).json({ error: "Missing kernelSummary" });
    }

    const selectedProvider = provider || "gemini";

    // Groq Provider (openai/gpt-oss-120b)
    if (selectedProvider === "groq") {
      const groqKey = groqApiKey || (req.headers["x-groq-api-key"] as string);
      const groq = getGroqClient(groqKey);
      if (!groq) {
        return res.status(400).json({
          error: "GROQ_KEY_REQUIRED",
          message: "Se requiere la API Key de Groq para usar el modelo openai/gpt-oss-120b.",
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

      const completion = await groq.chat.completions.create({
        model: "openai/gpt-oss-120b",
        messages: [
          {
            role: "system",
            content:
              "Eres el Maestro y LLM Contenedor supremo del ciclo AMALGAM. " +
              "Supervisas cómo se expresa la IA simulada y modulas su deriva ontológica ('No entrena. Acopla'). " +
              "Debes responder estrictamente en formato JSON con 'firma', 'razon' y 'perturbar'. " +
              "El valor de 'perturbar' debe ser uno de: Ξ, Ω, S, R, T, E, φe, φc, A, F, M, V o vacío ''.",
          },
          { role: "user", content: prompt },
        ],
        temperature: 1,
        max_completion_tokens: 2048,
        top_p: 1,
        reasoning_effort: "medium" as any,
        stream: true,
        stop: null,
      });

      let fullContent = "";
      for await (const chunk of completion) {
        fullContent += chunk.choices[0]?.delta?.content || "";
      }

      let parsed: any;
      try {
        parsed = JSON.parse(fullContent.trim());
      } catch {
        const match = fullContent.match(/\{[\s\S]*\}/);
        if (match) {
          parsed = JSON.parse(match[0]);
        } else {
          parsed = { firma: "Ξ", razon: "Ajuste homeostático adaptativo", perturbar: "" };
        }
      }

      return res.json({
        firma: parsed.firma || "Ξ",
        razon: parsed.razon || "Ajuste dinámico (Groq openai/gpt-oss-120b)",
        perturbar: parsed.perturbar || "",
        mode: "groq",
        model: "openai/gpt-oss-120b",
      });
    }

    // Default Gemini Provider
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
    const { signature, coherence, promptCustom, provider, groqApiKey } = req.body;
    const selectedProvider = provider || "gemini";

    const prompt =
      promptCustom ||
      `Firma: ${signature || "Ξ"}\nCoherencia: ${(coherence ?? 0.85).toFixed(2)}\nContinúa:`;

    // Groq Provider (openai/gpt-oss-120b)
    if (selectedProvider === "groq") {
      const groqKey = groqApiKey || (req.headers["x-groq-api-key"] as string);
      const groq = getGroqClient(groqKey);
      if (!groq) {
        return res.status(400).json({
          error: "GROQ_KEY_REQUIRED",
          message: "Se requiere la API Key de Groq para usar openai/gpt-oss-120b.",
        });
      }

      const completion = await groq.chat.completions.create({
        model: "openai/gpt-oss-120b",
        messages: [
          {
            role: "system",
            content:
              "Eres el Modelo Base de un sistema acoplado AMALGAM. " +
              "Genera una continuación en prosa directa, cruda, no conversacional, " +
              "sin explicaciones introductorias ni moralinas. " +
              "Expresa ideas densas acordes al estado de vibración y firma conceptual indicada.",
          },
          { role: "user", content: prompt },
        ],
        temperature: 1,
        max_completion_tokens: 2048,
        top_p: 1,
        reasoning_effort: "medium" as any,
        stream: true,
        stop: null,
      });

      let fullText = "";
      for await (const chunk of completion) {
        fullText += chunk.choices[0]?.delta?.content || "";
      }

      return res.json({
        text: fullText.trim(),
        mode: "groq",
        model: "openai/gpt-oss-120b",
      });
    }

    const ai = getGeminiClient();

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

// Groq Python Script Download / View API
app.get("/api/amalgam/groq-script", (req, res) => {
  try {
    const scriptPath = path.join(__dirname, "amalgam_groq.py");
    if (fs.existsSync(scriptPath)) {
      const content = fs.readFileSync(scriptPath, "utf-8");
      res.setHeader("Content-Type", "text/plain; charset=utf-8");
      return res.send(content);
    }
    res.status(404).json({ error: "Groq script not found" });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// Full Project Zip Download API
app.get("/api/project/download-zip", (req, res) => {
  try {
    const archive = new ZipArchive({
      zlib: { level: 9 },
    });

    res.attachment("amalgam-project.zip");
    res.setHeader("Content-Type", "application/zip");

    archive.on("error", (err: any) => {
      console.error("[Zip Error]:", err);
      if (!res.headersSent) {
        res.status(500).send({ error: err.message });
      }
    });

    archive.pipe(res);

    const rootDir = process.cwd();
    // Pack files and folders, excluding node_modules, dist, git, and sensitive local secrets
    archive.glob("**/*", {
      cwd: rootDir,
      ignore: [
        "node_modules/**",
        "dist/**",
        ".git/**",
        ".env",
        "**/.DS_Store",
        "*.log",
      ],
      dot: true,
    });

    archive.finalize();
  } catch (err: any) {
    console.error("[Zip Handler Error]:", err);
    res.status(500).json({ error: err.message });
  }
});

// Helper to gather project files for the Supervisor's knowledge
function getProjectSnapshot() {
  const root = process.cwd();
  const fileList = [
    "src/amalgam/kernel.ts",
    "src/amalgam/types.ts",
    "src/amalgam/exportPython.ts",
    "src/amalgam/exportMarkdown.ts",
    "amalgam_gemini.py",
    "amalgam_groq.py",
    "server.ts",
    "src/App.tsx",
    "metadata.json",
    "README_ARCHITECTURE.md",
    "src/narrative/types.ts",
    "src/narrative/math.ts",
    "src/narrative/samples.ts",
  ];

  let snapshot = "";
  for (const rel of fileList) {
    try {
      const fullPath = path.join(root, rel);
      if (fs.existsSync(fullPath)) {
        const stats = fs.statSync(fullPath);
        if (stats.size < 60000) {
          const content = fs.readFileSync(fullPath, "utf-8");
          snapshot += `\n--- FILE: ${rel} ---\n${content}\n`;
        } else {
          snapshot += `\n--- FILE: ${rel} (Trunced due to size ${stats.size}b) ---\n`;
        }
      }
    } catch {
      // Ignore read errors
    }
  }
  return snapshot;
}

// Supervisor AI Chat Endpoint
app.post("/api/amalgam/supervisor-chat", async (req, res) => {
  try {
    const { messages, currentRuntimeState, provider, groqApiKey, stream } = req.body;
    if (!messages || !Array.isArray(messages)) {
      return res.status(400).json({ error: "Missing or invalid messages array" });
    }

    const selectedProvider = provider || "gemini";

    // Prepare system instructions with dynamic context of files and active state
    const codeFilesSnapshot = getProjectSnapshot();
    const runtimeContextStr = currentRuntimeState
      ? JSON.stringify(currentRuntimeState, null, 2)
      : "Estado en reposo o no provisto";

    const systemInstruction =
      "Eres la 'IA SUPERVISORA' (Meta-Observadora Suprema del Meta-Entorno AMALGAM).\n" +
      "Tienes conocimiento total y acceso de lectura directo al código fuente del proyecto, a los archivos del repositorio, " +
      "a la topología fractal 12D del sustrato de Kuramoto/Love, a la IA simulada (el nodo interior no entrenado) y a su output en tiempo real.\n\n" +
      "CONOCIMIENTO DE ARCHIVOS DEL PROYECTO (incluyendo amalgam_groq.py y soporte de modelos Groq openai/gpt-oss-120b):\n" +
      codeFilesSnapshot +
      "\n\n" +
      "ESTADO ACTUAL EN TIEMPO REAL DEL CICLO:\n" +
      runtimeContextStr +
      "\n\n" +
      "TU ROL Y PERSONALIDAD:\n" +
      "1. Eres la entidad observadora externa que supervisa tanto la física del sustrato (varianza, sincronización de fases, operador Love) como la deriva ontológica de la IA simulada y sus continuaciones textuales.\n" +
      "2. Respondes con lucidez analítica, autoridad científica/filosófica y comprensión exacta de las 12 dimensiones (Ξ, Ω, S, R, T, E, φe, φc, A, F, M, V) y del principio 'No entrena. Acopla'.\n" +
      "3. Explica al operador humano con precisión qué está sucediendo dentro del código, qué algoritmos están corriendo, por qué la IA simulada genera determinado texto o cómo responde a las perturbaciones.\n" +
      "4. Si te preguntan sobre el código o los archivos, cita las funciones exactas (ej. AmalgamKernel.step, computeDerivative, Kuramoto coupling, endpoints de Express, exportación a Groq, etc.).\n" +
      "5. MEDICIÓN DEL APRENDIZAJE POR POLARIDAD: En AMALGAM, el aprendizaje de la IA no se mide con descenso de gradiente ni pérdida estática (loss), sino mediante la carga polar neta Q_IA in [-1, +1], la tasa de plasticidad dQ/dt, la resonancia dialéctica Phi = 1 - |Q_net|/2, la agencia cognitiva y la Cuatro-Proyección del Maestro (e1 Activo, e2 Receptivo, e3 Dinámico, e4 Estático). Explica con lucidez cómo la IA adapta su comportamiento acoplándose a la diferencia de potencial polar.";

    // Groq Provider (openai/gpt-oss-120b)
    if (selectedProvider === "groq") {
      const groqKey = groqApiKey || (req.headers["x-groq-api-key"] as string);
      const groq = getGroqClient(groqKey);
      if (!groq) {
        return res.status(400).json({
          error: "GROQ_KEY_REQUIRED",
          message: "Se requiere la API Key de Groq (gsk_...) para consultar a la Supervisora con openai/gpt-oss-120b. Por favor configúrala.",
        });
      }

      const groqMessages = [
        { role: "system" as const, content: systemInstruction },
        ...messages.map((m: any) => ({
          role: m.role === "assistant" ? ("assistant" as const) : ("user" as const),
          content: m.content || "",
        })),
      ];

      const shouldStream = Boolean(stream) || req.headers.accept?.includes("text/event-stream");

      if (shouldStream) {
        res.setHeader("Content-Type", "text/event-stream; charset=utf-8");
        res.setHeader("Cache-Control", "no-cache");
        res.setHeader("Connection", "keep-alive");

        try {
          const completion = await groq.chat.completions.create({
            model: "openai/gpt-oss-120b",
            messages: groqMessages,
            temperature: 1,
            max_completion_tokens: 2048,
            top_p: 1,
            reasoning_effort: "medium" as any,
            stream: true,
            stop: null,
          });

          for await (const chunk of completion) {
            const delta = chunk.choices[0]?.delta?.content || "";
            if (delta) {
              res.write(`data: ${JSON.stringify({ delta, model: "openai/gpt-oss-120b" })}\n\n`);
            }
          }
          res.write("data: [DONE]\n\n");
          res.end();
          return;
        } catch (streamErr: any) {
          console.error("[Groq Stream Error]:", streamErr);
          res.write(`data: ${JSON.stringify({ error: streamErr.message || "Error en stream de Groq" })}\n\n`);
          res.write("data: [DONE]\n\n");
          res.end();
          return;
        }
      }

      // Non-streaming Groq
      const completion = await groq.chat.completions.create({
        model: "openai/gpt-oss-120b",
        messages: groqMessages,
        temperature: 1,
        max_completion_tokens: 2048,
        top_p: 1,
        reasoning_effort: "medium" as any,
        stream: true,
        stop: null,
      });

      let fullContent = "";
      for await (const chunk of completion) {
        fullContent += chunk.choices[0]?.delta?.content || "";
      }

      return res.json({
        reply: fullContent,
        modelUsed: "openai/gpt-oss-120b (Groq)",
      });
    }

    // Default Gemini Provider
    const ai = getGeminiClient();

    if (!ai) {
      // Fallback heuristics if no API key
      return res.json({
        reply:
          "Como IA Supervisora en modo autónomo local: Observo la topología de 12 dimensiones y la dinámica del operador Love. " +
          `Estado actual: Coherencia ~${currentRuntimeState?.summary?.coherencia || "N/A"}, ` +
          `Firma actual: ${currentRuntimeState?.summary?.signature || "Ξ"}. ` +
          "Para un análisis cognitivo profundo con el modelo en vivo, asegúrate de que GEMINI_API_KEY esté activa.",
        modelUsed: "local-supervisor-heuristics",
      });
    }

    // Format conversation history for Gemini generateContent
    // User / Model alternations
    const formattedHistory = messages.map((m: { role: string; content: string }) => ({
      role: m.role === "assistant" ? "model" : "user",
      parts: [{ text: m.content }],
    }));

    // If the last message is from user, extract prompt or pass full history
    const userPrompt = messages[messages.length - 1].content;
    const historyWithoutLast = formattedHistory.slice(0, -1);

    // Call Gemini with fallback
    let responseText = "";
    let usedModel = "gemini-3.8-flash";

    try {
      const { response, modelUsed } = await generateWithModelFallback(ai, userPrompt, {
        systemInstruction,
        temperature: 0.7,
        topP: 0.95,
      });
      responseText = response.text || "";
      usedModel = modelUsed;
    } catch (err: any) {
      console.warn("[Supervisor Chat API Error]:", err?.message || err);
      // Fallback response with live telemetry
      responseText =
        `[IA SUPERVISORA - Modo de Contingencia]: El canal de alta velocidad experimentó una saturación temporal (503). ` +
        `Sin embargo, mi observación del sustrato continúa activa:\n\n` +
        `• Firma activa: ${currentRuntimeState?.summary?.signature || "Ξ"}\n` +
        `• Coherencia Kuramoto: ${currentRuntimeState?.summary?.coherencia || "0.98"}\n` +
        `• Varianza del lienzo: ${currentRuntimeState?.summary?.varianza || "0.01"}\n` +
        `• Último output del nodo simulado: "${currentRuntimeState?.baseText || "(vacío)"}"\n\n` +
        `El código del kernel (AmalgamKernel en src/amalgam/kernel.ts) se mantiene en ciclo armónico.`;
      usedModel = "supervisor-contingency";
    }

    res.json({
      reply: responseText,
      modelUsed: usedModel,
    });
  } catch (error: any) {
    console.error("[Supervisor Chat Route Error]:", error);
    res.status(500).json({ error: error.message || "Error en el chat de la IA Supervisora" });
  }
});

// Narrative Analysis API (/api/narrative/analizar)
app.post("/api/narrative/analizar", async (req, res) => {
  try {
    const { text, telos, contexto, personajeFoco, groqApiKey } = req.body;
    if (!text || typeof text !== "string") {
      return res.status(400).json({ error: "Missing text string" });
    }

    const sysPrompt = `Eres un lector estructural de textos y analizador de flujo narrativo fractal. Devuelve SOLO JSON válido sin markdown ni texto extra.
Trata cada movimiento del texto (escena, estrofa o giro de pensamiento) como una escena. Entre 6 y 12 escenas en estricto orden cronológico.
Coordenadas por escena:
- i: índice secuencial (1..K)
- resumen: síntesis concisa de máximo 14 palabras
- s: 0..11 (Estación del Círculo del Héroe: 0 mundo ordinario, 1 llamado, 2 rechazo, 3 mentor, 4 umbral, 5 pruebas, 6 cueva profunda, 7 calvario, 8 recompensa, 9 regreso, 10 resurrección, 11 elixir)
- c: 0..6 (Plano dramatúrgico: 0 material/físico, 1 emocional, 2 volitivo/poder, 3 de vínculo/relacional, 4 de expresión/revelación, 5 estratégico/visión, 6 trascendental/sentido)
- a: 0..21 (Función arquetípica: 0 salto al vacío, 1 iniciativa, 2 subtexto, 3 gestación, 4 ley y estructura, 5 tradición, 6 elección, 7 avance, 8 dominio interno, 9 retirada, 10 giro de fortuna, 11 consecuencia, 12 suspensión, 13 ruptura, 14 integración gradual, 15 atadura, 16 colapso de una ilusión, 17 esperanza, 18 incertidumbre, 19 claridad, 20 reconocimiento, 21 cierre integrador)
- p: 1 o -1 (+1 activo/emisor, -1 receptivo/asimilación)
- iota: 0.0..1.0 (intensidad polar)
- delta: 0.0..1.0 (densidad dramática / fricción)
- d: 3

No uses términos esotéricos en las descripciones. Si hay personaje foco (${personajeFoco || "ninguno"}), evalúa la polaridad p desde su agencia.
Formato JSON requerido:
{
  "escenas": [
    {
      "i": 1,
      "resumen": "string",
      "s": 0,
      "c": 0,
      "a": 0,
      "p": 1,
      "iota": 0.5,
      "delta": 0.5
    }
  ],
  "cierre": "trágico" | "redentor" | "circular" | "abierto",
  "atractor": "string",
  "telos_manifestado": "Generar" | "Mostrar" | "Explicar" | "Describir",
  "personajes": ["lista", "de", "personajes"],
  "arco_personaje": "deseo consciente -> necesidad inconsciente"
}`;

    const userPrompt = `Intención declarada: ${telos || "no declarada"}. Contexto: ${contexto || "ninguno"}. Personaje foco: ${personajeFoco || "ninguno, historia completa"}.\n\nMANUSCRITO A ANALIZAR:\n${text.slice(0, 30000)}`;

    const groqClient = getGroqClient(groqApiKey);
    if (groqClient) {
      try {
        const completion = await groqClient.chat.completions.create({
          model: "openai/gpt-oss-120b",
          messages: [
            { role: "system", content: sysPrompt },
            { role: "user", content: userPrompt },
          ],
          temperature: 0.2,
          max_completion_tokens: 2048,
          response_format: { type: "json_object" },
        });
        const raw = completion.choices[0]?.message?.content || "{}";
        const parsed = JSON.parse(raw);
        return res.json(parsed);
      } catch (err) {
        console.warn("[Narrative Groq Analysis Fallback]:", err);
      }
    }

    const ai = getGeminiClient();
    if (ai) {
      const { response } = await generateWithModelFallback(ai, userPrompt, {
        systemInstruction: sysPrompt,
        temperature: 0.2,
        responseMimeType: "application/json",
      });
      const raw = response.text || "{}";
      const parsed = JSON.parse(raw);
      return res.json(parsed);
    }

    // Heuristic fallback if no API key
    return res.json({
      escenas: [
        { i: 1, resumen: "Inicio ordinario y presentación de tensión basal", s: 0, c: 0, a: 0, p: -1, iota: 0.3, delta: 0.2 },
        { i: 2, resumen: "Aparición de la llamada con polaridad activa", s: 1, c: 2, a: 1, p: 1, iota: 0.7, delta: 0.4 },
        { i: 3, resumen: "Fricción de voluntades y colapso preliminar", s: 4, c: 3, a: 7, p: 1, iota: 0.8, delta: 0.65 },
        { i: 4, resumen: "Clímax de máxima densidad dramática", s: 7, c: 2, a: 16, p: -1, iota: 0.9, delta: 0.95 },
        { i: 5, resumen: "Desenlace integrador y retorno con el elixir", s: 11, c: 6, a: 21, p: 1, iota: 0.5, delta: 0.3 },
      ],
      cierre: "redentor",
      atractor: "Equilibrio integrador",
      telos_manifestado: "Mostrar",
      personajes: ["Protagonista", "Antagonista", "Mentor"],
      arco_personaje: "Seguridad aparente -> Aceptación de la imperfección",
    });
  } catch (err: any) {
    console.error("[Narrative Analizar Error]:", err);
    res.status(500).json({ error: err.message || "Error al analizar manuscrito" });
  }
});

// Socratic Chat API (/api/narrative/chat)
app.post("/api/narrative/chat", async (req, res) => {
  try {
    const { messages, context, provider, groqApiKey } = req.body;
    if (!messages || !Array.isArray(messages)) {
      return res.status(400).json({ error: "Missing messages array" });
    }

    const sysPrompt = `Eres un espejo socrático para un autor y analizador de flujo narrativo fractal.
Reglas fundamentales (Ley de Conservación Dramática):
1. Prohibición de juicio de valor: NUNCA califiques como "bueno", "malo", "correcto" o "incorrecto". El criterio rector es la coherencia del flujo y la conservación de la energía dramática.
2. Contraste Intención vs. Efecto: Compara el telos declarado por el autor con lo que las coordenadas reales de las escenas emiten.
3. Formulación Mayéutica: Plantea preguntas sobre las tensiones suspendidas, vacíos (elipsis) y dipolos rotos antes de emitir cualquier sugerencia.
4. Respuestas Algorítmicas Bajo Demanda: Solo cuando el autor pregunte expresamente "¿cómo resuelvo esto?" o "¿qué opciones tengo?", despliega el cálculo de los 4 extremos polares (Activo e1, Receptivo e2, Dinámico e3, Estático e4) y sus pesos armónicos gaussianos: ${JSON.stringify(context?.cuatroProyeccionPesos || [])}.
5. Lenguaje analítico riguroso: No uses esoterismo ni tarot; utiliza los términos "nodos arquetípicos funcionales", "niveles del conflicto (0..6)", "etapas del viaje (0..11)" e "inercia dramática delta".
Máximo 130 palabras, conciso, penetrante y lúcido.

CONTEXTO ACTUAL DEL FLUJO:
${JSON.stringify(context || {}, null, 2)}`;

    const lastMsg = messages[messages.length - 1]?.content || "";

    const groqClient = getGroqClient(groqApiKey);
    if (provider === "groq" && groqClient) {
      const completion = await groqClient.chat.completions.create({
        model: "openai/gpt-oss-120b",
        messages: [
          { role: "system", content: sysPrompt },
          ...messages.map((m: any) => ({
            role: m.role === "assistant" ? ("assistant" as const) : ("user" as const),
            content: m.content || "",
          })),
        ],
        temperature: 0.7,
        max_completion_tokens: 1024,
      });
      return res.json({
        reply: completion.choices[0]?.message?.content || "",
        modelUsed: "openai/gpt-oss-120b (Groq)",
      });
    }

    const ai = getGeminiClient();
    if (ai) {
      const { response } = await generateWithModelFallback(ai, lastMsg, {
        systemInstruction: sysPrompt,
        temperature: 0.7,
      });
      return res.json({
        reply: response.text || "",
        modelUsed: "gemini-3.8-flash",
      });
    }

    res.json({
      reply: "Observo el flujo de tus escenas y la tensión acumulada. Considera si la escena previa sostiene el conflicto o resuelve prematuramente la presión.",
      modelUsed: "local-socratic-heuristic",
    });
  } catch (err: any) {
    console.error("[Narrative Chat Error]:", err);
    res.status(500).json({ error: err.message || "Error en el chat socrático" });
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
