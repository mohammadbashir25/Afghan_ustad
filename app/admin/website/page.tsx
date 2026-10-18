import { requireRole } from "@/lib/auth/requireRole";
import { connectDB } from "@/lib/mongodb";
import Announcement from "@/models/Announcement";
import PublicStory from "@/models/PublicStory";
import ResourcePage from "@/components/dashboard/ResourcePage";
import { createAnnouncementAction } from "@/app/manager/announcements/actions";
import {
  createPublicStoryAction,
  updatePublicStoryStatusAction,
  deletePublicStoryAction,
  updatePublicStoryContentAction,
} from "./content-actions";
export const metadata = { title: "Website & Content | AfghanUstad" };
const field =
  "mt-1 w-full rounded-lg border border-[#DCE7E2] px-3 py-2 text-sm";
function Text({
  label,
  name,
  required = true,
}: {
  label: string;
  name: string;
  required?: boolean;
}) {
  return (
    <label className="text-sm font-medium">
      {label}
      <input name={name} required={required} className={field} />
    </label>
  );
}
function Area({
  label,
  name,
  required = true,
}: {
  label: string;
  name: string;
  required?: boolean;
}) {
  return (
    <label className="text-sm font-medium">
      {label}
      <textarea
        name={name}
        required={required}
        minLength={required ? 10 : 0}
        maxLength={3000}
        rows={3}
        className={field}
      />
    </label>
  );
}
export default async function Page({
  searchParams,
}: {
  searchParams: Promise<{
    contentCreated?: string;
    contentUpdated?: string;
    contentError?: string;
  }>;
}) {
  await requireRole(["SUPER_ADMIN", "MANAGER"]);
  await connectDB();
  const [announcements, stories, params] = await Promise.all([
    Announcement.find().sort({ createdAt: -1 }).limit(100).lean(),
    PublicStory.find().sort({ createdAt: -1 }).limit(100).lean(),
    searchParams,
  ]);
  const err: Record<string, string> = {
    validation: "All three languages and explicit consent are required.",
    photo: "Photo must be JPG, PNG or WebP and at most 5 MB.",
    upload: "Image upload failed. Check BLOB_READ_WRITE_TOKEN and try again.",
  };
  return (
    <div className="space-y-6">
      <ResourcePage
        eyebrow="System"
        title="Website & Content Management"
        description="Manage announcements, approved success stories and testimonials shown on the public website."
        stats={[
          { label: "Announcements", value: announcements.length },
          {
            label: "Published announcements",
            value: announcements.filter((a) => a.published).length,
          },
          { label: "Stories / testimonials", value: stories.length },
          {
            label: "Approved public items",
            value: stories.filter((s) => s.isApproved).length,
          },
        ]}
        rows={[
          ...stories.map((s) => ({
            title: `${s.type}: ${s.studentName}`,
            detail: s.story,
            status: s.isApproved ? "Approved / public" : "Draft / hidden",
            meta: `Featured: ${s.featured ? "Yes" : "No"}`,
          })),
          ...announcements.map((a) => ({
            title: a.title,
            detail: a.message,
            status: a.published ? "Published" : "Draft",
            meta: `Audience: ${a.audience}`,
          })),
        ]}
        empty="No website content has been added yet."
      />
      {params.contentUpdated && (
        <p className="rounded-lg bg-[#E6F4EE] p-3 text-sm">
          Website content updated successfully.
        </p>
      )}
      {params.contentCreated && (
        <p className="rounded-lg bg-[#E6F4EE] p-3 text-sm">
          Content saved. Approved items can now appear on the public pages.
        </p>
      )}
      {params.contentError && (
        <p
          role="alert"
          className="rounded-lg bg-red-50 p-3 text-sm text-red-700"
        >
          {err[params.contentError] || "Could not save content."}
        </p>
      )}
      <section className="rounded-xl border border-[#DCE7E2] bg-white p-5">
        <h2 className="font-semibold text-[#053B2E]">
          Manage existing public stories and testimonials
        </h2>
        <p className="mt-1 text-sm text-slate-500">
          Control publication and homepage featuring, or remove an item. Public
          visibility still requires recorded consent.
        </p>
        <div className="mt-4 space-y-3">
          {stories.map((story) => (
            <article
              key={String(story._id)}
              className="flex flex-col gap-4 rounded-xl border border-[#E4ECE8] p-4 md:flex-row md:items-center md:justify-between"
            >
              <div className="min-w-0">
                <p className="font-semibold text-[#12372E]">
                  {story.studentName}{" "}
                  <span className="font-normal text-slate-500">
                    ·{" "}
                    {story.type === "TESTIMONIAL"
                      ? "Testimonial"
                      : "Success story"}
                  </span>
                </p>
                <p className="mt-1 line-clamp-2 text-sm text-slate-600">
                  {story.story}
                </p>
                <p className="mt-2 text-xs text-slate-500">
                  {story.consentConfirmed
                    ? "Consent recorded"
                    : "Consent missing"}{" "}
                  · {story.isApproved ? "Public" : "Draft"} ·{" "}
                  {story.featured ? "Featured" : "Not featured"}
                </p>
              </div>
              <div className="flex shrink-0 flex-wrap items-end gap-3">
                <details className="basis-full rounded-lg border border-[#E4ECE8] p-3">
                  <summary className="cursor-pointer text-sm font-semibold text-[#0B6B4F]">
                    Edit localized content
                  </summary>
                  <form
                    action={updatePublicStoryContentAction}
                    encType="multipart/form-data"
                    className="mt-4 grid gap-4 lg:grid-cols-3"
                  >
                    <input
                      type="hidden"
                      name="storyId"
                      value={String(story._id)}
                    />
                    <label className="text-xs font-medium">
                      Content type
                      <select
                        name="type"
                        defaultValue={story.type}
                        className="mt-1 block w-full rounded-lg border px-3 py-2 text-sm"
                      >
                        <option value="SUCCESS_STORY">Success story</option>
                        <option value="TESTIMONIAL">Testimonial</option>
                      </select>
                    </label>
                    <label className="text-xs font-medium">
                      Replace photo (optional)
                      <input
                        type="file"
                        name="photo"
                        accept="image/jpeg,image/png,image/webp"
                        className="mt-1 block w-full rounded-lg border px-3 py-2 text-sm"
                      />
                    </label>
                    <div className="text-xs text-slate-500">
                      Current publication status is preserved.
                    </div>
                    <section className="space-y-2">
                      <h4 className="font-semibold">English</h4>
                      <label className="block text-xs">
                        Student name
                        <input
                          name="nameEn"
                          required
                          minLength={2}
                          maxLength={120}
                          defaultValue={
                            story.studentNameI18n?.en || story.studentName
                          }
                          className="mt-1 w-full rounded-lg border px-3 py-2 text-sm"
                        />
                      </label>
                      <label className="block text-xs">
                        Story
                        <textarea
                          name="storyEn"
                          required
                          minLength={10}
                          maxLength={3000}
                          defaultValue={story.storyI18n?.en || story.story}
                          rows={4}
                          className="mt-1 w-full rounded-lg border px-3 py-2 text-sm"
                        />
                      </label>
                      <label className="block text-xs">
                        Outcome
                        <input
                          name="outcomeEn"
                          maxLength={1000}
                          defaultValue={
                            story.outcomeI18n?.en || story.outcome || ""
                          }
                          className="mt-1 w-full rounded-lg border px-3 py-2 text-sm"
                        />
                      </label>
                      <label className="block text-xs">
                        Role
                        <input
                          name="roleEn"
                          maxLength={120}
                          defaultValue={story.roleI18n?.en || story.role || ""}
                          className="mt-1 w-full rounded-lg border px-3 py-2 text-sm"
                        />
                      </label>
                      <label className="block text-xs">
                        Category
                        <input
                          name="categoryEn"
                          maxLength={120}
                          defaultValue={
                            story.categoryI18n?.en || story.category || ""
                          }
                          className="mt-1 w-full rounded-lg border px-3 py-2 text-sm"
                        />
                      </label>
                    </section>
                    <section className="space-y-2">
                      <h4 className="font-semibold">Dari</h4>
                      <label className="block text-xs">
                        Student name
                        <input
                          name="nameFa"
                          required
                          minLength={2}
                          maxLength={120}
                          defaultValue={
                            story.studentNameI18n?.fa || story.studentName
                          }
                          className="mt-1 w-full rounded-lg border px-3 py-2 text-sm"
                        />
                      </label>
                      <label className="block text-xs">
                        Story
                        <textarea
                          name="storyFa"
                          required
                          minLength={10}
                          maxLength={3000}
                          defaultValue={story.storyI18n?.fa || story.story}
                          rows={4}
                          className="mt-1 w-full rounded-lg border px-3 py-2 text-sm"
                        />
                      </label>
                      <label className="block text-xs">
                        Outcome
                        <input
                          name="outcomeFa"
                          maxLength={1000}
                          defaultValue={
                            story.outcomeI18n?.fa || story.outcome || ""
                          }
                          className="mt-1 w-full rounded-lg border px-3 py-2 text-sm"
                        />
                      </label>
                      <label className="block text-xs">
                        Role
                        <input
                          name="roleFa"
                          maxLength={120}
                          defaultValue={story.roleI18n?.fa || story.role || ""}
                          className="mt-1 w-full rounded-lg border px-3 py-2 text-sm"
                        />
                      </label>
                      <label className="block text-xs">
                        Category
                        <input
                          name="categoryFa"
                          maxLength={120}
                          defaultValue={
                            story.categoryI18n?.fa || story.category || ""
                          }
                          className="mt-1 w-full rounded-lg border px-3 py-2 text-sm"
                        />
                      </label>
                    </section>
                    <section className="space-y-2">
                      <h4 className="font-semibold">Pashto</h4>
                      <label className="block text-xs">
                        Student name
                        <input
                          name="namePs"
                          required
                          minLength={2}
                          maxLength={120}
                          defaultValue={
                            story.studentNameI18n?.ps || story.studentName
                          }
                          className="mt-1 w-full rounded-lg border px-3 py-2 text-sm"
                        />
                      </label>
                      <label className="block text-xs">
                        Story
                        <textarea
                          name="storyPs"
                          required
                          minLength={10}
                          maxLength={3000}
                          defaultValue={story.storyI18n?.ps || story.story}
                          rows={4}
                          className="mt-1 w-full rounded-lg border px-3 py-2 text-sm"
                        />
                      </label>
                      <label className="block text-xs">
                        Outcome
                        <input
                          name="outcomePs"
                          maxLength={1000}
                          defaultValue={
                            story.outcomeI18n?.ps || story.outcome || ""
                          }
                          className="mt-1 w-full rounded-lg border px-3 py-2 text-sm"
                        />
                      </label>
                      <label className="block text-xs">
                        Role
                        <input
                          name="rolePs"
                          maxLength={120}
                          defaultValue={story.roleI18n?.ps || story.role || ""}
                          className="mt-1 w-full rounded-lg border px-3 py-2 text-sm"
                        />
                      </label>
                      <label className="block text-xs">
                        Category
                        <input
                          name="categoryPs"
                          maxLength={120}
                          defaultValue={
                            story.categoryI18n?.ps || story.category || ""
                          }
                          className="mt-1 w-full rounded-lg border px-3 py-2 text-sm"
                        />
                      </label>
                    </section>
                    <label className="flex items-center gap-2 text-xs lg:col-span-3">
                      <input
                        type="checkbox"
                        name="consentConfirmed"
                        value="true"
                        required
                      />{" "}
                      I reconfirm permission to publish this student&apos;s
                      name, story, and photo if provided.
                    </label>
                    <button className="w-fit rounded-lg bg-[#0B6B4F] px-4 py-2 text-sm font-semibold text-white lg:col-span-3">
                      Save content edits
                    </button>
                  </form>
                </details>
                <form
                  action={updatePublicStoryStatusAction}
                  className="flex flex-wrap items-end gap-2"
                >
                  <input
                    type="hidden"
                    name="storyId"
                    value={String(story._id)}
                  />
                  <label className="text-xs font-medium">
                    Visibility
                    <select
                      name="approved"
                      defaultValue={story.isApproved ? "true" : "false"}
                      className="mt-1 block rounded-lg border border-[#DCE7E2] bg-white px-2 py-2 text-sm"
                    >
                      <option value="false">Draft / hidden</option>
                      <option value="true" disabled={!story.consentConfirmed}>
                        Approved / public
                      </option>
                    </select>
                  </label>
                  <label className="text-xs font-medium">
                    Homepage
                    <select
                      name="featured"
                      defaultValue={story.featured ? "true" : "false"}
                      className="mt-1 block rounded-lg border border-[#DCE7E2] bg-white px-2 py-2 text-sm"
                    >
                      <option value="false">Not featured</option>
                      <option value="true">Featured</option>
                    </select>
                  </label>
                  <button className="rounded-lg bg-[#0B6B4F] px-3 py-2 text-xs font-semibold text-white">
                    Save
                  </button>
                </form>
                <form action={deletePublicStoryAction}>
                  <input
                    type="hidden"
                    name="storyId"
                    value={String(story._id)}
                  />
                  <button className="rounded-lg border border-rose-200 px-3 py-2 text-xs font-semibold text-rose-700 hover:bg-rose-50">
                    Delete
                  </button>
                </form>
              </div>
            </article>
          ))}
          {!stories.length && (
            <p className="rounded-lg bg-slate-50 p-4 text-sm text-slate-500">
              No stories or testimonials to manage yet.
            </p>
          )}
        </div>
      </section>

      <section className="rounded-xl border border-[#DCE7E2] bg-white p-5">
        <h2 className="font-semibold text-[#053B2E]">
          Add success story or testimonial
        </h2>
        <p className="mt-1 text-sm text-slate-500">
          Enter the real student’s content in English, Dari and Pashto.
          Publication requires confirmed consent.
        </p>
        <form
          action={createPublicStoryAction}
          className="mt-4 grid gap-5 lg:grid-cols-3"
        >
          <label className="text-sm font-medium">
            Content type
            <select name="type" className={field}>
              <option value="SUCCESS_STORY">Success story</option>
              <option value="TESTIMONIAL">Testimonial</option>
            </select>
          </label>
          <label className="text-sm font-medium">
            Photo (optional, JPG/PNG/WebP, max 5 MB)
            <input
              type="file"
              name="photo"
              accept="image/jpeg,image/png,image/webp"
              className={field}
            />
          </label>
          <label className="text-sm font-medium">
            Publication status
            <select name="approved" defaultValue="false" className={field}>
              <option value="false">Draft — hidden from public</option>
              <option value="true">Approved — publish</option>
            </select>
          </label>
          <section className="space-y-3">
            <h3 className="font-semibold">English</h3>
            <Text label="Student name" name="nameEn" />
            <Area label="Story / testimonial" name="storyEn" />
            <Text label="Outcome" name="outcomeEn" required={false} />
            <Text label="Role" name="roleEn" required={false} />
            <Text label="Category" name="categoryEn" required={false} />
          </section>
          <section className="space-y-3">
            <h3 className="font-semibold">دری (Dari)</h3>
            <Text label="نام شاگرد" name="nameFa" />
            <Area label="داستان / نظر" name="storyFa" />
            <Text label="نتیجه" name="outcomeFa" required={false} />
            <Text label="نقش" name="roleFa" required={false} />
            <Text label="دسته‌بندی" name="categoryFa" required={false} />
          </section>
          <section className="space-y-3">
            <h3 className="font-semibold">پښتو (Pashto)</h3>
            <Text label="د زده کوونکي نوم" name="namePs" />
            <Area label="کیسه / نظر" name="storyPs" />
            <Text label="پایله" name="outcomePs" required={false} />
            <Text label="رول" name="rolePs" required={false} />
            <Text label="کټګوري" name="categoryPs" required={false} />
          </section>
          <div className="flex flex-wrap gap-4 lg:col-span-3">
            <label className="flex items-center gap-2 text-sm">
              <input type="checkbox" name="featured" value="true" /> Feature on
              homepage
            </label>
            <label className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                name="consentConfirmed"
                value="true"
                required
              />{" "}
              I confirm explicit permission to publish this student&apos;s name,
              story and photo (if provided).
            </label>
          </div>
          <button className="w-fit rounded-lg bg-[#0B6B4F] px-4 py-2 text-sm font-semibold text-white lg:col-span-3">
            Save story / testimonial
          </button>
        </form>
      </section>
      <section className="rounded-xl border border-[#DCE7E2] bg-white p-5">
        <h2 className="font-semibold text-[#053B2E]">Publish announcement</h2>
        <form
          action={createAnnouncementAction}
          className="mt-4 grid max-w-3xl gap-4"
        >
          <Text label="Title" name="title" />
          <label className="text-sm font-medium">
            Audience
            <select name="audience" className={field}>
              <option value="ALL">Everyone</option>
              <option value="STUDENTS">Students</option>
              <option value="STAFF">Staff</option>
            </select>
          </label>
          <Area label="Message" name="message" />
          <button className="w-fit rounded-lg bg-[#0B6B4F] px-4 py-2 text-sm font-semibold text-white">
            Publish announcement
          </button>
        </form>
      </section>
    </div>
  );
}
