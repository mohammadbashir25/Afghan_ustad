"use client";

/**
 * PaymentStatusChart (donut chart)
 *
 * Client Component because Recharts depends on React hooks and context.
 *
 * Each slice carries its own label and colour, so the chart has no knowledge
 * of the status enum. The page maps its statuses to slices, which keeps this
 * component reusable for other status breakdowns (e.g. attendance) later.
 * Suggested colours for payments, from the dashboard palette:
 *   PAID #0B6B4F, PARTIAL #F4C430, PENDING #64748B, OVERDUE #053B2E.
 *
 * With an empty array, no donut is drawn: no placeholder segments.
 */

import { Cell, Legend, Pie, PieChart, ResponsiveContainer, Tooltip } from "recharts";
import { FiPieChart } from "react-icons/fi";

import ChartPanel from "./ChartPanel";
import { LEGEND_STYLE } from "./chartUtils";

/** One donut segment: how many payments have a given status. */
export interface PaymentStatusSlice {
  /** Stable unique id, e.g. the status value "PAID". */
  id: string;
  /** Display label, e.g. "Paid". */
  label: string;
  count: number;
  /** Hex colour for the segment. */
  color: string;
}

export interface PaymentStatusChartProps {
  data: PaymentStatusSlice[];
  className?: string;
}

export default function PaymentStatusChart({ data, className }: PaymentStatusChartProps) {
  return (
    <ChartPanel
      className={className}
      title="Payment status"
      description="Share of payments by status."
      hasData={data.length > 0}
      emptyIcon={<FiPieChart className="size-5" />}
      chartLabel={`Donut chart of payment status distribution with ${data.length} statuses.`}
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