/**
 * Convolución continua en tiempo
 *
 * (f * g)(t) = ∫ f(τ) g(t - τ) dτ
 *
 * Se aproxima la integral numéricamente en la ventana [τ_min, τ_max].
 */

export type SignalFunction = (t: number) => number;

/**
 * Calcula la convolución continua (f*g)(t) para un rango de tiempos.
 * Integración por regla del trapecio.
 *
 * @param f - Primera señal
 * @param g - Segunda señal
 * @param tauMin - Límite inferior de integración (τ)
 * @param tauMax - Límite superior de integración (τ)
 * @param nSamples - Número de puntos en la integral
 * @param outputTimes - Valores de t para los que se calcula (f*g)(t)
 */
export function computeConvolution(
  f: SignalFunction,
  g: SignalFunction,
  tauMin: number,
  tauMax: number,
  nSamples: number,
  outputTimes: number[]
): number[] {
  const dTau = (tauMax - tauMin) / (nSamples - 1);
  const result: number[] = [];

  for (const t of outputTimes) {
    let integral = 0;
    for (let k = 0; k < nSamples; k++) {
      const tau = tauMin + k * dTau;
      const weight = k === 0 || k === nSamples - 1 ? 0.5 : 1;
      integral += weight * f(tau) * g(t - tau);
    }
    result.push(dTau * integral);
  }

  return result;
}

/**
 * Genera un array de tiempos equiespaciados
 */
export function linspace(tMin: number, tMax: number, n: number): number[] {
  const out: number[] = [];
  const step = n === 1 ? 0 : (tMax - tMin) / (n - 1);
  for (let i = 0; i < n; i++) {
    out.push(tMin + i * step);
  }
  return out;
}

/**
 * Calcula un dominio Y fijo para el gráfico de animación (f(τ), g(t−τ), producto)
 * para que la escala vertical no cambie durante la animación.
 * Muestrea f en [tMin, tMax], g en [tMin−tMax, tMax−tMin] (rango de t−τ) y
 * acota el producto por las combinaciones de los extremos.
 */
export function computeAnimationYDomain(
  f: SignalFunction,
  g: SignalFunction,
  tMin: number,
  tMax: number,
  nSample = 200
): [number, number] {
  const tauPoints = linspace(tMin, tMax, nSample);
  const gArgMin = tMin - tMax;
  const gArgMax = tMax - tMin;
  const gPoints = linspace(gArgMin, gArgMax, nSample);

  let minF = Infinity;
  let maxF = -Infinity;
  for (const t of tauPoints) {
    const v = f(t);
    if (Number.isFinite(v)) {
      if (v < minF) minF = v;
      if (v > maxF) maxF = v;
    }
  }
  let minG = Infinity;
  let maxG = -Infinity;
  for (const t of gPoints) {
    const v = g(t);
    if (Number.isFinite(v)) {
      if (v < minG) minG = v;
      if (v > maxG) maxG = v;
    }
  }
  if (minF === Infinity) minF = 0;
  if (maxF === -Infinity) maxF = 0;
  if (minG === Infinity) minG = 0;
  if (maxG === -Infinity) maxG = 0;

  const productCandidates = [
    minF * minG,
    minF * maxG,
    maxF * minG,
    maxF * maxG,
  ];
  const minProduct = Math.min(...productCandidates);
  const maxProduct = Math.max(...productCandidates);

  const yMin = Math.min(minF, minG, minProduct);
  const yMax = Math.max(maxF, maxG, maxProduct);
  const span = yMax - yMin || 1;
  const padding = Math.max(span * 0.1, 0.2);
  const low = yMin - padding;
  const high = yMax + padding;
  const maxSpan = 50;
  if (high - low > maxSpan) {
    const mid = (low + high) / 2;
    return [mid - maxSpan / 2, mid + maxSpan / 2];
  }
  if (!Number.isFinite(low) || !Number.isFinite(high)) {
    return [-1.5, 1.5];
  }
  return [low, high];
}
