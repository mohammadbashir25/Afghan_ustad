"use server";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { put } from "@vercel/blob";
import { requireRole } from "@/lib/auth/requireRole";
import { connectDB } from "@/lib/mongodb";
import Course from "@/models/Course";
import ClassRecord from "@/models/Class";
import User from "@/models/User";
import AuditLog from "@/models/AuditLog";
import Assignment from "@/models/Assignment";

const courseSchema = z.object({
  titleEn: z.string().trim().min(2).max(120),
  titleFa: z.string().trim().min(2).max(120),
  titlePs: z.string().trim().min(2).max(120),
  slug: z
    .string()
    .trim()
    .toLowerCase()
    .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/)
    .max(140),
  categoryEn: z.string().trim().min(2).max(80),
  categoryFa: z.string().trim().min(2).max(80),
  categoryPs: z.string().trim().min(2).max(80),
  descriptionEn: z.string().trim().min(10).max(3000),
  descriptionFa: z.string().trim().min(10).max(3000),
  descriptionPs: z.string().trim().min(10).max(3000),
  durationEn: z.string().trim().min(1).max(80),
  durationFa: z.string().trim().min(1).max(80),
  durationPs: z.string().trim().min(1).max(80),
  level: z.enum(["beginner", "intermediate", "advanced"]),
  fee: z.coerce.number().finite().min(0),
  status: z.enum(["ACTIVE", "DRAFT", "ARCHIVED"]),
  featured: z.enum(["true", "false"]).default("false"),
});
const classSchema = z.object({
  name: z.string().trim().min(2).max(120),
  courseId: z.string().regex(/^[a-f\d]{24}$/i),
  guideId: z.string().optional(),
  teacherId: z.string().optional(),
  schedule: z.string().trim().min(2).max(160),
  startDate: z.string().optional(),
  endDate: z.string().optional(),
  status: z.enum(["ACTIVE", "UPCOMING", "COMPLETED"]),
});
const read = (fd: FormData, key: string) => String(fd.get(key) ?? "").trim();

export async function createCourseAction(fd: FormData) {
  const session = await requireRole(["SUPER_ADMIN", "MANAGER"]);
  const base =
    session.user.role === "MANAGER" ? "/manager/courses" : "/admin/courses";
  const parsed = courseSchema.safeParse({
    titleEn: read(fd, "titleEn"),
    titleFa: read(fd, "titleFa"),
    titlePs: read(fd, "titlePs"),
    slug: read(fd, "slug"),
    categoryEn: read(fd, "categoryEn"),
    categoryFa: read(fd, "categoryFa"),
    categoryPs: read(fd, "categoryPs"),
    descriptionEn: read(fd, "descriptionEn"),
    descriptionFa: read(fd, "descriptionFa"),
    descriptionPs: read(fd, "descriptionPs"),
    durationEn: read(fd, "durationEn"),
    durationFa: read(fd, "durationFa"),
    durationPs: read(fd, "durationPs"),
    level: read(fd, "level"),
    fee: read(fd, "fee"),
    status: read(fd, "status"),
    featured: read(fd, "featured") || "false",
  });
  const rawFile = fd.get("thumbnail");
  const thumbnail =
    rawFile instanceof File && rawFile.size > 0 ? rawFile : null;
  if (
    !parsed.success ||
    !thumbnail ||
    thumbnail.size > 5 * 1024 * 1024 ||
    !["image/jpeg", "image/png", "image/webp"].includes(thumbnail.type)
  )
    redirect(`${base}/new?error=invalid`);
  await connectDB();
  if (await Course.exists({ slug: parsed.data.slug }))
    redirect(`${base}/new?error=slug`);
  let thumbnailUrl = "";
  try {
    const safeName =
      thumbnail.name
        .normalize("NFKD")
        .replace(/[^a-zA-Z0-9._-]+/g, "-")
        .slice(-80) || "course-thumbnail";
    const blob = await put(
      `courses/${parsed.data.slug}/${Date.now()}-${safeName}`,
      thumbnail,
      { access: "public", addRandomSuffix: true, contentType: thumbnail.type },
    );
    thumbnailUrl = blob.url;
  } catch (error) {
    console.error("Course thumbnail upload failed", error);
    redirect(`${base}/new?error=upload`);
  }
  const {
    titleEn,
    titleFa,
    titlePs,
    categoryEn,
    categoryFa,
    categoryPs,
    descriptionEn,
    descriptionFa,
    descriptionPs,
    durationEn,
    durationFa,
    durationPs,
    ...rest
  } = parsed.data;
  const course = await Course.create({
    ...rest,
    title: titleEn,
    category: categoryEn,
    description: descriptionEn,
    duration: durationEn,
    slug: parsed.data.slug,
    thumbnailUrl,
    titleI18n: { en: titleEn, fa: titleFa, ps: titlePs },
    categoryI18n: { en: categoryEn, fa: categoryFa, ps: categoryPs },
    descriptionI18n: {
      en: descriptionEn,
      fa: descriptionFa,
      ps: descriptionPs,
    },
    durationI18n: { en: durationEn, fa: durationFa, ps: durationPs },
    featured: parsed.data.featured === "true",
  });
  await AuditLog.create({
    actor: session.user.id,
    actorName: session.user.name || session.user.email || "Staff",
    action: "COURSE_CREATED",
    targetType: "Course",
    targetId: String(course._id),
    details: `Created course ${titleEn} with fee ${parsed.data.fee} AFN.`,
  });
  revalidatePath("/admin/courses");
  revalidatePath("/manager/courses");
  revalidatePath("/en");
  revalidatePath("/fa");
  revalidatePath("/ps");
  revalidatePath("/en/courses");
  revalidatePath("/fa/courses");
  revalidatePath("/ps/courses");
  redirect(`${base}?created=1`);
}


