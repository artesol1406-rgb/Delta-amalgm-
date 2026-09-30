/**
 * PROYECTO INTEGRAL: ANALIZADOR DE FLUJO NARRATIVO FRACTAL
 * Núcleo Matemático y Operaciones sobre Variedades y Grafos Topológicos
 */

import {
  NarrativeNode,
  CausalRel,
  CausalTensorResult,
  FourProjectionResult,
  DialecticSynthesisResult,
} from "./types";

export const clamp = (val: number, min: number, max: number): number =>
  Math.min(max, Math.max(min, val));

// 3.1 Carga Polar Continua: q(n) = p * iota in [-1, 1]
export const calcQ = (p: 1 | -1, iota: number): number =>
  (p >= 0 ? 1 : -1) * clamp(iota, 0, 1);

// 7.1 Tensión Dramática por Nodo: T(n) = 0.65*delta + 0.35*iota in [0, 1]
export const calcT = (delta: number, iota: number): number =>
  0.65 * clamp(delta, 0, 1) + 0.35 * clamp(iota, 0, 1);

// 4.1 Tiempo Métrico Continuo: tau(n) = s(n) + c(n)/7 in [0, 11.86]
export const calcTau = (s: number, c: number): number =>
  clamp(s, 0, 11) + clamp(c, 0, 6) / 7;

// 3.2 Distancia Geodésica en el Círculo de 22 Arquetipos: dA(ax, ay) in [0, 11]
export const calcDistA = (ax: number, ay: number): number => {
  const diff = Math.abs(ax - ay);
  return Math.min(diff, 22 - diff);
};

// Antípoda exacto a distancia 11
export const getAntipodaArquetipo = (a: number): number => (a + 11) % 22;

// 3.2 Distancia Geodésica en el Círculo de 12 Estaciones: dS(sx, sy) in [0, 6]
export const calcDistS = (sx: number, sy: number): number => {
  const diff = Math.abs(sx - sy);
  return Math.min(diff, 12 - diff);
};

// 3.3 Índice de Oposición Corregido Omega(x, y) in [0, 1]
// Omega = 0.45 * (dA/11) + 0.15 * (|qx - qy|/2) + 0.15 * (|cx - cy|/6) + 0.25 * |deltax - deltay|
export const calcOmega = (
  x: { a: number; q: number; c: number; delta: number },
  y: { a: number; q: number; c: number; delta: number }
): number => {
  const dA = calcDistA(x.a, y.a) / 11;
  const dQ = Math.abs(x.q - y.q) / 2;
  const dC = Math.abs(x.c - y.c) / 6;
  const dDelta = Math.abs(x.delta - y.delta);
  return 0.45 * dA + 0.15 * dQ + 0.15 * dC + 0.25 * dDelta;
};

// 3.4 Complementariedad Eje Inicio -> Final Gamma(u, v) in [0, 1]
export const calcGamma = (
  u: { q: number; a: number; s: number },
  v: { q: number; a: number; s: number }
): number => {
  const dQ = Math.abs(u.q - v.q) / 2;
  const dA = calcDistA(u.a, v.a) / 11;
  const dS = calcDistS(u.s, v.s) / 6;
  return 0.5 * dQ + 0.3 * dA + 0.2 * dS;
};

// 3.4 Escalera Dimensional Fractal (13D -> 1D): D(n) = round(13 - 12 * (d_n / max(d_max, 1)))
export const calcFractalDimension = (d: number, dMax: number = 3): number => {
  const safeMax = Math.max(dMax, 1);
  return Math.round(13 - 12 * (clamp(d, 0, safeMax) / safeMax));
};

