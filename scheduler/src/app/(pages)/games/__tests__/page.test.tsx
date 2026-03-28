/**
 * Testing for Games page
 */

import GamesPage from "../page";
import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { getGameBalance } from "@/app/actions/games";
import GamesPageClient from "../GamesPageClient";

// Mocks

jest.mock("next-auth", () => ({
  getServerSession: jest.fn(),
}));

jest.mock("next/navigation", () => ({
  redirect: jest.fn(),
}));

jest.mock("@/app/actions/games", () => ({
  getGameBalance: jest.fn(),
}));

jest.mock("../GamesPageClient", () => ({
  __esModule: true,
  default: jest.fn(({ initialBalance }) => (
    <div data-testid="games-client">
      {initialBalance}
    </div>
  )),
}));


// Tests

describe("GamesPage", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("redirects to /login if no session", async () => {
    (getServerSession as jest.Mock).mockResolvedValue(null);

    await GamesPage();

    expect(redirect).toHaveBeenCalledWith("/login");
  });

  it("redirects to /login if session has no email", async () => {
    (getServerSession as jest.Mock).mockResolvedValue({
      user: {},
    });

    await GamesPage();

    expect(redirect).toHaveBeenCalledWith("/login");
  });

  it("fetches balance and renders client component", async () => {
    const mockBalance = 500;

    (getServerSession as jest.Mock).mockResolvedValue({
      user: { email: "test@example.com" },
    });

    (getGameBalance as jest.Mock).mockResolvedValue(mockBalance);

    const result = await GamesPage();

    expect(getGameBalance).toHaveBeenCalled();

    expect(result).toBeDefined();
    expect(result.props.initialBalance).toBe(mockBalance);
  });

  it("passes balance to GamesPageClient", async () => {
    const mockBalance = 999;

    (getServerSession as jest.Mock).mockResolvedValue({
      user: { email: "test@example.com" },
    });

    (getGameBalance as jest.Mock).mockResolvedValue(mockBalance);

    await GamesPage();

    const result = await GamesPage();

    expect(result.props.initialBalance).toBe(mockBalance);
  });
});