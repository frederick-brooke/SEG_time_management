/**
 * Testing for profile page.
 */

import React from "react";
import { Button } from "@/components/ui/Button";
import { render, screen } from "@testing-library/react";
import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { getMyProfile } from "@/app/actions/profile";
import ProfilePage from "../page";

// Mocks

jest.mock("next-auth", () => ({ getServerSession: jest.fn() }));
jest.mock("next/navigation", () => ({ redirect: jest.fn() }));
jest.mock("@/lib/auth", () => ({ authOptions: {} }));
jest.mock("@/app/actions/profile", () => ({ getMyProfile: jest.fn() }));
jest.mock("../ProfilePageClient", () => ({
  __esModule: true,
  default: ({ isOwnProfile }: { isOwnProfile: boolean }) => (
    <div data-testid="profile-client">isOwnProfile={String(isOwnProfile)}</div>
  ),
}));
jest.mock("@/components/layout/LunarThemeWrapper", () => ({
  __esModule: true,
  default: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
}));

const mockGetServerSession = getServerSession as jest.Mock;
const mockGetMyProfile = getMyProfile as jest.Mock;
const mockRedirect = redirect as unknown as jest.Mock;


// Tests

describe("ProfilePage (Server Component)", () => {
  beforeEach(() => jest.clearAllMocks());

  it("redirects to /login if no session is found (no session)", async () => {
    mockGetServerSession.mockResolvedValue(null);
    await ProfilePage();
    expect(mockRedirect).toHaveBeenCalledWith("/login");
  });

  it("redirects to /login if session has no email", async () => {
    mockGetServerSession.mockResolvedValue({ user: {} });
    await ProfilePage();
    expect(mockRedirect).toHaveBeenCalledWith("/login");
  });

  it("renders Profile Error if getMyProfile returns null", async () => {
    mockGetServerSession.mockResolvedValue({ user: { email: "a@b.com" } });
    mockGetMyProfile.mockResolvedValue(null);
    const jsx = await ProfilePage();
    render(jsx as React.ReactElement);
    expect(screen.getByText("Profile Error")).toBeInTheDocument();
    expect(
      screen.getByText("Profile not found. Please log in again.")
    ).toBeInTheDocument();
  });

  it("renders ProfilePageClient with isOwnProfile=true when profile exists", async () => {
    mockGetServerSession.mockResolvedValue({ user: { email: "a@b.com" } });
    mockGetMyProfile.mockResolvedValue({ username: "karim", email: "a@b.com" });
    const jsx = await ProfilePage();
    render(jsx as React.ReactElement);
    expect(screen.getByTestId("profile-client")).toBeInTheDocument();
    expect(screen.getByText("isOwnProfile=true")).toBeInTheDocument();
  });
});