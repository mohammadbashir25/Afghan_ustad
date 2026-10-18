"use client";

/**
 * MonthlyCollectionChart (line chart)
 *
 * Client Component because Recharts depends on React hooks and context.
 * Props are plain serializable data, so any Server Component can render it:
 *
 *   <MonthlyCollectionChart data={monthlyCollection} className="lg:col-span-2" />
 *
 * With an empty array, nothing is drawn: no zero line, no placeholder points.
 * The panel shows its empty state instead.
 */

import {
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { FiTrendingUp } from "react-icons/fi";

import ChartPanel from "./ChartPanel";
import {
  AXIS_LINE,
  AXIS_TICK,
  CHART_MARGIN,
  GRID_STROKE,
  formatCompact,
  formatTooltipValue,
} from "./chartUtils";

/** One point of the monthly collection line. */
export interface MonthlyCollectionPoint {
  /** Label shown on the x-axis, e.g. "Jan 2026". */
  month: string;
  /** Amount collected in that month, in AFN. */
  collected: number;
}

export interface MonthlyCollectionChartProps {
  data: MonthlyCollectionPoint[];
  className?: string;
}

export default function MonthlyCollectionChart({ data, className }: MonthlyCollectionChartProps) {
  return (
    <ChartPanel
      className={className}
      title="Monthly payment collection"
      description="Amount collected each month, in AFN."
      hasData={data.length > 0}
      emptyIcon={<FiTrendingUp className="size-5" />}
      chartLabel={`Line chart of monthly payment collection with ${data.length} months of data.`}
    >
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={data} margin={CHART_MARGIN}>
          <CartesianGrid stroke={GRID_STROKE} strokeDasharray="3 3" vertical={false} />
          <XAxis dataKey="month" tick={AXIS_TICK} axisLine={AXIS_LINE} tickLine={false} />
          <YAxis
            tick={AXIS_TICK}
            axisLine={false}
            tickLine={false}
            width={52}
            tickFormatter={(value: number) => formatCompact(value)}
          />
          <Tooltip formatter={formatTooltipValue} />
          <Line
            type="monotone"
            dataKey="collected"
            name="Collected"
            stroke="#0B6B4F"
            strokeWidth={2}
            dot={{ r: 3, fill: "#0B6B4F" }}
            activeDot={{ r: 5 }}
          />
        </LineChart>
      </ResponsiveContainer>
    </ChartPanel>
  );
}