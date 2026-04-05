/**
 * Testing for app/(pages)/layout.tsx
 */

import React from "react";
import { render, screen, fireEvent } from "@testing-library/react";
import PagesLayout from "../layout";
import { Button } from "@/components/ui/Button";

jest.mock("next-auth/react", () => ({
  useSession: () => ({
    data: { user: { id: "user-123", name: "Test User" } },
    status: "authenticated",
  }),
}));

jest.mock("@/components/layout/AppSidebar", () => ({
  AppSidebar: ({ onSearchClick }: any) => (
    <Button onClick={onSearchClick}>open-sidebar-search</Button>
  ),
}));

jest.mock("@/components/search-page/SearchPanel", () => ({
  __esModule: true,
  default: ({ onClose }: any) => (
    <Button onClick={onClose}>close-search</Button>
  ),
}));

jest.mock("@/components/ui/Sidebar", () => ({
  SidebarProvider: ({ children }: any) => <div>{children}</div>,
  SidebarInset: ({ children }: any) => <div>{children}</div>,
  SidebarTrigger: ({ onClick }: any) => (
    <Button onClick={onClick}>toggle-sidebar</Button>
  ),
}));


describe("PagesLayout", () => {
  const renderLayout = () =>
    render(
      <PagesLayout>
        <div>page-content</div>
      </PagesLayout>
    );

  it("renders children", () => {
    renderLayout();
    expect(screen.getByText("page-content")).toBeInTheDocument();
  });

  it("opens search panel", () => {
    renderLayout();
    fireEvent.click(screen.getByText("open-sidebar-search"));
    expect(screen.getByText("close-search")).toBeInTheDocument();
  });

  it("toggles sidebar", () => {
    renderLayout();
    fireEvent.click(screen.getByText("toggle-sidebar"));
  });
});