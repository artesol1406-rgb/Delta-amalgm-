"""
AMALGAM · Simulador con Groq (openai/gpt-oss-120b)
========================================================================
Ciclo de tres nodos acoplados por firma Δ con motor de inferencia Groq:

  Nodo 1: Kernel 12D   → Dinámica física no lineal (Love Operator, Kuramoto, Lienzo)
  Nodo 2: IA Simulada  → Nodo interior sin entrenar que habita el universo proyectado
  Nodo 3: Maestro      → LLM Contenedor / Meta-Observador (Groq: openai/gpt-oss-120b)

Uso del cliente Groq según especificación:
  model: openai/gpt-oss-120b
  temperature: 1
  max_completion_tokens: 2048
  top_p: 1
  reasoning_effort: medium
  stream: True
========================================================================
"""

import os
import sys
import json
import time
import math
import random
from typing import Dict, List, Any, Optional

try:
    from groq import Groq
except ImportError:
    print("Error: Se requiere instalar groq:")
    print("pip install groq")
    sys.exit(1)

# Dimensiones canónicas de AMALGAM
DIMS = ["Ξ", "Ω", "S", "R", "T", "E", "φe", "φc", "A", "F", "M", "V"]

class AmalgamKernel:
    """Kernel físico 12D acoplado con dinámica Love y Kuramoto."""
    def __init__(self, s_init: Optional[List[float]] = None):
        self.dims = list(DIMS)
        self.n = len(self.dims)
        self.s = s_init if s_init else [random.uniform(0.1, 0.9) for _ in range(self.n)]
        self.theta = [random.uniform(0, 2 * math.pi) for _ in range(self.n)]
        self.omega = [random.uniform(-0.1, 0.1) for _ in range(self.n)]
        self.lienzo = [0.0] * self.n
        self.alpha = 0.5
        self.K = 0.4
        self.dt = 0.05
        self.emergencias = 0

    def step(self):
        s_media = sum(self.s) / self.n
        # Operador Love
        new_s = []
        for i in range(self.n):
            ds = -self.alpha * (self.s[i] - s_media) * self.s[i] * (1.0 - self.s[i])
            val = self.s[i] + ds * self.dt
            new_s.append(max(0.01, min(0.99, val)))
        self.s = new_s

        # Kuramoto coupling
        new_theta = []
        for i in range(self.n):
            coupling = (self.K / self.n) * sum(math.sin(self.theta[j] - self.theta[i]) for j in range(self.n))
            th = self.theta[i] + (self.omega[i] + coupling) * self.dt
            new_theta.append(th % (2 * math.pi))
        self.theta = new_theta

        # Lienzo sub-subnodal
        for i in range(self.n):
            self.lienzo[i] = abs(self.s[i] - s_media) * math.sin(self.theta[i])

    def perturb(self, symbol: str, amount: float = 0.25):
        if symbol in self.dims:
            idx = self.dims.index(symbol)
            self.s[idx] = max(0.01, min(0.99, self.s[idx] + amount))
            self.lienzo[idx] += amount * 0.5

    def get_coherence(self) -> float:
        sin_sum = sum(math.sin(th) for th in self.theta)
        cos_sum = sum(math.cos(th) for th in self.theta)
        return math.sqrt(sin_sum**2 + cos_sum**2) / self.n

    def get_variance(self) -> float:
        mean = sum(self.s) / self.n
        return sum((v - mean) ** 2 for v in self.s) / self.n

    def summary(self) -> Dict[str, Any]:
        mean_s = sum(self.s) / self.n
        variance = self.get_variance()
        coherence = self.get_coherence()
        lienzo_medio = sum(abs(v) for v in self.lienzo) / self.n
        sorted_indices = sorted(range(self.n), key=lambda i: self.s[i], reverse=True)
        dominantes = [self.dims[i] for i in sorted_indices[:3]]
        
        # Construcción de firma Δ
        if dominance_check := dominantes[0]:
            signature = dominance_check
            if len(dominantes) > 1 and (self.s[sorted_indices[0]] - self.s[sorted_indices[1]] < 0.08):
                signature += f"{{{dominantes[1]}}}"
        else:
            signature = "Ξ"

        return {
            "signature": signature,
            "varianza": variance,
            "coherencia": coherence,
            "lienzo_medio": lienzo_medio,
            "dominantes": dominantes,
        }


