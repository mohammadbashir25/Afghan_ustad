"use client";

/**
 * PaidVsOutstandingChart (grouped bar chart)
 *
 * Client Component because Recharts depends on React hooks and context.
 * Each group (a month, a course, ...) shows its paid and outstanding amounts
 * side by side, in AFN.
 *
 * With an empty array, no bars are drawn and the panel shows its empty state.
 */

import {
  Bar,
  BarChart,
  CartesianGrid,
  Legend,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { FiBarChart2 } from "react-icons/fi";

import ChartPanel from "./ChartPanel";
import {
  AXIS_LINE,
  AXIS_TICK,
  CHART_MARGIN,
  GRID_STROKE,
  LEGEND_STYLE,
  formatCompact,
  formatTooltipValue,
} from "./chartUtils";

/** One group of bars. */
export interface PaidVsOutstandingPoint {
  /** Group label, e.g. a month or a course. */
  label: string;
  /** Amount paid, in AFN. */
  paid: number;
  /** Amount still outstanding, in AFN. */
  outstanding: number;
}

export interface PaidVsOutstandingChartProps {
  data: PaidVsOutstandingPoint[];
  className?: string;
}

export default function PaidVsOutstandingChart({ data, className }: PaidVsOutstandingChartProps) {
  return (
    <ChartPanel
      className={className}
      title="Amount paid versus outstanding"
      description="Paid and outstanding amounts side by side, in AFN."
      hasData={data.length > 0}
      emptyIcon={<FiBarChart2 className="size-5" />}
      chartLabel={`Bar chart comparing amount paid and outstanding across ${data.length} groups.`}
    >
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} margin={CHART_MARGIN}>
          <CartesianGrid stroke={GRID_STROKE} strokeDasharray="3 3" vertical={false} />
          <XAxis dataKey="label" tick={AXIS_TICK} axisLine={AXIS_LINE} tickLine={false} />
          <YAxis
            tick={AXIS_TICK}
            axisLine={false}
            tickLine={false}
            width={52}
            tickFormatter={(value: number) => formatCompact(value)}
          />
          <Tooltip formatter={formatTooltipValue} cursor={{ fill: "#F1F5F3" }} />
          <Legend iconType="circle" wrapperStyle={LEGEND_STYLE} />
          <Bar dataKey="paid" name="Paid" fill="#0B6B4F" radius={[4, 4, 0, 0]} />
          <Bar dataKey="outstanding" name="Outstanding" fill="#F4C430" radius={[4, 4, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </ChartPanel>
  );
}