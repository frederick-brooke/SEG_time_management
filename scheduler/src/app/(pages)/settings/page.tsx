import { getServerSession } from "next-auth";
import { authOptions } from "@/src/lib/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/src/lib/prisma";
import { SettingsClient } from "./SettingsClient";
import { Settings } from "lucide-react";
import { PageHeader } from "@/src/components/ui/page-header";

export default async function SettingsPage() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) redirect("/login");

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: {
      email: true,
      username: true,
      passwordHash: true,
      preferences: true,
      accounts: { where: { provider: 'google' } }
    }
  });

  if (!user) redirect("/login");

  return (
    <div className="min-h-screen bg-gray-950 text-white">
      <div className="max-w-4xl w-full mx-auto px-6 py-12 space-y-8">

        <PageHeader 
          icon={<Settings size={26} className="text-white/80" />} 
          title="Account Settings" 
          subtitle="Manage your trajectory, security, and integrations." 
        />

        <SettingsClient
          user={{
            username: user.username,
            email: user.email,
            hasPassword: !!user.passwordHash,
            hasGoogleConnected: user.accounts.length > 0,
            preferences: user.preferences
          }}
        />
      </div>
    </div>
  );
}