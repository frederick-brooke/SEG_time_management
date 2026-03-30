/**
 * Tests for src/lib/calendar/googleCalendar.ts
 */

import { getGoogleCalendarClient } from "../googleCalendar";
import { prisma } from "../../prisma";
import { google } from "googleapis";

// Mocks

jest.mock("../../prisma", () => ({
  prisma: {
    account: {
      findFirst: jest.fn(),
      update: jest.fn(),
    },
  },
}));

// Capture the tokens listener so tests can trigger it manually
let capturedTokensListener: ((tokens: any) => void) | null = null;

const mockSetCredentials = jest.fn();
const mockOn = jest.fn((event: string, listener: (tokens: any) => void) => {
  if (event === "tokens") capturedTokensListener = listener;
});
const mockOAuth2Constructor = jest.fn().mockImplementation(() => ({
  setCredentials: mockSetCredentials,
  on: mockOn,
}));

jest.mock("googleapis", () => ({
  google: {
    auth: {
      OAuth2: jest.fn().mockImplementation(() => ({
        setCredentials: mockSetCredentials,
        on: mockOn,
      })),
    },
    calendar: jest.fn().mockReturnValue({ events: {} }),
  },
}));

// Typed mock helpers

const mockPrismaAccount = prisma.account as unknown as {
  findFirst: jest.Mock;
  update: jest.Mock;
};
const mockGoogleCalendar = google.calendar as jest.Mock;
const mockOAuth2 = google.auth.OAuth2 as unknown as jest.Mock;

// Factory helpers 

/**
 * Creates a mock DB account with Google OAuth tokens.
 */
function createMockAccount(overrides: Record<string, any> = {}) {
  return {
    id: "account-id",
    userId: "user-123",
    provider: "google",
    access_token: "access-token-abc",
    refresh_token: "refresh-token-xyz",
    expires_at: 1234567890,
    ...overrides,
  };
}

// Tests 

