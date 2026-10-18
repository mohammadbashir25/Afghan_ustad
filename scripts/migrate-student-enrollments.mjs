import mongoose from "mongoose";

const uri = process.env.MONGODB_URI;
if (!uri) {
  console.error("MONGODB_URI is required. Set it in the environment before running this script.");
  process.exit(1);
}
const apply = process.argv.includes("--apply");
const enforceAccess = process.argv.includes("--enforce-access");
await mongoose.connect(uri);
try {
  const db = mongoose.connection.db;
  const users = db.collection("users");
  const courses = db.collection("courses");
  const classes = db.collection("classes");
  const enrollments = db.collection("enrollments");
  const payments = db.collection("payments");
  const students = await users.find({ role: "STUDENT", course: { $ne: null } }).toArray();
  let created = 0, linkedPayments = 0, wouldDeactivate = 0;
  for (const student of students) {
    const course = await courses.findOne({ _id: student.course });
    if (!course) {
      console.warn(`SKIP ${student.studentId || student._id}: course record not found.`);
      continue;
    }
    const classId = student.class || null;
    const classDoc = classId ? await classes.findOne({ _id: classId }) : null;
    if (classId && !classDoc) console.warn(`Student ${student.studentId || student._id} references a missing class; keeping class null.`);
    const actualClassId = classDoc ? classId : null;
    let enrollment = await enrollments.findOne({ student: student._id, course: course._id, class: actualClassId, status: { $ne: "CANCELLED" } });
    const legacyPayments = await payments.find({ student: student._id, $or: [{ enrollment: null }, { enrollment: { $exists: false } }] }).toArray();
    const paid = legacyPayments.reduce((sum, payment) => sum + Number(payment.amountPaid || 0), 0);
    const discountAmount = Math.max(0, Number(student.discountAmount || 0));
    const fee = Math.max(0, Number(student.courseFee ?? course.fee ?? 0) - discountAmount);
    const status = paid >= fee ? "ACTIVE" : "PENDING_PAYMENT";
    if (!enrollment) {
      if (apply) {
        const result = await enrollments.insertOne({
          student: student._id, course: course._id, class: actualClassId,
          courseName: student.courseName || course.title, courseFee: fee,
          discountAmount, status, enrolledAt: student.createdAt || new Date(),
          createdAt: new Date(), updatedAt: new Date(),
        });
        enrollment = { _id: result.insertedId };
      }
      created++;
    }
    if (apply && enrollment && legacyPayments.length) {
      const result = await payments.updateMany(
        { _id: { $in: legacyPayments.map(payment => payment._id) } },
        { $set: { enrollment: enrollment._id, class: actualClassId, courseFee: fee, discountAmount } },
      );
      linkedPayments += result.modifiedCount;
    }
    if (status !== "ACTIVE" && student.isActive) {
      wouldDeactivate++;
      if (apply && enforceAccess) await users.updateOne({ _id: student._id }, { $set: { isActive: false } });
    } else if (status === "ACTIVE" && !student.isActive && apply && enforceAccess) {
      await users.updateOne({ _id: student._id }, { $set: { isActive: true } });
    }
  }
  console.log(`${apply ? "APPLY" : "DRY RUN"}: ${created} legacy enrollments to create/process; ${linkedPayments} legacy payment records linked.`);
  console.log(`${wouldDeactivate} currently active accounts have insufficient recorded payments for their legacy course.`);
  if (!apply) console.log("No data was changed. Run with --apply to migrate; add --enforce-access only after reviewing the accounts that would be deactivated.");
  else if (!enforceAccess) console.log("Enrollment/payment data was migrated without changing current account access. Review outstanding balances before running with --enforce-access.");
} finally {
  await mongoose.disconnect();
}
