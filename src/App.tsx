import { useMemo, useState, useEffect, useRef } from 'react';
import { computeConvolution, linspace } from './lib/convolution';
import { createCustomSignal } from './lib/customExpression';
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

function App() {
  const [signalIdF, setSignalIdF] = useState<SignalId>('sine');
  const [customExprF, setCustomExprF] = useState(DEFAULT_CUSTOM_EXPRESSION);
  const [signalIdG, setSignalIdG] = useState<SignalId>('rect');
  const [customExprG, setCustomExprG] = useState('1');
  const [range, setRange] = useState(RANGE_DEFAULT);
  const [animationT, setAnimationT] = useState(-RANGE_DEFAULT);
  const [isAnimating, setIsAnimating] = useState(false);
  const animRef = useRef<number>(0);
  const startRef = useRef<number>(0);

  const tMin = -range;
  const tMax = range;

  useEffect(() => {
    setAnimationT(tMin);
  }, [tMin, tMax]);

  useEffect(() => {
    if (!isAnimating) return;
    startRef.current = performance.now();
    const run = () => {
      const elapsed = performance.now() - startRef.current;
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
    setAnimationT(tMin);
  };

  const handlePlay = () => {
    if (animationT >= tMax - (tMax - tMin) / N_POINTS) setAnimationT(tMin);
    setIsAnimating(true);
  };

  const f = useMemo(() => {
    if (signalIdF === 'custom') return createCustomSignal(customExprF, T);
    return SIGNAL_OPTIONS[signalIdF].fn;
  }, [signalIdF, customExprF]);

  const g = useMemo(() => {
    if (signalIdG === 'custom') return createCustomSignal(customExprG, T);
    return SIGNAL_OPTIONS[signalIdG].fn;
  }, [signalIdG, customExprG]);

  const { dataF, dataG, dataConv, isValid } = useMemo(() => {
    const validF = !!f;
    const validG = !!g;
    if (!validF || !validG) {
      return {
        dataF: [] as { t: number; value: number }[],
        dataG: [] as { t: number; value: number }[],
        dataConv: [] as { t: number; value: number }[],
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

    const dataF = outputTimes.map((t) => ({ t, value: f!(t) }));
    const dataG = outputTimes.map((t) => ({ t, value: g!(t) }));
    const dataConv = outputTimes.map((t, i) => ({ t, value: convValues[i] }));

    return { dataF, dataG, dataConv, isValid: true };
  }, [f, g, range]);

  const dataConvVisible = useMemo(() => {
    return dataConv.filter((p: { t: number; value: number }) => p.t <= animationT);
  }, [dataConv, animationT]);

  const xDomain: [number, number] = [tMin, tMax];

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
                  {(Object.entries(SIGNAL_OPTIONS) as [SignalId, { label: string }][]).map(
                    ([id, { label }]) => (
                      <option key={id} value={id}>
                        {label}
                      </option>
                    )
                  )}
                  <option value="custom">{CUSTOM_LABEL}</option>
                </select>
                {signalIdF === 'custom' && (
                  <input
                    type="text"
                    value={customExprF}
                    onChange={(e) => setCustomExprF(e.target.value)}
                    placeholder="sin(2*pi*t)"
                    className={`w-full rounded-lg border px-4 py-2.5 font-mono text-sm focus:outline-none focus:ring-1 ${
                      !!f
                        ? 'border-zinc-700 bg-zinc-800/80 text-zinc-100 focus:border-violet-500 focus:ring-violet-500'
                        : 'border-red-500/60 bg-zinc-800/80 focus:border-red-500 focus:ring-red-500'
                    }`}
                  />
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
                  {(Object.entries(SIGNAL_OPTIONS) as [SignalId, { label: string }][]).map(
                    ([id, { label }]) => (
                      <option key={id} value={id}>
                        {label}
                      </option>
                    )
                  )}
                  <option value="custom">{CUSTOM_LABEL}</option>
                </select>
                {signalIdG === 'custom' && (
                  <input
                    type="text"
                    value={customExprG}
                    onChange={(e) => setCustomExprG(e.target.value)}
                    placeholder="1"
                    className={`w-full rounded-lg border px-4 py-2.5 font-mono text-sm focus:outline-none focus:ring-1 ${
                      !!g
                        ? 'border-zinc-700 bg-zinc-800/80 text-zinc-100 focus:border-violet-500 focus:ring-violet-500'
                        : 'border-red-500/60 bg-zinc-800/80 focus:border-red-500 focus:ring-red-500'
                    }`}
                  />
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
            {(signalIdF === 'custom' || signalIdG === 'custom') && (!!f || !!g) && (
              <p className="mt-3 text-xs text-zinc-500">
                Expresión personalizada: se evalúa en tiempo real t (no periódica). Puedes definir pulsos únicos, ej: 5*(t&gt;=0)*(t&lt;=2) para un pulso de amplitud 5 en [0, 2].
              </p>
            )}
            <p className="mt-4 text-xs text-zinc-500">
              Ventana de integración τ ∈ [{tMin}, {tMax}] · {N_INTEGRAL} puntos
            </p>
          </section>

          <section className="rounded-xl border border-zinc-800/60 bg-zinc-900/30 p-6">
            <h2 className="mb-4 font-display text-lg font-medium text-zinc-200">
              f(t)
            </h2>
            {dataF.length > 0 ? (
              <TimeChart
                data={dataF}
                title="f(t)"
                color="#00d4aa"
                xDomain={xDomain}
              />
            ) : (
              <div className="flex h-[320px] items-center justify-center rounded-lg bg-zinc-800/30 text-zinc-500">
                Elige señales válidas para ver f(t)
              </div>
            )}
          </section>

          <section className="rounded-xl border border-zinc-800/60 bg-zinc-900/30 p-6">
            <h2 className="mb-4 font-display text-lg font-medium text-zinc-200">
              g(t)
            </h2>
            {dataG.length > 0 ? (
              <TimeChart
                data={dataG}
                title="g(t)"
                color="#f472b6"
                xDomain={xDomain}
              />
            ) : (
              <div className="flex h-[320px] items-center justify-center rounded-lg bg-zinc-800/30 text-zinc-500">
                Elige señales válidas para ver g(t)
              </div>
            )}
          </section>

          {isValid && dataConv.length > 0 && (
            <section className="rounded-xl border border-zinc-800/60 bg-zinc-900/30 p-6">
              <h2 className="mb-4 font-display text-lg font-medium text-zinc-200">
                Animación didáctica
              </h2>
              <p className="mb-4 text-sm text-zinc-400">
                f(τ) y g(t − τ) en el eje τ. Al reproducir, g se desliza y la convolución (abajo) se va formando.
              </p>
              <div className="mb-4 flex gap-3">
                <button
                  type="button"
                  onClick={handlePlay}
                  disabled={isAnimating}
                  className="rounded-lg bg-violet-600 px-4 py-2 text-sm font-medium text-white hover:bg-violet-500 disabled:opacity-50"
                >
                  {isAnimating ? 'Reproduciendo…' : 'Reproducir animación'}
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
                  La curva se dibuja al reproducir la animación (de t = {tMin} a t = {tMax}).
                </p>
                <TimeChart
                data={dataConvVisible}
                title="(f * g)(t)"
                color="#a78bfa"
                yDomain="auto"
                xDomain={xDomain}
              />
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
