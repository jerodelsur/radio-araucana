// Tokens de diseño compartidos del módulo /frontera/extractos.
// Paleta heredada de Radio La Frontera (FronteraApp.jsx) con acentos editoriales
// para el contexto institucional/legal del servicio (PRD §8).

export const T = Object.freeze({
  green: "#4EA552",
  greenMid: "#56AF57",
  greenDark: "#0d2410",
  greenInk: "#13321a",
  greenSoft: "#1a3a1e",
  cream: "#f6f5ee",
  paper: "#efe9d4",
  ink: "#0a1f0d",
  inkSoft: "#3a4a3c",
  inkMute: "#6c7569",
  border: "#d8d2bd",
  borderStrong: "#1a3a1e",
  terracota: "#B5481E",
  oro: "#C9923C",
  danger: "#c53e1f",
  warn: "#a06b18",
  ok: "#2f7d39",
});

export const FONTS = Object.freeze({
  display: "'Fraunces', Georgia, 'Times New Roman', serif",
  body: "'Manrope', system-ui, -apple-system, 'Segoe UI', sans-serif",
  mono: "'IBM Plex Mono', ui-monospace, SFMono-Regular, Menlo, monospace",
  bookman: '"Bookman Old Style", "URW Bookman L", "ITC Bookman", "Bitstream Charter", Georgia, serif',
});

/** Helper de merge de estilos in-line, pensado en línea con el patrón del repo. */
export function S(...objs) {
  return Object.assign({}, ...objs.filter(Boolean));
}
