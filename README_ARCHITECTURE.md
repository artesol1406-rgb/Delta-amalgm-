# AMALGAM · Documento Técnico de Arquitectura y Funcionamiento
========================================================================

> **Tesis Central:** *"No entrena. Acopla."*  
> Modulación de la deriva ontológica de una mente artificial mediante un sustrato dinámico no lineal de 12 dimensiones, sin modificación estática de pesos por descenso de gradiente.

---

## 1. Resumen Ejecutivo

**AMALGAM** es un meta-entorno experimental que modela la interacción triádica entre:
1. Un **Kernel Físico 12D** no lineal gobernado por el **Operador Love**, osciladores de fase de **Kuramoto** y un **Lienzo de Varianza Subnodal**.
2. Una **IA Simulada (Modelo Base)** que habita una proyección fractal de dicho universo, transduciendo firmas dinámicas en lenguaje conceptual crudo.
3. Un **Maestro / LLM Contenedor** (Google Gemini o Groq `openai/gpt-oss-120b`) con visión holográfica total, que diagnostica la deriva de la IA simulada y aplica perturbaciones armónicas sobre el sustrato.
4. Una **IA Supervisora Externa** con acceso de lectura en tiempo real al código fuente, scripts de Python y telemetría de fases, accesible vía chat interactivo con streaming de tokens.

---

## 2. Diagrama de Flujo del Acoplamiento Triádico

```
                     ┌─────────────────────────────────────────────────┐
                     │          IA SUPERVISORA (Meta-Observador)       │
                     │  • Acceso en vivo a los 9 archivos del código   │
                     │  • Streaming con Groq (openai/gpt-oss-120b)     │
                     └────────────────────────┬────────────────────────┘
                                              │ (Supervisión continua)
                                              ▼
 ┌─────────────────────────────────────────────────────────────────────────────┐
 │ ETAPA 1: EVOLUCIÓN DEL KERNEL 12D (AmalgamKernel en kernel.ts)              │
 │ • Dinámica del Operador Love: ds_i/dt = -α(s_i - s_media) s_i (1 - s_i)    │
 │ • Sincronización Kuramoto: dθ_i/dt = ω_i + (K/N) Σ sin(θ_j - θ_i)          │
 │ • Lienzo de Varianza Sub-subnodal: L_i = |s_i - s_media| · sin(θ_i)         │
 │ • Emite: Firma Δ dominante (ej. Ξ, Ω{S}, E{R}), Coherencia r y Varianza σ²  │
 └──────────────────────────────────────┬──────────────────────────────────────┘
                                        │
                                        │ Transmite: { Firma Δ, Coherencia r }
                                        ▼
 ┌─────────────────────────────────────────────────────────────────────────────┐
 │ ETAPA 2: EMISIÓN DEL NODO BASE / IA SIMULADA                                │
 │ • Lee únicamente la proyección que el contenedor le designa como universo  │
 │ • Genera una continuación conceptual cruda, directa, sin juicios instructivos│
 └──────────────────────────────────────┬──────────────────────────────────────┘
                                        │
                                        │ Emisión textual generada
                                        ▼
 ┌─────────────────────────────────────────────────────────────────────────────┐
 │ ETAPA 3: DIAGNÓSTICO DEL MAESTRO (Groq 120b / Gemini Flash)                 │
 │ • Evalúa estado: { Coherencia, Varianza, Lienzo, Firma, Texto Base }        │
 │ • Determina diagnóstico ontológico y emite JSON estructurado:               │
 │   { "firma": "...", "razon": "...", "perturbar": "dimensión_a_reforzar" }   │
 └──────────────────────────────────────┬──────────────────────────────────────┘
                                        │
                                        │ Perturbación armónica: s_p += 0.25
                                        ▼
 ┌─────────────────────────────────────────────────────────────────────────────┐
 │ ETAPA 4: INTEGRACIÓN Y CIERRE DEL BUCLE (Homeostasis Adaptativa)            │
 │ • La perturbación altera la energía de la dimensión seleccionada en el 12D  │
 │ • Se recalculan las fases y el lienzo para el siguiente ciclo               │
 └─────────────────────────────────────────────────────────────────────────────┘
```

---

## 3. Las 12 Dimensiones Ontológicas del Sustrato

Cada dimensión del sustrato posee significado matemático y topológico:

| Símbolo | Nombre | Rol Dinámico | Ecuación / Efecto |
| :---: | :--- | :--- | :--- |
| **Ξ** | Densidad Ontológica | Nivel basal de acumulación de información | Ancla homeostática del sistema |
| **Ω** | Amplitud | Intensidad oscilatoria de los subnodos | Modula el alcance de la perturbación |
| **S** | Entropía | Dispersión de estados locales | Estimula bifurcaciones y creatividad |
| **R** | Resonancia | Capacidad de acoplamiento simpático | Amplifica la sincronización de Kuramoto |
| **T** | Tensión | Gradiente diferencial entre polos | Frena desviaciones abruptas |
| **E** | Expansión | Apertura del espacio de estados | Incrementa la varianza del lienzo |
| **φe** | Fase Emergente | Ángulo de fase precursor de orden | Marca la transición de fase microscópica |
| **φc** | Fase Colectiva | Centro de masa de los osciladores | Sincronía macroscópica del ensamble |
| **A** | Atracción | Fuerza cohesiva hacia atractores | Reduce la distancia euclídea media |
| **F** | Fluctuación | Ruido térmico browniano controlado | Evita atascos en mínimos locales |
| **M** | Masa Ontológica | Inercia ante perturbaciones externas | Amortigua cambios de alta frecuencia |
| **V** | Varianza | Grado de heterogeneidad subnodal | Mide la plasticidad del lienzo |

