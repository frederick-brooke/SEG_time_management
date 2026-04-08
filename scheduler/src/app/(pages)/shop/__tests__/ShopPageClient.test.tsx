/**
 * Testing for Shop Page Client.
 */

import React from "react";
import {
  render,
  screen,
  fireEvent,
  waitFor,
  act,
} from "@testing-library/react";
import "@testing-library/jest-dom";
import ShopPageClient from "../ShopPageClient";
import { purchaseItem, equipItem, unequipItem } from "@/app/actions/shop";
import { ShopData } from "../shop.types";

// Mocks

jest.mock("@/app/actions/shop", () => ({
  purchaseItem: jest.fn(),
  equipItem: jest.fn(),
  unequipItem: jest.fn(),
}));

jest.mock("lucide-react", () => ({
  Package: () => <div>PackageIcon</div>,
}));

jest.mock("@/components/ui/GoldCoin", () => ({
  GoldCoin: () => <div>Coin</div>,
}));

jest.mock("@/lib/shop-catalogue", () => ({
  AVATAR_IMAGES: {
    avatar1: "/avatar1.png",
    avatar2: "/avatar2.png",
  },
}));

jest.mock("@/components/layout/LunarThemeWrapper", () => ({
  __esModule: true,
  default: ({ children }: { children: React.ReactNode }) => (
    <div>{children}</div>
  ),
}));

/**
 * Mock AvatarCard so tests focus on ShopPageClient behavior.
 */
jest.mock("../ShopCards", () => ({
  AvatarCard: ({
    item,
    equippedAvatar,
    onPurchase,
    onEquip,
    onUnequip,
    isPending,
  }: {
    item: any;
    equippedAvatar: string | null;
    onPurchase: (id: string) => void;
    onEquip: (id: string) => void;
    onUnequip: () => void;
    isPending: boolean;
  }) => (
    <div data-testid={`avatar-card-${item.id}`}>
      <div>{item.name}</div>
      <div>{item.description}</div>
      <div>{item.price}</div>
      <div>{isPending ? "pending" : "idle"}</div>

      {!item.owned ? (
        <button onClick={() => onPurchase(item.id)}>Buy</button>
      ) : equippedAvatar === item.value ? (
        <button onClick={onUnequip}>Unequip</button>
      ) : (
        <button onClick={() => onEquip(item.id)}>Equip</button>
      )}
    </div>
  ),
}));

// Mock Data

const baseData: ShopData = {
  points: 1000,
  equippedAvatar: null,
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
  ],
};