describe("getGoogleCalendarClient", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    capturedTokensListener = null;

    // Re-apply the mock implementation after clearAllMocks
    mockOAuth2.mockImplementation(() => ({
      setCredentials: mockSetCredentials,
      on: mockOn,
    }));
    mockGoogleCalendar.mockReturnValue({ events: {} });
  });

  it("should return null when no Google account is found for the user", async () => {
    mockPrismaAccount.findFirst.mockResolvedValue(null);

    const result = await getGoogleCalendarClient("user-123");

    expect(result).toBeNull();
  });

  it("should return null when the account has no access_token", async () => {
    mockPrismaAccount.findFirst.mockResolvedValue(
      createMockAccount({ access_token: null })
    );

    const result = await getGoogleCalendarClient("user-123");

    expect(result).toBeNull();
  });

  it("should return null when access_token is an empty string", async () => {
    mockPrismaAccount.findFirst.mockResolvedValue(
      createMockAccount({ access_token: "" })
    );

    const result = await getGoogleCalendarClient("user-123");

    expect(result).toBeNull();
  });

  it("should return a Google Calendar client when the account is valid", async () => {
    mockPrismaAccount.findFirst.mockResolvedValue(createMockAccount());

    const result = await getGoogleCalendarClient("user-123");

    expect(result).not.toBeNull();
    expect(mockGoogleCalendar).toHaveBeenCalledWith({ version: "v3", auth: expect.any(Object) });
  });

  it("should query for the account using the correct userId and provider", async () => {
    mockPrismaAccount.findFirst.mockResolvedValue(createMockAccount());

    await getGoogleCalendarClient("user-456");

    expect(mockPrismaAccount.findFirst).toHaveBeenCalledWith({
      where: { userId: "user-456", provider: "google" },
    });
  });

  it("should create an OAuth2 client with the correct env credentials", async () => {
    process.env.GOOGLE_CLIENT_ID = "test-client-id";
    process.env.GOOGLE_CLIENT_SECRET = "test-client-secret";
    mockPrismaAccount.findFirst.mockResolvedValue(createMockAccount());

    await getGoogleCalendarClient("user-123");

    expect(mockOAuth2).toHaveBeenCalledWith("test-client-id", "test-client-secret");
  });

  it("should set the account access_token and refresh_token on the OAuth2 client", async () => {
    const account = createMockAccount({
      access_token: "my-access-token",
      refresh_token: "my-refresh-token",
    });
    mockPrismaAccount.findFirst.mockResolvedValue(account);

    await getGoogleCalendarClient("user-123");

    expect(mockSetCredentials).toHaveBeenCalledWith({
      access_token: "my-access-token",
      refresh_token: "my-refresh-token",
    });
  });

  it("should register a tokens listener on the OAuth2 client", async () => {
    mockPrismaAccount.findFirst.mockResolvedValue(createMockAccount());

    await getGoogleCalendarClient("user-123");

    expect(mockOn).toHaveBeenCalledWith("tokens", expect.any(Function));
  });

  it("should update the access_token in the DB when a tokens event fires", async () => {
    const account = createMockAccount();
    mockPrismaAccount.findFirst.mockResolvedValue(account);
    mockPrismaAccount.update.mockResolvedValue({});

    await getGoogleCalendarClient("user-123");

    // Simulate the OAuth2 tokens event firing
    capturedTokensListener!({ access_token: "new-access-token" });

    // Allow async persistence to complete
    await new Promise((r) => setTimeout(r, 10));

    expect(mockPrismaAccount.update).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: account.id },
        data: expect.objectContaining({ access_token: "new-access-token" }),
      })
    );
  });

  it("should update the refresh_token in the DB when the tokens event includes one", async () => {
    const account = createMockAccount();
    mockPrismaAccount.findFirst.mockResolvedValue(account);
    mockPrismaAccount.update.mockResolvedValue({});

    await getGoogleCalendarClient("user-123");

    capturedTokensListener!({
      access_token: "new-access-token",
      refresh_token: "new-refresh-token",
    });

    await new Promise((r) => setTimeout(r, 10));

    expect(mockPrismaAccount.update).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ refresh_token: "new-refresh-token" }),
      })
    );
  });

  it("should not include refresh_token in the update when tokens event does not provide one", async () => {
    const account = createMockAccount();
    mockPrismaAccount.findFirst.mockResolvedValue(account);
    mockPrismaAccount.update.mockResolvedValue({});

    await getGoogleCalendarClient("user-123");

    capturedTokensListener!({ access_token: "new-access-token" });

    await new Promise((r) => setTimeout(r, 10));

    const updateData = mockPrismaAccount.update.mock.calls[0][0].data;
    expect(updateData).not.toHaveProperty("refresh_token");
  });

  it("should update expires_at when expiry_date is provided in the tokens event", async () => {
    const account = createMockAccount();
    mockPrismaAccount.findFirst.mockResolvedValue(account);
    mockPrismaAccount.update.mockResolvedValue({});

    await getGoogleCalendarClient("user-123");

    capturedTokensListener!({
      access_token: "new-access-token",
      expiry_date: 1700000000000, // ms timestamp
    });

    await new Promise((r) => setTimeout(r, 10));

    expect(mockPrismaAccount.update).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          expires_at: Math.floor(1700000000000 / 1000),
        }),
      })
    );
  });

  it("should not include expires_at in the update when expiry_date is absent", async () => {
    const account = createMockAccount();
    mockPrismaAccount.findFirst.mockResolvedValue(account);
    mockPrismaAccount.update.mockResolvedValue({});

    await getGoogleCalendarClient("user-123");

    capturedTokensListener!({ access_token: "new-access-token" });

    await new Promise((r) => setTimeout(r, 10));

    const updateData = mockPrismaAccount.update.mock.calls[0][0].data;
    expect(updateData).not.toHaveProperty("expires_at");
  });

  it("should fall back to the original access_token when the tokens event has no new one", async () => {
    const account = createMockAccount({ access_token: "original-token" });
    mockPrismaAccount.findFirst.mockResolvedValue(account);
    mockPrismaAccount.update.mockResolvedValue({});

    await getGoogleCalendarClient("user-123");

    capturedTokensListener!({ access_token: null });

    await new Promise((r) => setTimeout(r, 10));

    expect(mockPrismaAccount.update).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ access_token: "original-token" }),
      })
    );
  });

  it("should not throw when the token persistence DB update fails", async () => {
    const account = createMockAccount();
    mockPrismaAccount.findFirst.mockResolvedValue(account);
    mockPrismaAccount.update.mockRejectedValue(new Error("DB failure"));

    await getGoogleCalendarClient("user-123");

    // Trigger the listener — error should be swallowed
    capturedTokensListener!({ access_token: "new-access-token" });

    // Allow async rejection to settle without uncaught error
    await expect(new Promise((r) => setTimeout(r, 20))).resolves.not.toThrow();
  });
});