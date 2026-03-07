import {
  ComposedChart,
  Line,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  ReferenceLine,
} from 'recharts';
import { formatAxisTick } from '../lib/formatAxisTick';
import type { SignalFunction } from '../lib/convolution';

interface SlidingAnimationChartProps {
  f: SignalFunction;
  g: SignalFunction;
  tMin: number;
  tMax: number;
  currentT: number;
  nPoints?: number;
}

export function SlidingAnimationChart({
  f,
  g,
  tMin,
  tMax,
  currentT,
  nPoints = 300,
}: SlidingAnimationChartProps) {
  const tau = Array.from({ length: nPoints }, (_, i) => {
    const τ = tMin + (i / (nPoints - 1)) * (tMax - tMin);
    const fVal = f(τ);
    const gVal = g(currentT - τ);
    const product = fVal * gVal;
    return {
      tau: τ,
      f: fVal,
      gShifted: gVal,
      product,
      positivePart: product >= 0 ? product : 0,
      negativePart: product < 0 ? product : 0,
    };
  });

  return (
    <div className="h-[320px] w-full">
      <ResponsiveContainer width="100%" height="100%">
        <ComposedChart
          data={tau}
          margin={{ top: 10, right: 30, left: 0, bottom: 0 }}
        >
          <CartesianGrid strokeDasharray="3 3" stroke="#3f3f46" opacity={0.5} />
          <XAxis
            dataKey="tau"
            stroke="#71717a"
            tick={{ fill: '#a1a1aa', fontSize: 12 }}
            tickFormatter={(v) => formatAxisTick(Number(v))}
            domain={[tMin, tMax]}
            label={{
              value: 'τ (s)',
              position: 'insideBottom',
              offset: -5,
              fill: '#71717a',
            }}
          />
          <YAxis
            stroke="#71717a"
            tick={{ fill: '#a1a1aa', fontSize: 12 }}
            tickFormatter={(v) => formatAxisTick(Number(v))}
            label={{
              value: 'Amplitud',
              angle: -90,
              position: 'insideLeft',
              fill: '#71717a',
            }}
          />
          <Tooltip
            contentStyle={{
              backgroundColor: '#27272a',
              border: '1px solid #3f3f46',
              borderRadius: '8px',
            }}
            labelStyle={{ color: '#a1a1aa' }}
            labelFormatter={(τ) => `τ = ${Number(τ).toFixed(3)} s · t = ${currentT.toFixed(3)} s`}
          />
          <Legend
            wrapperStyle={{ paddingTop: 8 }}
            formatter={(value) => (
              <span className="text-sm text-zinc-300">{value}</span>
            )}
          />
          <ReferenceLine x={0} stroke="#52525b" strokeDasharray="2 2" />
          <ReferenceLine y={0} stroke="#52525b" strokeDasharray="2 2" />
          <ReferenceLine
            x={currentT}
            stroke="#f472b6"
            strokeDasharray="4 4"
            strokeWidth={1.5}
          />
          <Area
            type="monotone"
            dataKey="positivePart"
            fill="#22c55e"
            fillOpacity={0.5}
            stroke="none"
            baseValue={0}
            name="f·g &gt; 0"
            isAnimationActive={false}
          />
          <Area
            type="monotone"
            dataKey="negativePart"
            fill="#f43f5e"
            fillOpacity={0.5}
            stroke="none"
            baseValue={0}
            name="f·g &lt; 0"
            isAnimationActive={false}
          />
          <Line
            type="monotone"
            dataKey="f"
            name="f(τ)"
            stroke="#00d4aa"
            strokeWidth={2}
            dot={false}
            connectNulls
          />
          <Line
            type="monotone"
            dataKey="gShifted"
            name="g(t − τ)"
            stroke="#f472b6"
            strokeWidth={2}
            strokeDasharray="4 4"
            dot={false}
            connectNulls
          />
        </ComposedChart>
      </ResponsiveContainer>
    </div>
  );
}
