import { NarrativeNode } from "./types";
import { procesarDinamicaFlujo, getMandalaCoordinates } from "./math";

export const SAMPLE_NARRATIVE_TEXT = `Me siento vacío porque necesito algo que temo perder.
Me llena el impulso de ese vacío que me jala hacia adelante.
Me alegra sentir que estoy llegando a casa; para eso me voy de casa, por eso me alegra la soledad.
Porque sin ese vacío, sin esa nada, no podría amar. Sin esa distancia no podría extrañar.
Me siento necesitado porque lleno vacíos de algo que se perdió en el tiempo.
Me impulsa el saber que tuve y volví a tener, la llamada a cruzar el umbral sin garantías.
Me da miedo dejar de sentir miedo, como despojar a Sísifo de su piedra sin pensar en el costo.
Aceptamos nuestro lugar, reconocemos nuestras limitaciones y confrontamos la noche más oscura.
En la cima del abismo descubrimos que la belleza es la marca de la eficacia y del poder divino.
Donde ser honesto te lleva a la transformación, y donde la entrega transmuta el conflicto en elixir integrador.`;

export const RAW_SAMPLE_SCENES: Omit<NarrativeNode, "q" | "tau" | "t" | "T" | "D" | "xy">[] = [
  {
    id: "esc-1",
    i: 1,
    resumen: "Mundo Ordinario: El protagonista convive con un vacío basal y temor a la pérdida.",
    s: 0,
    c: 0, // Material
    a: 0, // El Loco / Salto al vacío
    p: -1, // Receptivo
    delta: 0.18,
    iota: 0.25,
  },
  {
    id: "esc-2",
    i: 2,
    resumen: "Llamado: El héroe desafiante decide actuar impulsado por la carencia.",
    s: 1,
    c: 2, // Volitivo / Poder
    a: 1, // El Mago / Iniciativa
    p: 1, // Activo
    delta: 0.42,
    iota: 0.75,
  },
  {
    id: "esc-3",
    i: 3,
    resumen: "Rechazo: El guardián impone suspensión y advierte sobre el costo del apego.",
    s: 2,
    c: 3, // Relacional / Vínculo
    a: 12, // El Colgado / Suspensión
    p: -1, // Receptivo
    delta: 0.55,
    iota: 0.85,
  },
  {
    id: "esc-4",
    i: 4,
    resumen: "Mentor: Revelación de leyes y límites del mundo interior.",
    s: 3,
    c: 4, // Expresivo / Revelación
    a: 4, // El Emperador / Ley
    p: 1, // Activo
    delta: 0.48,
    iota: 0.6,
  },
  {
    id: "esc-5",
    i: 5,
    resumen: "Cruce del Umbral: Salida definitiva hacia el territorio desconocido.",
    s: 4,
    c: 1, // Emocional
    a: 7, // El Carro / Avance
    p: 1, // Activo
    delta: 0.62,
    iota: 0.78,
  },
  {
    id: "esc-6",
    i: 6,
    resumen: "Pruebas y Aliados: Fricción estratégica y confrontación dialéctica.",
    s: 5,
    c: 5, // Estratégico
    a: 6, // Los Enamorados / Elección
    p: -1, // Receptivo
    delta: 0.7,
    iota: 0.68,
  },
  {
    id: "esc-7",
    i: 7,
    resumen: "Cueva Profunda: Aproximación al núcleo de máxima vulnerabilidad.",
    s: 6,
    c: 1, // Emocional
    a: 9, // El Ermitaño / Introspección
    p: -1, // Receptivo
    delta: 0.75,
    iota: 0.82,
  },
  {
    id: "esc-8",
    i: 8,
    resumen: "Calvario Supremo: Ruptura catastrófica y colapso de la ilusión previa.",
    s: 7,
    c: 2, // Volitivo
    a: 16, // La Torre / Colapso
    p: 1, // Activo
    delta: 0.94,
    iota: 0.92,
  },
  {
    id: "esc-9",
    i: 9,
    resumen: "Recompensa: Epifanía y rescate del elixir conceptual en la calma.",
    s: 8,
    c: 6, // Trascendental / Sentido
    a: 17, // La Estrella / Esperanza
    p: -1, // Receptivo
    delta: 0.38,
    iota: 0.7,
  },
  {
    id: "esc-10",
    i: 10,
    resumen: "Camino de Regreso: Persecución y asimilación de la inercia dramática.",
    s: 9,
    c: 3, // Relacional
    a: 14, // La Templanza / Integración
    p: 1, // Activo
    delta: 0.65,
    iota: 0.62,
  },
  {
    id: "esc-11",
    i: 11,
    resumen: "Resurrección: Última prueba donde la muerte simbólica sella el destino.",
    s: 10,
    c: 2, // Volitivo
    a: 20, // El Juicio / Reconocimiento
    p: 1, // Activo
    delta: 0.88,
    iota: 0.86,
  },
  {
    id: "esc-12",
    i: 12,
    resumen: "Retorno con el Elixir: Cierre armónico e integración total de planos.",
    s: 11,
    c: 6, // Trascendental
    a: 21, // El Mundo / Integración Total
    p: -1, // Receptivo
    delta: 0.28,
    iota: 0.45,
  },
];

export const getInitialNarrativeNodes = (): NarrativeNode[] => {
  const processed = procesarDinamicaFlujo(
    RAW_SAMPLE_SCENES.map((raw) => ({
      ...raw,
      q: 0,
      tau: 0,
      t: 0,
      T: 0,
      D: 0,
    }))
  );

  return processed.map((node) => ({
    ...node,
    xy: getMandalaCoordinates(node.s, node.c, node.a),
  }));
};