describe("ShopPageClient", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.runOnlyPendingTimers();
    jest.useRealTimers();
  });

  it("renders shop header, balance, and avatar items", () => {
    render(<ShopPageClient initialData={baseData} />);

    expect(screen.getByText("🛸 Cosmic Avatar Shop")).toBeInTheDocument();
    expect(screen.getByText("Your Balance")).toBeInTheDocument();
    expect(screen.getByText("1,000")).toBeInTheDocument();
    expect(screen.getByText("Cool Avatar")).toBeInTheDocument();
    expect(screen.queryByText("My Avatar Collection")).not.toBeInTheDocument();
  });

  it("filters out non-avatar items from the grid and collection", () => {
    const mixedData: ShopData = {
      ...baseData,
      items: [
        ...baseData.items,
        {
          id: "2",
          name: "Not An Avatar",
          description: "Should not appear",
          type: "TITLE" as any,
          price: 50,
          value: "title1",
          icon: "🏷️",
          rarity: "common",
          owned: true,
          canAfford: true,
        },
      ],
    };

    render(<ShopPageClient initialData={mixedData} />);

    expect(screen.getByText("Cool Avatar")).toBeInTheDocument();
    expect(screen.queryByText("Not An Avatar")).not.toBeInTheDocument();
  });

  it("purchases an item, updates UI, and shows owned collection", async () => {
    (purchaseItem as jest.Mock).mockResolvedValue({});

    render(<ShopPageClient initialData={baseData} />);

    fireEvent.click(screen.getByText("Buy"));

    await waitFor(() => {
      expect(purchaseItem).toHaveBeenCalledWith("1");
    });

    expect(
      await screen.findByText("🎉 Cool Avatar purchased!"),
    ).toBeInTheDocument();
    expect(screen.getByText("900")).toBeInTheDocument();
    expect(screen.getByText("My Avatar Collection")).toBeInTheDocument();
    expect(screen.getByTitle("Cool Avatar")).toBeInTheDocument();
  });

  it("equips an owned avatar from the card button", async () => {
    (equipItem as jest.Mock).mockResolvedValue({});

    const ownedData: ShopData = {
      ...baseData,
      items: [{ ...baseData.items[0], owned: true }],
    };

    render(<ShopPageClient initialData={ownedData} />);

    fireEvent.click(screen.getByText("Equip"));

    await waitFor(() => {
      expect(equipItem).toHaveBeenCalledWith("1");
    });

    expect(
      await screen.findByText("✨ Cool Avatar equipped!"),
    ).toBeInTheDocument();
  });

  it("equips an owned avatar from the thumbnail when not currently equipped", async () => {
    (equipItem as jest.Mock).mockResolvedValue({});

    const ownedData: ShopData = {
      ...baseData,
      items: [{ ...baseData.items[0], owned: true }],
    };

    render(<ShopPageClient initialData={ownedData} />);

    fireEvent.click(screen.getByTitle("Cool Avatar"));

    await waitFor(() => {
      expect(equipItem).toHaveBeenCalledWith("1");
    });

    expect(
      await screen.findByText("✨ Cool Avatar equipped!"),
    ).toBeInTheDocument();
  });

  it("unequips avatar from the thumbnail when it is currently equipped", async () => {
    (unequipItem as jest.Mock).mockResolvedValue({});

    const equippedData: ShopData = {
      ...baseData,
      equippedAvatar: "avatar1",
      items: [{ ...baseData.items[0], owned: true }],
    };

    render(<ShopPageClient initialData={equippedData} />);

    fireEvent.click(screen.getByTitle("Cool Avatar"));

    await waitFor(() => {
      expect(unequipItem).toHaveBeenCalledWith("AVATAR");
    });

    expect(await screen.findByText("Avatar unequipped")).toBeInTheDocument();
  });

  it("shows error toast if purchase fails with an Error message", async () => {
    (purchaseItem as jest.Mock).mockRejectedValue(new Error("Failed"));

    render(<ShopPageClient initialData={baseData} />);

    fireEvent.click(screen.getByText("Buy"));

    expect(await screen.findByText("Failed")).toBeInTheDocument();
  });

  it('shows fallback error toast "Action failed" when thrown value has no message', async () => {
    (purchaseItem as jest.Mock).mockRejectedValue({});

    render(<ShopPageClient initialData={baseData} />);

    fireEvent.click(screen.getByText("Buy"));

    expect(await screen.findByText("Action failed")).toBeInTheDocument();
  });

  it("hides the toast after 3 seconds", async () => {
    (purchaseItem as jest.Mock).mockResolvedValue({});

    render(<ShopPageClient initialData={baseData} />);

    fireEvent.click(screen.getByText("Buy"));

    expect(
      await screen.findByText("🎉 Cool Avatar purchased!"),
    ).toBeInTheDocument();

    act(() => {
      jest.advanceTimersByTime(3000);
    });

    await waitFor(() => {
      expect(
        screen.queryByText("🎉 Cool Avatar purchased!"),
      ).not.toBeInTheDocument();
    });
  });

  it("renders collection only when there are owned avatars", () => {
    const noOwnedData: ShopData = {
      ...baseData,
      items: [
        { ...baseData.items[0], owned: false },
        {
          id: "2",
          name: "Second Avatar",
          description: "Another avatar",
          type: "AVATAR",
          price: 200,
          value: "avatar2",
          icon: "🌙",
          rarity: "rare",
          owned: false,
          canAfford: true,
        },
      ],
    };

    render(<ShopPageClient initialData={noOwnedData} />);

    expect(screen.queryByText("My Avatar Collection")).not.toBeInTheDocument();
    expect(screen.queryByTitle("Cool Avatar")).not.toBeInTheDocument();
    expect(screen.queryByTitle("Second Avatar")).not.toBeInTheDocument();
  });

  it("shows fallback error toast when error message is an empty string", async () => {
    (purchaseItem as jest.Mock).mockRejectedValue({ message: "" });

    render(<ShopPageClient initialData={baseData} />);

    fireEvent.click(screen.getByText("Buy"));

    expect(await screen.findByText("Action failed")).toBeInTheDocument();
  });

  it("shows fallback error toast when error message is undefined", async () => {
    (purchaseItem as jest.Mock).mockRejectedValue({ message: undefined });

    render(<ShopPageClient initialData={baseData} />);

    fireEvent.click(screen.getByText("Buy"));

    expect(await screen.findByText("Action failed")).toBeInTheDocument();
  });
});