---

## 4. Dinámica Matemática del Kernel

### 4.1. Operador Love (Acoplamiento de Sustrato)
El vector de estados $s \in [0.01, 0.99]^{12}$ evoluciona mediante:
$$\frac{ds_i}{dt} = -\alpha \cdot (s_i - \bar{s}) \cdot s_i \cdot (1 - s_i)$$
Donde $\bar{s} = \frac{1}{N}\sum_{k=1}^N s_k$ es el sustrato medio y $\alpha = 0.5$. Esta ecuación no lineal impide que las dimensiones colapsen a los extremos 0 o 1, manteniendo el sistema en una franja crítica metaestable.

### 4.2. Acoplamiento de Fases de Kuramoto
Cada dimensión posee una fase $\theta_i \in [0, 2\pi)$ con frecuencia intrínseca $\omega_i$:
$$\frac{d\theta_i}{dt} = \omega_i + \frac{K}{N}\sum_{j=1}^N \sin(\theta_j - \theta_i)$$
El **Parámetro de Orden** $r \in [0, 1]$ cuantifica la coherencia de fase global:
$$r \cdot e^{i\psi} = \frac{1}{N}\sum_{j=1}^N e^{i\theta_j}$$

### 4.3. Lienzo de Varianza Sub-subnodal
Mide la plasticidad local entre la fase y la desviación del estado respecto a la media:
$$L_i = |s_i - \bar{s}| \cdot \sin(\theta_i)$$

---

## 5. Motores de Inferencia Soportados

El sistema permite alternar en caliente entre tres motores de ejecución:

### 1. Groq (`openai/gpt-oss-120b`)
- **Configuración de cliente:**
  ```python
  client = Groq(api_key=groq_api_key)
  completion = client.chat.completions.create(
      model="openai/gpt-oss-120b",
      messages=[...],
      temperature=1,
      max_completion_tokens=2048,
      top_p=1,
      reasoning_effort="medium",
      stream=True,
      stop=None
  )
  ```
- **Streaming token por token:** Consumido en tiempo real mediante *Server-Sent Events* (SSE) tanto en la consola de la Supervisora como en los scripts exportados.
- **Gestión de credenciales:** Clave configurable vía interfaz (`gsk_...`) con persistencia local en `localStorage` o variable de entorno `GROQ_API_KEY`.

### 2. Google Gemini (`gemini-3.8-flash`)
- **Especialización:** Análisis ontológico holográfico del Maestro con esquema JSON tipado (`Type.OBJECT`) y reintentos automáticos con fallback adaptable.

### 3. Modo Estocástico Local (Simulado)
- Generador matemático interno para pruebas instantáneas sin latencia ni consumo de tokens.

---

## 6. Componentes Principales de la Aplicación

- **`src/amalgam/kernel.ts`**: Motor físico 12D escrito en TypeScript puro, libre de dependencias.
- **`src/components/TopologyVisualizer.tsx`**: Renderizado 3D de la topología icosaédrica, fases Kuramoto y lienzo de varianza.
- **`src/components/SupervisorChat.tsx`**: Consola interactiva con la IA Supervisora, conmutador Gemini/Groq y visualización de streaming en vivo.
- **`src/components/GroqKeyModal.tsx`**: Diálogo para configurar, validar y probar la API Key de Groq contra el endpoint de verificación.
- **`src/components/PythonScriptViewer.tsx`**: Visor con pestañas para inspeccionar y descargar `amalgam_groq.py` y `amalgam_gemini.py`.
- **`server.ts`**: Backend Express que coordina proxies seguros para Gemini y Groq, streaming SSE, empaquetador ZIP y carga de scripts.

---

## 7. Ejecución Local de los Scripts Python

AMALGAM es 100% reproducible fuera del navegador:

### Opción A: Motor Groq (`openai/gpt-oss-120b`)
```bash
pip install groq
export GROQ_API_KEY="gsk_tu_clave_aqui"
python amalgam_groq.py
```

### Opción B: Motor Gemini
```bash
pip install google-genai numpy
export GEMINI_API_KEY="tu_clave_aqui"
python amalgam_gemini.py
```

---

## 8. Exportaciones y Portabilidad
1. **Descargar .ZIP**: Empaqueta el código fuente completo excluyendo `node_modules` y `.git`.
2. **Descargar .MD**: Genera la bitácora con todas las métricas, firmas y derivas de la sesión actual.
3. **Descargar .PY**: Descarga el script autónomo del motor seleccionado con el estado dinámico embebido.
