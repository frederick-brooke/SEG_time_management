import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import { prisma } from "@/lib/prisma";

// ─── Mocks ────────────────────────────────────────────────────────────────────

jest.mock("next-auth", () => ({ getServerSession: jest.fn() }));
jest.mock("next/navigation", () => ({ redirect: jest.fn() }));
jest.mock("@/lib/prisma", () => ({ prisma: { user: { findUnique: jest.fn() } } }));
jest.mock("@/lib/auth", () => ({ authOptions: {} }));

jest.mock("./SettingsClient", () => ({
  SettingsClient: ({ user }: { user: Record<string, unknown> }) => (
    <div data-testid="settings-client" data-props={JSON.stringify(user)} />
  ),
}));

jest.mock("@/components/ui/page-header", () => ({
  PageHeader: ({
    title,
    subtitle,
    icon,
  }: {
    title: string;
    subtitle: string;
    icon: React.ReactNode;
  }) => (
    <div data-testid="page-header">
      <span data-testid="page-header-title">{title}</span>
      <span data-testid="page-header-subtitle">{subtitle}</span>
      {icon}
    </div>
  ),
}));

jest.mock("lucide-react", () => ({
  Settings: ({ size, className }: { size: number; className: string }) => (
    <svg data-testid="settings-icon" data-size={size} className={className} />
  ),
}));

// ─── Helpers ──────────────────────────────────────────────────────────────────

import React from "react";
import { render, screen } from "@testing-library/react";
import SettingsPage from "./page";

const mockGetServerSession = getServerSession as jest.MockedFunction<typeof getServerSession>;
const mockRedirect = redirect as jest.MockedFunction<typeof redirect>;
const mockFindUnique = prisma.user.findUnique as jest.MockedFunction<
  typeof prisma.user.findUnique
>;

/** A fully-populated user row returned by prisma */
const buildUser = (overrides: Partial<ReturnType<typeof buildUser>> = {}) => ({
  email: "alice@example.com",
  username: "alice",
  passwordHash: "hashed-secret",
  preferences: { theme: "dark" },
  accounts: [{ provider: "google" }],
  location: { lat: 51.5, lng: -0.1 },
  city: "London",
  country: "GB",
  locationHidden: false,
  ...overrides,
});

/** Render the async server component and await it */
async function renderPage() {
  const jsx = await SettingsPage();
  return render(jsx as React.ReactElement);
}

// ─── Tests ────────────────────────────────────────────────────────────────────