// 4. Dinámica Vectorial: Eje Inicio -> Final
export const procesarDinamicaFlujo = (nodos: NarrativeNode[]): NarrativeNode[] => {
  if (nodos.length === 0) return [];
  const u = nodos[0];
  const v = nodos[nodos.length - 1];
  const deltaTau = calcTau(v.s, v.c) - calcTau(u.s, u.c);

  return nodos.map((n, idx) => {
    const qVal = calcQ(n.p, n.iota);
    const tauVal = calcTau(n.s, n.c);
    const tVal =
      deltaTau === 0
        ? idx >= nodos.length - 1
          ? 1
          : 0
        : clamp((tauVal - calcTau(u.s, u.c)) / deltaTau, 0, 1);

    // Recta ideal de inercia: delta_ideal(t) = delta(u) + t * (delta(v) - delta(u))
    const deltaIdeal = u.delta + tVal * (v.delta - u.delta);
    // Desviación de inercia Delta: |delta(n) - delta_ideal(t(n))|
    const DVal = Math.abs(n.delta - deltaIdeal);
    const tDrama = calcT(n.delta, n.iota);

    const estadoInercia: "Estático" | "Dinámico" =
      DVal <= 0.12 ? "Estático" : "Dinámico";
    const regimenPolar: "Activo" | "Receptivo" =
      tVal < 0.5 ? "Activo" : "Receptivo";
    const dim = calcFractalDimension(n.d ?? 3, 4);

    // Derivada de tensión respecto al nodo anterior (dT/dt)
    const prevNode = idx > 0 ? nodos[idx - 1] : null;
    const prevT = prevNode ? calcT(prevNode.delta, prevNode.iota) : tDrama;
    const dTVal = idx === 0 ? 0 : tDrama - prevT;

    let tipoGradiente: "Carga (+)" | "Descarga (-)" | "Falso Alivio / Ironía" | "Neutro" = "Neutro";
    if (dTVal > 0.04) {
      tipoGradiente = "Carga (+)";
    } else if (dTVal < -0.04) {
      // Falso alivio: la tensión superficial cae, pero el subtexto o riesgo latente es alto
      if (n.c === 2 || n.delta > 0.65) {
        tipoGradiente = "Falso Alivio / Ironía";
      } else {
        tipoGradiente = "Descarga (-)";
      }
    }

    // Agencia Causal frente al determinismo
    const agenciaCausal: "Decisión Interna" | "Accidente / Suceso Externo" =
      n.p > 0 && (n.c === 2 || n.c === 5 || n.iota >= 0.55)
        ? "Decisión Interna"
        : "Accidente / Suceso Externo";

    return {
      ...n,
      q: qVal,
      tau: tauVal,
      t: tVal,
      T: tDrama,
      D: DVal,
      D_dim: dim,
      dT: dTVal,
      tipoGradiente,
      agenciaCausal,
      estadoInercia,
      regimenPolar,
    };
  });
};

