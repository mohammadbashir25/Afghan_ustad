"use client";

/**
 * AssignmentCompletionChart (stacked bar chart)
 *
 * Client Component because Recharts depends on React hooks and context.
 *
 * One bar per group (a course or class), stacked into completed, pending and
 * overdue assignment counts. Counts come from the backend, never from this
 * file, and what counts as "completed", "pending" and "overdue" is decided
 * where the data is built.
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
import { FiCheckSquare } from "react-icons/fi";

import ChartPanel from "./ChartPanel";
import { AXIS_LINE, AXIS_TICK, CHART_MARGIN, GRID_STROKE, LEGEND_STYLE } from "./chartUtils";

/** One stacked bar: assignment counts for a single course or class. */
export interface AssignmentCompletionPoint {
  /** Course or class display name. */
  label: string;
  completed: number;
  pending: number;
  overdue: number;
}

export interface AssignmentCompletionChartProps {
  data: AssignmentCompletionPoint[];
  className?: string;
}

/** Keeps long names from colliding on the x-axis. Full name is in the tooltip. */
function truncateLabel(value: string): string {
  return value.length > 14 ? `${value.slice(0, 13)}…` : value;
}

export default function AssignmentCompletionChart({
  data,
  className,
}: AssignmentCompletionChartProps) {
  return (
    <ChartPanel
      className={className}
      title="Assignment completion"
      description="Completed, pending and overdue assignments per course or class."
      hasData={data.length > 0}
      emptyIcon={<FiCheckSquare className="size-5" />}
      emptyTitle="No assignments to chart yet"
      emptyDescription="Assignment data will appear here once academic records are connected."
      chartLabel={`Stacked bar chart of completed, pending and overdue assignments across ${data.length} courses or classes.`}
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
          <Bar dataKey="completed" name="Completed" stackId="assignments" fill="#0B6B4F" />
          <Bar dataKey="pending" name="Pending" stackId="assignments" fill="#64748B" />
          <Bar dataKey="overdue" name="Overdue" stackId="assignments" fill="#F4C430" />
        </BarChart>
      </ResponsiveContainer>
    </ChartPanel>
  );
}