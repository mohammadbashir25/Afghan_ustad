import Payment from "@/models/Payment";
import Expense from "@/models/Expense";
import mongoose from "mongoose";

export interface MonthlyFinancePoint {
  month: string;
  revenue: number;
  expenses: number;
  net: number;
}

/** Returns a complete rolling 12-month series, including zero-value months. */
export async function getMonthlyFinanceSeries(classId?: string): Promise<MonthlyFinancePoint[]> {
  const now = new Date();
  const start = new Date(now.getFullYear(), now.getMonth() - 11, 1);
  const match = {
    paidAt: { $gte: start },
    ...(classId && /^[a-f\d]{24}$/i.test(classId) ? { class: new mongoose.Types.ObjectId(classId) } : {}),
  };

  const [revenueRows, expenseRows] = await Promise.all([
    Payment.aggregate([
      { $match: match },
      { $group: { _id: { $dateToString: { format: "%Y-%m", date: "$paidAt" } }, total: { $sum: "$amountPaid" } } },
    ]),
    Expense.aggregate([
      { $match: { status: { $in: ["RECORDED", "APPROVED"] }, date: { $gte: start } } },
      { $group: { _id: { $dateToString: { format: "%Y-%m", date: "$date" } }, total: { $sum: "$amount" } } },
    ]),
  ]);
  const revenues = new Map<string, number>(revenueRows.map((r) => [String(r._id), Number(r.total || 0)]));
  const expenses = new Map<string, number>(expenseRows.map((r) => [String(r._id), Number(r.total || 0)]));
  return Array.from({ length: 12 }, (_, index) => {
    const date = new Date(now.getFullYear(), now.getMonth() - 11 + index, 1);
    const key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
    const revenue = revenues.get(key) || 0;
    const expense = expenses.get(key) || 0;
    return { month: date.toLocaleDateString("en-US", { month: "short", year: "2-digit" }), revenue, expenses: expense, net: revenue - expense };
  });
}
