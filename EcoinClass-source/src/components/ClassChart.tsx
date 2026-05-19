import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  AreaChart,
  Area,
  BarChart,
  Bar,
} from 'recharts';
import { cn } from '@/lib/utils';

interface ClassChartProps {
  data: { date: string; coins: number; carbon: number }[];
  type?: 'line' | 'area' | 'bar';
  metric?: 'coins' | 'carbon';
  className?: string;
}

export function ClassChart({ data, type = 'area', metric = 'carbon', className }: ClassChartProps) {
  const dataKey = metric;
  const color = metric === 'coins' ? '#F4B942' : '#2E9E6B';
  const gradientId = metric === 'coins' ? 'coinGradient' : 'carbonGradient';

  const formatValue = (value: number) => {
    if (metric === 'carbon') {
      return `${(value / 1000).toFixed(1)}kg`;
    }
    return `${value}`;
  };

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-card border border-border rounded-lg shadow-card p-3">
          <p className="text-sm font-medium text-foreground">{label}</p>
          <p className="text-lg font-bold" style={{ color }}>
            {metric === 'coins' ? '🌱 ' : '🌍 '}
            {formatValue(payload[0].value)}
            {metric === 'coins' ? ' 코인' : ' CO₂ 절감'}
          </p>
        </div>
      );
    }
    return null;
  };

  const renderChart = () => {
    const commonProps = {
      data,
      margin: { top: 10, right: 10, left: 0, bottom: 0 },
    };

    const defs = (
      <defs>
        <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
          <stop offset="5%" stopColor={color} stopOpacity={0.3} />
          <stop offset="95%" stopColor={color} stopOpacity={0} />
        </linearGradient>
      </defs>
    );

    const xAxis = (
      <XAxis
        dataKey="date"
        stroke="hsl(var(--muted-foreground))"
        fontSize={12}
        tickLine={false}
        axisLine={false}
      />
    );

    const yAxis = (
      <YAxis
        stroke="hsl(var(--muted-foreground))"
        fontSize={12}
        tickLine={false}
        axisLine={false}
        tickFormatter={formatValue}
      />
    );

    const grid = <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />;
    const tooltip = <Tooltip content={<CustomTooltip />} />;

    if (type === 'bar') {
      return (
        <BarChart {...commonProps}>
          {defs}
          {grid}
          {xAxis}
          {yAxis}
          {tooltip}
          <Bar dataKey={dataKey} fill={color} radius={[4, 4, 0, 0]} />
        </BarChart>
      );
    }

    if (type === 'line') {
      return (
        <LineChart {...commonProps}>
          {defs}
          {grid}
          {xAxis}
          {yAxis}
          {tooltip}
          <Line
            type="monotone"
            dataKey={dataKey}
            stroke={color}
            strokeWidth={3}
            dot={{ fill: color, strokeWidth: 2, r: 4 }}
            activeDot={{ r: 6, stroke: color, strokeWidth: 2 }}
          />
        </LineChart>
      );
    }

    return (
      <AreaChart {...commonProps}>
        {defs}
        {grid}
        {xAxis}
        {yAxis}
        {tooltip}
        <Area
          type="monotone"
          dataKey={dataKey}
          stroke={color}
          strokeWidth={3}
          fillOpacity={1}
          fill={`url(#${gradientId})`}
        />
      </AreaChart>
    );
  };

  return (
    <div className={cn('w-full h-64', className)}>
      <ResponsiveContainer width="100%" height="100%">
        {renderChart()}
      </ResponsiveContainer>
    </div>
  );
}
