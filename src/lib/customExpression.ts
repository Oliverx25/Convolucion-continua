/**
 * Parser de expresiones matemáticas para convolución
 * Variable: t. Período T para extensión periódica.
 */

import { create, all } from 'mathjs';
import type { SignalFunction } from './fourier';

const math = create(all);

function wrapToPeriod(t: number, T: number): number {
  return t - T * Math.floor((t + T / 2) / T);
}

export function createCustomSignal(
  expression: string,
  T: number
): SignalFunction | null {
  const trimmed = expression.trim();
  if (!trimmed) return null;

  try {
    const compiled = math.compile(trimmed);
    const scope: { t: number } = { t: 0 };

    return (t: number): number => {
      const tWrapped = wrapToPeriod(t, T);
      scope.t = tWrapped;
      const result = compiled.evaluate(scope);
      return typeof result === 'number' && Number.isFinite(result) ? result : 0;
    };
  } catch {
    return null;
  }
}
