"use client";

/**
 * AttendanceTrendChart (line chart)
 *
 * Client Component because Recharts depends on React hooks and context.
 * Props are plain serializable data, so any Server Component can render it:
 *
 *   <AttendanceTrendChart data={attendanceTrend} className="lg:col-span-2" />
 *
 * `rate` is a percentage from 0 to 100, calculated by the backend (for example
 * present + late + excused over total records for that period). The axis is
 * fixed to 0-100 so the scale never exaggerates small changes.
 *
 * With an empty array, nothing is drawn: no zero line, no placeholder points.
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
  formatPercent,
  formatTooltipPercent,
} from "./chartUtils";

/** One point of the attendance-rate line. */
export interface AttendanceTrendPoint {
  /** Label shown on the x-axis, e.g. "12 Oct" or "Week 3". */
  label: string;
  /** Attendance rate for that period, as a percentage from 0 to 100. */
  rate: number;
}

export interface AttendanceTrendChartProps {
  data: AttendanceTrendPoint[];
  className?: string;
}

export default function AttendanceTrendChart({ data, className }: AttendanceTrendChartProps) {
  return (
    <ChartPanel
      className={className}
      title="Attendance rate over time"
      description="Share of attendance records counted as attended, by period."
      hasData={data.length > 0}
      emptyIcon={<FiTrendingUp className="size-5" />}
      emptyDescription="Attendance data will appear here once attendance records are connected."
      chartLabel={`Line chart of attendance rate over time with ${data.length} data points.`}
    >
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={data} margin={CHART_MARGIN}>
          <CartesianGrid stroke={GRID_STROKE} strokeDasharray="3 3" vertical={false} />
          <XAxis dataKey="label" tick={AXIS_TICK} axisLine={AXIS_LINE} tickLine={false} />
          <YAxis
            domain={[0, 100]}
            tick={AXIS_TICK}
            axisLine={false}
            tickLine={false}
            width={44}
            tickFormatter={(value: number) => formatPercent(value)}
          />
          <Tooltip formatter={formatTooltipPercent} />
          <Line
            type="monotone"
            dataKey="rate"
            name="Attendance rate"
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