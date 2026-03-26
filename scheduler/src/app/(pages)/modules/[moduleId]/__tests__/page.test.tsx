import { render, screen } from "@testing-library/react";
import ModulesPage from "../page";
import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { getMyModules } from "@/app/actions/module";

// ── 1. Mock External Dependencies ───────────────────────────────────────────

jest.mock("next-auth", () => ({
  getServerSession: jest.fn(),
}));

jest.mock("lib/auth", () => ({
  authOptions: {},
}));

// Throw an error to stop execution, exactly how real Next.js works
jest.mock("next/navigation", () => ({
  redirect: jest.fn(() => { throw new Error("NEXT_REDIRECT"); }),
}));

jest.mock("@/app/actions/module", () => ({
  getMyModules: jest.fn(),
}));

// ── 2. Mock Child Component ─────────────────────────────────────────────────

jest.mock("./ModulesPageClient", () => ({
  __esModule: true,
  default: ({ modules }: any) => (
    <div data-testid="modules-client">
      Mocked Modules Client - Count: {modules?.length || 0}
    </div>
  ),
}));

// ── 3. Test Suite ───────────────────────────────────────────────────────────

describe("ModulesPage (Server Component)", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("redirects to /login if no session or email is found", async () => {
    (getServerSession as jest.Mock).mockResolvedValueOnce(null);

    // Catch the intentional mock error
    await expect(ModulesPage()).rejects.toThrow("NEXT_REDIRECT");
    
    expect(redirect).toHaveBeenCalledWith("/login");
    // Ensure it didn't keep executing down to the DB call
    expect(getMyModules).not.toHaveBeenCalled(); 
  });

  it("fetches modules and renders ModulesPageClient when authenticated", async () => {
    (getServerSession as jest.Mock).mockResolvedValueOnce({
      user: { email: "student@lunar.com" },
    });
    
    const mockModulesData = [{ id: "mod1" }, { id: "mod2" }];
    (getMyModules as jest.Mock).mockResolvedValueOnce(mockModulesData);

    // Call the async server component and render the result
    const ui = await ModulesPage();
    render(ui);

    expect(getMyModules).toHaveBeenCalled();
    expect(screen.getByTestId("modules-client")).toBeInTheDocument();
    expect(screen.getByText("Mocked Modules Client - Count: 2")).toBeInTheDocument();
  });
});