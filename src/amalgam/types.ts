export const DIMS = [
  "Ξ", "Ω", "S", "R", "T", "E", "φe", "φc", "A", "F", "M", "V"
] as const;

export type DimSymbol = typeof DIMS[number];

export interface DimensionMeta {
  symbol: DimSymbol;
  name: string;
  category: "fundamento" | "fase" | "fuerza" | "manifestacion";
  description: string;
  color: string;
  angle: number; // in radians (0 to 2pi)
}

export const DIMENSION_METAS: Record<DimSymbol, DimensionMeta> = {
  "Ξ": {
    symbol: "Ξ",
    name: "Vacío / Pausa",
    category: "fundamento",
    description: "Silencio primordial, desacoplamiento, atenuación y estabilización.",
    color: "#64748b",
    angle: 0,
  },
  "Ω": {
    symbol: "Ω",
    name: "Límite / Horizonte",
    category: "fundamento",
    description: "Frontera asintótica, contención estructural y clausura.",
    color: "#475569",
    angle: (1 * Math.PI) / 6,
  },
  "S": {
    symbol: "S",
    name: "Estructura / Entropía",
    category: "fundamento",
    description: "Organización morfogenética, retícula y gradiente de orden.",
    color: "#0284c7",
    angle: (2 * Math.PI) / 6,
  },
  "R": {
    symbol: "R",
    name: "Resonancia / Ritmo",
    category: "fase",
    description: "Sincronía periódica, armónicos circulares y pulsación.",
    color: "#0d9488",
    angle: (3 * Math.PI) / 6,
  },
  "T": {
    symbol: "T",
    name: "Tiempo / Tensión",
    category: "fase",
    description: "Flecha temporal, acumulación de energía cinética y retardo.",
    color: "#d97706",
    angle: (4 * Math.PI) / 6,
  },
  "E": {
    symbol: "E",
    name: "Energía / Emergencia",
    category: "fase",
    description: "Excitación divergente, ruptura de simetría y salto cuántico.",
    color: "#e11d48",
    angle: (5 * Math.PI) / 6,
  },
  "φe": {
    symbol: "φe",
    name: "Flujo Externo",
    category: "fuerza",
    description: "Apertura al entorno exterior, absorción y dispersión.",
    color: "#8b5cf6",
    angle: (6 * Math.PI) / 6,
  },
  "φc": {
    symbol: "φc",
    name: "Flujo Coherente",
    category: "fuerza",
    description: "Interconexión circular interna, fase Kuramoto concentrada.",
    color: "#6366f1",
    angle: (7 * Math.PI) / 6,
  },
  "A": {
    symbol: "A",
    name: "Atractor / Afinidad",
    category: "fuerza",
    description: "Fuerza centrípeta gravitatoria sobre los nodos vecinos.",
    color: "#2563eb",
    angle: (8 * Math.PI) / 6,
  },
  "F": {
    symbol: "F",
    name: "Forma / Morfogénesis",
    category: "manifestacion",
    description: "Topología sensible, geometría del icosaedro en relieve.",
    color: "#059669",
    angle: (9 * Math.PI) / 6,
  },
  "M": {
    symbol: "M",
    name: "Memoria / Masa",
    category: "manifestacion",
    description: "Inercia histórica en el lienzo, huella acumulada de estados.",
    color: "#ca8a04",
    angle: (10 * Math.PI) / 6,
  },
  "V": {
    symbol: "V",
    name: "Voz / Vibración",
    category: "manifestacion",
    description: "Emisión de texto y perturbación transmitida a la red acoplada.",
    color: "#c026d3",
    angle: (11 * Math.PI) / 6,
  },
};

export interface KernelSummary {
  signature: string;
  varianza: number;
  coherencia: number;
  lienzo_medio: number;
  emergencias: number;
  dominantes: [DimSymbol, number][];
}

export interface MaestroGuidance {
  firma: string;
  razon: string;
  perturbar: string;
  mode?: "gemini" | "fallback";
  model?: string;
}

export interface BaseGeneration {
  prompt: string;
  text: string;
  mode?: "gemini" | "simulated";
}

export interface CycleIteration {
  id: string;
  iteration: number;
  timestamp: number;
  summary: KernelSummary;
  baseText: string;
  guidance: MaestroGuidance | null;
  perturbedSymbol?: string;
  perturbStrength?: number;
}
