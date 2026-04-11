import GamesPage from "../page";
import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { getGameBalance } from "@/app/actions/games";
import React from "react";

// MOCKS
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
    <div data-testid="games-client">{initialBalance}</div>
  )),
}));
jest.mock("@/components/StarBackground", () => ({
  __esModule: true,
  default: () => <div data-testid="star-background" />,
}));

// TESTS
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
    (getServerSession as jest.Mock).mockResolvedValue({ user: {} });
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

    const children = React.Children.toArray((result as any).props.children);
    const clientEl = children.find((child) => {
      if (!React.isValidElement(child)) return false;
      const type = child.type as any;
      return type?.mock !== undefined; 
    }) as React.ReactElement | undefined;

    expect(clientEl).toBeDefined();
    expect((clientEl!.props as any).initialBalance).toBe(mockBalance);
  });

  it("passes balance to GamesPageClient", async () => {
    const mockBalance = 999;
    (getServerSession as jest.Mock).mockResolvedValue({
      user: { email: "test@example.com" },
    });
    (getGameBalance as jest.Mock).mockResolvedValue(mockBalance);

    const result = await GamesPage();

    const children = React.Children.toArray((result as any).props.children);
    const clientEl = children.find((child) => {
      if (!React.isValidElement(child)) return false;
      const type = child.type as any;
      return type?.mock !== undefined;
    }) as React.ReactElement | undefined;

    expect(clientEl).toBeDefined();
    expect((clientEl!.props as any).initialBalance).toBe(mockBalance);
  });
});