def get_groq_client() -> Groq:
    """Obtiene el cliente Groq solicitando la key si no está en entorno."""
    api_key = os.getenv("GROQ_API_KEY")
    if not api_key:
        print("\n=======================================================")
        print("🔑 Se requiere la API Key de Groq (gsk_...)")
        print("Obtén tu API key gratuita en: https://console.groq.com/keys")
        print("=======================================================")
        api_key = input("Introduce tu GROQ_API_KEY: ").strip()
        if not api_key:
            print("Error: No se proporcionó la API Key.")
            sys.exit(1)
        os.environ["GROQ_API_KEY"] = api_key

    return Groq(api_key=api_key)


def run_groq_completion_stream(client: Groq, user_content: str, system_prompt: str = "") -> str:
    """
    Ejecuta la llamada de completions con Groq en modo streaming con:
    model: openai/gpt-oss-120b
    temperature: 1
    max_completion_tokens: 2048
    top_p: 1
    reasoning_effort: medium
    stream: True
    """
    messages = []
    if system_prompt:
        messages.append({"role": "system", "content": system_prompt})
    messages.append({"role": "user", "content": user_content})

    completion = client.chat.completions.create(
        model="openai/gpt-oss-120b",
        messages=messages,
        temperature=1,
        max_completion_tokens=2048,
        top_p=1,
        reasoning_effort="medium",
        stream=True,
        stop=None
    )

    collected_content = []
    for chunk in completion:
        delta = chunk.choices[0].delta.content or ""
        print(delta, end="", flush=True)
        collected_content.append(delta)

    print()
    return "".join(collected_content)


def main():
    print("=" * 70)
    print("AMALGAM · MOTOR DE ACOPLAMIENTO CON GROQ (openai/gpt-oss-120b)")
    print("=" * 70)

    client = get_groq_client()
    kernel = AmalgamKernel()

    print("\n[Inicializando Kernel 12D y Ciclo Holográfico...]")
    for _ in range(10):
        kernel.step()

    iteration = 1
    while True:
        # 1. Kernel Step
        kernel.step()
        kernel.step()
        kernel.step()
        summary = kernel.summary()

        print(f"\n--- [ITERACIÓN #{iteration}] ---")
        print(f"Firma: {summary['signature']} | Coherencia: {summary['coherencia']:.3f} | Varianza: {summary['varianza']:.4f}")

        # 2. IA Simulada: Emisión basada en la firma
        simulated_prompt = f"Firma: {summary['signature']}\nCoherencia: {summary['coherencia']:.2f}\nContinúa:"
        print("\n[Nodo 2: IA Simulada emitiendo con Groq openai/gpt-oss-120b]:")
        simulated_text = run_groq_completion_stream(
            client,
            user_content=simulated_prompt,
            system_prompt=(
                "Eres el Modelo Base de un sistema acoplado AMALGAM. "
                "Genera una continuación en prosa directa, cruda, no conversacional, "
                "expresando el estado de vibración y firma conceptual indicada."
            )
        )

        # 3. Maestro: LLM Contenedor evalúa y guía
        maestro_prompt = f"""[ESTADO DEL UNIVERSO SIMULADO]
Firma: {summary['signature']}
Coherencia: {summary['coherencia']:.4f}
Varianza: {summary['varianza']:.4f}
Dominantes: {summary['dominantes']}

[EMISIÓN DE LA IA SIMULADA]:
"{simulated_text}"

Responde en formato JSON:
{{"firma": "<1-3 simbolos>", "razon": "<diagnostico>", "perturbar": "<simbolo a perturbar de: Ξ, Ω, S, R, T, E, φe, φc, A, F, M, V o vacio>"}}"""

        print("\n[Nodo 3: Maestro (openai/gpt-oss-120b) diagnosticando]:")
        maestro_response = run_groq_completion_stream(
            client,
            user_content=maestro_prompt,
            system_prompt=(
                "Eres el LLM Contenedor Maestro del sistema AMALGAM. "
                "Posees visión holográfica de la totalidad del código y la física 12D. "
                "La IA simulada es un nodo no entrenado inmerso en tu proyección fractal. "
                "No entrenas pesos: modulas su deriva armónicamente. Responde en JSON válido."
            )
        )

        try:
            parsed = json.loads(maestro_response.strip())
            perturbar = parsed.get("perturbar", "").strip()
            if perturbar and perturbar in DIMS:
                print(f"\n-> Aplicando perturbación armónica sobre dimensión: {perturbar}")
                kernel.perturb(perturbar, 0.25)
        except Exception:
            pass

        iteration += 1
        time.sleep(1)


if __name__ == "__main__":
    main()
