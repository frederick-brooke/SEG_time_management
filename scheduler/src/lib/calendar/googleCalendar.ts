import { google } from "googleapis";
import { prisma } from "./prisma";

async function persistRefreshedTokens(accountId: string, currentAccessToken: string, tokens: any) {
  try {
    await prisma.account.update({
      where: { id: accountId },
      data: {
        access_token: tokens.access_token ?? currentAccessToken,
        ...(tokens.refresh_token && { refresh_token: tokens.refresh_token }),
        ...(tokens.expiry_date && { expires_at: Math.floor(tokens.expiry_date / 1000) }),
      },
    });
  } catch (err) {
    console.error("Failed to persist refreshed token:", err);
  }
}

export async function getGoogleCalendarClient(userId: string) {
  const account = await prisma.account.findFirst({
    where: { userId, provider: "google" },
  });

  if (!account || !account.access_token) return null;

  const auth = new google.auth.OAuth2(
    process.env.GOOGLE_CLIENT_ID,
    process.env.GOOGLE_CLIENT_SECRET,
  );

  auth.setCredentials({
    access_token: account.access_token,
    refresh_token: account.refresh_token,
  });

  auth.on("tokens", (tokens) =>
    persistRefreshedTokens(account.id, account.access_token!, tokens),
  );

  return google.calendar({ version: "v3", auth });
}