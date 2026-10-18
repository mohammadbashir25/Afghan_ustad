"use client";

/**
 * AttendanceStatusChart (donut chart)
 *
 * Client Component because Recharts depends on React hooks and context.
 *
 * Each slice carries its own label and colour, so this component doesn't need
 * to know the status enum. The page builds the slices (see the colour map in
 * app/admin/attendance/page.tsx).
 *
 * With an empty array, no donut is drawn: no placeholder segments.
 */

import { Cell, Legend, Pie, PieChart, ResponsiveContainer, Tooltip } from "recharts";
import { FiPieChart } from "react-icons/fi";

import ChartPanel from "./ChartPanel";
import { LEGEND_STYLE } from "./chartUtils";

/** One donut segment: how many records have a given attendance status. */
export interface AttendanceStatusSlice {
  /** Stable unique id, e.g. the status value "PRESENT". */
  id: string;
  /** Display label, e.g. "Present". */
  label: string;
  count: number;
  /** Hex colour for the segment. */
  color: string;
}

export interface AttendanceStatusChartProps {
  data: AttendanceStatusSlice[];
  className?: string;
}

export default function AttendanceStatusChart({ data, className }: AttendanceStatusChartProps) {
  return (
    <ChartPanel
      className={className}
      title="Attendance status"
      description="Share of records by status."
      hasData={data.length > 0}
      emptyIcon={<FiPieChart className="size-5" />}
      emptyDescription="Attendance data will appear here once attendance records are connected."
      chartLabel={`Donut chart of attendance status distribution with ${data.length} statuses.`}
    >
      <ResponsiveContainer width="100%" height="100%">
        <PieChart>
          <Pie
            data={data.map((slice) => ({ name: slice.label, value: slice.count }))}
            dataKey="value"
            nameKey="name"
            innerRadius="58%"
            outerRadius="85%"
            paddingAngle={2}
            stroke="#FFFFFF"
          >
            {data.map((slice) => (
              <Cell key={slice.id} fill={slice.color} />
            ))}
          </Pie>
          <Tooltip />
          <Legend iconType="circle" wrapperStyle={LEGEND_STYLE} />
        </PieChart>
      </ResponsiveContainer>
    </ChartPanel>
  );
}