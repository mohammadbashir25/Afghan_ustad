"use client";

/**
 * AttendanceByClassChart (stacked bar chart)
 *
 * Client Component because Recharts depends on React hooks and context.
 *
 * One bar per class, stacked by status. Counts (not percentages) are used so
 * the bar height also shows how many records each class has, and the stack
 * shows how they split. Counts come from the backend, never from this file.
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
} from "./chartUtils";

/** One stacked bar: attendance counts for a single class. */
export interface AttendanceByClassPoint {
  /** Class display name, e.g. as shown in the classes list. */
  label: string;
  present: number;
  late: number;
  excused: number;
  absent: number;
}

export interface AttendanceByClassChartProps {
  data: AttendanceByClassPoint[];
  className?: string;
}

/** Keeps long class names from colliding on the x-axis. Full name is in the tooltip. */
function truncateLabel(value: string): string {
  return value.length > 14 ? `${value.slice(0, 13)}…` : value;
}

export default function AttendanceByClassChart({ data, className }: AttendanceByClassChartProps) {
  return (
    <ChartPanel
      className={className}
      title="Attendance by class"
      description="Attendance records per class, split by status."
      hasData={data.length > 0}
      emptyIcon={<FiBarChart2 className="size-5" />}
      emptyDescription="Attendance data will appear here once attendance records are connected."
      chartLabel={`Stacked bar chart of attendance by status across ${data.length} classes.`}
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
            width={40}
          />
          <Tooltip cursor={{ fill: "#F1F5F3" }} />
          <Legend iconType="circle" wrapperStyle={LEGEND_STYLE} />
          <Bar dataKey="present" name="Present" stackId="status" fill="#0B6B4F" />
          <Bar dataKey="late" name="Late" stackId="status" fill="#F4C430" />
          <Bar dataKey="excused" name="Excused" stackId="status" fill="#64748B" />
          <Bar dataKey="absent" name="Absent" stackId="status" fill="#053B2E" />
        </BarChart>
      </ResponsiveContainer>
    </ChartPanel>
  );
}