export async function createClassAction(fd: FormData) {
  const session = await requireRole(["SUPER_ADMIN", "MANAGER"]);
  const base =
    session.user.role === "MANAGER" ? "/manager/classes" : "/admin/classes";

  const parsed = classSchema.safeParse({
    name: read(fd, "name"),
    courseId: read(fd, "courseId"),
    guideId: read(fd, "guideId"),
    teacherId: read(fd, "teacherId"),
    schedule: read(fd, "schedule"),
    startDate: read(fd, "startDate"),
    endDate: read(fd, "endDate"),
    status: read(fd, "status"),
  });

  if (!parsed.success) redirect(`${base}/new?error=invalid`);

  const taskTitles = fd.getAll("taskTitle").map((v) => String(v).trim());
  const taskDescriptions = fd
    .getAll("taskDescription")
    .map((v) => String(v).trim());
  const taskTips = fd.getAll("taskTips").map((v) => String(v).trim());
  const taskDueDates = fd.getAll("taskDueDate").map((v) => String(v).trim());

  if (
    taskTitles.length < 1 ||
    taskTitles.length !== taskDescriptions.length ||
    taskTitles.length !== taskTips.length ||
    taskTitles.length !== taskDueDates.length
  ) {
    redirect(`${base}/new?error=tasks`);
  }

  const tasks = taskTitles.map((title, index) => {
    const dueDateText = taskDueDates[index];
    const dueDate = new Date(`${dueDateText}T23:59:59.999Z`);

    if (
      title.length < 2 ||
      title.length > 160 ||
      taskDescriptions[index].length > 3000 ||
      taskTips[index].length > 3000 ||
      !/^\d{4}-\d{2}-\d{2}$/.test(dueDateText) ||
      Number.isNaN(dueDate.getTime()) ||
      dueDate.toISOString().slice(0, 10) !== dueDateText
    ) {
      redirect(`${base}/new?error=tasks`);
    }

    return {
      title,
      description: taskDescriptions[index],
      guidesAndTips: taskTips[index],
      dueDate,
    };
  });

  await connectDB();

  if (!(await Course.exists({ _id: parsed.data.courseId }))) {
    redirect(`${base}/new?error=course`);
  }

  const guide = await User.findOne({
    _id: parsed.data.guideId,
    role: "GUIDE",
    isActive: true,
  })
    .select("_id")
    .lean();

  // Tasks need an assigned Guide to appear in the Guide dashboard.
  if (!guide) redirect(`${base}/new?error=guide`);

  let teacher = null;

  if (parsed.data.teacherId) {
    teacher = await User.findOne({
      _id: parsed.data.teacherId,
      role: "TEACHER",
      isActive: true,
    })
      .select("_id")
      .lean();

    if (!teacher) redirect(`${base}/new?error=teacher`);
  }

  const startDate = parsed.data.startDate
    ? new Date(`${parsed.data.startDate}T00:00:00.000Z`)
    : null;

  const endDate = parsed.data.endDate
    ? new Date(`${parsed.data.endDate}T00:00:00.000Z`)
    : null;

  if (
    (startDate && Number.isNaN(startDate.getTime())) ||
    (endDate && Number.isNaN(endDate.getTime()))
  ) {
    redirect(`${base}/new?error=date`);
  }

  if (startDate && endDate && endDate < startDate) {
    redirect(`${base}/new?error=date`);
  }

  const classRecord = await ClassRecord.create({
    name: parsed.data.name,
    course: parsed.data.courseId,
    guide: guide._id,
    teacher: teacher?._id ?? null,
    schedule: parsed.data.schedule,
    startDate,
    endDate,
    status: parsed.data.status,
  });

  for (const task of tasks) {
    const assignment = await Assignment.create({
      ...task,
      course: parsed.data.courseId,
      class: classRecord._id,
      status: "PUBLISHED",
      createdBy: session.user.id,
    });

    await AuditLog.create({
      actor: session.user.id,
      actorName: session.user.name || session.user.email || "Staff",
      action: "SKILL_CENTER_TASK_CREATED",
      targetType: "Assignment",
      targetId: String(assignment._id),
      details: `Created task "${task.title}" for class ${parsed.data.name}.`,
    });
  }

  await AuditLog.create({
    actor: session.user.id,
    actorName: session.user.name || session.user.email || "Staff",
    action: "CLASS_CREATED",
    targetType: "Class",
    targetId: String(classRecord._id),
    details: `Created class ${parsed.data.name}; guide ${guide._id}; teacher ${teacher?._id || "unassigned"}; tasks ${tasks.length}.`,
  });

  revalidatePath("/admin/classes");
  revalidatePath("/manager/classes");
  revalidatePath("/teacher");
  revalidatePath("/guide/assignments");
  revalidatePath("/student/assignments");

  redirect(`${base}?created=1`);
}