// Medición de Polaridad para Toma de Decisiones de la IA
export const calcularDecisionPolarIA = (
  nodos: NarrativeNode[],
  atractorDeclarado: string = "Trascendencia"
): import("./types").DecisionPolarIA => {
  if (nodos.length === 0) {
    return {
      atractorDeseoVsNecesidad: {
        deseoConsciente: "Control del presente",
        necesidadInconsciente: "Aceptación de la incertidumbre",
      },
      agenciaDramaticaPct: 50,
      potencialPolarGradiente: 0.5,
      derivadaTensionMedia: 0,
      bifurcacionRecomendada: {
        camino: "e1",
        nombre: "Activo (Intervención / Choque)",
        pesoArmonico: 25,
        justificacion: "Sistema sin nodos suficientes.",
        accionSugerida: "Introducir la primera perturbación.",
      },
      losCuatroCaminos: [],
    };
  }

  // 1. Deseo consciente vs Necesidad inconsciente (M_personaje)
  const primerNodo = nodos[0];
  const ultimoNodo = nodos[nodos.length - 1];

  const deseoConsciente =
    primerNodo.p > 0
      ? "Imponer orden activo y proteger el statu quo"
      : "Evitar el conflicto y asimilar pasivamente la carencia";

  const necesidadInconsciente =
    ultimoNodo.p > 0
      ? "Reconocer los límites de la propia voluntad"
      : "Asumir la responsabilidad activa de la transformación colectiva";

  // 2. Porcentaje de Agencia Dramática
  const decisionesInternas = nodos.filter(
    (n) => n.agenciaCausal === "Decisión Interna"
  ).length;
  const agenciaDramaticaPct = Math.round(
    (decisionesInternas / nodos.length) * 100
  );

  // 3. Gradiente de potencial polar actual |q_presente - q_futuro|
  const potencialPolarGradiente = Math.abs(primerNodo.q - ultimoNodo.q);

  // 4. Derivada media de tensión dT/dt
  const dTSum = nodos.reduce((acc, curr) => acc + (curr.dT || 0), 0);
  const derivadaTensionMedia = dTSum / Math.max(nodos.length - 1, 1);

  // 5. Cuatro-Proyección Cuaternaria desde el último nodo
  const proj = calcularCuatroProyeccion(
    [ultimoNodo.t, ultimoNodo.D, ultimoNodo.delta, ultimoNodo.iota],
    0.05
  );

  const acciones = [
    "Lanzar una intervención frontal agresiva o confrontar directamente al antagonista.",
    "Aceptar una pérdida táctica, rendirse para infiltrarse o asimilar la verdad en soledad.",
    "Quebrar un juramento moral previo o romper una alianza estratégica para detonar aceleración.",
    "Atrincherarse en un ancla estática, consolidar la información y resistir sin avanzar.",
  ];

  const caminos: Array<{
    camino: "e1" | "e2" | "e3" | "e4";
    nombre: string;
    vector: [number, number, number, number];
    peso: number;
    accion: string;
  }> = [
    { camino: "e1", nombre: "Activo (Intervención / Choque)", vector: proj.e1, peso: proj.weights[0], accion: acciones[0] },
    { camino: "e2", nombre: "Receptivo (Asimilación / Entrega)", vector: proj.e2, peso: proj.weights[1], accion: acciones[1] },
    { camino: "e3", nombre: "Dinámico (Ruptura de reglas)", vector: proj.e3, peso: proj.weights[2], accion: acciones[2] },
    { camino: "e4", nombre: "Estático (Anclaje / Contención)", vector: proj.e4, peso: proj.weights[3], accion: acciones[3] },
  ];

  // Elegir el camino recomendado según el gradiente polar
  // Si la tensión viene subiendo en exceso, recomendar contención o ruptura; si está estancada, choque o dinámico.
  let bestCaminoIdx = 0;
  if (ultimoNodo.T > 0.8) {
    // Si la tensión ya está al límite, el sistema busca receptivo o dinámico
    bestCaminoIdx = proj.weights[1] >= proj.weights[2] ? 1 : 2;
  } else if (ultimoNodo.D <= 0.12 && Math.abs(ultimoNodo.q) < 0.3) {
    // Si está en punto muerto o neutro, forzar ruptura dinámica o choque activo
    bestCaminoIdx = proj.weights[0] >= proj.weights[2] ? 0 : 2;
  } else {
    // Por peso armónico máximo
    bestCaminoIdx = proj.weights.indexOf(Math.max(...proj.weights));
  }

  const recomendado = caminos[bestCaminoIdx];

  return {
    atractorDeseoVsNecesidad: {
      deseoConsciente,
      necesidadInconsciente,
    },
    agenciaDramaticaPct,
    potencialPolarGradiente,
    derivadaTensionMedia,
    bifurcacionRecomendada: {
      camino: recomendado.camino,
      nombre: recomendado.nombre,
      pesoArmonico: recomendado.peso,
      justificacion:
        `Con tensión actual T=${ultimoNodo.T.toFixed(2)} y carga polar q=${ultimoNodo.q.toFixed(2)}, ` +
        `el sistema requiere un gradiente de compensación ${recomendado.nombre} para evitar monotonía y preservar la energía dramática hacia el atractor '${atractorDeclarado}'.`,
      accionSugerida: recomendado.accion,
    },
    losCuatroCaminos: caminos,
  };
};

