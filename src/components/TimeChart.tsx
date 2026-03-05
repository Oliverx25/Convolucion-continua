import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  ReferenceLine,
} from 'recharts';
import { formatAxisTick } from '../lib/formatAxisTick';

interface TimePoint {
  t: number;
  value: number | null;
}

interface TimeChartProps {
  data: TimePoint[];
  title?: string;
  color?: string;
  yDomain?: [number, number] | 'auto';
  /** Dominio del eje X para centrar t=0 (ej. [tMin, tMax]) */
  xDomain?: [number, number];
  /** Si false, no une puntos con value null (para dibujo progresivo) */
  connectNulls?: boolean;
}

export function TimeChart({
  data,
  title = 'Señal',
  color = '#00d4aa',
  yDomain = 'auto',
  xDomain,
  connectNulls = true,
}: TimeChartProps) {
  const domain: [number, number] =
    yDomain === 'auto'
      ? (() => {
          const values = data.map((d) => d.value).filter((v): v is number => v != null);
          if (values.length === 0) return [-1.5, 1.5];
          const min = Math.min(...values);
          const max = Math.max(...values);
          const padding = Math.max(0.2, (max - min) * 0.1);
          return [min - padding, max + padding];
        })()
      : yDomain;

  return (
    <div className="h-[320px] w-full">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart
          data={data}
          margin={{ top: 10, right: 30, left: 0, bottom: 0 }}
        >
          <CartesianGrid strokeDasharray="3 3" stroke="#3f3f46" opacity={0.5} />
          <XAxis
            dataKey="t"
            stroke="#71717a"
            tick={{ fill: '#a1a1aa', fontSize: 12 }}
            tickFormatter={(v) => formatAxisTick(Number(v))}
            domain={xDomain}
            label={{
              value: 't (s)',
              position: 'insideBottom',
              offset: -5,
              fill: '#71717a',
            }}
          />
          <YAxis
            stroke="#71717a"
            tick={{ fill: '#a1a1aa', fontSize: 12 }}
            tickFormatter={(v) => formatAxisTick(Number(v))}
            domain={domain}
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
            formatter={(value: number | null) =>
              value != null ? [value.toFixed(4), title] : ['—', title]
            }
            labelFormatter={(t) => `t = ${Number(t).toFixed(3)} s`}
          />
          <ReferenceLine x={0} stroke="#52525b" strokeDasharray="2 2" />
          <ReferenceLine y={0} stroke="#52525b" strokeDasharray="2 2" />
          <Line
            type="monotone"
            dataKey="value"
            name={title}
            stroke={color}
            strokeWidth={2}
            dot={false}
            connectNulls={connectNulls}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
