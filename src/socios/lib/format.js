const clpFmt = new Intl.NumberFormat("es-CL", {
  style: "currency",
  currency: "CLP",
  maximumFractionDigits: 0,
});

export function formatPesos(n) {
  if (n == null || isNaN(n)) return "$0";
  return clpFmt.format(Number(n));
}

export function formatMes(yyyymm) {
  if (!yyyymm) return "";
  const [y, m] = yyyymm.split("-");
  const fecha = new Date(Number(y), Number(m) - 1, 1);
  return fecha.toLocaleDateString("es-CL", { month: "long", year: "numeric" });
}

export function mesLabel(yyyymm) {
  if (!yyyymm) return "";
  const [y, m] = yyyymm.split("-");
  const fecha = new Date(Number(y), Number(m) - 1, 1);
  const mes = fecha.toLocaleDateString("es-CL", { month: "long" });
  return `${mes.charAt(0).toUpperCase()}${mes.slice(1)} ${y}`;
}

export function currentMes() {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
}
