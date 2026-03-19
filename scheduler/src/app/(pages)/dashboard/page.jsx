// scheduler/src/app/(pages)/dashboard/page.tsx
import { getServerSession } from "next-auth";
import { authOptions } from "@/src/lib/auth";
import { redirect } from "next/navigation";
import { getMyProfile } from "@/src/app/actions/profile";
import { getMyExams } from "@/src/app/actions/examActions";
import DashboardClient from "./DashboardClient";

export default async function DashboardPage() {
  const session = await getServerSession(authOptions);
  
  if (!session?.user) {
    redirect("/login");
  }

  // Parallel data fetching for performance (Band 5 optimization)
  const [profile, exams] = await Promise.all([
    getMyProfile(),
    getMyExams()
  ]);

  if (!profile) {
    redirect("/login");
  }

  return (
    <DashboardClient 
      profile={profile} 
      initialExams={exams} 
      session={session} 
    />
  );
}