const recordIdSchema = z.string().regex(/^[a-f\d]{24}$/i);

export async function updateCourseAction(fd: FormData) {
  const session = await requireRole(["SUPER_ADMIN", "MANAGER"]);
  const base =
    session.user.role === "MANAGER" ? "/manager/courses" : "/admin/courses";

  const courseId = read(fd, "courseId");
  const parsed = courseSchema.safeParse({
    titleEn: read(fd, "titleEn"),
    titleFa: read(fd, "titleFa"),
    titlePs: read(fd, "titlePs"),
    slug: read(fd, "slug"),
    categoryEn: read(fd, "categoryEn"),
    categoryFa: read(fd, "categoryFa"),
    categoryPs: read(fd, "categoryPs"),
    descriptionEn: read(fd, "descriptionEn"),
    descriptionFa: read(fd, "descriptionFa"),
    descriptionPs: read(fd, "descriptionPs"),
    durationEn: read(fd, "durationEn"),
    durationFa: read(fd, "durationFa"),
    durationPs: read(fd, "durationPs"),
    level: read(fd, "level"),
    fee: read(fd, "fee"),
    status: read(fd, "status"),
    featured: read(fd, "featured") || "false",
  });

  if (!recordIdSchema.safeParse(courseId).success || !parsed.success) {
    redirect(`${base}?error=invalid`);
  }

  const rawFile = fd.get("thumbnail");
  const thumbnail =
    rawFile instanceof File && rawFile.size > 0 ? rawFile : null;

  if (
    thumbnail &&
    (thumbnail.size > 5 * 1024 * 1024 ||
      !["image/jpeg", "image/png", "image/webp"].includes(thumbnail.type))
  ) {
    redirect(`${base}?error=thumbnail`);
  }

  await connectDB();

  const existing = await Course.findById(courseId).select("_id slug").lean();
  if (!existing) redirect(`${base}?error=notfound`);

  const duplicateSlug = await Course.exists({
    slug: parsed.data.slug,
    _id: { $ne: courseId },
  });
  if (duplicateSlug) redirect(`${base}?error=slug`);

  let thumbnailUrl: string | undefined;

  if (thumbnail) {
    try {
      const safeName =
        thumbnail.name
          .normalize("NFKD")
          .replace(/[^a-zA-Z0-9._-]+/g, "-")
          .slice(-80) || "course-thumbnail";

      const blob = await put(
        `courses/${parsed.data.slug}/${Date.now()}-${safeName}`,
        thumbnail,
        {
          access: "public",
          addRandomSuffix: true,
          contentType: thumbnail.type,
        },
      );
      thumbnailUrl = blob.url;
    } catch (error) {
      console.error("Course thumbnail upload failed", error);
      redirect(`${base}?error=upload`);
    }
  }

  const {
    titleEn,
    titleFa,
    titlePs,
    categoryEn,
    categoryFa,
    categoryPs,
    descriptionEn,
    descriptionFa,
    descriptionPs,
    durationEn,
    durationFa,
    durationPs,
    ...rest
  } = parsed.data;

  const update: Record<string, unknown> = {
    ...rest,
    title: titleEn,
    category: categoryEn,
    description: descriptionEn,
    duration: durationEn,
    titleI18n: { en: titleEn, fa: titleFa, ps: titlePs },
    categoryI18n: { en: categoryEn, fa: categoryFa, ps: categoryPs },
    descriptionI18n: {
      en: descriptionEn,
      fa: descriptionFa,
      ps: descriptionPs,
    },
    durationI18n: { en: durationEn, fa: durationFa, ps: durationPs },
    featured: parsed.data.featured === "true",
  };

  if (thumbnailUrl) update.thumbnailUrl = thumbnailUrl;

  await Course.findByIdAndUpdate(
    courseId,
    { $set: update },
    { runValidators: true },
  );

  await AuditLog.create({
    actor: session.user.id,
    actorName: session.user.name || session.user.email || "Staff",
    action: "COURSE_UPDATED",
    targetType: "Course",
    targetId: courseId,
    details: `Updated course ${titleEn}; status ${parsed.data.status}.`,
  });

  revalidatePath("/admin/courses");
  revalidatePath("/manager/courses");
  revalidatePath("/admin/classes");
  revalidatePath("/manager/classes");
  revalidatePath("/en");
  revalidatePath("/fa");
  revalidatePath("/ps");
  revalidatePath("/en/courses");
  revalidatePath("/fa/courses");
  revalidatePath("/ps/courses");

  redirect(`${base}?updated=1`);
}