describe("SettingsPage", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    // Mirror Next.js behaviour: redirect() throws internally to halt execution
    mockRedirect.mockImplementation(() => {
      throw new Error("NEXT_REDIRECT");
    });
  });

  // ── Auth guard ──────────────────────────────────────────────────────────────

  describe("when there is no session", () => {
    it("redirects to /login", async () => {
      mockGetServerSession.mockResolvedValue(null);
      await expect(SettingsPage()).rejects.toThrow("NEXT_REDIRECT");
      expect(mockRedirect).toHaveBeenCalledWith("/login");
    });
  });

  describe("when session has no user id", () => {
    it("redirects to /login", async () => {
      mockGetServerSession.mockResolvedValue({ user: {} } as never);
      await expect(SettingsPage()).rejects.toThrow("NEXT_REDIRECT");
      expect(mockRedirect).toHaveBeenCalledWith("/login");
    });
  });

  describe("when prisma returns no user", () => {
    it("redirects to /login", async () => {
      mockGetServerSession.mockResolvedValue({
        user: { id: "user-1" },
      } as never);
      mockFindUnique.mockResolvedValue(null);
      await expect(SettingsPage()).rejects.toThrow("NEXT_REDIRECT");
      expect(mockRedirect).toHaveBeenCalledWith("/login");
    });
  });

  // ── Prisma query ────────────────────────────────────────────────────────────

  describe("prisma query", () => {
    it("queries the correct user id from the session", async () => {
      mockGetServerSession.mockResolvedValue({
        user: { id: "user-42" },
      } as never);
      mockFindUnique.mockResolvedValue(buildUser() as never);

      await SettingsPage();

      expect(mockFindUnique).toHaveBeenCalledWith(
        expect.objectContaining({ where: { id: "user-42" } })
      );
    });

    it("selects the required fields including google accounts filter", async () => {
      mockGetServerSession.mockResolvedValue({
        user: { id: "user-1" },
      } as never);
      mockFindUnique.mockResolvedValue(buildUser() as never);

      await SettingsPage();

      const callArg = mockFindUnique.mock.calls[0][0] as {
        select: Record<string, unknown>;
      };
      expect(callArg.select).toMatchObject({
        email: true,
        username: true,
        passwordHash: true,
        preferences: true,
        accounts: { where: { provider: "google" } },
        location: true,
        city: true,
        country: true,
        locationHidden: true,
      });
    });
  });

  // ── Layout & static content ─────────────────────────────────────────────────

  describe("rendered layout", () => {
    beforeEach(() => {
      mockGetServerSession.mockResolvedValue({
        user: { id: "user-1" },
      } as never);
      mockFindUnique.mockResolvedValue(buildUser() as never);
    });

    it("renders a full-height dark background container", async () => {
      const { container } = await renderPage();
      const root = container.firstChild as HTMLElement;
      expect(root.className).toMatch(/min-h-screen/);
      expect(root.className).toMatch(/bg-\[#0a0a0f\]/);
    });

    it("renders the inner max-width wrapper", async () => {
      const { container } = await renderPage();
      const inner = container.querySelector(".max-w-5xl") as HTMLElement;
      expect(inner).toBeTruthy();
      expect(inner.className).toMatch(/mx-auto/);
    });

    it("renders PageHeader with correct title and subtitle", async () => {
      await renderPage();
      expect(screen.getByTestId("page-header-title").textContent).toBe(
        "Account Settings"
      );
      expect(screen.getByTestId("page-header-subtitle").textContent).toBe(
        "Manage your trajectory, security, and integrations."
      );
    });

    it("passes Settings icon with size=26 to PageHeader", async () => {
      await renderPage();
      const icon = screen.getByTestId("settings-icon");
      expect(icon.getAttribute("data-size")).toBe("26");
      expect(icon.getAttribute("class")).toContain("text-white/80");
    });

    it("renders SettingsClient", async () => {
      await renderPage();
      expect(screen.getByTestId("settings-client")).toBeTruthy();
    });
  });

  // ── SettingsClient props ────────────────────────────────────────────────────

  describe("props forwarded to SettingsClient", () => {
    const setup = async (userOverrides = {}) => {
      mockGetServerSession.mockResolvedValue({
        user: { id: "user-1" },
      } as never);
      mockFindUnique.mockResolvedValue(buildUser(userOverrides) as never);
      await renderPage();
      const el = screen.getByTestId("settings-client");
      return JSON.parse(el.getAttribute("data-props")!);
    };

    it("passes username", async () => {
      const props = await setup({ username: "bob" });
      expect(props.username).toBe("bob");
    });

    it("passes email", async () => {
      const props = await setup({ email: "bob@example.com" });
      expect(props.email).toBe("bob@example.com");
    });

    it("sets hasPassword=true when passwordHash exists", async () => {
      const props = await setup({ passwordHash: "some-hash" });
      expect(props.hasPassword).toBe(true);
    });

    it("sets hasPassword=false when passwordHash is null", async () => {
      const props = await setup({ passwordHash: null });
      expect(props.hasPassword).toBe(false);
    });

    it("sets hasGoogleConnected=true when google account present", async () => {
      const props = await setup({ accounts: [{ provider: "google" }] });
      expect(props.hasGoogleConnected).toBe(true);
    });

    it("sets hasGoogleConnected=false when accounts array is empty", async () => {
      const props = await setup({ accounts: [] });
      expect(props.hasGoogleConnected).toBe(false);
    });

    it("passes preferences object", async () => {
      const prefs = { theme: "light", notifications: true };
      const props = await setup({ preferences: prefs });
      expect(props.preferences).toEqual(prefs);
    });

    it("passes location as lat/lng object", async () => {
      const props = await setup({ location: { lat: 48.8, lng: 2.3 } });
      expect(props.location).toEqual({ lat: 48.8, lng: 2.3 });
    });

    it("passes null location when location is null", async () => {
      const props = await setup({ location: null });
      expect(props.location).toBeNull();
    });

    it("passes city", async () => {
      const props = await setup({ city: "Paris" });
      expect(props.city).toBe("Paris");
    });

    it("passes country", async () => {
      const props = await setup({ country: "FR" });
      expect(props.country).toBe("FR");
    });

    it("passes locationHidden=true when set", async () => {
      const props = await setup({ locationHidden: true });
      expect(props.locationHidden).toBe(true);
    });

    it("defaults locationHidden to false when undefined/null", async () => {
      const props = await setup({ locationHidden: null });
      expect(props.locationHidden).toBe(false);
    });
  });
});