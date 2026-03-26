import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import ShopPageClient from "./ShopPageClient";
import { purchaseItem, equipItem, unequipItem } from "@/app/actions/shop";
import { ShopData } from "./shop.types";

// Mock server actions
jest.mock("@/app/actions/shop", () => ({
  purchaseItem: jest.fn(),
  equipItem: jest.fn(),
  unequipItem: jest.fn(),
}));

// Mock icons + coin (avoid rendering issues)
jest.mock("lucide-react", () => ({
  Zap: () => <div>ZapIcon</div>,
  Shield: () => <div>ShieldIcon</div>,
  ShoppingBag: () => <div>ShoppingBagIcon</div>,
  CheckCircle: () => <div>CheckIcon</div>,
  Package: () => <div>PackageIcon</div>,
  User: () => <div>UserIcon</div>,
  Sparkles: () => <div>SparklesIcon</div>,
})); `p`

jest.mock("components/ui/gold-coin", () => ({
  GoldCoin: () => <div>Coin</div>,
}));

jest.mock("@/lib/shop-catalogue", () => ({
  AVATAR_IMAGES: {},
}));

const mockData: ShopData = {
  points: 1000,
  equippedAvatar: null,
  xpBoostExpires: null,
  streakShields: 0,
  items: [
    {
      id: "1",
      name: "Cool Avatar",
      description: "A cool avatar",
      type: "AVATAR",
      price: 100,
      value: "avatar1",
      icon: "😎",
      rarity: "common",
      owned: false,
      canAfford: true,
    },
    {
      id: "2",
      name: "XP Boost",
      description: "Boost XP",
      type: "FUNCTIONAL",
      price: 200,
      value: "boost",
      icon: "⚡",
      rarity: "rare",
      owned: false,
      canAfford: true,
    },
  ],
};

describe("ShopPageClient", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });


  it("renders items and balance", () => {
    render(<ShopPageClient initialData={mockData} />);

    expect(screen.getByText("Cool Avatar")).toBeInTheDocument();
    expect(screen.getByText("XP Boost")).toBeInTheDocument();
    expect(screen.getByText("1,000")).toBeInTheDocument();
  });

  it("filters items by tab", () => {
    render(<ShopPageClient initialData={mockData} />);

    fireEvent.click(screen.getByText("Avatars"));

    expect(screen.getByText("Cool Avatar")).toBeInTheDocument();
    expect(screen.queryByText("XP Boost")).not.toBeInTheDocument();
  });

  
  it("purchases an item and updates UI", async () => {
    (purchaseItem as jest.Mock).mockResolvedValue({});

    render(<ShopPageClient initialData={mockData} />);

    fireEvent.click(screen.getAllByText("Buy")[0]);

    await waitFor(() => {
      expect(purchaseItem).toHaveBeenCalledWith("1");
    });

    // Toast appears
    expect(await screen.findByText(/purchased/i)).toBeInTheDocument();
  });

  it("equips an owned avatar", async () => {
    (equipItem as jest.Mock).mockResolvedValue({});

    const ownedData = {
      ...mockData,
      items: [{ ...mockData.items[0], owned: true }],
    };

    render(<ShopPageClient initialData={ownedData} />);

    fireEvent.click(screen.getByText("Equip"));

    await waitFor(() => {
      expect(equipItem).toHaveBeenCalledWith("1");
    });

    expect(
        await screen.findByText(/equipped!/i)
      ).toBeInTheDocument();
});

 
  it("unequips avatar", async () => {
    (unequipItem as jest.Mock).mockResolvedValue({});

    const equippedData = {
      ...mockData,
      equippedAvatar: "avatar1",
      items: [{ ...mockData.items[0], owned: true }],
    };

    render(<ShopPageClient initialData={equippedData} />);

    fireEvent.click(screen.getByText("Unequip"));

    await waitFor(() => {
      expect(unequipItem).toHaveBeenCalledWith("AVATAR");
    });

    expect(await screen.findByText(/unequipped/i)).toBeInTheDocument();
  });


  it("shows error toast if purchase fails", async () => {
    (purchaseItem as jest.Mock).mockRejectedValue(new Error("Failed"));

    render(<ShopPageClient initialData={mockData} />);

    fireEvent.click(screen.getAllByText("Buy")[0]);

    expect(await screen.findByText("Failed")).toBeInTheDocument();
  });
});