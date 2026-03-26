import React from "react";
import { render, screen, fireEvent } from "@testing-library/react";
import PagesLayout from "../layout";

jest.mock("@/components/layout/app-sidebar", () => ({
  AppSidebar: ({ onSearchClick }: any) => (
    <button onClick={onSearchClick}>open-sidebar-search</button>
  ),
}));

jest.mock("@/components/search-page/search-panel", () => ({
  __esModule: true,
  default: ({ onClose }: any) => (
    <button onClick={onClose}>close-search</button>
  ),
}));

jest.mock("@/components/ui/sidebar", () => ({
  SidebarProvider: ({ children }: any) => <div>{children}</div>,
  SidebarInset: ({ children }: any) => <div>{children}</div>,
  SidebarTrigger: ({ onClick }: any) => (
    <button onClick={onClick}>toggle-sidebar</button>
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