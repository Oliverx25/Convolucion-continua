/**
 * Formatea un valor para etiquetas de ejes: máximo 2–3 decimales
 * y notación compacta para números muy grandes o muy pequeños.
 */
export function formatAxisTick(value: number): string {
  if (value === 0) return '0';
  const abs = Math.abs(value);
  if (abs >= 10000 || (abs < 0.01 && abs > 0)) {
    return value.toExponential(2).replace('e+', 'e').replace('e0', 'e');
  }
  const decimals = abs >= 100 ? 0 : abs >= 1 ? 2 : 3;
  const formatted = value.toFixed(decimals);
  return Number(formatted).toString();
}
