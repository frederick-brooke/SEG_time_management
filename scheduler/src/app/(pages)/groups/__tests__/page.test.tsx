/**
 * Testing for groups page.
 */

import React from "react";
import { render, screen } from "@testing-library/react";
import "@testing-library/jest-dom";
import GroupDetailPage from "../page";
import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import { getGroupDetails, getGroupEvents, getGroupTasksWithProgress, getMyGroups } from "@/app/actions/groups";


// Mocks

jest.mock("next/navigation", () => ({
  redirect: jest.fn(),
  useRouter: jest.fn(() => ({
    push: jest.fn(),
    replace: jest.fn(),
    prefetch: jest.fn(),
  })),
}));

jest.mock("next-auth", () => ({
  getServerSession: jest.fn(),
}));

jest.mock("lib/auth", () => ({
  authOptions: {},
}));

jest.mock("@/app/actions/groups", () => ({
  getGroupDetails: jest.fn(),
  getGroupEvents: jest.fn(),
  getGroupTasksWithProgress: jest.fn(),
  getMyGroups: jest.fn(),
}));

jest.mock("../GroupsPageClient", () => ({
  __esModule: true,
  default: ({ groups }: any) => 
    <div data-testid="groups-list">
      Groups: {groups?.length === 0 ? "No groups found" : `Groups count: ${groups?.length}`}
    </div>,
}))

jest.mock("@/app/(pages)/groups/[groupId]/GroupDetailClient", () => ({
  __esModule: true,
  default: ({ group }: any) => <div data-testid="client-wrapper">{group.name}</div>,
}));


// Tests

describe("GroupDetailPage Server Component", () => {
  const mockParams = Promise.resolve({ groupId: "grp_123" });

  beforeEach(() => {
    jest.clearAllMocks();
    (getMyGroups as jest.Mock).mockResolvedValue([]);
  });

  // No Session 
  it("redirects to login if user is not authenticated", async () => {
    (getServerSession as jest.Mock).mockResolvedValueOnce(null);

    // For Async Server Components, wait for the component function call
    const props = {
      params: Promise.resolve({ groupId: "grp-123" })
    } as any;

    await (GroupDetailPage as any)(props);

    expect(redirect).toHaveBeenCalledWith("/login");
  });

  // Group Not Found 
  it("renders correctly when the user has no groups", async () => {
    (getServerSession as jest.Mock).mockResolvedValueOnce({ user: { email: "test@test.com" } });
    (getGroupDetails as jest.Mock).mockResolvedValueOnce(null);

    const props = {
      params: Promise.resolve({ groupId: "grp-123" })
    } as any;

    const ResolvedPage = await (GroupDetailPage as any)(props);
    render(ResolvedPage);

    expect(screen.getByText(/No groups found/i)).toBeInTheDocument();
  });

  it("fetches data and renders GroupDetailClient on success", async () => {
    (getServerSession as jest.Mock).mockResolvedValueOnce({ user: { email: "test@test.com" } });
    (getGroupDetails as jest.Mock).mockResolvedValueOnce({ id: "grp_123", name: "Study Squad" });
    (getMyGroups as jest.Mock).mockResolvedValue([{ id: "grp-123"}]);

    const props = {
      params: Promise.resolve({ groupId: "grp-123" })
    } as any;

    const ResolvedPage = await (GroupDetailPage as any)(props);
    render(ResolvedPage);

    expect(screen.getByTestId("groups-list")).toHaveTextContent("Groups count: 1");
    expect(getMyGroups).toHaveBeenCalled();
  });
});