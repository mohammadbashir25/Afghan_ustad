"use client";

import { Bar, BarChart, CartesianGrid, Legend, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import ChartPanel from "./ChartPanel";
import { AXIS_LINE, AXIS_TICK, CHART_MARGIN, GRID_STROKE, formatAfn, formatCompact, formatTooltipValue } from "./chartUtils";
import { FiDollarSign } from "react-icons/fi";
import type { MonthlyFinancePoint } from "@/lib/finance/monthly";

export default function MonthlyFinanceChart({ data }: { data: MonthlyFinancePoint[] }) {
  const hasData = data.some((item) => item.revenue > 0 || item.expenses > 0);
  return <div className="space-y-5">
    <ChartPanel title="Monthly revenue vs expenses" description="Recorded payment income and approved/recorded operating expenses, in AFN." hasData={hasData} emptyIcon={<FiDollarSign className="size-5" />} chartLabel="Monthly revenue and expense comparison bar chart." emptyDescription="The chart will populate as payment and expense records are added.">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} margin={CHART_MARGIN}>
          <CartesianGrid stroke={GRID_STROKE} strokeDasharray="3 3" vertical={false} />
          <XAxis dataKey="month" tick={AXIS_TICK} axisLine={AXIS_LINE} tickLine={false} />
          <YAxis tick={AXIS_TICK} axisLine={false} tickLine={false} width={56} tickFormatter={(value: number) => formatCompact(value)} />
          <Tooltip formatter={formatTooltipValue} />
          <Legend />
          <Bar dataKey="revenue" name="Revenue" fill="#0B6B4F" radius={[4, 4, 0, 0]} />
          <Bar dataKey="expenses" name="Expenses" fill="#D97706" radius={[4, 4, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </ChartPanel>
    <section className="overflow-hidden rounded-xl border border-[#DCE7E2] bg-white">
      <div className="border-b border-[#DCE7E2] px-5 py-4"><h3 className="text-sm font-semibold text-[#053B2E]">Monthly finance report</h3><p className="mt-1 text-xs text-slate-500">Last 12 months · AFN · net is revenue minus recorded operating expenses.</p></div>
      <div className="overflow-x-auto"><table className="w-full min-w-[620px] text-left text-sm"><thead className="bg-[#F8FAFC] text-xs text-slate-500"><tr><th className="px-5 py-3 font-medium">Month</th><th className="px-5 py-3 text-right font-medium">Revenue</th><th className="px-5 py-3 text-right font-medium">Expenses</th><th className="px-5 py-3 text-right font-medium">Net</th></tr></thead><tbody>{data.map((item) => <tr key={item.month} className="border-t border-[#EDF2EF]"><td className="px-5 py-3 font-medium text-[#12372E]">{item.month}</td><td className="px-5 py-3 text-right tabular-nums">{formatAfn(item.revenue)}</td><td className="px-5 py-3 text-right tabular-nums">{formatAfn(item.expenses)}</td><td className={`px-5 py-3 text-right font-semibold tabular-nums ${item.net < 0 ? "text-rose-700" : "text-[#0B6B4F]"}`}>{formatAfn(item.net)}</td></tr>)}</tbody></table></div>
    </section>
  </div>;
}
