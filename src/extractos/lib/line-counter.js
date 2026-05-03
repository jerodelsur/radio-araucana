// Conteo de líneas tipográficas, replicando el método de la radio:
// MS Word con texto en Bookman Old Style 12pt, ancho útil ~16cm.
// PRD §6.2.
//
// IMPORTANTE: el conteo es referencial — Bookman Old Style puede no estar
// instalada en todos los dispositivos del cliente. La operadora puede
// ajustar líneas+precio desde el dashboard antes de marcar como pagado.

const FONT_STACK =
  '"Bookman Old Style", "URW Bookman L", "ITC Bookman", "Bitstream Charter", Georgia, serif';
// 16cm ≈ 605px @ 96dpi. Mantengo cm para que Chrome calcule en device-pixels.
const TEXT_WIDTH_CM = 16;
// 12pt @ line-height:1 ≈ 16px. Usamos exactamente 16 para evitar drift por sub-pixel.
const LINE_PX = 16;

/** @typedef {{ container: HTMLDivElement, dispose: () => void }} HiddenNode */

/**
 * Crea un nodo DOM oculto fuera de pantalla, configurado igual que Word
 * para medir layout.
 * @returns {HiddenNode}
 */
function createHiddenNode() {
  const container = document.createElement("div");
  container.setAttribute("aria-hidden", "true");
  container.style.cssText = [
    "position: absolute",
    "top: -10000px",
    "left: -10000px",
    "visibility: hidden",
    "pointer-events: none",
    `width: ${TEXT_WIDTH_CM}cm`,
    `font-family: ${FONT_STACK}`,
    "font-size: 12pt",
    "line-height: 1",
    "white-space: pre-wrap",
    "word-wrap: break-word",
    "overflow-wrap: break-word",
    "letter-spacing: 0",
    "padding: 0",
    "margin: 0",
    "border: 0",
  ].join(";");
  document.body.appendChild(container);
  return {
    container,
    dispose: () => {
      if (container.parentNode) container.parentNode.removeChild(container);
    },
  };
}

/**
 * Cuenta líneas para un texto dado, usando un nodo oculto único.
 * @param {string} text
 * @returns {number} cantidad de líneas (entero ≥ 0).
 */
export function countLines(text) {
  if (typeof window === "undefined" || typeof document === "undefined") return 0;
  if (!text) return 0;

  const node = createHiddenNode();
  try {
    node.container.textContent = text;
    // Forzar layout. offsetHeight sincroniza.
    const height = node.container.offsetHeight;
    if (!height) return 0;
    return Math.max(1, Math.ceil(height / LINE_PX));
  } finally {
    node.dispose();
  }
}

/**
 * Hook-style helper que reusa un único nodo oculto vivo durante el lifecycle
 * del cotizador. Más eficiente que crear/destruir un nodo en cada keystroke.
 * Devuelve { measure(text), dispose() }.
 */
export function createLineMeter() {
  if (typeof window === "undefined" || typeof document === "undefined") {
    return { measure: () => 0, dispose: () => {} };
  }
  const node = createHiddenNode();
  return {
    /** @param {string} text */
    measure(text) {
      if (!text) {
        node.container.textContent = "";
        return 0;
      }
      node.container.textContent = text;
      const height = node.container.offsetHeight;
      if (!height) return 0;
      return Math.max(1, Math.ceil(height / LINE_PX));
    },
    dispose: node.dispose,
  };
}

export const LINE_COUNTER_FONT_STACK = FONT_STACK;
export const LINE_COUNTER_WIDTH_CM = TEXT_WIDTH_CM;
