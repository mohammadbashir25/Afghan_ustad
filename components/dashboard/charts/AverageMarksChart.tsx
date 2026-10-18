"use client";

/**
 * AverageMarksChart (bar chart)
 *
 * Client Component because Recharts depends on React hooks and context.
 * Props are plain serializable data, so any Server Component can render it:
 *
 *   <AverageMarksChart data={averageMarks} scaleMax={100} valueSuffix="%" />
 *
 * Scale:
 *  - This component has no built-in grading scale. If `scaleMax` is passed,
 *    the y-axis is fixed to 0..scaleMax. If it is omitted, the axis starts at
 *    0 and fits the data. Only pass `scaleMax` when the real data model
 *    defines one (for example averages expressed as a percentage of each
 *    assessment's own maximum marks, which is a 0-100 scale).
 *
 * With an empty array, no bars are drawn and the panel shows its empty state.
 */

import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { FiBarChart2 } from "react-icons/fi";

import ChartPanel from "./ChartPanel";
import { AXIS_LINE, AXIS_TICK, CHART_MARGIN, GRID_STROKE } from "./chartUtils";

/** One bar: the average for a single course or class. */
export interface AverageMarksPoint {
  /** Course or class display name. */
  label: string;
  /** Average value, in the unit/scale the caller documents. */
  average: number;
}

export interface AverageMarksChartProps {
  data: AverageMarksPoint[];
  /** Upper bound of the scale, only when the data model defines one. */
  scaleMax?: number;
  /** Appended to axis ticks and tooltip values, e.g. "%". */
  valueSuffix?: string;
  className?: string;
}

const valueFormatter = new Intl.NumberFormat("en", { maximumFractionDigits: 1 });

/** Keeps long names from colliding on the x-axis. Full name is in the tooltip. */
function truncateLabel(value: string): string {
  return value.length > 14 ? `${value.slice(0, 13)}…` : value;
}

export default function AverageMarksChart({
  data,
  scaleMax,
  valueSuffix = "",
  className,
}: AverageMarksChartProps) {
  const domain: [number, number | "auto"] = [0, scaleMax ?? "auto"];

  return (
    <ChartPanel
      className={className}
      title="Average marks by course or class"
      description="Average marks for each course or class."
      hasData={data.length > 0}
      emptyIcon={<FiBarChart2 className="size-5" />}
      emptyTitle="No marks to chart yet"
      emptyDescription="Performance data will appear here once academic records are connected."
      chartLabel={`Bar chart of average marks across ${data.length} courses or classes.`}
    >
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} margin={CHART_MARGIN}>
          <CartesianGrid stroke={GRID_STROKE} strokeDasharray="3 3" vertical={false} />
          <XAxis
            dataKey="label"
            interval={0}
            tick={AXIS_TICK}
            axisLine={AXIS_LINE}
            tickLine={false}
            tickFormatter={(value: string) => truncateLabel(value)}
          />
          <YAxis
            domain={domain}
            tick={AXIS_TICK}
            axisLine={false}
            tickLine={false}
            width={44}
            tickFormatter={(value: number) => `${value}${valueSuffix}`}
          />
          <Tooltip
            cursor={{ fill: "#F1F5F3" }}
            formatter={(value: unknown) =>
              typeof value === "number"
                ? `${valueFormatter.format(value)}${valueSuffix}`
                : String(value ?? "")
            }
          />
          <Bar dataKey="average" name="Average" fill="#0B6B4F" radius={[4, 4, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </ChartPanel>
  );
}