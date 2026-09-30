/**
 * PROYECTO INTEGRAL: ANALIZADOR DE FLUJO NARRATIVO FRACTAL
 * Tipos y estructuras del espacio de fases discreto de 7 dimensiones
 */

export interface NarrativeNode {
  id: string;
  i: number; // Índice 1..K
  resumen: string;
  s: number; // Estación del Viaje del Héroe: 0..11
  c: number; // Plano Dramatúrgico / Chakras: 0..6
  a: number; // Función Arquetípica / Arcanos: 0..21
  p: 1 | -1; // Polaridad: +1 Activo, -1 Receptivo
  delta: number; // Densidad Dramática: 0.0..1.0
  iota: number; // Intensidad Polar: 0.0..1.0
  d?: number; // Profundidad Fractal: 0..d_max (default 3 para escena/beat)

  // Métricas calculadas
  q: number; // Carga Polar Continua: p * iota [-1.0..+1.0]
  tau: number; // Tiempo continuo: s + c/7 [0.0..11.86]
  t: number; // Progresión relativa al eje: [0.0..1.0]
  T: number; // Tensión dramática: 0.65*delta + 0.35*iota [0.0..1.0]
  D: number; // Desviación de inercia Delta: |delta - delta_ideal|
  D_dim?: number; // Dimensión fractal colapsada: 1D..13D
  estadoInercia?: "Estático" | "Dinámico";
  regimenPolar?: "Activo" | "Receptivo";
  dT?: number; // Derivada de tensión dT/dt respecto al nodo anterior
  tipoGradiente?: "Carga (+)" | "Descarga (-)" | "Falso Alivio / Ironía" | "Neutro";
  agenciaCausal?: "Decisión Interna" | "Accidente / Suceso Externo";
  personajeFoco?: string;
  xy?: [number, number]; // Coordenadas en el Mándala
}

export interface CausalRel {
  i: number;
  j: number;
  v: number;
  tipo: "mariposa" | "retrocausalidad" | "presagio" | "oposicion";
  descripcion?: string;
}

export interface CausalTensorResult {
  M: CausalRel[]; // Efecto Mariposa
  R: CausalRel[]; // Retrocausalidad
  F: CausalRel[]; // Presagio / Foreshadowing
  om: CausalRel | null; // Par de máxima oposición
  bestJump?: CausalRel | null;
  maxT: number;
  maxJump: number;
}

export interface FourProjectionResult {
  F: [number, number, number, number]; // [t, Delta, delta, iota]
  P: [number, number, number, number]; // Inversión polar retroactiva
  epsilon: [number, number, number, number];
  P_prime: [number, number, number, number];
  e1: [number, number, number, number]; // Activo
  e2: [number, number, number, number]; // Receptivo
  e3: [number, number, number, number]; // Dinámico
  e4: [number, number, number, number]; // Estático
  distances: [number, number, number, number];
  sigma: number;
  weights: [number, number, number, number]; // [w1, w2, w3, w4] porcentajes normalizados
}

export interface DialecticSynthesisResult {
  omega: number; // Índice de oposición
  isOposicionValida: boolean; // Omega >= 0.35
  phi: number; // Factor de neutralización de cargas
  score: number; // Puntuación de síntesis S(x, y -> z)
  zCandidate: Partial<NarrativeNode>;
}

export interface StoryAnalysisOutput {
  escenas: NarrativeNode[];
  cierre: "trágico" | "redentor" | "circular" | "abierto";
  atractor: string;
  telos_manifestado: "Generar" | "Mostrar" | "Explicar" | "Describir";
  personajes: string[];
  arco_personaje?: string;
  deusExDiagnostico?: {
    tipo: "Deus ex Machina" | "Deus ex Nihil";
    intensidadTwist: number;
    explicacion: string;
  };
  decisionPolar?: DecisionPolarIA;
}

export interface DecisionPolarIA {
  atractorDeseoVsNecesidad: {
    deseoConsciente: string;
    necesidadInconsciente: string;
  };
  agenciaDramaticaPct: number; // Porcentaje de eventos causados por decisiones (0..100)
  potencialPolarGradiente: number; // Diferencia de potencial acumulada |q_presente - q_futuro|
  derivadaTensionMedia: number; // Promedio dT/dt
  bifurcacionRecomendada: {
    camino: "e1" | "e2" | "e3" | "e4";
    nombre: string;
    pesoArmonico: number;
    justificacion: string;
    accionSugerida: string;
  };
  losCuatroCaminos: Array<{
    camino: "e1" | "e2" | "e3" | "e4";
    nombre: string;
    vector: [number, number, number, number];
    peso: number;
    accion: string;
  }>;
}

export const PLANOS_DRAMATURGICOS = [
  "Material / Físico",
  "Emocional / Vulnerabilidad",
  "Volitivo / Poder",
  "Relacional / Vínculo",
  "Expresivo / Revelación",
  "Estratégico / Visión",
  "Trascendental / Sentido",
] as const;

export const PLANO_COLORS = [
  "#c4694b", // Material - Terracota
  "#d6923f", // Emocional - Ámbar cálido
  "#d6c64f", // Volitivo - Oro/Amarillo
  "#6fb877", // Relacional - Verde esmeralda
  "#5eaed0", // Expresivo - Cian cielo
  "#8087e0", // Estratégico - Índigo
  "#c48ce0", // Trascendental - Violeta místico
] as const;

export const ESTACIONES_HEROE = [
  "0. Mundo Ordinario",
  "1. Llamado a la Aventura",
  "2. Rechazo del Llamado",
  "3. Encuentro con el Mentor",
  "4. Cruce del Primer Umbral",
  "5. Pruebas, Aliados y Enemigos",
  "6. Acercamiento a la Cueva Profunda",
  "7. Calvario / Muerte y Renacimiento",
  "8. Recompensa (Elixir)",
  "9. El Camino de Regreso",
  "10. Resurrección",
  "11. Retorno con el Elixir",
] as const;

export const ARQUETIPOS_FUNCIONALES = [
  "0. El Loco / Salto al vacío",
  "1. El Mago / Iniciativa técnica",
  "2. La Sacerdotisa / Subtexto e intuición",
  "3. La Emperatriz / Gestación fértil",
  "4. El Emperador / Ley y estructura",
  "5. El Sumo Sacerdote / Tradición y doctrina",
  "6. Los Enamorados / Elección y bifurcación",
  "7. El Carro / Avance y dirección",
  "8. La Fuerza / Dominio de pulsión interna",
  "9. El Ermitaño / Retirada e introspección",
  "10. La Rueda / Giro de fortuna",
  "11. La Justicia / Consecuencia inexorable",
  "12. El Colgado / Suspensión y sacrificio",
  "13. La Muerte / Ruptura y transmutación",
  "14. La Templanza / Integración gradual",
  "15. El Diablo / Atadura y obsesión",
  "16. La Torre / Colapso de una ilusión",
  "17. La Estrella / Esperanza y guía",
  "18. La Luna / Incertidumbre y distorsión",
  "19. El Sol / Claridad y verdad manifiesta",
  "20. El Juicio / Reconocimiento y vocación",
  "21. El Mundo / Cierre integrador total",
] as const;
