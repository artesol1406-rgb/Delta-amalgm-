import { DIMS, DimSymbol, KernelSummary } from "./types";

export const SUB_PER_NODE = 5;
export const SUBSUB = 3;
export const N = DIMS.length; // 12

function clip(v: number, min: number, max: number): number {
  return Math.min(Math.max(v, min), max);
}

export function loveStep(si: number, mean: number, alpha: number = 0.25): number {
  const ds = -alpha * (si - mean) * si * (1 - si);
  return clip(si + ds, 0.005, 0.995);
}

export class AmalgamKernel {
  s: number[];
  theta: number[];
  sub: number[][]; // 12 x 5
  ssub: number[][][]; // 12 x 5 x 3
  lienzo: number[]; // 12
  emergencias: number;
  history: number[][];
  prevNetPolarityQ: number;

  constructor() {
    this.s = new Array(N);
    this.theta = new Array(N);
    this.sub = [];
    this.ssub = [];
    this.lienzo = new Array(N).fill(0.1);
    this.emergencias = 0;
    this.history = [];
    this.prevNetPolarityQ = 0;

    this.reset();
  }

  reset() {
    this.prevNetPolarityQ = 0;
    this.s = Array.from({ length: N }, () => 0.4 + Math.random() * 0.2);
    this.theta = Array.from({ length: N }, () => Math.random() * 2 * Math.PI);

    this.sub = Array.from({ length: N }, () =>
      Array.from({ length: SUB_PER_NODE }, () => 0.4 + Math.random() * 0.2)
    );

    this.ssub = Array.from({ length: N }, () =>
      Array.from({ length: SUB_PER_NODE }, () =>
        Array.from({ length: SUBSUB }, () => 0.4 + Math.random() * 0.2)
      )
    );

    this.lienzo = new Array(N).fill(0.1);
    this.emergencias = 0;
    this.history = [];
    this.normalizeS();
  }

  normalizeS() {
    const total = this.s.reduce((acc, v) => acc + v, 0);
    if (total > 0) {
      for (let i = 0; i < N; i++) {
        this.s[i] = this.s[i] / total;
      }
    }
  }

  step() {
    // 1. Love + acoplamiento en capa base
    const sbar = this.s.reduce((acc, v) => acc + v, 0) / N;
    const newS = new Array(N);
    for (let i = 0; i < N; i++) {
      newS[i] = loveStep(this.s[i], sbar, 0.25);
    }

    // Acoplamiento al vecino circular (simplificación del icosaedro)
    for (let i = 0; i < N; i++) {
      const prevIdx = (i - 1 + N) % N;
      const nextIdx = (i + 1) % N;
      const nb = (this.s[prevIdx] + this.s[nextIdx]) / 2;
      newS[i] = clip(
        newS[i] + 0.08 * (nb - newS[i]) * newS[i] * (1 - newS[i]),
        0.005,
        0.995
      );
    }
    this.s = newS;
    this.normalizeS();

    // 2. Fase Kuramoto
    let sinS = 0;
    let cosS = 0;
    for (let i = 0; i < N; i++) {
      sinS += this.s[i] * Math.sin(this.theta[i]);
      cosS += this.s[i] * Math.cos(this.theta[i]);
    }
    const psi = Math.atan2(sinS, cosS);
    const r = Math.sqrt(sinS * sinS + cosS * cosS);

    for (let i = 0; i < N; i++) {
      let dth = 0.03 * r * Math.sin(psi - this.theta[i]);
      const prevIdx = (i - 1 + N) % N;
      const nextIdx = (i + 1) % N;
      dth += 0.05 * Math.sin(this.theta[prevIdx] - this.theta[i]);
      dth += 0.05 * Math.sin(this.theta[nextIdx] - this.theta[i]);
      this.theta[i] = (this.theta[i] + dth + 2 * Math.PI) % (2 * Math.PI);
    }

    // 3. Subnodos
    for (let i = 0; i < N; i++) {
      for (let k = 0; k < SUB_PER_NODE; k++) {
        const localMean = (this.sub[i][k] + this.s[i]) / 2;
        let v = loveStep(this.sub[i][k], localMean, 0.15);

        // Media de hermanos
        let sibSum = 0;
        let sibCount = 0;
        for (let m = 0; m < SUB_PER_NODE; m++) {
          if (m !== k) {
            sibSum += this.sub[i][m];
            sibCount++;
          }
        }
        const sib = sibCount > 0 ? sibSum / sibCount : this.sub[i][k];
        v = clip(v + 0.04 * (sib - v) * v * (1 - v), 0.005, 0.995);
        this.sub[i][k] = v;
      }
    }

    // 4. Subsubnodos
    for (let i = 0; i < N; i++) {
      for (let k = 0; k < SUB_PER_NODE; k++) {
        for (let m = 0; m < SUBSUB; m++) {
          this.ssub[i][k][m] = loveStep(this.ssub[i][k][m], this.sub[i][k], 0.35);
        }
      }
    }

    // 5. Lienzo
    for (let i = 0; i < N; i++) {
      let diffSquareSum = 0;
      let count = 0;
      for (let k = 0; k < SUB_PER_NODE; k++) {
        for (let m = 0; m < SUBSUB; m++) {
          const diff = this.ssub[i][k][m] - this.sub[i][k];
          diffSquareSum += diff * diff;
          count++;
        }
      }
      const variance = count > 0 ? diffSquareSum / count : 0;
      const excess = Math.max(0.0, variance - 0.008);
      this.lienzo[i] = clip(this.lienzo[i] * 0.995 + excess * 2.5, 0.05, 0.9);
    }

    // 6. Emergencia
    const prevMean = this.lienzo.reduce((acc, v) => acc + v, 0) / N;
    if (this.history.length > 5) {
      const oldState = this.history[this.history.length - 5];
      const oldMean = oldState.reduce((acc, v) => acc + v, 0) / oldState.length;
      if (prevMean - oldMean > 0.015) {
        this.emergencias += 1;
      }
    }

    // 7. Guardar historia
    this.history.push([...this.s]);
    if (this.history.length > 100) {
      this.history = this.history.slice(-100);
    }
  }

