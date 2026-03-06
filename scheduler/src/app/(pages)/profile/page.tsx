import { getServerSession } from "next-auth";
import { authOptions } from "@/src/lib/auth";
import { redirect } from "next/navigation";
import { getMyProfile } from "@/src/app/actions/profile";
import ProfilePageClient from "./ProfilePageClient";

/**
 * Server component that fetches current user's profile data
 * @return {JSX.Element} - Own profile page with edit capabilities
 */
export default async function ProfilePage() {
  const session = await getServerSession(authOptions);
  
  if (!session?.user?.email) {
    redirect("/login");
  }

  const profile = await getMyProfile(); 

  if (!profile) {
    return <div className="p-8">Profile not found. Please log in again.</div>;
  }

  return <ProfilePageClient profile={profile} isOwnProfile={true} />;
}