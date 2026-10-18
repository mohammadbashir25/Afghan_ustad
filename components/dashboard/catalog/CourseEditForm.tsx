
import Link from "next/link";
import { updateCourseAction } from "@/app/admin/catalog-actions";

type CourseEditData = {
  id: string;
  title: string;
  slug: string;
  titleI18n?: { en?: string; fa?: string; ps?: string };
  categoryI18n?: { en?: string; fa?: string; ps?: string };
  descriptionI18n?: { en?: string; fa?: string; ps?: string };
  durationI18n?: { en?: string; fa?: string; ps?: string };
  level: "beginner" | "intermediate" | "advanced";
  fee: number;
  status: "ACTIVE" | "DRAFT" | "ARCHIVED";
  featured: boolean;
};

const field =
  "mt-1 w-full rounded-lg border border-[#DCE7E2] bg-white px-3 py-2 text-sm text-[#12372E]";

function InputField({
  label,
  name,
  defaultValue,
  required = true,
  type = "text",
}: {
  label: string;
  name: string;
  defaultValue?: string | number;
  required?: boolean;
  type?: string;
}) {
  return (
    <label className="block text-sm font-medium text-[#12372E]">
      {label}
      <input
        className={field}
        name={name}
        type={type}
        defaultValue={defaultValue}
        required={required}
      />
    </label>
  );
}

function TextAreaField({
  label,
  name,
  defaultValue,
}: {
  label: string;
  name: string;
  defaultValue?: string;
}) {
  return (
    <label className="block text-sm font-medium text-[#12372E]">
      {label}
      <textarea
        className={field}
        name={name}
        defaultValue={defaultValue}
        required
        minLength={10}
        maxLength={3000}
        rows={4}
      />
    </label>
  );
}

export default function CourseEditForm({
  course,
  basePath,
}: {
  course: CourseEditData;
  basePath: "/admin/courses" | "/manager/courses";
}) {
  return (
    <form
      action={updateCourseAction}
      className="space-y-6 rounded-xl border border-[#DCE7E2] bg-white p-5"
    >
      <input type="hidden" name="courseId" value={course.id} />

      <section className="space-y-4">
        <h2 className="font-semibold text-[#053B2E]">Course identity</h2>
        <div className="grid gap-4 md:grid-cols-2">
          <InputField label="Title (English)" name="titleEn" defaultValue={course.titleI18n?.en ?? course.title} />
          <InputField label="Title (Dari)" name="titleFa" defaultValue={course.titleI18n?.fa ?? ""} />
          <InputField label="Title (Pashto)" name="titlePs" defaultValue={course.titleI18n?.ps ?? ""} />
          <InputField label="URL slug" name="slug" defaultValue={course.slug} />
          <InputField label="Category (English)" name="categoryEn" defaultValue={course.categoryI18n?.en ?? ""} />
          <InputField label="Category (Dari)" name="categoryFa" defaultValue={course.categoryI18n?.fa ?? ""} />
          <InputField label="Category (Pashto)" name="categoryPs" defaultValue={course.categoryI18n?.ps ?? ""} />
        </div>
      </section>

      <section className="space-y-4">
        <h2 className="font-semibold text-[#053B2E]">Descriptions</h2>
        <div className="grid gap-4 md:grid-cols-2">
          <TextAreaField label="Description (English)" name="descriptionEn" defaultValue={course.descriptionI18n?.en ?? ""} />
          <TextAreaField label="Description (Dari)" name="descriptionFa" defaultValue={course.descriptionI18n?.fa ?? ""} />
          <TextAreaField label="Description (Pashto)" name="descriptionPs" defaultValue={course.descriptionI18n?.ps ?? ""} />
        </div>
      </section>

      <section className="space-y-4">
        <h2 className="font-semibold text-[#053B2E]">Course settings</h2>
        <div className="grid gap-4 md:grid-cols-2">
          <InputField label="Duration (English)" name="durationEn" defaultValue={course.durationI18n?.en ?? ""} />
          <InputField label="Duration (Dari)" name="durationFa" defaultValue={course.durationI18n?.fa ?? ""} />
          <InputField label="Duration (Pashto)" name="durationPs" defaultValue={course.durationI18n?.ps ?? ""} />
          <InputField label="Fee (AFN)" name="fee" type="number" defaultValue={course.fee} />
          <label className="block text-sm font-medium text-[#12372E]">
            Level
            <select name="level" defaultValue={course.level} className={field}>
              <option value="beginner">Beginner</option>
              <option value="intermediate">Intermediate</option>
              <option value="advanced">Advanced</option>
            </select>
          </label>
          <label className="block text-sm font-medium text-[#12372E]">
            Status
            <select name="status" defaultValue={course.status} className={field}>
              <option value="DRAFT">Draft</option>
              <option value="ACTIVE">Active / Published</option>
              <option value="ARCHIVED">Archived</option>
            </select>
          </label>
          <label className="block text-sm font-medium text-[#12372E]">
            Featured course
            <select
              name="featured"
              defaultValue={course.featured ? "true" : "false"}
              className={field}
            >
              <option value="false">No</option>
              <option value="true">Yes</option>
            </select>
          </label>
          <label className="block text-sm font-medium text-[#12372E]">
            Replace thumbnail (optional)
            <input
              className={field}
              type="file"
              name="thumbnail"
              accept="image/png,image/jpeg,image/webp"
            />
            <span className="mt-1 block text-xs text-slate-500">
              Leave empty to keep the current thumbnail.
            </span>
          </label>
        </div>
      </section>

      <div className="flex flex-wrap gap-3 border-t border-[#DCE7E2] pt-4">
        <button className="rounded-lg bg-[#0B6B4F] px-5 py-2.5 text-sm font-semibold text-white">
          Save course changes
        </button>
        <Link href={basePath} className="rounded-lg border border-[#DCE7E2] px-5 py-2.5 text-sm">
          Cancel
        </Link>
      </div>
    </form>
  );
}