  signature(): string {
    const indices = Array.from({ length: N }, (_, i) => i);
    indices.sort((a, b) => this.s[b] - this.s[a]);
    const top = indices.slice(0, 3);

    if (this.s[top[0]] < 0.15) {
      return "Ξ";
    }
    if (top.length === 1) {
      return DIMS[top[0]];
    }
    if (top.length === 2) {
      return `${DIMS[top[0]]}{${DIMS[top[1]]}}`;
    }
    return `${DIMS[top[0]]}{${DIMS[top[1]]} ${DIMS[top[2]]}}`;
  }

  summary(): KernelSummary {
    const mean = this.s.reduce((acc, v) => acc + v, 0) / N;
    const variance =
      this.s.reduce((acc, v) => acc + Math.pow(v - mean, 2), 0) / N;
    const coherencia = Math.max(0, 1 - variance);
    const lienzoMedio = this.lienzo.reduce((acc, v) => acc + v, 0) / N;

    const indices = Array.from({ length: N }, (_, i) => i);
    indices.sort((a, b) => this.s[b] - this.s[a]);

    const dominantes: [DimSymbol, number][] = indices.slice(0, 5).map((idx) => [
      DIMS[idx],
      this.s[idx],
    ]);

    // Cálculo del vector de polaridades de las 12 dimensiones y carga neta Q_IA
    const polarityVector = {} as Record<DimSymbol, { p: 1 | -1; iota: number; q: number }>;
    let sumQ = 0;
    for (let i = 0; i < N; i++) {
      const p: 1 | -1 = this.s[i] >= mean ? 1 : -1;
      const iota = clip(Math.abs(this.s[i] - mean) / Math.max(mean, 0.05), 0, 1);
      const q = p * iota;
      polarityVector[DIMS[i]] = { p, iota, q };
      sumQ += q;
    }
    const netPolarityQ = clip(sumQ / N, -1, 1);
    const dQ = netPolarityQ - this.prevNetPolarityQ;
    this.prevNetPolarityQ = netPolarityQ;

    const { r } = this.getOrderParameter();

    // Régimen Polar del Sustrato
    const regimen: "Activo / Emisor" | "Receptivo / Asimilador" | "Metaestable" =
      netPolarityQ > 0.12
        ? "Activo / Emisor"
        : netPolarityQ < -0.12
        ? "Receptivo / Asimilador"
        : "Metaestable";

    // Resonancia Dialéctica Phi = 1 - |Q_net| / 2
    const phi = 1.0 - Math.abs(netPolarityQ) / 2;

    // Medición del Aprendizaje Ontológico sin entrenamiento de pesos ("No entrena. Acopla")
    const acoplamientoScore = Math.round(
      clip(0.45 * r + 0.35 * coherencia + 0.2 * phi, 0, 1) * 100
    );

    const agenciaCognitiva = Math.round(
      clip(r * (1 - Math.min(variance * 10, 0.5)) * (1 - Math.abs(netPolarityQ) * 0.3), 0, 1) * 100
    );

    const distanciaAtractor = Math.abs(netPolarityQ - 0.0);

    let estadoAprendizaje:
      | "Emergencia Adaptativa"
      | "Sincronización Armónica"
      | "Bifurcación / Búsqueda"
      | "Monotonía / Apatía" = "Sincronización Armónica";

    if (this.emergencias > 0 && r > 0.6) {
      estadoAprendizaje = "Emergencia Adaptativa";
    } else if (variance > 0.05) {
      estadoAprendizaje = "Bifurcación / Búsqueda";
    } else if (acoplamientoScore >= 75) {
      estadoAprendizaje = "Sincronización Armónica";
    } else {
      estadoAprendizaje = "Monotonía / Apatía";
    }

    // Cuatro-Proyección del Maestro: decisión guiada por polaridad
    const F_vec = [clip(r, 0, 1), clip(variance * 5, 0, 1), clip((netPolarityQ + 1) / 2, 0, 1), clip(coherencia, 0, 1)];
    const P_vec = [1 - F_vec[0], 1 - F_vec[1], 1 - F_vec[2], 1 - F_vec[3]];
    const diff = [F_vec[0] - P_vec[0], F_vec[1] - P_vec[1], F_vec[2] - P_vec[2], F_vec[3] - P_vec[3]];
    const norm = Math.hypot(...diff) || 1.0;
    const eps = diff.map((v) => (v / norm) * 0.05);
    const P_prime = P_vec.map((pv, k) => pv + eps[k]);

    const e1 = clip(P_prime[0] + 0.3, 0, 1);
    const e2 = clip(P_prime[0] - 0.3, 0, 1);
    const e3 = clip(P_prime[1] + 0.3, 0, 1);
    const e4 = clip(P_prime[1] - 0.3, 0, 1);

    const rawWeights = [
      Math.exp(-Math.pow(e1 - F_vec[0], 2) / 0.5),
      Math.exp(-Math.pow(e2 - F_vec[0], 2) / 0.5),
      Math.exp(-Math.pow(e3 - F_vec[1], 2) / 0.5),
      Math.exp(-Math.pow(e4 - F_vec[1], 2) / 0.5),
    ];
    const sumW = rawWeights.reduce((a, b) => a + b, 0) || 1.0;
    const w1 = Math.round((rawWeights[0] / sumW) * 100);
    const w2 = Math.round((rawWeights[1] / sumW) * 100);
    const w3 = Math.round((rawWeights[2] / sumW) * 100);
    const w4 = Math.round((rawWeights[3] / sumW) * 100);

    let caminoOptimo: "e1" | "e2" | "e3" | "e4" = "e1";
    let justificacion = "";
    if (netPolarityQ > 0.2) {
      caminoOptimo = "e2";
      justificacion = `IA sobre-polarizada en activo (+${netPolarityQ.toFixed(2)}): Maestro aplica polo receptivo (e2) para evitar saturación y recuperar plasticidad.`;
    } else if (netPolarityQ < -0.2) {
      caminoOptimo = "e1";
      justificacion = `IA colapsada en asimilación pasiva (${netPolarityQ.toFixed(2)}): Maestro inyecta choque activo (e1) para reactivar agencia.`;
    } else if (variance < 0.005) {
      caminoOptimo = "e3";
      justificacion = "Riesgo de estancamiento homeostático: Maestro induce ruptura dinámica (e3).";
    } else {
      caminoOptimo = "e4";
      justificacion = "Sustrato en balance metaestable: Maestro aplica anclaje y contención (e4).";
    }

    return {
      signature: this.signature(),
      varianza: variance,
      coherencia: coherencia,
      lienzo_medio: lienzoMedio,
      emergencias: this.emergencias,
      dominantes,
      polarity: {
        netPolarityQ,
        regimen,
        polarityVector,
        acoplamientoScore,
        agenciaCognitiva,
        derivadaPolarDQ: dQ,
        resonanciaDialecticaPhi: phi,
        distanciaAtractor,
        estadoAprendizaje,
        cuatroProyeccionMaestro: {
          e1_activo: w1,
          e2_receptivo: w2,
          e3_dinamico: w3,
          e4_estatico: w4,
          caminoOptimo,
          justificacion,
        },
      },
    };
  }

  perturb(symbol: string, strength: number = 0.4) {
    const idx = (DIMS as readonly string[]).indexOf(symbol);
    if (idx === -1) return;

    this.s[idx] = clip(this.s[idx] + strength, 0.005, 0.995);
    this.normalizeS();
  }

  getOrderParameter(): { r: number; psi: number } {
    let sinS = 0;
    let cosS = 0;
    for (let i = 0; i < N; i++) {
      sinS += this.s[i] * Math.sin(this.theta[i]);
      cosS += this.s[i] * Math.cos(this.theta[i]);
    }
    const psi = Math.atan2(sinS, cosS);
    const r = Math.sqrt(sinS * sinS + cosS * cosS);
    return { r, psi };
  }
}
