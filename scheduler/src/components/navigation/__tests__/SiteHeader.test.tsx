import { render, screen } from "@testing-library/react";
import { SiteHeader } from "../SiteHeader"; 


jest.mock("components/ui/Button", () => ({
  Button: ({ children }: { children: React.ReactNode }) => <>{children}</>,
}));

jest.mock("components/ui/separator", () => ({
  Separator: ({ orientation, className }: any) => (
    <div data-testid="separator" data-orientation={orientation} className={className} />
  ),
}));

jest.mock("@/components/ui/sidebar", () => ({
  SidebarTrigger: ({ className }: any) => (
    <button data-testid="sidebar-trigger" className={className}>
      Trigger
    </button>
  ),
}));

describe("SiteHeader Component", () => {
  it("renders the header container successfully", () => {
    render(<SiteHeader />);
    const headerElement = screen.getByRole("banner");
    expect(headerElement).toBeInTheDocument();
  });

  it("renders the SidebarTrigger component", () => {
    render(<SiteHeader />);
    expect(screen.getByTestId("sidebar-trigger")).toBeInTheDocument();
  });

  it("renders the Separator component", () => {
    render(<SiteHeader />);
    expect(screen.getByTestId("separator")).toBeInTheDocument();
  });

  it("renders the GitHub link with the correct attributes", () => {
    render(<SiteHeader />);
    
    const githubLink = screen.getByRole("link", { name: /github/i });

    expect(githubLink).toBeInTheDocument();
    expect(githubLink).toHaveAttribute(
      "href",
      "https://github.com/shadcn-ui/ui/tree/main/apps/v4/app/(examples)/dashboard"
    );
    expect(githubLink).toHaveAttribute("target", "_blank");
    expect(githubLink).toHaveAttribute("rel", "noopener noreferrer");
  });
});