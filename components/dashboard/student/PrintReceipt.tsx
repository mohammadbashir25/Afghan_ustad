"use client";

export type ReceiptData = {
  studentName: string; studentId: string; username: string; courseName: string;
  courseFee: number; amountPaid: number; balance: number;
  receiptNumber: string | null; method: string; paidAt: string;
};
const afn = (n: number) => `${n.toLocaleString("en-US", { maximumFractionDigits: 2 })} AFN`;

export default function PrintReceipt({ data }: { data: ReceiptData }) {
  return <section className="space-y-3">
    <div className="receipt mx-auto w-full max-w-[320px] border border-dashed border-slate-300 bg-white p-3 font-mono text-xs text-black">
      <div className="text-center"><strong className="text-sm">AFGHANUSTAD</strong>
        <p>STUDENT PAYMENT RECEIPT</p><p>{new Date(data.paidAt).toLocaleString()}</p></div>
      <hr className="my-2 border-dashed border-black" />
      <p>Student: {data.studentName}</p><p>ID: {data.studentId}</p><p>Username: {data.username}</p><p>Course: {data.courseName}</p>
      <hr className="my-2 border-dashed border-black" />
      <div className="flex justify-between gap-2"><span>Course fee</span><span>{afn(data.courseFee)}</span></div>
      <div className="flex justify-between gap-2"><span>Paid now</span><span>{afn(data.amountPaid)}</span></div>
      <div className="flex justify-between gap-2 font-bold"><span>Balance</span><span>{afn(data.balance)}</span></div>
      <hr className="my-2 border-dashed border-black" />
      <p>Method: {data.method}</p><p>Receipt: {data.receiptNumber ?? "No payment recorded"}</p>
      <p className="mt-3 text-center">Thank you!</p>
    </div>
    <button type="button" onClick={() => window.print()} className="rounded-lg bg-[#0B6B4F] px-4 py-2 text-sm font-semibold text-white">Print receipt</button>
    <style jsx global>{`
      @media print {
        @page { size: 58mm auto; margin: 2mm; }
        body * { visibility: hidden !important; }
        .receipt, .receipt * { visibility: visible !important; }
        .receipt { position: absolute !important; left: 0 !important; top: 0 !important;
          width: 54mm !important; max-width: 54mm !important; padding: 1mm !important;
          margin: 0 !important; border: 0 !important; font-size: 9pt !important; line-height: 1.35 !important; }
        button { display: none !important; }
      }
    `}</style>
  </section>;
}
