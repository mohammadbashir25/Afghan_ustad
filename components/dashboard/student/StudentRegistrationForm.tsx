"use client";

import { useActionState, useEffect, useRef, useState } from "react";
import {
  registerStudentAction,
  type RegistrationState,
} from "@/app/admin/students/actions";
import PrintReceipt from "@/components/dashboard/student/PrintReceipt";

const initial: RegistrationState = { status: "idle" };
const field =
  "w-full rounded-lg border border-[#DCE7E2] bg-white px-3 py-2 text-sm text-[#12372E]";

type CourseOption = {
  id: string;
  title: string;
  fee: number;
  duration: string;
};
type ClassOption = {
  id: string;
  name: string;
  courseId: string;
  courseTitle: string;
  schedule: string;
};

export default function StudentRegistrationForm({
  courses,
  classes,
}: {
  courses: CourseOption[];
  classes: ClassOption[];
}) {
  const [state, action, pending] = useActionState(
    registerStudentAction,
    initial,
  );
  const [selectedCourseId, setSelectedCourseId] = useState("");
  const [selectedClassId, setSelectedClassId] = useState("");
  const photoInputRef = useRef<HTMLInputElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);

  const [cameraStream, setCameraStream] = useState<MediaStream | null>(null);
  const [cameraError, setCameraError] = useState("");

  useEffect(() => {
    return () => {
      cameraStream?.getTracks().forEach((track) => track.stop());
    };
  }, [cameraStream]);

  async function openCamera() {
    setCameraError("");

    if (!navigator.mediaDevices?.getUserMedia) {
      setCameraError(
        "Camera access is unavailable. Use Choose Image to select a photo from your PC.",
      );
      return;
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: "user" },
        audio: false,
      });

      setCameraStream(stream);
    } catch {
      setCameraError(
        "Could not access the camera. Allow camera permission in your browser or choose an image from your PC.",
      );
    }
  }

  function closeCamera() {
    cameraStream?.getTracks().forEach((track) => track.stop());
    setCameraStream(null);
  }

  function capturePhoto() {
    const video = videoRef.current;
    const input = photoInputRef.current;

    if (!video || !input || video.videoWidth === 0) {
      setCameraError("The camera is not ready yet. Please try again.");
      return;
    }

    const canvas = document.createElement("canvas");
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;

    const context = canvas.getContext("2d");

    if (!context) {
      setCameraError("Could not capture the photo. Please try again.");
      return;
    }

    // Mirror the image to match the front-camera preview.
    context.translate(canvas.width, 0);
    context.scale(-1, 1);
    context.drawImage(video, 0, 0, canvas.width, canvas.height);

    canvas.toBlob(
      (blob) => {
        if (!blob) {
          setCameraError("Could not create the photo. Please try again.");
          return;
        }

        if (blob.size > 5 * 1024 * 1024) {
          setCameraError("The photo exceeds the 5 MB limit.");
          return;
        }

        const file = new File([blob], `student-photo-${Date.now()}.jpg`, {
          type: "image/jpeg",
        });

        const transfer = new DataTransfer();
        transfer.items.add(file);
        input.files = transfer.files;

        setCameraError("");
        closeCamera();
      },
      "image/jpeg",
      0.9,
    );
  }
  if (state.status === "success" && state.receipt)
    return (
      <div className="space-y-5">
        <p
          role="status"
          className="rounded-lg bg-[#E6F4EE] p-3 text-sm text-[#053B2E]"
        >
          {state.message}
        </p>
        <section className="rounded-xl border border-amber-300 bg-amber-50 p-4 text-sm text-amber-950 print:hidden">
          <h2 className="font-semibold">
            Give these login details to the student securely
          </h2>
          <p className="mt-2">
            Student ID: <strong>{state.receipt.studentId}</strong>
          </p>
          <p>
            Username: <strong>{state.receipt.username}</strong>
          </p>
          <p>
            Initial PIN:{" "}
            <strong className="font-mono text-lg">
              {state.receipt.initialPin}
            </strong>
          </p>
          <p className="mt-2 text-xs">
            This PIN is shown only in this confirmation and is never printed on
            the payment receipt. Share it privately.
          </p>
        </section>
        <PrintReceipt data={state.receipt} />
        <button
          type="button"
          onClick={() => window.location.reload()}
          className="rounded-lg border px-4 py-2 text-sm"
        >
          Register another student
        </button>
      </div>
    );

  return (
    <form
      action={action}
      className="grid max-w-3xl gap-4 rounded-xl border border-[#DCE7E2] bg-white p-5 sm:grid-cols-2"
    >
      <label className="grid gap-1 text-sm font-medium">
        Student full name
        <input
          name="name"
          required
          minLength={2}
          maxLength={100}
          className={field}
        />
      </label>
      <label className="grid gap-1 text-sm font-medium">
        Father&apos;s name
        <input
          name="fatherName"
          required
          minLength={2}
          maxLength={120}
          className={field}
        />
      </label>
      <label className="grid gap-1 text-sm font-medium">
        WhatsApp number
        <input
          name="whatsappNumber"
          type="tel"
          required
          minLength={7}
          maxLength={32}
          className={field}
          placeholder="+93 7X XXX XXXX"
        />
      </label>
      <div className="grid gap-3 sm:col-span-2">
        <label className="grid gap-1 text-sm font-medium">
          Student photo
          <input
            ref={photoInputRef}
            name="photo"
            type="file"
            accept="image/jpeg,image/png,image/webp"
            className={field}
            onChange={() => setCameraError("")}
          />
          <span className="text-xs font-normal text-slate-500">
            Choose an image from your computer, or use your connected camera.
            JPG, PNG, or WebP, maximum 5 MB.
          </span>
        </label>

        {!cameraStream ? (
          <div>
            <button
              type="button"
              onClick={openCamera}
              className="rounded-lg border border-[#0B6B4F] px-4 py-2 text-sm font-semibold text-[#0B6B4F] hover:bg-[#F1F7F4]"
            >
              Open Camera
            </button>
          </div>
        ) : (
          <div className="max-w-md space-y-3 rounded-xl border border-[#DCE7E2] p-3">
            <video
              ref={(element) => {
                videoRef.current = element;

                if (element && cameraStream) {
                  element.srcObject = cameraStream;
                }
              }}
              autoPlay
              playsInline
              muted
              className="w-full rounded-lg bg-black"
              style={{ transform: "scaleX(-1)" }}
            />

            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                onClick={capturePhoto}
                className="rounded-lg bg-[#0B6B4F] px-4 py-2 text-sm font-semibold text-white"
              >
                Capture Photo
              </button>

              <button
                type="button"
                onClick={closeCamera}
                className="rounded-lg border px-4 py-2 text-sm"
              >
                Cancel
              </button>
            </div>
          </div>
        )}

        {cameraError && (
          <p role="alert" className="text-sm text-red-700">
            {cameraError}
          </p>
        )}
      </div>
      <label className="grid gap-1 text-sm font-medium">
        Username
        <input
          name="username"
          required
          minLength={3}
          maxLength={24}
          pattern="[A-Za-z0-9._-]+"
          className={field}
          placeholder="e.g. bashir.k"
        />
      </label>
      <label className="grid gap-1 text-sm font-medium">
        Initial student PIN
        <input
          name="pin"
          type="password"
          inputMode="numeric"
          pattern="[0-9]{4,8}"
          minLength={4}
          maxLength={8}
          autoComplete="new-password"
          required
          className={field}
          placeholder="4–8 digits"
        />
      </label>
      <label className="grid gap-1 text-sm font-medium">
        Course
        <select
          name="courseId"
          required
          className={field}
          value={selectedCourseId}
          onChange={(event) => {
            setSelectedCourseId(event.target.value);
            setSelectedClassId("");
          }}
        >
          <option value="" disabled>
            Select an active course
          </option>
          {courses.map((course) => (
            <option key={course.id} value={course.id}>
              {course.title} · {course.fee.toLocaleString()} AFN ·{" "}
              {course.duration}
            </option>
          ))}
        </select>
      </label>
      <label className="grid gap-1 text-sm font-medium">
        Class / batch (optional)
        <select
          name="classId"
          className={field}
          value={selectedClassId}
          onChange={(event) => setSelectedClassId(event.target.value)}
        >
          <option value="">Assign to a class later</option>
          {classes
            .filter((cls) => cls.courseId === selectedCourseId)
            .map((cls) => (
              <option key={cls.id} value={cls.id}>
                {cls.name} · {cls.schedule}
              </option>
            ))}
        </select>
        <span className="text-xs font-normal text-slate-500">
          Choose a batch that matches the selected course. This connects
          attendance, guide access, and monthly class tests.
        </span>
      </label>
      <div className="rounded-lg bg-[#F1F7F4] p-3 text-sm text-[#12372E]">
        <p className="font-semibold">Course fee</p>
        <p className="mt-1">
          The fee is loaded from the selected course record. It cannot be
          changed in this registration form.
        </p>
        {!courses.length && (
          <p className="mt-2 text-amber-800">
            No active courses are available. Add an active course before
            registering a student.
          </p>
        )}
      </div>
      <label className="grid gap-1 text-sm font-medium">
        Discount (AFN)
        <input
          name="discountAmount"
          type="number"
          min="0"
          step="0.01"
          defaultValue="0"
          required
          className={field}
        />
      </label>
      <label className="grid gap-1 text-sm font-medium">
        Amount paid now (AFN)
        <input
          name="amountPaid"
          type="number"
          min="0"
          step="0.01"
          defaultValue="0"
          required
          className={field}
        />
      </label>
      <label className="grid gap-1 text-sm font-medium sm:col-span-2">
        Payment method
        <select name="method" className={field} defaultValue="CASH">
          <option value="CASH">Cash</option>
          <option value="BANK">Bank transfer</option>
          <option value="MOBILE_MONEY">Mobile money</option>
          <option value="OTHER">Other</option>
        </select>
      </label>
      {state.status === "error" && (
        <p role="alert" className="text-sm text-red-700 sm:col-span-2">
          {state.message}
        </p>
      )}
      <div className="sm:col-span-2">
        <p className="mb-3 text-xs text-slate-500">
          The student account stays inactive until the course fee is fully paid.
          The initial PIN is stored as a secure hash. A receipt number is
          generated when a payment greater than zero is recorded.
        </p>
        <button
          disabled={pending || courses.length === 0}
          className="rounded-lg bg-[#0B6B4F] px-4 py-2 text-sm font-semibold text-white disabled:opacity-60"
        >
          {pending ? "Registering..." : "Register student"}
        </button>
      </div>
    </form>
  );
}
