import { useMemo, useState } from 'react';
import { computeConvolution, linspace } from './lib/convolution';
import { createCustomSignal } from './lib/customExpression';
import {
  SIGNAL_OPTIONS,
  CUSTOM_LABEL,
  type SignalId,
} from './lib/signals';
import { TimeChart } from './components/TimeChart';

const T = 1;
const T_MIN = -2;
const T_MAX = 2;
const N_POINTS = 400;
const N_INTEGRAL = 600;
const DEFAULT_CUSTOM_EXPRESSION = 'sin(2*pi*t)';

function App() {
  const [signalIdF, setSignalIdF] = useState<SignalId>('sine');
  const [customExprF, setCustomExprF] = useState(DEFAULT_CUSTOM_EXPRESSION);
  const [signalIdG, setSignalIdG] = useState<SignalId>('rect');
  const [customExprG, setCustomExprG] = useState('1');

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

    const outputTimes = linspace(T_MIN, T_MAX, N_POINTS);
    const convValues = computeConvolution(
      f!,
      g!,
      T_MIN,
      T_MAX,
      N_INTEGRAL,
      outputTimes
    );

    const dataF = outputTimes.map((t) => ({ t, value: f!(t) }));
    const dataG = outputTimes.map((t) => ({ t, value: g!(t) }));
    const dataConv = outputTimes.map((t, i) => ({ t, value: convValues[i] }));

    return { dataF, dataG, dataConv, isValid: true };
  }, [f, g]);

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
            {(!f || !g) && (
              <p className="mt-3 text-xs text-red-400">
                Expresiones inválidas. Usa la variable t (ej: sin(2*pi*t)).
              </p>
            )}
            <p className="mt-4 text-xs text-zinc-500">
              Ventana de integración τ ∈ [{T_MIN}, {T_MAX}] · {N_INTEGRAL} puntos
            </p>
          </section>

          <section className="rounded-xl border border-zinc-800/60 bg-zinc-900/30 p-6">
            <h2 className="mb-4 font-display text-lg font-medium text-zinc-200">
              f(t)
            </h2>
            {dataF.length > 0 ? (
              <TimeChart data={dataF} title="f(t)" color="#00d4aa" />
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
              <TimeChart data={dataG} title="g(t)" color="#f472b6" />
            ) : (
              <div className="flex h-[320px] items-center justify-center rounded-lg bg-zinc-800/30 text-zinc-500">
                Elige señales válidas para ver g(t)
              </div>
            )}
          </section>

          <section className="rounded-xl border border-zinc-800/60 bg-zinc-900/30 p-6">
            <h2 className="mb-4 font-display text-lg font-medium text-zinc-200">
              Convolución (f * g)(t)
            </h2>
            {dataConv.length > 0 ? (
              <TimeChart
                data={dataConv}
                title="(f * g)(t)"
                color="#a78bfa"
                yDomain="auto"
              />
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
