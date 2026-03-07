/**
 * Señales predefinidas para convolución continua
 * f(t) definida para t ∈ [-T/2, T/2], extendida periódicamente
 */

import type { SignalFunction } from './fourier';

function normalizePhase(t: number, T: number): number {
  return ((t / T + 0.5) % 1 + 1) % 1;
}

export const squareWave: SignalFunction = (t) => {
  const T = 1;
  const phase = normalizePhase(t, T);
  return phase < 0.5 ? -1 : 1;
};

export const sawtoothWave: SignalFunction = (t) => {
  const T = 1;
  const phase = normalizePhase(t, T);
  return 2 * phase - 1;
};

export const triangleWave: SignalFunction = (t) => {
  const T = 1;
  const phase = normalizePhase(t, T);
  return 4 * Math.abs(phase - 0.5) - 1;
};

export const sineWave: SignalFunction = (t) => {
  const T = 1;
  return Math.sin((2 * Math.PI * t) / T);
};

export const createRectangularPulse = (dutyCycle: number): SignalFunction => {
  const d = Math.max(0.01, Math.min(0.99, dutyCycle));
  return (t) => {
    const T = 1;
    const phase = normalizePhase(t, T);
    return phase < d ? 1 : 0;
  };
};

export type SignalId =
  | 'square'
  | 'sawtooth'
  | 'triangle'
  | 'sine'
  | 'rect'
  | 'piecewise'
  | 'custom';

export const SIGNAL_OPTIONS: Record<
  Exclude<SignalId, 'custom' | 'piecewise'>,
  { label: string; fn: SignalFunction }
> = {
  square: { label: 'Onda cuadrada', fn: squareWave },
  sawtooth: { label: 'Diente de sierra', fn: sawtoothWave },
  triangle: { label: 'Onda triangular', fn: triangleWave },
  sine: { label: 'Sinusoidal', fn: sineWave },
  rect: {
    label: 'Pulso rectangular',
    fn: createRectangularPulse(0.25),
  },
};

export const CUSTOM_LABEL = 'Expresión personalizada';
