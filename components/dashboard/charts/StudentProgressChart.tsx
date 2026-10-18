"use client";

/**
 * StudentProgressChart (line chart)
 *
 * Client Component because Recharts depends on React hooks and context.
 *
 * Each point is the average performance for one period (a week, a month, an
 * assessment round...), so the line shows how results move over time. The
 * backend decides how `average` is calculated. As with AverageMarksChart,
 * pass `scaleMax` only when the data model defines a scale.
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
import { AXIS_LINE, AXIS_TICK, CHART_MARGIN, GRID_STROKE } from "./chartUtils";

/** One point of the progress line. */
export interface StudentProgressPoint {
  /** Label shown on the x-axis, e.g. "Week 3" or "Oct 2026". */
  label: string;
  /** Average performance for that period, in the unit/scale the caller documents. */
  average: number;
}

export interface StudentProgressChartProps {
  data: StudentProgressPoint[];
  /** Upper bound of the scale, only when the data model defines one. */
  scaleMax?: number;
  /** Appended to axis ticks and tooltip values, e.g. "%". */
  valueSuffix?: string;
  className?: string;
}

const valueFormatter = new Intl.NumberFormat("en", { maximumFractionDigits: 1 });

export default function StudentProgressChart({
  data,
  scaleMax,
  valueSuffix = "",
  className,
}: StudentProgressChartProps) {
  const domain: [number, number | "auto"] = [0, scaleMax ?? "auto"];

  return (
    <ChartPanel
      className={className}
      title="Student progress over time"
      description="Average performance by period."
      hasData={data.length > 0}
      emptyIcon={<FiTrendingUp className="size-5" />}
      emptyTitle="No progress data yet"
      emptyDescription="Progress will appear here once academic records are connected."
      chartLabel={`Line chart of student progress over time with ${data.length} data points.`}
    >
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={data} margin={CHART_MARGIN}>
          <CartesianGrid stroke={GRID_STROKE} strokeDasharray="3 3" vertical={false} />
          <XAxis dataKey="label" tick={AXIS_TICK} axisLine={AXIS_LINE} tickLine={false} />
          <YAxis
            domain={domain}
            tick={AXIS_TICK}
            axisLine={false}
            tickLine={false}
            width={44}
            tickFormatter={(value: number) => `${value}${valueSuffix}`}
          />
          <Tooltip
            formatter={(value: unknown) =>
              typeof value === "number"
                ? `${valueFormatter.format(value)}${valueSuffix}`
                : String(value ?? "")
            }
          />
          <Line
            type="monotone"
            dataKey="average"
            name="Average"
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