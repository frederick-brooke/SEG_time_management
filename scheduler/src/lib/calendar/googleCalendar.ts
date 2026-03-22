/**
 * Google Calendar Client
 *
 * Provides an authenticated Google Calendar API client for a given user.
 * Handles OAuth2 token refresh automatically, persisting any new tokens
 * back to the database.
 */

import { google } from "googleapis";
import { prisma } from "../prisma";

/**
 * Writes a refreshed OAuth2 token set back to the user's account record.
 * Only updates fields present in the refresh response; errors are logged but
 * not propagated so they don't interrupt the in-flight API call.
 *
 * @param accountId - The Prisma account record to update.
 * @param currentAccessToken - Fallback if the refresh response omits a new access token.
 * @param tokens - Token object emitted by the OAuth2 `"tokens"` event.
 */
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

/**
 * Returns an authenticated Google Calendar client for the given user,
 * or `null` if they have no linked Google account or missing access token.
 *
 * @param userId - The user whose linked Google account to use.
 */
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