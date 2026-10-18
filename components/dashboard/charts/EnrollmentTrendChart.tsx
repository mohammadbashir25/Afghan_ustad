"use client";

/**
 * EnrollmentTrendChart (line chart)
 *
 * Client Component because Recharts depends on React hooks and context.
 * Props are plain serializable data, so any Server Component can render it:
 *
 *   <EnrollmentTrendChart data={enrollmentTrend} className="lg:col-span-2" />
 *
 * Each point is the number of NEW enrollments in one period (a week or a
 * month). The backend decides the period and how enrollments are counted.
 * The y-axis starts at 0 and shows whole numbers only.
 *
 * With an empty array, nothing is drawn: no zero line, no placeholder points.
 * The empty state says the data is not connected, so it never implies that
 * zero enrollments happened.
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
import { FiUserPlus } from "react-icons/fi";

import ChartPanel from "./ChartPanel";
import { AXIS_LINE, AXIS_TICK, CHART_MARGIN, GRID_STROKE, formatCompact } from "./chartUtils";

/** One point of the enrollment line. */
export interface EnrollmentTrendPoint {
  /** Label shown on the x-axis, e.g. "Oct 2026" or "Week 3". */
  label: string;
  /** Number of new enrollments in that period. */
  enrollments: number;
}

export interface EnrollmentTrendChartProps {
  data: EnrollmentTrendPoint[];
  className?: string;
}

const countFormatter = new Intl.NumberFormat("en");

export default function EnrollmentTrendChart({ data, className }: EnrollmentTrendChartProps) {
  return (
    <ChartPanel
      className={className}
      title="Student enrollment trend"
      description="New enrollments by period."
      hasData={data.length > 0}
      emptyIcon={<FiUserPlus className="size-5" />}
      emptyTitle="Enrollment data not connected yet"
      emptyDescription="Enrollment trends will appear here once enrollment records are connected."
      chartLabel={`Line chart of new student enrollments over time with ${data.length} data points.`}
    >
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={data} margin={CHART_MARGIN}>
          <CartesianGrid stroke={GRID_STROKE} strokeDasharray="3 3" vertical={false} />
          <XAxis dataKey="label" tick={AXIS_TICK} axisLine={AXIS_LINE} tickLine={false} />
          <YAxis
            domain={[0, "auto"]}
            allowDecimals={false}
            tick={AXIS_TICK}
            axisLine={false}
            tickLine={false}
            width={44}
            tickFormatter={(value: number) => formatCompact(value)}
          />
          <Tooltip
            formatter={(value: unknown) =>
              typeof value === "number" ? countFormatter.format(value) : String(value ?? "")
            }
          />
          <Line
            type="monotone"
            dataKey="enrollments"
            name="New enrollments"
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