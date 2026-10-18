"use client";
import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { deleteStudentAction } from "@/app/admin/students/actions";
export default function DeleteStudentButton({ studentId, studentName }: { studentId: string; studentName: string }) {
 const router = useRouter(); const [pending,startTransition] = useTransition(); const [message,setMessage] = useState("");
 function remove(){ if(!window.confirm(`Permanently delete ${studentName}? This cannot be undone.`)) return; startTransition(async()=>{ const result=await deleteStudentAction(studentId); setMessage(result.message); if(result.success) router.refresh(); }); }
 return <div className="space-y-1"><button type="button" disabled={pending} onClick={remove} className="rounded-lg border border-red-200 px-3 py-2 text-sm font-medium text-red-700 hover:bg-red-50 disabled:opacity-50">{pending?"Deleting…":"Delete student"}</button>{message&&<p role="status" className="max-w-40 text-xs text-slate-500">{message}</p>}</div>;
}
