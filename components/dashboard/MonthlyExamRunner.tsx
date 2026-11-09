"use client";

import { useState } from "react";

type Question = {
  prompt: string;
  points: number;
  options: string[];
};
type ExamAction = (formData: FormData) => void | Promise<void>;

export default function MonthlyExamRunner({
  testId,
  title,
  questions,
  action,
}: {
  testId: string;
  title: string;
  questions: Question[];
  action: ExamAction;
}) {
  const [started, setStarted] = useState(false);
  const [current, setCurrent] = useState(0);
  const [review, setReview] = useState(false);
  const [answers, setAnswers] = useState<Record<number, string>>({});
  const [confirmed, setConfirmed] = useState(false);
  const [error, setError] = useState("");

  const answered = Object.keys(answers).length;
  const question = questions[current];

  if (!started) {
    return (
      <div className="mt-5 rounded-xl border border-emerald-100 bg-emerald-50/60 p-5">
        <h3 className="font-semibold text-[#053B2E]">Before you start</h3>
        <ul className="mt-3 list-disc space-y-1 ps-5 text-sm text-slate-600">
          <li>This exam contains {questions.length} multiple-choice questions.</li>
          <li>Choose one answer for every question.</li>
          <li>You can move backward and review your answers before submitting.</li>
          <li>After final submission, answers cannot be changed.</li>
        </ul>
        <button type="button" onClick={() => setStarted(true)} className="mt-4 rounded-lg bg-[#0B6B4F] px-5 py-2.5 text-sm font-semibold text-white">Start exam</button>
      </div>
    );
  }

  return (
    <form action={action} onSubmit={(event) => {
      if (!confirmed || answered !== questions.length) {
        event.preventDefault();
        setError("Answer every question and confirm your submission before finishing.");
      }
    }} className="mt-5 space-y-4">
      <input type="hidden" name="testId" value={testId} />
      {questions.map((_, index) => <input key={index} type="hidden" name={`answer_${index}`} value={answers[index] ?? ""} />)}

      <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <p className="text-sm font-semibold text-[#053B2E]">{title}</p>
          <p className="text-xs font-medium text-slate-500">{answered} of {questions.length} answered</p>
        </div>
        <div className="mt-3 h-2 overflow-hidden rounded-full bg-slate-200"><div className="h-full rounded-full bg-[#0B6B4F] transition-all" style={{ width: `${answered / questions.length * 100}%` }} /></div>
      </div>

      {!review ? (
        <fieldset className="rounded-xl border border-[#DCE7E2] bg-white p-5">
          <legend className="px-1 text-sm font-semibold text-[#053B2E]">Question {current + 1} of {questions.length}</legend>
          <p className="mt-2 text-base font-semibold text-[#12372E]">{question.prompt}</p>
          <p className="mt-1 text-xs text-slate-500">{question.points} points</p>
          <div className="mt-4 grid gap-2 sm:grid-cols-2">
            {question.options.map((option, optionIndex) => {
              const selected = answers[current] === String(optionIndex);
              return <label key={optionIndex} className={`flex cursor-pointer items-start gap-3 rounded-lg border p-3 text-sm transition ${selected ? "border-[#0B6B4F] bg-emerald-50" : "border-slate-200 hover:bg-slate-50"}`}>
                <input type="radio" name={`visible-answer-${current}`} checked={selected} onChange={() => setAnswers((old) => ({ ...old, [current]: String(optionIndex) }))} className="mt-1 accent-[#0B6B4F]" />
                <span><span className="font-semibold">{String.fromCharCode(65 + optionIndex)}.</span> {option}</span>
              </label>;
            })}
          </div>
          <div className="mt-5 flex flex-wrap justify-between gap-2">
            <button type="button" disabled={current === 0} onClick={() => setCurrent((value) => value - 1)} className="rounded-lg border px-4 py-2 text-sm font-medium disabled:opacity-40">Previous</button>
            {current < questions.length - 1
              ? <button type="button" onClick={() => setCurrent((value) => value + 1)} className="rounded-lg bg-[#0B6B4F] px-4 py-2 text-sm font-semibold text-white">Next question</button>
              : <button type="button" onClick={() => setReview(true)} className="rounded-lg bg-[#0B6B4F] px-4 py-2 text-sm font-semibold text-white">Review answers</button>}
          </div>
        </fieldset>
      ) : (
        <section className="rounded-xl border border-[#DCE7E2] bg-white p-5">
          <h3 className="font-semibold text-[#053B2E]">Review before submission</h3>
          <div className="mt-3 divide-y">
            {questions.map((item, index) => <button key={index} type="button" onClick={() => { setCurrent(index); setReview(false); }} className="flex w-full items-start justify-between gap-3 py-3 text-left text-sm hover:bg-slate-50">
              <span><span className="font-semibold">Q{index + 1}.</span> {item.prompt}</span>
              <span className={answers[index] === undefined ? "text-red-700" : "text-emerald-700"}>{answers[index] === undefined ? "Not answered" : `Option ${String.fromCharCode(65 + Number(answers[index]))}`}</span>
            </button>)}
          </div>
          <label className="mt-4 flex items-start gap-2 rounded-lg bg-slate-50 p-3 text-sm">
            <input type="checkbox" checked={confirmed} onChange={(event) => setConfirmed(event.target.checked)} className="mt-1 accent-[#0B6B4F]" />
            I have reviewed my answers and want to submit my exam. I understand I cannot change them afterward.
          </label>
          {error && <p role="alert" className="mt-3 text-sm text-red-700">{error}</p>}
          <div className="mt-4 flex flex-wrap justify-between gap-2">
            <button type="button" onClick={() => setReview(false)} className="rounded-lg border px-4 py-2 text-sm font-medium">Back to questions</button>
            <button type="submit" disabled={!confirmed || answered !== questions.length} className="rounded-lg bg-[#0B6B4F] px-5 py-2.5 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:opacity-40">Finish and submit exam</button>
          </div>
        </section>
      )}
    </form>
  );
}
