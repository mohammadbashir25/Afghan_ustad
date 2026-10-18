"use server";

import { randomInt } from "node:crypto";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import type { Types } from "mongoose";

import { requireRole } from "@/lib/auth/requireRole";
import { connectDB } from "@/lib/mongodb";
import User from "@/models/User";
import Payment from "@/models/Payment";
import Enrollment from "@/models/Enrollment";
import AuditLog from "@/models/AuditLog";
import Notification from "@/models/Notification";

type StudentPaymentRecord = {
  _id: Types.ObjectId;
  name: string;
  studentId?: string;
  courseName?: string;
  courseFee?: number;
  discountAmount?: number;
  class?: Types.ObjectId | null;
};

type EnrollmentPaymentRecord = {
  _id: Types.ObjectId;
  student: Types.ObjectId;
  status: string;
  courseFee: number;
  courseName: string;
  class?: Types.ObjectId | null;
  discountAmount?: number;
};

export async function recordPaymentAction(fd: FormData) {
  const s = await requireRole(["SUPER_ADMIN", "MANAGER"]);

  const base =
    s.user.role === "MANAGER"
      ? "/manager/finance/payments/new"
      : "/admin/finance/payments/new";

  const selection = String(fd.get("studentId") || "");
  const amount = Number(fd.get("amount"));
  const method = String(fd.get("method") || "");

  if (
    !selection ||
    !Number.isFinite(amount) ||
    amount <= 0 ||
    !(["CASH", "BANK", "MOBILE_MONEY", "OTHER"] as string[]).includes(
      method,
    )
  ) {
    redirect(`${base}?error=invalid`);
  }

  await connectDB();

  const receiptNumber = `AUP-${Date.now()}-${randomInt(1000, 9999)}`;

  let student: StudentPaymentRecord | null = null;
  let enrollment: EnrollmentPaymentRecord | null = null;

  let fee = 0;
  let paid = 0;
  let courseName = "Course fee";
  let studentKey = "";

  let enrollmentId: Types.ObjectId | null = null;
  let classId: Types.ObjectId | null = null;
  let discountAmount = 0;

  if (selection.startsWith("enrollment:")) {
    const id = selection.slice("enrollment:".length);

    if (!/^[a-f\d]{24}$/i.test(id)) {
      redirect(`${base}?error=invalid`);
    }

    enrollment = await Enrollment.findById(id).lean();

    if (
      !enrollment ||
      !["ACTIVE", "PENDING_PAYMENT"].includes(enrollment.status)
    ) {
      redirect(`${base}?error=student`);
    }

    student = await User.findOne({
      _id: enrollment.student,
      role: "STUDENT",
    })
      .select("name studentId")
      .lean();

    if (!student) {
      redirect(`${base}?error=student`);
    }

    const previous = await Payment.find({
      enrollment: enrollment._id,
    })
      .select("amountPaid")
      .lean();

    paid = previous.reduce((sum, payment) => sum + payment.amountPaid, 0);

    fee = enrollment.courseFee;
    courseName = enrollment.courseName;
    studentKey = String(student._id);
    enrollmentId = enrollment._id;

    // Normalize undefined to null.
    classId = enrollment.class ?? null;

    discountAmount = enrollment.discountAmount || 0;
  } else {
    if (!/^[a-f\d]{24}$/i.test(selection)) {
      redirect(`${base}?error=invalid`);
    }

    student = await User.findOne({
      _id: selection,
      role: "STUDENT",
    })
      .select("name studentId courseName courseFee discountAmount class")
      .lean();

    if (!student) {
      redirect(`${base}?error=student`);
    }

    const previous = await Payment.find({
      student: selection,
      enrollment: null,
    })
      .select("amountPaid")
      .lean();

    paid = previous.reduce((sum, payment) => sum + payment.amountPaid, 0);

    fee = student.courseFee || 0;
    courseName = student.courseName || "Course fee";
    studentKey = selection;

    // Normalize undefined to null.
    classId = student.class ?? null;

    discountAmount = student.discountAmount || 0;
  }

  const balance = Math.max(0, fee - paid);

  if (amount > balance) {
    redirect(`${base}?error=amount`);
  }

  const remaining = Math.max(0, balance - amount);

  const payment = await Payment.create({
    receiptNumber,
    student: studentKey,
    enrollment: enrollmentId,
    class: classId,
    studentName: student.name,
    studentId: student.studentId || "",
    courseName,
    courseFee: fee,
    discountAmount,
    amountPaid: amount,
    balanceAfterPayment: remaining,
    method,
    paidAt: new Date(),
    receivedBy: s.user.id,
  });

  try {
    await Notification.create({
      recipient: studentKey,
      title: "Payment recorded",
      message: `A payment of ${amount.toLocaleString()} AFN was recorded for ${courseName}. Receipt: ${receiptNumber}. Remaining balance: ${remaining.toLocaleString()} AFN.`,
      kind: "FINANCE",
      sourceId: String(payment._id),
    });

    const financeReviewers = await User.find({
      role: { $in: ["SUPER_ADMIN", "MANAGER"] },
      isActive: true,
      _id: { $ne: s.user.id },
    })
      .select("_id")
      .lean();

    if (financeReviewers.length > 0) {
      await Notification.insertMany(
        financeReviewers.map((reviewer) => ({
          recipient: reviewer._id,
          title: "Student payment recorded",
          message: `${student.name} paid ${amount.toLocaleString()} AFN for ${courseName}. Receipt: ${receiptNumber}.`,
          kind: "FINANCE",
          sourceId: String(payment._id),
        })),
      );
    }
  } catch (notificationError) {
    console.error(
      "Payment notification delivery failed",
      notificationError,
    );
  }

  const totalPaid = paid + amount;

  if (enrollmentId && totalPaid >= fee) {
    await Enrollment.updateOne(
      { _id: enrollmentId },
      { $set: { status: "ACTIVE" } },
    );

    await User.updateOne(
      { _id: studentKey, role: "STUDENT" },
      { $set: { isActive: true } },
    );
  } else if (!enrollmentId && totalPaid >= fee) {
    await User.updateOne(
      { _id: studentKey, role: "STUDENT" },
      { $set: { isActive: true } },
    );

    const legacyEnrollment = await Enrollment.findOne({
      student: studentKey,
      status: "PENDING_PAYMENT",
    })
      .select("_id")
      .lean();

    if (legacyEnrollment) {
      await Enrollment.updateOne(
        { _id: legacyEnrollment._id },
        { $set: { status: "ACTIVE" } },
      );
    }
  }

  await AuditLog.create({
    actor: s.user.id,
    actorName: s.user.name || s.user.email || "Staff",
    action: "PAYMENT_RECORDED",
    targetType: "Payment",
    targetId: String(payment._id),
    details: `${amount.toLocaleString()} AFN received from ${student.name} for ${courseName}; receipt ${receiptNumber}; remaining balance ${remaining} AFN.`,
  });

  revalidatePath("/admin/finance");
  revalidatePath("/manager/finance");
  revalidatePath("/student/payments");
  revalidatePath("/manager/students");
  revalidatePath("/manager/student-history");
  revalidatePath("/admin/students");
  revalidatePath("/student");

  redirect(
    `${s.user.role === "MANAGER" ? "/manager/finance" : "/admin/finance"}?paymentRecorded=1`,
  );
}