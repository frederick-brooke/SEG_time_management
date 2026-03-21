/**
 * @jest-environment node
 */

import ShopPage from "./page";
import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { getShopData } from "@/src/app/actions/shop";

// Mock dependencies
jest.mock("next-auth", () => ({
  getServerSession: jest.fn(),
}));

jest.mock("next/navigation", () => ({
  redirect: jest.fn(),
}));

jest.mock("@/src/app/actions/shop", () => ({
  getShopData: jest.fn(),
}));

jest.mock("./ShopPageClient", () => ({
  __esModule: true,
  default: jest.fn(({ initialData }) => (
    <div data-testid="shop-client">
      {JSON.stringify(initialData)}
    </div>
  )),
}));

describe("ShopPage", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("redirects to /login if no session", async () => {
    (getServerSession as jest.Mock).mockResolvedValue(null);

    await ShopPage();

    expect(redirect).toHaveBeenCalledWith("/login");
  });

  it("redirects to /login if session has no email", async () => {
    (getServerSession as jest.Mock).mockResolvedValue({
      user: {},
    });

    await ShopPage();

    expect(redirect).toHaveBeenCalledWith("/login");
  });

  it("redirects to /login if no shop data", async () => {
    (getServerSession as jest.Mock).mockResolvedValue({
      user: { email: "test@example.com" },
    });

    (getShopData as jest.Mock).mockResolvedValue(null);

    await ShopPage();

    expect(redirect).toHaveBeenCalledWith("/login");
  });

  it("renders ShopPageClient with data when session and data exist", async () => {
    const mockData = { items: [{ id: 1, name: "Item 1" }] };

    (getServerSession as jest.Mock).mockResolvedValue({
      user: { email: "test@example.com" },
    });

    (getShopData as jest.Mock).mockResolvedValue(mockData);

    const result = await ShopPage();

    expect(result).toBeDefined();
    expect(result.props.initialData).toEqual(mockData);
  });
});