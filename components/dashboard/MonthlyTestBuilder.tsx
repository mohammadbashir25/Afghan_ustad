"use client";

import { useState } from "react";

type Question = {
  prompt: string;
  type: "MULTIPLE_CHOICE";
  options: string[];
  correctOption: number;
  points: number;
};
type ClassOption = { id: string; name: string; courseTitle: string };
const field = "mt-1 w-full rounded-lg border border-[#DCE7E2] bg-white px-3 py-2 text-sm";

export default function MonthlyTestBuilder({
  classes,
  action,
}: {
  classes: ClassOption[];
  action: (formData: FormData) => void | Promise<void>;
}) {
  const [questions, setQuestions] = useState<Question[]>([
    { prompt: "", type: "MULTIPLE_CHOICE", options: ["", "", "", ""], correctOption: 0, points: 10 },
    { prompt: "", type: "MULTIPLE_CHOICE", options: ["", "", "", ""], correctOption: 0, points: 10 },
  ]);

  const updateQuestion = (index: number, patch: Partial<Question>) =>
    setQuestions((old) => old.map((question, i) => i === index ? { ...question, ...patch } : question));

  return (
    <form action={action} className="mt-4 grid max-w-5xl gap-5">
      <div className="grid gap-4 sm:grid-cols-2">
        <label className="text-sm font-medium sm:col-span-2">Test title
          <input name="title" required minLength={2} maxLength={160} className={field} placeholder="November monthly assessment" />
        </label>
        <label className="text-sm font-medium">Class
          <select name="classId" required defaultValue="" className={field}>
            <option value="" disabled>Select class</option>
            {classes.map((item) => <option key={item.id} value={item.id}>{item.name} · {item.courseTitle}</option>)}
          </select>
        </label>
        <label className="text-sm font-medium">Test date
          <input name="testDate" type="date" required className={field} defaultValue={new Date().toISOString().slice(0, 10)} />
        </label>
        <label className="text-sm font-medium">Month
          <select name="month" required defaultValue={String(new Date().getMonth() + 1)} className={field}>
            {Array.from({ length: 12 }, (_, i) => i + 1).map((month) => <option key={month} value={month}>{new Date(2000, month - 1, 1).toLocaleString("en", { month: "long" })}</option>)}
          </select>
        </label>
        <label className="text-sm font-medium">Year
          <input name="year" type="number" min="2020" max="2200" required defaultValue={new Date().getFullYear()} className={field} />
        </label>
        <label className="text-sm font-medium sm:col-span-2">Instructions
          <textarea name="instructions" rows={2} maxLength={3000} className={field} placeholder="Read each question carefully. Select one answer." />
        </label>
      </div>

      <input type="hidden" name="questionsJson" value={JSON.stringify(questions)} />
      <input type="hidden" name="practicalTasksJson" value="[]" />

      <section className="space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div>
            <h3 className="font-semibold text-[#053B2E]">Multiple-choice questions only</h3>
            <p className="mt-1 text-xs text-slate-500">Every question has four options and one correct answer. Practical work and file uploads are not part of monthly tests.</p>
          </div>
          <button type="button" onClick={() => setQuestions((old) => [...old, { prompt: "", type: "MULTIPLE_CHOICE", options: ["", "", "", ""], correctOption: 0, points: 10 }])} className="rounded-lg border px-3 py-2 text-sm">+ Add question</button>
        </div>

        {questions.map((question, index) => (
          <div key={index} className="space-y-3 rounded-xl border border-[#DCE7E2] p-4">
            <div className="flex items-center justify-between">
              <h4 className="font-medium">Question {index + 1}</h4>
              {questions.length > 2 && <button type="button" onClick={() => setQuestions((old) => old.filter((_, i) => i !== index))} className="text-sm text-red-600">Remove</button>}
            </div>
            <label className="block text-sm font-medium">Question
              <textarea value={question.prompt} onChange={(event) => updateQuestion(index, { prompt: event.target.value })} required minLength={2} maxLength={1500} rows={2} className={field} />
            </label>
            <div className="grid gap-3 sm:grid-cols-2">
              {question.options.map((option, optionIndex) => (
                <label key={optionIndex} className="text-sm">Option {String.fromCharCode(65 + optionIndex)}
                  <input value={option} onChange={(event) => updateQuestion(index, { options: question.options.map((value, i) => i === optionIndex ? event.target.value : value) })} required maxLength={300} className={field} />
                </label>
              ))}
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              <label className="text-sm font-medium">Correct answer
                <select value={question.correctOption} onChange={(event) => updateQuestion(index, { correctOption: Number(event.target.value) })} className={field}>
                  {question.options.map((option, i) => <option key={i} value={i}>{String.fromCharCode(65 + i)} — {option || `Option ${i + 1}`}</option>)}
                </select>
              </label>
              <label className="text-sm font-medium">Points
                <input type="number" min="1" max="100" required value={question.points} onChange={(event) => updateQuestion(index, { points: Number(event.target.value) })} className={field} />
              </label>
            </div>
          </div>
        ))}
      </section>
      <button className="w-fit rounded-lg bg-[#0B6B4F] px-4 py-2 text-sm font-semibold text-white">Create monthly MCQ test</button>
    </form>
  );
}
