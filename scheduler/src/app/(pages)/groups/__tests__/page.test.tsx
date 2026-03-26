import React from "react";
import { render, screen } from "@testing-library/react";
import "@testing-library/jest-dom";
import GroupDetailPage from "../page";
import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import { getGroupDetails, getGroupEvents, getGroupTasksWithProgress } from "@/app/actions/groups";

//Mock Next.js Navigation
jest.mock("next/navigation", () => ({
  redirect: jest.fn(),
}));

//Mock NextAuth
jest.mock("next-auth", () => ({
  getServerSession: jest.fn(),
}));
jest.mock("lib/auth", () => ({
  authOptions: {},
}));

//Mock Server Actions
jest.mock("@/app/actions/groups", () => ({
  getGroupDetails: jest.fn(),
  getGroupEvents: jest.fn(),
  getGroupTasksWithProgress: jest.fn(),
}));

//Mock the Client Component to prevent deep rendering
jest.mock("../GroupDetailClient", () => ({
  __esModule: true,
  default: ({ group }: any) => <div data-testid="client-wrapper">{group.name}</div>,
}));

describe("GroupDetailPage Server Component", () => {
  const mockParams = Promise.resolve({ groupId: "grp_123" });

  beforeEach(() => {
    jest.clearAllMocks();
  });

  // No Session 
  it("redirects to login if user is not authenticated", async () => {
    (getServerSession as jest.Mock).mockResolvedValueOnce(null);

    // For Async Server Components, we must await the component function call
    const props = {
      params: Promise.resolve({ groupId: "grp-123" })
    } as any;

    await GroupDetailPage(props);

    expect(redirect).toHaveBeenCalledWith("/login");
  });

  // Group Not Found 
  it("renders the 'Group not found' error state if group does not exist", async () => {
    (getServerSession as jest.Mock).mockResolvedValueOnce({ user: { email: "test@test.com" } });
    (getGroupDetails as jest.Mock).mockResolvedValueOnce(null);

    const ResolvedPage = await GroupDetailPage({ params: mockParams });
    render(ResolvedPage);

    expect(screen.getByText("Group not found")).toBeInTheDocument();
    expect(screen.getByText(/This group does not exist/i)).toBeInTheDocument();
  });

  //  Success Path 
  it("fetches data and renders GroupDetailClient on success", async () => {
    (getServerSession as jest.Mock).mockResolvedValueOnce({ user: { email: "test@test.com" } });
    (getGroupDetails as jest.Mock).mockResolvedValueOnce({ id: "grp_123", name: "Study Squad" });
    (getGroupEvents as jest.Mock).mockResolvedValueOnce([]);
    (getGroupTasksWithProgress as jest.Mock).mockResolvedValueOnce([]);

    const ResolvedPage = await GroupDetailPage({ params: mockParams });
    render(ResolvedPage);

    // Verifies the child component received the props and rendered
    expect(screen.getByTestId("client-wrapper")).toHaveTextContent("Study Squad");
    
    // Verifies Promise.all executed correctly
    expect(getGroupEvents).toHaveBeenCalledWith("grp_123");
    expect(getGroupTasksWithProgress).toHaveBeenCalledWith("grp_123");
  });
});