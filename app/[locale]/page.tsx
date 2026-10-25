import AboutAfghanUstad from "@/components/Home/About/Aboutafghanustad";
import Courses from "@/components/Home/Courses/Courses";
import { FinalCTA } from "@/components/Home/CTA/FinalCTA";
import { Hero } from "@/components/Home/hero/Hero";
import StudentVerification from "@/components/Home/StudentVerification/StudentVerification";
import SuccessStories from "@/components/Home/SuccessStories/SuccessStories";
import ValueProposition from "@/components/Home/Value/ValueProposition";
import { connectDB } from "@/lib/mongodb";
import CourseModel from "@/models/Course";
import { CLIENT_INPUT_REQUIRED, type Course as HomeCourse } from "@/components/Home/Courses/data";
import type { SuccessStory } from "@/components/Home/SuccessStories/data";
import PublicStory from "@/models/PublicStory";

const localized = (value: unknown, legacy = "") => {
  if (value && typeof value === "object") {
    const v = value as { en?: string; fa?: string; ps?: string };
    return {
      en: v.en || legacy,
      fa: v.fa || v.en || legacy,
      ps: v.ps || v.en || legacy,
    };
  }
  return { en: legacy, fa: legacy, ps: legacy };
};
/** Convert CMS category labels into the stable IDs used by homepage filters. */
const categoryId = (value: string): string => {
  const v = value.normalize("NFKD").toLowerCase().trim().replace(/[_-]+/g, " ");

  // Match specific topics before generic words such as "design" or "computer".
  if (/database|sql|دیتابیس|ډیټابیس/.test(v)) return "database";
  if (/digital\s*market|marketing|مارکیټنګ|بازاریابی/.test(v)) return "digitalMarketing";
  if (/graphic\s*design|design|ګرافیک|گرافیک/.test(v)) return "graphicDesign";
  if (/video\s*edit|premiere|پریمیر|ویدیو|ویډیو/.test(v)) return "videoEditing";
  if (/web\s*development|web|html|css|javascript|ویب/.test(v)) return "web";
  if (/internet|online|انټرنېټ|اینترنت/.test(v)) return "internet";
  if (/program|coding|code|programming|پروګرام|برنامه.?نویسی/.test(v)) return "programming";
  if (/office|computer\s*(fundamental|basic)|fundamental|ms\s*office|کمپیوټر|کمپیوتر/.test(v)) return "fundamentals";
  return "fundamentals";
};

export default async function Home() {
  let courses: HomeCourse[] = [];
  let stories: SuccessStory[] = [];
  try {
    await connectDB();
    const docs = await CourseModel.find({ status: "ACTIVE" })
      .sort({ featured: -1, createdAt: -1 })
      .limit(12)
      .lean();
    courses = docs.map((doc, index) => {
      const row = doc as unknown as {
        _id: unknown;
        slug: string;
        categoryI18n?: { en?: string };
        category?: string;
        titleI18n?: unknown;
        title: string;
        descriptionI18n?: unknown;
        description?: string;
        level?: string;
        durationI18n?: unknown;
        duration?: string;
        thumbnailUrl?: string;
        featured?: boolean;
      };
      return {
        id: String(row._id),
        slug: row.slug,
        categoryId: categoryId(row.categoryI18n?.en || row.category || ""),
        title: localized(row.titleI18n, row.title),
        summary: localized(row.descriptionI18n, row.description || ""),
        level:
          typeof row.level === "string" &&
          ["beginner", "intermediate", "advanced"].includes(row.level)
            ? row.level
            : "beginner",
        duration: localized(row.durationI18n, row.duration || ""),
        lessonCount: CLIENT_INPUT_REQUIRED,
        coverImage: row.thumbnailUrl || CLIENT_INPUT_REQUIRED,
        coverVariant: (["lattice", "grid", "rings", "path"] as string[])[
          index % 4
        ] as HomeCourse["coverVariant"],
        isFeatured: Boolean(row.featured),
      } as HomeCourse;
    });
    const storyDocs = await PublicStory.find({
      isApproved: true,
      consentConfirmed: true,
      type: { $in: ["SUCCESS_STORY", "TESTIMONIAL"] },
    })
      .sort({ featured: -1, createdAt: -1 })
      .limit(12)
      .lean();
    stories = storyDocs.map((doc) => {
      const row = doc as unknown as {
        _id: unknown;
        studentNameI18n?: unknown;
        studentName?: string;
        storyI18n?: unknown;
        story?: string;
        outcomeI18n?: unknown;
        outcome?: string;
        roleI18n?: unknown;
        role?: string;
        categoryI18n?: unknown;
        category?: string;
        imageUrl?: string;
        imageAltI18n?: unknown;
        createdAt?: Date;
      };
      return {
        id: String(row._id),
        isApproved: true,
        studentName: localized(row.studentNameI18n, row.studentName || ""),
        story: localized(row.storyI18n, row.story || ""),
        outcome: localized(row.outcomeI18n, row.outcome || ""),
        role: localized(row.roleI18n, row.role || ""),
        category: localized(row.categoryI18n, row.category || ""),
        image: row.imageUrl
          ? {
              src: row.imageUrl,
              width: 640,
              height: 640,
              alt: localized(row.imageAltI18n, row.studentName || "Student"),
            }
          : undefined,
      } as SuccessStory;
    });
  } catch (error) {
    // Public pages should remain renderable during a temporary DB outage.
    console.error("Homepage CMS read failed", error);
  }
  return (
    <div className="flex flex-col">
      <Hero />
      <ValueProposition />
      <AboutAfghanUstad />
      <Courses courses={courses} />
      <StudentVerification />
      <SuccessStories stories={stories} />
      <FinalCTA />
    </div>
  );
}
