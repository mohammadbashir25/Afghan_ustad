
"use client";

import { useState } from "react";

type TaskRow = {
  id: number;
};

const inputClass =
  "mt-1 w-full rounded-lg border border-[#DCE7E2] bg-white px-3 py-2 text-sm";

export default function PracticalTaskFields() {
  const [tasks, setTasks] = useState<TaskRow[]>([{ id: 1 }]);
  const [nextId, setNextId] = useState(2);

  function addTask() {
    setTasks((current) => [...current, { id: nextId }]);
    setNextId((current) => current + 1);
  }

  function removeTask(id: number) {
    setTasks((current) => current.filter((task) => task.id !== id));
  }

  return (
    <section className="space-y-4 sm:col-span-2">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-lg font-bold text-[#053B2E]">
            Practical Skill Center Tasks
          </h2>
          <p className="mt-1 text-sm text-slate-500">
            Guides will conduct these tasks with students and record each
            student&apos;s score out of 100, KPI, and feedback.
          </p>
        </div>

        <button
          type="button"
          onClick={addTask}
          className="rounded-lg border border-[#0B6B4F] px-3 py-2 text-sm font-semibold text-[#0B6B4F]"
        >
          + Add task
        </button>
      </div>

      {tasks.map((task, index) => (
        <fieldset
          key={task.id}
          className="grid gap-4 rounded-xl border border-[#DCE7E2] bg-[#F8FBF9] p-4 sm:grid-cols-2"
        >
          <legend className="px-2 text-sm font-semibold text-[#053B2E]">
            Task {index + 1}
          </legend>

          <label className="text-sm font-medium sm:col-span-2">
            Task title
            <input
              name="taskTitle"
              required
              minLength={2}
              maxLength={160}
              className={inputClass}
              placeholder="e.g. Build a responsive navigation bar"
            />
          </label>

          <label className="text-sm font-medium sm:col-span-2">
            Instructions
            <textarea
              name="taskDescription"
              maxLength={3000}
              rows={3}
              className={inputClass}
              placeholder="Explain what students must practise at the Skill Center."
            />
          </label>

          <label className="text-sm font-medium sm:col-span-2">
            Guide tips
            <textarea
              name="taskTips"
              maxLength={3000}
              rows={2}
              className={inputClass}
              placeholder="Explain how the Guide should supervise or assess the task."
            />
          </label>

          <label className="text-sm font-medium">
            Due date
            <input
              name="taskDueDate"
              type="date"
              required
              className={inputClass}
            />
          </label>

          <div className="flex items-end justify-between gap-3">
            <p className="text-xs text-slate-500">
              Each student&apos;s score is out of 100.
            </p>

            {tasks.length > 1 && (
              <button
                type="button"
                onClick={() => removeTask(task.id)}
                className="rounded-lg px-3 py-2 text-sm font-medium text-red-700 hover:bg-red-50"
              >
                Remove
              </button>
            )}
          </div>
        </fieldset>
      ))}
    </section>
  );
}
