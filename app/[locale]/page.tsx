
import AboutAfghanUstad from "@/components/Home/About/Aboutafghanustad";
import Courses from "@/components/Home/Courses/Courses";
import { FinalCTA } from "@/components/Home/CTA/FinalCTA";
import { Hero } from "@/components/Home/hero/Hero";
import StudentVerification from "@/components/Home/StudentVerification/StudentVerification";
import SuccessStories from "@/components/Home/SuccessStories/SuccessStories";
import ValueProposition from "@/components/Home/Value/ValueProposition";

export default async function Home() {
  return (
    <div className="flex flex-col">
      <Hero />
      <ValueProposition />
      <AboutAfghanUstad />
      <Courses />
      <StudentVerification />
      <SuccessStories />
      <FinalCTA />
    </div>
  );
}
