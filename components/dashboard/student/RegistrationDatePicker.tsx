
"use client";

import { useState } from "react";

type RegistrationDatePickerProps = {
  name?: string;
  defaultValue?: string;
};

const inputClass =
  "w-full rounded-lg border border-[#DCE7E2] bg-white px-3 py-2.5 text-sm text-[#12372E] outline-none transition focus:border-[#0B6B4F] focus:ring-2 focus:ring-[#0B6B4F]/15";

const monthNames = [
  "January", "February", "March", "April",
  "May", "June", "July", "August",
  "September", "October", "November", "December",
];

function formatDate(date: Date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

export default function RegistrationDatePicker({
  name = "registrationDate",
  defaultValue,
}: RegistrationDatePickerProps) {
  const today = new Date();
  const todayString = formatDate(today);
  const initialDate = defaultValue || todayString;

  const [selectedDate, setSelectedDate] = useState(initialDate);
  const [visibleMonth, setVisibleMonth] = useState(() => {
    const date = new Date(`${initialDate}T12:00:00`);
    return new Date(date.getFullYear(), date.getMonth(), 1);
  });
  const [isOpen, setIsOpen] = useState(false);

  const year = visibleMonth.getFullYear();
  const month = visibleMonth.getMonth();
  const firstDay = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();

  function changeMonth(amount: number) {
    setVisibleMonth(
      new Date(year, month + amount, 1),
    );
  }

  function selectDate(day: number) {
    const date = formatDate(new Date(year, month, day));

    if (date > todayString) return;

    setSelectedDate(date);
    setIsOpen(false);
  }

  const formattedDate = selectedDate
    ? new Date(`${selectedDate}T12:00:00`).toLocaleDateString(
        "en-GB",
        {
          day: "2-digit",
          month: "long",
          year: "numeric",
        },
      )
    : "Select registration date";

  return (
    <div className="relative">
      <input
        type="hidden"
        name={name}
        value={selectedDate}
      />

      <label className="mb-1.5 block text-sm font-medium text-[#12372E]">
        Registration Date
      </label>

      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className={`${inputClass} flex items-center justify-between gap-3 text-left`}
        aria-expanded={isOpen}
      >
        <span>{formattedDate}</span>
        <span aria-hidden="true" className="text-[#0B6B4F]">
          ▦
        </span>
      </button>

      {isOpen && (
        <div className="absolute left-0 top-full z-50 mt-2 w-full min-w-[290px] rounded-xl border border-[#DCE7E2] bg-white p-4 shadow-xl sm:min-w-[320px]">
          <div className="mb-4 flex items-center justify-between gap-2">
            <button
              type="button"
              onClick={() => changeMonth(-1)}
              className="flex h-9 w-9 items-center justify-center rounded-lg text-lg text-[#0B6B4F] hover:bg-[#E6F4EE]"
              aria-label="Previous month"
            >
              ‹
            </button>

            <div className="text-center">
              <p className="font-semibold text-[#12372E]">
                {monthNames[month]}
              </p>
              <p className="text-xs text-[#64748B]">{year}</p>
            </div>

            <button
              type="button"
              onClick={() => changeMonth(1)}
              disabled={
                year > today.getFullYear() ||
                (year === today.getFullYear() &&
                  month >= today.getMonth())
              }
              className="flex h-9 w-9 items-center justify-center rounded-lg text-lg text-[#0B6B4F] hover:bg-[#E6F4EE] disabled:cursor-not-allowed disabled:opacity-30"
              aria-label="Next month"
            >
              ›
            </button>
          </div>

          <div className="mb-2 grid grid-cols-7 text-center text-xs font-medium text-[#64748B]">
            {["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"].map(
              (day) => (
                <div key={day} className="py-2">
                  {day}
                </div>
              ),
            )}
          </div>

          <div className="grid grid-cols-7 gap-1">
            {Array.from({ length: firstDay }).map((_, index) => (
              <div key={`empty-${index}`} />
            ))}

            {Array.from({ length: daysInMonth }, (_, index) => {
              const day = index + 1;
              const date = formatDate(new Date(year, month, day));
              const isSelected = date === selectedDate;
              const isFuture = date > todayString;

              return (
                <button
                  key={day}
                  type="button"
                  disabled={isFuture}
                  onClick={() => selectDate(day)}
                  className={`flex aspect-square items-center justify-center rounded-lg text-sm transition ${
                    isSelected
                      ? "bg-[#0B6B4F] font-semibold text-white"
                      : isFuture
                        ? "cursor-not-allowed text-gray-300"
                        : "text-[#12372E] hover:bg-[#E6F4EE]"
                  }`}
                  aria-label={`${monthNames[month]} ${day}, ${year}`}
                  aria-pressed={isSelected}
                >
                  {day}
                </button>
              );
            })}
          </div>

          <div className="mt-4 flex items-center justify-between border-t border-[#DCE7E2] pt-3">
            <button
              type="button"
              onClick={() => {
                setSelectedDate(todayString);
                setVisibleMonth(
                  new Date(today.getFullYear(), today.getMonth(), 1),
                );
                setIsOpen(false);
              }}
              className="text-sm font-medium text-[#0B6B4F] hover:underline"
            >
              Today
            </button>

            <button
              type="button"
              onClick={() => setIsOpen(false)}
              className="text-sm text-[#64748B] hover:text-[#12372E]"
            >
              Close
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
