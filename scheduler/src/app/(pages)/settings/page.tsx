/**
 * Server-side Settings page.
 * Authenticates the user, fetches account and profile settings from the database,
 * and passes normalized data to the Settings client component.
 */

import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { SettingsClient } from "./SettingsClient";
import { Settings } from "lucide-react";
import { PageHeader } from "@/components/ui/page-header";

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
      accounts: { where: { provider: 'google' } },
      location: true,
      city: true,
      country: true,
      locationHidden: true,
    }
  });

  if (!user) redirect("/login");

  return (
    <div className="min-h-screen bg-[#0a0a0f] text-white">
      <div className="max-w-5xl w-full mx-auto px-4 md:px-6 py-8 md:py-12 space-y-8">

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
            preferences: user.preferences,
            location: user.location as { lat: number; lng: number } | null,
            city: user.city,
            country: user.country,
            locationHidden: user.locationHidden || false,
          }}
        />
      </div>
    </div>
  );
}