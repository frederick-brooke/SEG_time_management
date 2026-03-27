import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { getShopData } from "@/app/actions/shop";
import ShopPage from "../page";

// 1. Update the next/navigation mock to THROW an error, halting execution
jest.mock("next/navigation", () => ({
  redirect: jest.fn(() => {
    throw new Error("NEXT_REDIRECT");
  }),
}));

jest.mock("next-auth", () => ({
  getServerSession: jest.fn(),
}));

jest.mock("@/app/actions/shop", () => ({
  getShopData: jest.fn(),
}));

jest.mock("../ShopPageClient", () => {
  return function MockShopPageClient({ initialData }: any) {
    return <div data-testid="client-boundary">{JSON.stringify(initialData)}</div>;
  };
});

describe("ShopPage Server Component", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("redirects to login if user is not authenticated", async () => {
    (getServerSession as jest.Mock).mockResolvedValue(null);

    // 2. Expect the component to reject/throw when redirect is called
    await expect(ShopPage()).rejects.toThrow("NEXT_REDIRECT");

    expect(getServerSession).toHaveBeenCalled();
    expect(redirect).toHaveBeenCalledWith("/login");
  });

  it("redirects to login if shop data fails to load", async () => {
    (getServerSession as jest.Mock).mockResolvedValue({ user: { email: "test@test.com" } });
    (getShopData as jest.Mock).mockResolvedValue(null);

    // 2. Expect the component to reject/throw here as well
    await expect(ShopPage()).rejects.toThrow("NEXT_REDIRECT");

    expect(getShopData).toHaveBeenCalled();
    expect(redirect).toHaveBeenCalledWith("/login");
  });

  it("sanitizes data and renders the client component", async () => {
    (getServerSession as jest.Mock).mockResolvedValue({ user: { email: "test@test.com" } });
    
    const mockDbData = {
      points: 1500,
      equippedAvatar: "avatar1",
      items: [
        { id: "1", type: "AVATAR", rarity: "rare", name: "Cool Avatar" },
        { id: "2", type: "WEAPON", rarity: "common", name: "Sword" }, 
      ],
    };
    (getShopData as jest.Mock).mockResolvedValue(mockDbData);

    const component = await ShopPage();

    expect(component.props.initialData).toEqual({
      points: 1500,
      equippedAvatar: "avatar1",
      items: [
        { id: "1", type: "AVATAR", rarity: "rare", name: "Cool Avatar" },
      ],
    });
  });
});