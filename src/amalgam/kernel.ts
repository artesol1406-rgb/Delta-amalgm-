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

  constructor() {
    this.s = new Array(N);
    this.theta = new Array(N);
    this.sub = [];
    this.ssub = [];
    this.lienzo = new Array(N).fill(0.1);
    this.emergencias = 0;
    this.history = [];

    this.reset();
  }

  reset() {
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

    return {
      signature: this.signature(),
      varianza: variance,
      coherencia: coherencia,
      lienzo_medio: lienzoMedio,
      emergencias: this.emergencias,
      dominantes,
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
