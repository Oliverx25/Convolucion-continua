/**
 * Parser de expresiones para convolución continua
 * Variable: t (tiempo real). Se evalúa f(t) en cada t sin extensión periódica,
 * para que puedas definir pulsos únicos o señales no periódicas (periodo infinito).
 */

import { create, all } from 'mathjs';
import type { SignalFunction } from './fourier';

const math = create(all);

export function createCustomSignal(
  expression: string,
  _T: number
): SignalFunction | null {
  const trimmed = expression.trim();
  if (!trimmed) return null;

  try {
    const compiled = math.compile(trimmed);
    const scope: { t: number } = { t: 0 };

    return (t: number): number => {
      scope.t = t;
      try {
        const result = compiled.evaluate(scope);
        return typeof result === 'number' && Number.isFinite(result) ? result : 0;
      } catch {
        return 0;
      }
    };
  } catch {
    return null;
  }
}
