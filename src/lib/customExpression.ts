/**
 * Parser de expresiones para convolución continua
 * Variable: t (tiempo real). Se evalúa f(t) en cada t sin extensión periódica,
 * para que puedas definir pulsos únicos o señales no periódicas (periodo infinito).
 */

import { create, all } from 'mathjs';
import type { SignalFunction } from './convolution';

const math = create(all);

export interface ValidationResult {
  valid: boolean;
  error?: string;
}

/**
 * Valida la sintaxis de una expresión sin crear la señal.
 * Útil para resaltar errores en tiempo real en la UI.
 */
export function validateExpression(expression: string): ValidationResult {
  const trimmed = expression.trim();
  if (!trimmed) return { valid: false, error: 'Escribe una expresión' };

  try {
    math.compile(trimmed);
    const scope: { t: number } = { t: 0 };
    const compiled = math.compile(trimmed);
    compiled.evaluate(scope);
    return { valid: true };
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    return { valid: false, error: message };
  }
}

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

export interface PiecewiseInterval {
  a: number;
  b: number;
  expr: string;
}

/**
 * Parsea texto de función a trozos. Una línea por intervalo: "a b expr"
 * Ejemplo: "0 1 1" → en [0,1] vale 1; "1 2 -1" → en [1,2] vale -1.
 */
export function parsePiecewiseText(text: string): PiecewiseInterval[] | null {
  const lines = text.trim().split(/\r?\n/).filter((l) => l.trim());
  const intervals: PiecewiseInterval[] = [];
  for (const line of lines) {
    const parts = line.trim().split(/\s+/);
    if (parts.length < 3) return null;
    const a = parseFloat(parts[0]);
    const b = parseFloat(parts[1]);
    if (Number.isNaN(a) || Number.isNaN(b) || a > b) return null;
    const expr = parts.slice(2).join(' ').trim();
    if (!expr) return null;
    intervals.push({ a, b, expr });
  }
  return intervals.length > 0 ? intervals : null;
}

/**
 * Crea una señal a trozos a partir de intervalos [a, b] con expresión expr.
 * Si t está en varios intervalos (solapamiento), se usa el primero que coincida.
 */
export function createPiecewiseSignal(
  intervals: PiecewiseInterval[]
): SignalFunction | null {
  if (intervals.length === 0) return null;
  const compiled = intervals.map(({ expr }) => {
    try {
      return math.compile(expr);
    } catch {
      return null;
    }
  });
  if (compiled.some((c) => c === null)) return null;
  const scope: { t: number } = { t: 0 };
  return (t: number): number => {
    for (let i = 0; i < intervals.length; i++) {
      const { a, b } = intervals[i];
      if (t >= a && t <= b) {
        const c = compiled[i];
        if (!c) return 0;
        scope.t = t;
        try {
          const result = c.evaluate(scope);
          return typeof result === 'number' && Number.isFinite(result) ? result : 0;
        } catch {
          return 0;
        }
      }
    }
    return 0;
  };
}