// 7. Tensor Causal y Patrones Profundos
export const calcularTensorCausal = (nodos: NarrativeNode[]): CausalTensorResult => {
  const K = nodos.length;
  const result: CausalTensorResult = {
    M: [],
    R: [],
    F: [],
    om: null,
    bestJump: null,
    maxT: 0,
    maxJump: 0,
  };

  if (K < 2) return result;

  for (let i = 0; i < K; i++) {
    const x = nodos[i];
    result.maxT = Math.max(result.maxT, x.T);

    for (let j = i + 1; j < K; j++) {
      const y = nodos[j];
      const jump = y.T - x.T;
      result.maxJump = Math.max(result.maxJump, jump);

      if (!result.bestJump || jump > result.bestJump.v) {
        result.bestJump = {
          i,
          j,
          v: jump,
          tipo: "mariposa",
          descripcion: `Salto de tensión de +${jump.toFixed(2)}`,
        };
      }

      // 7.4 Efecto Mariposa (M_i->j):
      // 1. T(ni) <= 0.45 (mínima en pasado)
      // 2. T(nj) >= 0.85 y jump > 0.45
      // 3. Valle intermedio: si j - i >= 2, existe k in (i, j) con T(nk) < T(nj) - 0.20
      if (x.T <= 0.45 && y.T >= 0.85 && jump > 0.45) {
        let hasValle = j - i < 2;
        if (!hasValle) {
          for (let k = i + 1; k < j; k++) {
            if (nodos[k].T < y.T - 0.2) {
              hasValle = true;
              break;
            }
          }
        }
        if (hasValle) {
          result.M.push({
            i,
            j,
            v: jump,
            tipo: "mariposa",
            descripcion: `Efecto Mariposa crítico: Escena ${x.i} (T=${x.T.toFixed(2)}) detona crisis en Escena ${y.i} (T=${y.T.toFixed(2)}) con salto de +${jump.toFixed(2)}`,
          });
        }
      }

      // 7.2 Retrocausalidad (R_j->i):
      // 1. s_j > s_i + 1
      // 2. (a_j == a_i) or (c_j == c_i)
      // 3. sgn(q_j) != sgn(q_i)
      // Magnitud: |q_j - q_i| * (T_j / 2)
      if (
        y.s > x.s + 1 &&
        (x.a === y.a || x.c === y.c) &&
        Math.sign(x.q) !== Math.sign(y.q)
      ) {
        const magR = (Math.abs(y.q - x.q) * y.T) / 2;
        result.R.push({
          i,
          j,
          v: magR,
          tipo: "retrocausalidad",
          descripcion: `Retrocausalidad: Escena ${y.i} resignifica el polo de Escena ${x.i} (${x.p > 0 ? "Activo" : "Receptivo"} -> ${y.p > 0 ? "Activo" : "Receptivo"}) en plano ${x.c === y.c ? "compartido" : "arquetípico"}`,
        });
      }

      // 7.3 Presagio / Foreshadowing (F_i->j):
      // (c_i == c_j) or (a_i == a_j) * (j - i - 1) / max(K - 2, 1)
      if (x.c === y.c || x.a === y.a) {
        const distNorm = (j - i - 1) / Math.max(K - 2, 1);
        result.F.push({
          i,
          j,
          v: distNorm,
          tipo: "presagio",
          descripcion: `Presagio estructural: Escena temprana ${x.i} anticipa Escena lejana ${y.i} compartiendo ${x.c === y.c ? "Plano Dramatúrgico" : "Arquetipo"}`,
        });
      }

      // Oposición máxima
      const omVal = calcOmega(x, y);
      if (!result.om || omVal > result.om.v) {
        result.om = {
          i,
          j,
          v: omVal,
          tipo: "oposicion",
          descripcion: `Mayor índice de oposición dialéctica: Omega = ${omVal.toFixed(3)} entre Escena ${x.i} y ${y.i}`,
        };
      }
    }
  }

  result.M.sort((a, b) => b.v - a.v);
  result.R.sort((a, b) => b.v - a.v);
  result.F.sort((a, b) => b.v - a.v);

  return result;
};

