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
