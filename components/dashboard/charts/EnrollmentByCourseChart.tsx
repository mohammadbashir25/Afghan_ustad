"use client";

/**
 * EnrollmentByCourseChart (bar chart)
 *
 * Client Component because Recharts depends on React hooks and context.
 * Props are plain serializable data, so any Server Component can render it:
 *
 *   <EnrollmentByCourseChart data={enrollmentByCourse} className="lg:col-span-3" />
 *
 * One bar per course, showing how many students are enrolled. Counts come
 * from the backend, never from this file. The backend also decides whether
 * to cap the list (for example the top N courses) and how to sort it.
 *
 * With an empty array, no bars are drawn and the panel shows its empty state.
 * The empty state says the data is not connected, so it never implies that
 * zero students are enrolled.
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
import { AXIS_LINE, AXIS_TICK, CHART_MARGIN, GRID_STROKE, formatCompact } from "./chartUtils";

/** One bar: the number of students enrolled in a single course. */
export interface EnrollmentByCoursePoint {
  /** Course display name. */
  label: string;
  /** Number of students enrolled. */
  students: number;
}

export interface EnrollmentByCourseChartProps {
  data: EnrollmentByCoursePoint[];
  className?: string;
}

const countFormatter = new Intl.NumberFormat("en");

/** Keeps long course names from colliding on the x-axis. Full name is in the tooltip. */
function truncateLabel(value: string): string {
  return value.length > 14 ? `${value.slice(0, 13)}…` : value;
}

export default function EnrollmentByCourseChart({ data, className }: EnrollmentByCourseChartProps) {
  return (
    <ChartPanel
      className={className}
      title="Student distribution by course"
      description="Number of students enrolled in each course."
      hasData={data.length > 0}
      emptyIcon={<FiBarChart2 className="size-5" />}
      emptyTitle="Course enrollment data not connected yet"
      emptyDescription="Student counts per course will appear here once enrollment records are connected."
      chartLabel={`Bar chart of student enrollment counts across ${data.length} courses.`}
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
            allowDecimals={false}
            tick={AXIS_TICK}
            axisLine={false}
            tickLine={false}
            width={44}
            tickFormatter={(value: number) => formatCompact(value)}
          />
          <Tooltip
            cursor={{ fill: "#F1F5F3" }}
            formatter={(value: unknown) =>
              typeof value === "number" ? countFormatter.format(value) : String(value ?? "")
            }
          />
          <Bar dataKey="students" name="Students" fill="#0B6B4F" radius={[4, 4, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </ChartPanel>
  );
}