// 5. Mecánica de Decisión y Cuatro-Proyección Cuaternaria
// F = (t_F, Delta_F, delta_F, iota_F) in [0, 1]^4
export const calcularCuatroProyeccion = (
  F: [number, number, number, number],
  epsilon0: number = 0.05
): FourProjectionResult => {
  // 1. Inversión polar retroactiva del presente P
  const P: [number, number, number, number] = [
    clamp(1 - F[0], 0, 1),
    clamp(1 - F[1], 0, 1),
    clamp(1 - F[2], 0, 1),
    clamp(1 - F[3], 0, 1),
  ];

  // 2. Perturbación mínima epsilon
  const diff = [F[0] - P[0], F[1] - P[1], F[2] - P[2], F[3] - P[3]];
  const normDiff = Math.hypot(...diff) || 1.0;
  const epsilon: [number, number, number, number] = [
    (diff[0] / normDiff) * epsilon0,
    (diff[1] / normDiff) * epsilon0,
    (diff[2] / normDiff) * epsilon0,
    (diff[3] / normDiff) * epsilon0,
  ];

  const P_prime: [number, number, number, number] = [
    P[0] + epsilon[0],
    P[1] + epsilon[1],
    P[2] + epsilon[2],
    P[3] + epsilon[3],
  ];

  // 3. Los 4 vértices extremos
  const e1: [number, number, number, number] = [
    clamp(P_prime[0] + 0.3, 0, 1),
    clamp(P_prime[1] + 0.0, 0, 1),
    clamp(P_prime[2] + 0.2, 0, 1),
    clamp(P_prime[3] + 0.2, 0, 1),
  ]; // Activo: Choque frontal

  const e2: [number, number, number, number] = [
    clamp(P_prime[0] - 0.3, 0, 1),
    clamp(P_prime[1] + 0.0, 0, 1),
    clamp(P_prime[2] - 0.2, 0, 1),
    clamp(P_prime[3] - 0.2, 0, 1),
  ]; // Receptivo: Asimilación

  const e3: [number, number, number, number] = [
    clamp(P_prime[0] + 0.0, 0, 1),
    clamp(P_prime[1] + 0.3, 0, 1),
    clamp(P_prime[2] + 0.25, 0, 1),
    clamp(P_prime[3] + 0.0, 0, 1),
  ]; // Dinámico: Ruptura de reglas

  const e4: [number, number, number, number] = [
    clamp(P_prime[0] + 0.0, 0, 1),
    clamp(P_prime[1] - 0.3, 0, 1),
    clamp(P_prime[2] - 0.25, 0, 1),
    clamp(P_prime[3] + 0.0, 0, 1),
  ]; // Estático: Anclaje y contención

  // 4. Distancias euclídeas a F
  const distE = (e: [number, number, number, number]) =>
    Math.hypot(e[0] - F[0], e[1] - F[1], e[2] - F[2], e[3] - F[3]);

  const distances: [number, number, number, number] = [
    distE(e1),
    distE(e2),
    distE(e3),
    distE(e4),
  ];

  // 5. Sigma = max(0.01, 1/4 * sum(dist))
  const avgDist = (distances[0] + distances[1] + distances[2] + distances[3]) / 4;
  const sigma = Math.max(0.01, avgDist);

  // 6. Pesos Gaussianos: exp(-dist^2 / (2 * sigma^2))
  const rawW = distances.map((d) => Math.exp(-(d * d) / (2 * sigma * sigma)));
  const sumW = rawW.reduce((a, b) => a + b, 0) || 1.0;
  const weights: [number, number, number, number] = [
    (rawW[0] / sumW) * 100,
    (rawW[1] / sumW) * 100,
    (rawW[2] / sumW) * 100,
    (rawW[3] / sumW) * 100,
  ];

  return {
    F,
    P,
    epsilon,
    P_prime,
    e1,
    e2,
    e3,
    e4,
    distances,
    sigma,
    weights,
  };
};

// 6. Síntesis de Flujo Dialéctico
// S(x, y -> z) = 0.45 * Omega(x, y) + 0.35 * Phi(x, y) + 0.20 * (1 - |Delta(z) - (Delta(x)+Delta(y))/2|)
// Phi(x, y) = 1.0 - |q(x) + q(y)| / 2 in [0, 1]
export const calcularSintesisDialectica = (
  x: NarrativeNode,
  y: NarrativeNode,
  zCandidate: Partial<NarrativeNode>
): DialecticSynthesisResult => {
  const omegaVal = calcOmega(x, y);
  const isOposicionValida = omegaVal >= 0.35;
  const phiVal = 1.0 - Math.abs(x.q + y.q) / 2;

  const inerciaMedia = (x.D + y.D) / 2;
  const deltaZ = zCandidate.D ?? inerciaMedia;
  const inerciaFactor = 1.0 - Math.abs(deltaZ - inerciaMedia);

  const score = 0.45 * omegaVal + 0.35 * phiVal + 0.2 * inerciaFactor;

  return {
    omega: omegaVal,
    isOposicionValida,
    phi: phiVal,
    score: clamp(score, 0, 1),
    zCandidate,
  };
};

// Coordenadas trigonométricas para renderizar el Mándala
export const getMandalaCoordinates = (
  s: number,
  c: number,
  a: number,
  cx: number = 200,
  cy: number = 200
): [number, number] => {
  // Radio concéntrico por plano dramatúrgico: 0..6
  const r = 48 + clamp(c, 0, 6) * 21;
  // Ángulo por estación del héroe: 0..11 con modulación por arquetipo: 0..21
  const theta =
    (clamp(s, 0, 11) / 12) * 2 * Math.PI -
    Math.PI / 2 +
    (clamp(a, 0, 21) / 21 - 0.5) * 0.42 +
    Math.PI / 12;

  return [cx + r * Math.cos(theta), cy + r * Math.sin(theta)];
};
