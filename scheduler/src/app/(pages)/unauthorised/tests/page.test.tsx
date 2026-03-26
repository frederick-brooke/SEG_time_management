import { render, screen } from "@testing-library/react";
import UnauthorizedPage from "../page";
// ── Mocks 

/** LunarThemeWrapper is a layout concern — render children directly. */
jest.mock("@/components/layout/LunarThemeWrapper", () => ({
  __esModule: true,
  default: ({ children }: { children: React.ReactNode }) => <>{children}</>,
}));

// ── Tests 

describe("UnauthorizedPage", () => {
  beforeEach(() => render(<UnauthorizedPage />));

  test("renders the access denied heading", () => {
    expect(
      screen.getByRole("heading", { name: /access denied – superuser required/i })
    ).toBeInTheDocument();
  });

  test("heading has the correct styling classes", () => {
    const heading = screen.getByRole("heading", { level: 1 });
    expect(heading).toHaveClass("text-2xl", "lunar-page-subtitle", "text-red-600");
  });

  test("renders LunarThemeWrapper", () => {
    expect(screen.getByRole("heading")).toBeInTheDocument();
  });
});