export async function updateClassAction(fd: FormData) {
  const session = await requireRole(["SUPER_ADMIN", "MANAGER"]);
  const base =
    session.user.role === "MANAGER" ? "/manager/classes" : "/admin/classes";

  const classId = read(fd, "classId");
  const parsed = classSchema.safeParse({
    name: read(fd, "name"),
    courseId: read(fd, "courseId"),
    guideId: read(fd, "guideId"),
    teacherId: read(fd, "teacherId"),
    schedule: read(fd, "schedule"),
    startDate: read(fd, "startDate"),
    endDate: read(fd, "endDate"),
    status: read(fd, "status"),
  });

  if (!recordIdSchema.safeParse(classId).success || !parsed.success) {
    redirect(`${base}?error=invalid`);
  }

  const dateOnly = (value: string) => {
    if (!value) return null;
    if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return undefined;
    const date = new Date(`${value}T00:00:00.000Z`);
    return !Number.isNaN(date.getTime()) &&
      date.toISOString().slice(0, 10) === value
      ? date
      : undefined;
  };

  const startDate = dateOnly(parsed.data.startDate ?? "");
  const endDate = dateOnly(parsed.data.endDate ?? "");

  if (
    startDate === undefined ||
    endDate === undefined ||
    (startDate && endDate && endDate < startDate)
  ) {
    redirect(`${base}?error=date`);
  }

  await connectDB();

  const existing = await ClassRecord.findById(classId)
    .select("_id name")
    .lean();
  if (!existing) redirect(`${base}?error=notfound`);

  const course = await Course.findById(parsed.data.courseId)
    .select("_id")
    .lean();
  if (!course) redirect(`${base}?error=course`);

  let guideId: string | null = null;
  if (parsed.data.guideId) {
    const guide = await User.findOne({
      _id: parsed.data.guideId,
      role: "GUIDE",
      isActive: true,
    })
      .select("_id")
      .lean();

    if (!guide) redirect(`${base}?error=guide`);
    guideId = String(guide._id);
  }

  let teacherId: string | null = null;
  if (parsed.data.teacherId) {
    const teacher = await User.findOne({
      _id: parsed.data.teacherId,
      role: "TEACHER",
      isActive: true,
    })
      .select("_id")
      .lean();

    if (!teacher) redirect(`${base}?error=teacher`);
    teacherId = String(teacher._id);
  }

  await ClassRecord.findByIdAndUpdate(
    classId,
    {
      $set: {
        name: parsed.data.name,
        course: parsed.data.courseId,
        guide: guideId,
        teacher: teacherId,
        schedule: parsed.data.schedule,
        startDate,
        endDate,
        status: parsed.data.status,
      },
    },
    { runValidators: true },
  );

  await AuditLog.create({
    actor: session.user.id,
    actorName: session.user.name || session.user.email || "Staff",
    action: "CLASS_UPDATED",
    targetType: "Class",
    targetId: classId,
    details: `Updated class ${parsed.data.name}; status ${parsed.data.status}.`,
  });

  revalidatePath("/admin/classes");
  revalidatePath("/manager/classes");
  revalidatePath("/teacher");
  revalidatePath("/teacher/student-attendance");
  revalidatePath("/guide/attendance");
  revalidatePath("/guide/assignments");
  revalidatePath("/student/assignments");
  revalidatePath("/admin/audit-logs");

  redirect(`${base}?updated=1`);
}
