import { useMemo, useState, useEffect, useRef } from 'react';
import { computeConvolution, linspace } from './lib/convolution';
import { createCustomSignal, validateExpression, createPiecewiseSignal, parsePiecewiseText } from './lib/customExpression';
import {
  SIGNAL_OPTIONS,
  CUSTOM_LABEL,
  type SignalId,
} from './lib/signals';
import { TimeChart } from './components/TimeChart';
import { SlidingAnimationChart } from './components/SlidingAnimationChart';

const T = 1;
const RANGE_MIN = 0.5;
const RANGE_MAX = 50;
const RANGE_DEFAULT = 2;
const N_POINTS = 400;
const N_INTEGRAL = 600;
const ANIMATION_DURATION_MS = 5000;
const DEFAULT_CUSTOM_EXPRESSION = 'sin(2*pi*t)';
const DEFAULT_PIECEWISE = '0 1 1\n1 2 -1';

function App() {
  const [signalIdF, setSignalIdF] = useState<SignalId>('sine');
  const [customExprF, setCustomExprF] = useState(DEFAULT_CUSTOM_EXPRESSION);
  const [piecewiseF, setPiecewiseF] = useState(DEFAULT_PIECEWISE);
  const [signalIdG, setSignalIdG] = useState<SignalId>('rect');
  const [customExprG, setCustomExprG] = useState('1');
  const [piecewiseG, setPiecewiseG] = useState(DEFAULT_PIECEWISE);
  const [range, setRange] = useState(RANGE_DEFAULT);
  const [animationT, setAnimationT] = useState(-RANGE_DEFAULT);
  const [isAnimating, setIsAnimating] = useState(false);
  const animRef = useRef<number>(0);
  const startRef = useRef<number>(0);
  const elapsedRef = useRef<number>(0);

  const tMin = -range;
  const tMax = range;

  useEffect(() => {
    setAnimationT(tMin);
  }, [tMin, tMax]);

  useEffect(() => {
    if (!isAnimating) return;
    startRef.current = performance.now() - elapsedRef.current;
    const run = () => {
      const elapsed = performance.now() - startRef.current;
      elapsedRef.current = elapsed;
      const progress = Math.min(1, elapsed / ANIMATION_DURATION_MS);
      const t = tMin + progress * (tMax - tMin);
      setAnimationT(t);
      if (progress < 1) {
        animRef.current = requestAnimationFrame(run);
      } else {
        setIsAnimating(false);
      }
    };
    animRef.current = requestAnimationFrame(run);
    return () => cancelAnimationFrame(animRef.current);
  }, [isAnimating, tMin, tMax]);

  const handleRestart = () => {
    setIsAnimating(false);
    cancelAnimationFrame(animRef.current);
    elapsedRef.current = 0;
    setAnimationT(tMin);
  };

  const handlePause = () => {
    setIsAnimating(false);
    cancelAnimationFrame(animRef.current);
    elapsedRef.current = performance.now() - startRef.current;
  };

  const handlePlay = () => {
    const atEnd = animationT >= tMax - (tMax - tMin) / N_POINTS;
    if (atEnd) {
      elapsedRef.current = 0;
      setAnimationT(tMin);
    }
    setIsAnimating(true);
  };

  const canResume =
    !isAnimating &&
    animationT > tMin + (tMax - tMin) / N_POINTS &&
    animationT < tMax - (tMax - tMin) / N_POINTS;

  const validationF = useMemo(
    () => (signalIdF === 'custom' ? validateExpression(customExprF) : { valid: true as const }),
    [signalIdF, customExprF]
  );
  const validationG = useMemo(
    () => (signalIdG === 'custom' ? validateExpression(customExprG) : { valid: true as const }),
    [signalIdG, customExprG]
  );

  const f = useMemo(() => {
    if (signalIdF === 'custom') return createCustomSignal(customExprF, T);
    if (signalIdF === 'piecewise') {
      const intervals = parsePiecewiseText(piecewiseF);
      return intervals ? createPiecewiseSignal(intervals) : null;
    }
    return SIGNAL_OPTIONS[signalIdF].fn;
  }, [signalIdF, customExprF, piecewiseF]);

  const g = useMemo(() => {
    if (signalIdG === 'custom') return createCustomSignal(customExprG, T);
    if (signalIdG === 'piecewise') {
      const intervals = parsePiecewiseText(piecewiseG);
      return intervals ? createPiecewiseSignal(intervals) : null;
    }
    return SIGNAL_OPTIONS[signalIdG].fn;
  }, [signalIdG, customExprG, piecewiseG]);

  const { dataConv, convYDomain, isValid } = useMemo(() => {
    const validF = !!f;
    const validG = !!g;
    if (!validF || !validG) {
      return {
        dataConv: [] as { t: number; value: number }[],
        convYDomain: [0, 1] as [number, number],
        isValid: false,
      };
    }

    const outputTimes = linspace(tMin, tMax, N_POINTS);
    const convValues = computeConvolution(
      f!,
      g!,
      tMin,
      tMax,
      N_INTEGRAL,
      outputTimes
    );

    const dataConv = outputTimes.map((t, i) => ({ t, value: convValues[i] }));

    const convValuesOnly = dataConv.map((p) => p.value);
    const convMin = convValuesOnly.length
      ? Math.min(...convValuesOnly)
      : 0;
    const convMax = convValuesOnly.length
      ? Math.max(...convValuesOnly)
      : 1;
    const rangeY = convMax - convMin;
    const padding = rangeY > 0.01
      ? Math.max(0.2, rangeY * 0.15)
      : 0.2;
    const convYDomain: [number, number] = [
      convMin - padding,
      convMax + padding,
    ];

    return { dataConv, convYDomain, isValid: true };
  }, [f, g, range]);

  const dataConvVisible = useMemo(() => {
    return dataConv.map((p) =>
      p.t <= animationT ? p : { t: p.t, value: null as number | null }
    );
  }, [dataConv, animationT]);

  const xDomain: [number, number] = [tMin, tMax];

  const convChartRef = useRef<HTMLDivElement>(null);

  const handleExportCSV = () => {
    const header = 't (s), (f*g)(t)';
    const rows = dataConv.map((p) => `${p.t},${p.value}`);
    const csv = [header, ...rows].join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'convolucion.csv';
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleExportSVG = () => {
    const container = convChartRef.current;
    const svg = container?.querySelector('svg');
    if (!svg) return;
    const serializer = new XMLSerializer();
    const str = serializer.serializeToString(svg);
    const blob = new Blob([str], { type: 'image/svg+xml;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'convolucion.svg';
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="min-h-screen bg-[#0f0f12] text-zinc-100">
      <header className="border-b border-zinc-800/80 bg-zinc-900/50 backdrop-blur">
        <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
          <h1 className="font-display text-2xl font-semibold tracking-tight text-violet-400 sm:text-3xl">
            Convolución continua
          </h1>
          <p className="mt-1 text-sm text-zinc-400">
            (f * g)(t) = ∫ f(τ) g(t − τ) dτ
          </p>
        </div>
      </header>

      <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="space-y-8">
          <section className="rounded-xl border border-zinc-800/60 bg-zinc-900/30 p-6">
            <h2 className="mb-4 font-display text-lg font-medium text-zinc-200">
              Señales
            </h2>
            <div className="grid gap-6 sm:grid-cols-2">
              <div className="space-y-4">
                <label className="block text-sm font-medium text-zinc-400">
                  Señal f(t)
                </label>
                <select
                  value={signalIdF}
                  onChange={(e) => setSignalIdF(e.target.value as SignalId)}
                  className="w-full rounded-lg border border-zinc-700 bg-zinc-800/80 px-4 py-2.5 font-display text-sm text-zinc-100 focus:border-violet-500 focus:outline-none focus:ring-1 focus:ring-violet-500"
                >
                  {(Object.entries(SIGNAL_OPTIONS) as [Exclude<SignalId, 'custom' | 'piecewise'>, { label: string }][]).map(
                    ([id, { label }]) => (
                      <option key={id} value={id}>
                        {label}
                      </option>
                    )
                  )}
                  <option value="piecewise">Función a trozos</option>
                  <option value="custom">{CUSTOM_LABEL}</option>
                </select>
                {signalIdF === 'custom' && (
                  <div className="space-y-1">
                    <input
                      type="text"
                      value={customExprF}
                      onChange={(e) => setCustomExprF(e.target.value)}
                      placeholder="sin(2*pi*t)"
                      className={`w-full rounded-lg border px-4 py-2.5 font-mono text-sm focus:outline-none focus:ring-1 ${
                        validationF.valid
                          ? 'border-zinc-700 bg-zinc-800/80 text-zinc-100 focus:border-violet-500 focus:ring-violet-500'
                          : 'border-red-500/60 bg-zinc-800/80 text-red-200 focus:border-red-500 focus:ring-red-500'
                      }`}
                    />
                    {!validationF.valid && validationF.error && (
                      <p className="text-xs text-red-400" role="alert">
                        {validationF.error}
                      </p>
                    )}
                  </div>
                )}
                {signalIdF === 'piecewise' && (
                  <div className="space-y-1">
                    <textarea
                      value={piecewiseF}
                      onChange={(e) => setPiecewiseF(e.target.value)}
                      placeholder="0 1 1&#10;1 2 -1"
                      rows={4}
                      className={`w-full rounded-lg border px-4 py-2.5 font-mono text-sm focus:outline-none focus:ring-1 ${
                        !!f
                          ? 'border-zinc-700 bg-zinc-800/80 text-zinc-100 focus:border-violet-500 focus:ring-violet-500'
                          : 'border-red-500/60 bg-zinc-800/80 text-red-200 focus:border-red-500 focus:ring-red-500'
                      }`}
                    />
                    <p className="text-xs text-zinc-500">
                      Una línea por intervalo: <code className="rounded bg-zinc-700/80 px-1">a b expr</code> — en [a, b] se usa la expresión (variable t). Ej: 0 1 1 → valor 1 en [0,1].
                    </p>
                  </div>
                )}
              </div>
              <div className="space-y-4">
                <label className="block text-sm font-medium text-zinc-400">
                  Señal g(t)
                </label>
                <select
                  value={signalIdG}
                  onChange={(e) => setSignalIdG(e.target.value as SignalId)}
                  className="w-full rounded-lg border border-zinc-700 bg-zinc-800/80 px-4 py-2.5 font-display text-sm text-zinc-100 focus:border-violet-500 focus:outline-none focus:ring-1 focus:ring-violet-500"
                >
                  {(Object.entries(SIGNAL_OPTIONS) as [Exclude<SignalId, 'custom' | 'piecewise'>, { label: string }][]).map(
                    ([id, { label }]) => (
                      <option key={id} value={id}>
                        {label}
                      </option>
                    )
                  )}
                  <option value="piecewise">Función a trozos</option>
                  <option value="custom">{CUSTOM_LABEL}</option>
                </select>
                {signalIdG === 'custom' && (
                  <div className="space-y-1">
                    <input
                      type="text"
                      value={customExprG}
                      onChange={(e) => setCustomExprG(e.target.value)}
                      placeholder="1"
                      className={`w-full rounded-lg border px-4 py-2.5 font-mono text-sm focus:outline-none focus:ring-1 ${
                        validationG.valid
                          ? 'border-zinc-700 bg-zinc-800/80 text-zinc-100 focus:border-violet-500 focus:ring-violet-500'
                          : 'border-red-500/60 bg-zinc-800/80 text-red-200 focus:border-red-500 focus:ring-red-500'
                      }`}
                    />
                    {!validationG.valid && validationG.error && (
                      <p className="text-xs text-red-400" role="alert">
                        {validationG.error}
                      </p>
                    )}
                  </div>
                )}
                {signalIdG === 'piecewise' && (
                  <div className="space-y-1">
                    <textarea
                      value={piecewiseG}
                      onChange={(e) => setPiecewiseG(e.target.value)}
                      placeholder="0 1 1&#10;1 2 -1"
                      rows={4}
                      className={`w-full rounded-lg border px-4 py-2.5 font-mono text-sm focus:outline-none focus:ring-1 ${
                        !!g
                          ? 'border-zinc-700 bg-zinc-800/80 text-zinc-100 focus:border-violet-500 focus:ring-violet-500'
                          : 'border-red-500/60 bg-zinc-800/80 text-red-200 focus:border-red-500 focus:ring-red-500'
                      }`}
                    />
                    <p className="text-xs text-zinc-500">
                      Una línea por intervalo: <code className="rounded bg-zinc-700/80 px-1">a b expr</code> — en [a, b] se usa la expresión (variable t).
                    </p>
                  </div>
                )}
              </div>
            </div>
            <div className="mt-6 flex flex-wrap items-end gap-4 border-t border-zinc-700/50 pt-6">
              <div>
                <label
                  htmlFor="range"
                  className="mb-2 block text-sm font-medium text-zinc-400"
                >
                  Rango de la gráfica (eje t)
                </label>
                <div className="flex items-center gap-2">
                  <input
                    id="range"
                    type="number"
                    min={RANGE_MIN}
                    max={RANGE_MAX}
                    step={0.5}
                    value={range}
                    onChange={(e) => {
                      const v = parseFloat(e.target.value);
                      if (!Number.isNaN(v))
                        setRange(Math.max(RANGE_MIN, Math.min(RANGE_MAX, v)));
                    }}
                    className="w-24 rounded-lg border border-zinc-700 bg-zinc-800/80 px-4 py-2.5 font-display text-sm text-zinc-100 focus:border-violet-500 focus:outline-none focus:ring-1 focus:ring-violet-500"
                  />
                  <span className="text-sm text-zinc-500">
                    t ∈ [−{range}, {range}]
                  </span>
                </div>
              </div>
              <div className="flex gap-2">
                {[2, 5, 10, 20].map((r) => (
                  <button
                    key={r}
                    type="button"
                    onClick={() => setRange(r)}
                    className={`rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
                      range === r
                        ? 'bg-violet-600 text-white'
                        : 'bg-zinc-700/80 text-zinc-300 hover:bg-zinc-600/80'
                    }`}
                  >
                    ±{r}
                  </button>
                ))}
              </div>
            </div>
            {(!f || !g) && (
              <p className="mt-3 text-xs text-red-400">
                Expresiones inválidas. Usa la variable t (ej: sin(2*pi*t)).
              </p>
            )}
            {(signalIdF === 'custom' || signalIdG === 'custom' || signalIdF === 'piecewise' || signalIdG === 'piecewise') && (!!f || !!g) && (
              <p className="mt-3 text-xs text-zinc-500">
                Expresión personalizada: se evalúa en tiempo real t (no periódica). Función a trozos: una línea por intervalo con formato a b expr.
              </p>
            )}
            <p className="mt-4 text-xs text-zinc-500">
              Ventana de integración τ ∈ [{tMin}, {tMax}] · {N_INTEGRAL} puntos
            </p>
          </section>

          {isValid && dataConv.length > 0 && (
            <section className="rounded-xl border border-zinc-800/60 bg-zinc-900/30 p-6">
              <h2 className="mb-4 font-display text-lg font-medium text-zinc-200">
                Animación didáctica
              </h2>
              <p className="mb-4 text-sm text-zinc-400">
                f(τ) y g(t − τ) en el eje τ. Al reproducir, g se desliza y la convolución (abajo) se va formando. El área del integrando f(τ)·g(t−τ) se colorea en verde cuando es positiva y en rojo cuando es negativa.
              </p>
              <div className="mb-4 flex flex-wrap items-center gap-3">
                <button
                  type="button"
                  onClick={isAnimating ? handlePause : handlePlay}
                  className={`rounded-lg px-4 py-2 text-sm font-medium text-white ${
                    isAnimating
                      ? 'border border-amber-500/60 bg-amber-500/20 text-amber-200 hover:bg-amber-500/30'
                      : 'bg-violet-600 hover:bg-violet-500'
                  }`}
                >
                  {isAnimating
                    ? 'Pausar'
                    : canResume
                      ? 'Reanudar'
                      : 'Reproducir animación'}
                </button>
                <button
                  type="button"
                  onClick={handleRestart}
                  className="rounded-lg border border-zinc-600 bg-zinc-800/80 px-4 py-2 text-sm font-medium text-zinc-300 hover:bg-zinc-700/80"
                >
                  Reiniciar
                </button>
                <span className="flex items-center text-sm text-zinc-500">
                  t = {animationT.toFixed(2)} s
                </span>
              </div>
              <div className="mb-4">
                <label htmlFor="time-slider" className="mb-2 block text-sm font-medium text-zinc-400">
                  Mover tiempo t manualmente (flip & shift)
                </label>
                <input
                  id="time-slider"
                  type="range"
                  min={tMin}
                  max={tMax}
                  step={(tMax - tMin) / 300}
                  value={animationT}
                  onChange={(e) => setAnimationT(parseFloat(e.target.value))}
                  className="h-2 w-full max-w-md cursor-pointer appearance-none rounded-lg bg-zinc-700 accent-violet-500"
                />
              </div>
              <SlidingAnimationChart
                f={f!}
                g={g!}
                tMin={tMin}
                tMax={tMax}
                currentT={animationT}
              />
            </section>
          )}

          <section className="rounded-xl border border-zinc-800/60 bg-zinc-900/30 p-6">
            <h2 className="mb-4 font-display text-lg font-medium text-zinc-200">
              Convolución (f * g)(t)
            </h2>
            {dataConv.length > 0 ? (
              <>
                <p className="mb-4 text-sm text-zinc-400">
                  Eje t fijo: la curva (f * g)(t) se dibuja al reproducir la animación, como un monitor de latidos.
                </p>
                <div className="mb-4 flex flex-wrap gap-2">
                  <button
                    type="button"
                    onClick={handleExportCSV}
                    className="rounded-lg border border-zinc-600 bg-zinc-800/80 px-3 py-2 text-sm font-medium text-zinc-300 hover:bg-zinc-700/80"
                  >
                    Descargar CSV
                  </button>
                  <button
                    type="button"
                    onClick={handleExportSVG}
                    className="rounded-lg border border-zinc-600 bg-zinc-800/80 px-3 py-2 text-sm font-medium text-zinc-300 hover:bg-zinc-700/80"
                  >
                    Descargar gráfica (SVG)
                  </button>
                </div>
                <div ref={convChartRef}>
                  <TimeChart
                  data={dataConvVisible}
                  title="(f * g)(t)"
                  color="#a78bfa"
                  yDomain={convYDomain}
                  xDomain={xDomain}
                  connectNulls={false}
                />
                </div>
              </>
            ) : (
              <div className="flex h-[320px] items-center justify-center rounded-lg bg-zinc-800/30 text-zinc-500">
                La convolución se mostrará cuando ambas señales sean válidas
              </div>
            )}
          </section>
        </div>
      </main>

      <footer className="mt-12 border-t border-zinc-800/60 py-6 text-center text-sm text-zinc-500">
        Convolución continua en tiempo
      </footer>
    </div>
  );
}

export default App;
