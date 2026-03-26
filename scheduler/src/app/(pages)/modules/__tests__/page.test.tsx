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

jest.mock("next/navigation", () => ({
  redirect: jest.fn(() => { throw new Error("NEXT_REDIRECT"); }),
}));

jest.mock("@/app/actions/module", () => ({
  getMyModules: jest.fn(),
}));

// ── 2. Mock Child Component ─────────────────────────────────────────────────

jest.mock("../ModulesPageClient", () => ({
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

    await expect(ModulesPage()).rejects.toThrow("NEXT_REDIRECT");
    
    expect(redirect).toHaveBeenCalledWith("/login");
    expect(getMyModules).not.toHaveBeenCalled(); 
  });

  it("fetches modules and renders ModulesPageClient when authenticated", async () => {
    (getServerSession as jest.Mock).mockResolvedValueOnce({
      user: { email: "student@lunar.com" },
    });
    
    const mockModulesData = [{ id: "mod1" }, { id: "mod2" }];
    (getMyModules as jest.Mock).mockResolvedValueOnce(mockModulesData);

    const ui = await ModulesPage();
    render(ui);

    expect(getMyModules).toHaveBeenCalled();
    expect(screen.getByTestId("modules-client")).toBeInTheDocument();
    expect(screen.getByText("Mocked Modules Client - Count: 2")).toBeInTheDocument();
  });
});