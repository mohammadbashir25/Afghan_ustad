"use client";

export type ReceiptData = {
  studentName: string;
  studentId: string;
  username: string;
  courseName: string;
  courseFee: number;
  amountPaid: number;
  balance: number;
  receiptNumber: string | null;
  method: string;
  paidAt: string;
};

const afn = (amount: number) =>
  `${amount.toLocaleString("en-US", {
    maximumFractionDigits: 2,
  })} AFN`;

export default function PrintReceipt({ data }: { data: ReceiptData }) {
  return (
    <section className="space-y-3">
      <div className="receipt mx-auto w-full max-w-[320px] border border-dashed border-slate-300 bg-white p-3 font-mono text-xs text-black">
        <header className="text-center">
          <h2 className="text-lg font-bold tracking-wide">AFGHANUSTAD</h2>

          <p className="mt-1 font-bold">STUDENT PAYMENT RECEIPT</p>

          <p className="mt-1">{new Date(data.paidAt).toLocaleString()}</p>
        </header>

        <hr className="my-3 border-dashed border-black" />

        <div className="space-y-1 break-words">
          <p>
            <strong>Student:</strong> {data.studentName}
          </p>
          <p>
            <strong>Student ID:</strong> {data.studentId}
          </p>
          <p>
            <strong>Username:</strong> {data.username}
          </p>
          <p>
            <strong>Course:</strong> {data.courseName}
          </p>
        </div>

        <hr className="my-3 border-dashed border-black" />

        <div className="space-y-2">
          <div className="flex justify-between gap-2">
            <span>Course fee</span>
            <span className="text-right">{afn(data.courseFee)}</span>
          </div>

          <div className="flex justify-between gap-2">
            <span>Paid</span>
            <span className="text-right">{afn(data.amountPaid)}</span>
          </div>

          <div className="flex justify-between gap-2 font-bold">
            <span>Balance</span>
            <span className="text-right">{afn(data.balance)}</span>
          </div>
        </div>

        <hr className="my-3 border-dashed border-black" />

        <div className="space-y-1 break-words">
          <p>
            <strong>Payment method:</strong> {data.method}
          </p>
          <p>
            <strong>Receipt No:</strong> {data.receiptNumber ?? "Not assigned"}
          </p>
        </div>

        <hr className="my-3 border-dashed border-black" />

        <footer className="text-center">
          <p className="font-bold">Thank you!</p>
          <p className="mt-1">Thank you for choosing AfghanUstad.</p>
          <p>Please keep this receipt for your records.</p>
        </footer>
      </div>

      <button
        type="button"
        onClick={() => window.print()}
        className="receipt-print-button rounded-lg bg-[#0B6B4F] px-4 py-2 text-sm font-semibold text-white"
      >
        Print receipt
      </button>
    </section>
  );
}
