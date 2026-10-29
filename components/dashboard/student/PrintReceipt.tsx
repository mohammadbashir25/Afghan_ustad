"use client";

export type ReceiptData = {
  studentName: string;
  studentId: string;
  username: string;
  initialPin: string;
  courseName: string;
  className: string;
  classSchedule: string;
  teacherName: string;
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
          <p className="mt-1 font-bold">STUDENT ENROLLMENT RECEIPT</p>
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
            <strong>Initial PIN:</strong> {data.initialPin}
          </p>
        </div>

        <hr className="my-3 border-dashed border-black" />

        <div className="space-y-1 break-words">
          <p>
            <strong>Course:</strong> {data.courseName}
          </p>
          <p>
            <strong>Class:</strong> {data.className}
          </p>
          <p>
            <strong>Time:</strong> {data.classSchedule}
          </p>
          <p>
            <strong>Teacher:</strong> {data.teacherName}
          </p>
        </div>

        <hr className="my-3 border-dashed border-black" />

        <div className="space-y-2">
          <div className="flex justify-between gap-2">
            <span>Course fee</span>
            <span>{afn(data.courseFee)}</span>
          </div>
          <div className="flex justify-between gap-2">
            <span>Paid now</span>
            <span>{afn(data.amountPaid)}</span>
          </div>
          <div className="flex justify-between gap-2 font-bold">
            <span>Balance</span>
            <span>{afn(data.balance)}</span>
          </div>
        </div>

        <hr className="my-3 border-dashed border-black" />

        <div className="space-y-1 break-words">
          <p>
            <strong>Payment method:</strong> {data.method}
          </p>
          <p>
            <strong>Receipt No:</strong>{" "}
            {data.receiptNumber ?? "No payment recorded"}
          </p>
        </div>

        <hr className="my-3 border-dashed border-black" />

        <div className="space-y-1">
          <p className="text-center font-bold">
            HOW TO OPEN YOUR STUDENT DASHBOARD
          </p>
          <p>1. Open Chrome or another browser.</p>
          <p>2. Visit: afghanustad.com</p>
          <p>3. Choose Student Login.</p>
          <p>4. Enter your username and initial PIN above.</p>
          <p>
            5. Open your Student Dashboard to see classes, attendance, tests and
            results.
          </p>
          <p className="mt-2 font-bold">
            Keep your PIN private. Change it after your first login.
          </p>
        </div>

        <hr className="my-3 border-dashed border-black" />

        <footer className="text-center">
          <p className="font-bold">Thank you for choosing AfghanUstad!</p>
          <p className="mt-1">Please keep this receipt for your records.</p>
        </footer>
      </div>

      <button
        type="button"
        onClick={() => window.print()}
        className="receipt-print-button rounded-lg bg-[#0B6B4F] px-4 py-2 text-sm font-semibold text-white"
      >
        Print 80mm receipt
      </button>

      <style jsx global>{`
        @media print {
          @page {
            size: 80mm auto;
            margin: 0;
          }

          html,
          body {
            width: 80mm !important;
            margin: 0 !important;
            padding: 0 !important;
          }

          body * {
            visibility: hidden !important;
          }

          .receipt,
          .receipt * {
            visibility: visible !important;
          }

          .receipt {
            position: absolute !important;
            top: 0 !important;
            left: 0 !important;
            width: 72mm !important;
            max-width: 72mm !important;
            min-width: 0 !important;
            box-sizing: border-box !important;
            margin: 0 !important;
            padding: 2mm !important;
            border: 0 !important;
            border-radius: 0 !important;
            box-shadow: none !important;
            background: #fff !important;
            color: #000 !important;
            font-family: monospace !important;
            font-size: 9pt !important;
            line-height: 1.35 !important;
            overflow-wrap: anywhere !important;
          }

          .receipt hr {
            border: 0 !important;
            border-top: 1px dashed #000 !important;
          }

          .receipt-print-button {
            display: none !important;
          }
        }
      `}</style>
    </section>
  );
}