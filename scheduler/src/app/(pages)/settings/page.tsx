import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { SettingsClient } from "./SettingsClient";
import { Settings } from "lucide-react";

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

        {/* Header */}
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center">
            <Settings size={24} className="text-white/60" />
          </div>
          <div>
            <h1 className="text-3xl font-semibold tracking-tight text-white">Account Settings</h1>
            <p className="text-sm text-white/45 mt-0.5">Manage your account, security, and integrations.</p>
          </div>
        </div>

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