"use client";

import { useActionState, useEffect, useRef, useState } from "react";
import {
  registerStudentAction,
  type RegistrationState,
} from "@/app/admin/students/actions";
import PrintReceipt from "@/components/dashboard/student/PrintReceipt";
import RegistrationDatePicker from "@/components/dashboard/student/RegistrationDatePicker";

const initial: RegistrationState = { status: "idle" };
const field =
  "w-full rounded-lg border border-[#DCE7E2] bg-white px-3 py-2 text-sm text-[#12372E]";

type CameraDevice = {
  deviceId: string;
  label: string;
};

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
  const streamRef = useRef<MediaStream | null>(null);

  const [cameraStream, setCameraStream] = useState<MediaStream | null>(null);
  const [cameras, setCameras] = useState<CameraDevice[]>([]);
  const [selectedCameraId, setSelectedCameraId] = useState("");
  const [cameraError, setCameraError] = useState("");
  const [switchingCamera, setSwitchingCamera] = useState(false);

  useEffect(() => {
    if (videoRef.current) {
      videoRef.current.srcObject = cameraStream;
    }
  }, [cameraStream]);

  useEffect(() => {
    return () => {
      streamRef.current?.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    };
  }, []);

  async function refreshCameraList(): Promise<CameraDevice[]> {
    if (!navigator.mediaDevices?.enumerateDevices) {
      setCameras([]);
      return [];
    }

    try {
      const devices = await navigator.mediaDevices.enumerateDevices();
      const availableCameras = devices
        .filter((device) => device.kind === "videoinput")
        .map((device, index) => ({
          deviceId: device.deviceId,
          label: device.label || `Camera ${index + 1}`,
        }));

      setCameras(availableCameras);
      return availableCameras;
    } catch (error) {
      console.error("Could not list cameras:", error);
      setCameraError("Could not detect available cameras.");
      return [];
    }
  }

  async function openCamera(deviceId?: string) {
    setCameraError("");

    if (!navigator.mediaDevices?.getUserMedia) {
      setCameraError(
        "Camera access is unavailable. Use Choose Image to upload a photo. Camera access requires localhost or HTTPS and browser permission.",
      );
      return;
    }

    setSwitchingCamera(true);
    let nextStream: MediaStream | null = null;

    try {
      nextStream = await navigator.mediaDevices.getUserMedia({
        video: deviceId
          ? { deviceId: { exact: deviceId } }
          : { facingMode: { ideal: "user" } },
        audio: false,
      });

      const activeTrack = nextStream.getVideoTracks()[0];
      const actualDeviceId =
        activeTrack?.getSettings().deviceId ?? deviceId ?? "";

      const devices = await navigator.mediaDevices.enumerateDevices();
      const availableCameras = devices
        .filter((device) => device.kind === "videoinput")
        .map((device, index) => ({
          deviceId: device.deviceId,
          label: device.label || `Camera ${index + 1}`,
        }));

      setCameras(availableCameras);
      setSelectedCameraId(actualDeviceId);

      streamRef.current?.getTracks().forEach((track) => track.stop());
      streamRef.current = nextStream;
      setCameraStream(nextStream);
      nextStream = null;
    } catch (error) {
      nextStream?.getTracks().forEach((track) => track.stop());
      console.error("Camera access failed:", error);

      setCameraError(
        deviceId
          ? "Could not open that camera. Check that it is connected and not being used by another app, then try another camera."
          : "Could not access a camera. Allow camera permission in your browser, check that the camera is connected, or choose an image from your computer.",
      );

      await refreshCameraList();
    } finally {
      setSwitchingCamera(false);
    }
  }

  function closeCamera() {
    streamRef.current?.getTracks().forEach((track) => track.stop());
    streamRef.current = null;
    setCameraStream(null);
    setSelectedCameraId("");
    setCameraError("");
  }

  function capturePhoto() {
    const video = videoRef.current;
    const input = photoInputRef.current;

    if (
      !video ||
      !input ||
      video.readyState < HTMLMediaElement.HAVE_CURRENT_DATA ||
      video.videoWidth === 0
    ) {
      setCameraError(
        "The camera is not ready yet. Please wait a moment and try again.",
      );
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

    context.drawImage(video, 0, 0, canvas.width, canvas.height);

    canvas.toBlob(
      (blob) => {
        if (!blob) {
          setCameraError("Could not create the photo. Please try again.");
          return;
        }

        if (blob.size > 5 * 1024 * 1024) {
          setCameraError(
            "The photo exceeds the 5 MB limit. Move closer to the camera and try again.",
          );
          return;
        }

        try {
          const file = new File([blob], `student-photo-${Date.now()}.jpg`, {
            type: "image/jpeg",
          });

          const transfer = new DataTransfer();
          transfer.items.add(file);
          input.files = transfer.files;

          setCameraError("");
          closeCamera();
        } catch (error) {
          console.error("Could not attach captured photo:", error);
          setCameraError(
            "The photo was captured but could not be attached. Please use Choose Image instead.",
          );
        }
      },
      "image/jpeg",
      0.9,
    );
  }

  if (state.status === "success" && state.receipt) {
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
            The initial PIN is also printed on the enrollment receipt so the
            student can sign in. Hand the receipt directly to the student and
            ask them to change the PIN after their first login.
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
  }

  return (
    <form
      action={action}
      className="grid max-w-3xl gap-4 rounded-xl border border-[#DCE7E2] bg-white p-5 sm:grid-cols-2"
    >
      <RegistrationDatePicker />

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
            Choose an image from your computer, or open a built-in or connected
            camera. JPG, PNG, or WebP, maximum 5 MB.
          </span>
        </label>

        {!cameraStream ? (
          <div className="flex flex-wrap items-center gap-3">
            <button
              type="button"
              onClick={() => openCamera()}
              disabled={switchingCamera}
              className="rounded-lg border border-[#0B6B4F] px-4 py-2 text-sm font-semibold text-[#0B6B4F] hover:bg-[#F1F7F4] disabled:cursor-not-allowed disabled:opacity-60"
            >
              {switchingCamera ? "Opening camera..." : "Open Camera"}
            </button>
            <span className="text-xs text-slate-500">
              You can choose the camera after it opens.
            </span>
          </div>
        ) : (
          <div className="max-w-md space-y-3 rounded-xl border border-[#DCE7E2] p-3">
            <label className="grid gap-1 text-sm font-medium">
              Select camera
              <select
                value={selectedCameraId}
                onChange={(event) => openCamera(event.target.value)}
                disabled={switchingCamera || cameras.length === 0}
                className={field}
              >
                {cameras.length === 0 && (
                  <option value="">No cameras detected</option>
                )}
                {cameras.map((camera, index) => (
                  <option key={camera.deviceId} value={camera.deviceId}>
                    {camera.label || `Camera ${index + 1}`}
                  </option>
                ))}
              </select>
            </label>

            {switchingCamera && (
              <p role="status" className="text-sm text-slate-500">
                Switching camera...
              </p>
            )}

            <video
              ref={videoRef}
              autoPlay
              playsInline
              muted
              className="w-full rounded-lg bg-black"
              style={{ transform: "scaleX(-1)" }}
            />

            <p className="text-xs text-slate-500">
              The preview is mirrored for convenience. The captured photo is
              saved without mirroring.
            </p>

            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                onClick={capturePhoto}
                disabled={switchingCamera}
                className="rounded-lg bg-[#0B6B4F] px-4 py-2 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:opacity-60"
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
