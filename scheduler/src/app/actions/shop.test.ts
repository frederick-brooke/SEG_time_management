import {
  getShopData,
  seedShopItems,
  purchaseItem,
  equipItem,
  unequipItem,
} from "./shop";

// Mocks
jest.mock("next-auth", () => ({ getServerSession: jest.fn() }));
jest.mock("next/cache",  () => ({ revalidatePath: jest.fn() }));
jest.mock("@/lib/auth",  () => ({ authOptions: {} }));
jest.mock("@/lib/shop-catalogue", () => ({
  SHOP_CATALOGUE: [
    { name: "Shield", price: 50, description: "A shield", type: "FUNCTIONAL", value: "streak-shield" },
  ],
}));
jest.mock("@/lib/prisma", () => ({
  prisma: {
    shopItem:         { findMany: jest.fn(), findUnique: jest.fn(), upsert: jest.fn() },
    userProgress:     { findUnique: jest.fn(), create: jest.fn(), update: jest.fn() },
    userInventory:    { findUnique: jest.fn(), create: jest.fn() },
    pointTransaction: { create: jest.fn() },
    user:             { findUnique: jest.fn(), update: jest.fn() },
    $transaction:     jest.fn(),
  },
}));

import { getServerSession } from "next-auth";
import { prisma }           from "@/lib/prisma";

const mockSession     = getServerSession       as jest.Mock;
const mockItems       = prisma.shopItem.findMany   as jest.Mock;
const mockItemFind    = prisma.shopItem.findUnique  as jest.Mock;
const mockItemUpsert  = prisma.shopItem.upsert      as jest.Mock;
const mockProgFind    = prisma.userProgress.findUnique as jest.Mock;
const mockProgCreate  = prisma.userProgress.create    as jest.Mock;
const mockProgUpdate  = prisma.userProgress.update    as jest.Mock;
const mockInvFind     = prisma.userInventory.findUnique as jest.Mock;
const mockTransaction = prisma.$transaction           as jest.Mock;
const mockUserFind    = prisma.user.findUnique        as jest.Mock;
const mockUserUpdate  = prisma.user.update            as jest.Mock;

function authedSession(id = "user-1") {
  mockSession.mockResolvedValue({ user: { id } });
}

function makeProgress(overrides: Record<string, unknown> = {}) {
  return {
    id: "prog-1", userId: "user-1", coins: 100, experience: 0,
    level: 1, inventory: [], xpBoostExpires: null,
    ...overrides,
  };
}

function makeItem(overrides: Record<string, unknown> = {}) {
  return {
    id: "item-1", name: "Test Item", price: 50,
    type: "COSMETIC", value: "some-value", isActive: true,
    ...overrides,
  };
}

beforeEach(() => jest.clearAllMocks());

// getShopData
describe("getShopData", () => {
  it("returns null when the user is not authenticated", async () => {
    mockSession.mockResolvedValue(null);
    expect(await getShopData()).toBeNull();
  });

  it("returns shop data with owned and affordability flags", async () => {
    authedSession();
    const item     = makeItem({ id: "item-1", price: 50 });
    const progress = makeProgress({
      coins: 100,
      inventory: [{ itemId: "item-1", item }],
    });
    mockItems.mockResolvedValue([item]);
    mockProgFind.mockResolvedValue(progress);

    const result = await getShopData();

    expect(result?.items[0]).toMatchObject({ id: "item-1", owned: true, canAfford: true });
    expect(result?.points).toBe(100);
  });

  it("marks item as unaffordable when coins are insufficient", async () => {
    authedSession();
    mockItems.mockResolvedValue([makeItem({ price: 200 })]);
    mockProgFind.mockResolvedValue(makeProgress({ coins: 50, inventory: [] }));

    const result = await getShopData();

    expect(result?.items[0].canAfford).toBe(false);
  });

  it("creates progress when none exists", async () => {
    authedSession();
    mockItems.mockResolvedValue([]);
    mockProgFind.mockResolvedValue(null);
    mockProgCreate.mockResolvedValue(makeProgress({ inventory: [] }));

    await getShopData();

    expect(mockProgCreate).toHaveBeenCalledTimes(1);
  });
});

// seedShopItems
describe("seedShopItems", () => {
  it("upserts every item in the catalogue", async () => {
    mockItemUpsert.mockResolvedValue({});
    await seedShopItems();
    expect(mockItemUpsert).toHaveBeenCalledTimes(1);
    expect(mockItemUpsert).toHaveBeenCalledWith(expect.objectContaining({
      where: { name: "Shield" },
    }));
  });
});

// purchaseItem
describe("purchaseItem", () => {
  it("throws Unauthorized when not logged in", async () => {
    mockSession.mockResolvedValue(null);
    await expect(purchaseItem("item-1")).rejects.toThrow("Unauthorized");
  });

  it("throws when item does not exist", async () => {
    authedSession();
    mockItemFind.mockResolvedValue(null);
    mockProgFind.mockResolvedValue(makeProgress());
    await expect(purchaseItem("item-1")).rejects.toThrow("Item not found");
  });

  it("throws when user progress does not exist", async () => {
    authedSession();
    mockItemFind.mockResolvedValue(makeItem());
    mockProgFind.mockResolvedValue(null);
    await expect(purchaseItem("item-1")).rejects.toThrow("User progress not found");
  });

  it("throws when coins are insufficient", async () => {
    authedSession();
    mockItemFind.mockResolvedValue(makeItem({ price: 200 }));
    mockProgFind.mockResolvedValue(makeProgress({ coins: 50 }));
    await expect(purchaseItem("item-1")).rejects.toThrow("Not enough coins");
  });

  it("throws when item is already owned", async () => {
    authedSession();
    mockItemFind.mockResolvedValue(makeItem());
    mockProgFind.mockResolvedValue(makeProgress({
      inventory: [{ itemId: "item-1" }],
    }));
    await expect(purchaseItem("item-1")).rejects.toThrow("Already owned");
  });

  it("runs the purchase transaction on success", async () => {
    authedSession();
    mockItemFind.mockResolvedValue(makeItem());
    mockProgFind.mockResolvedValue(makeProgress({ inventory: [] }));
    mockTransaction.mockResolvedValue([]);

    const result = await purchaseItem("item-1");

    expect(mockTransaction).toHaveBeenCalledTimes(1);
    expect(result).toEqual({ success: true });
  });

  it("applies xp-boost-24h for functional items", async () => {
    authedSession();
    mockItemFind.mockResolvedValue(makeItem({ type: "FUNCTIONAL", value: "xp-boost-24h" }));
    mockProgFind.mockResolvedValue(makeProgress({ inventory: [] }));
    mockTransaction.mockResolvedValue([]);
    mockProgUpdate.mockResolvedValue({});

    await purchaseItem("item-1");

    expect(mockProgUpdate).toHaveBeenCalledWith(expect.objectContaining({
      data: expect.objectContaining({ xpBoostExpires: expect.any(Date) }),
    }));
  });
});

// equipItem
describe("equipItem", () => {
  it("throws Unauthorized when not logged in", async () => {
    mockSession.mockResolvedValue(null);
    await expect(equipItem("item-1")).rejects.toThrow("Unauthorized");
  });

  it("throws when item is not owned", async () => {
    authedSession();
    mockItemFind.mockResolvedValue(makeItem({ type: "TITLE", value: "hero" }));
    mockInvFind.mockResolvedValue(null);
    await expect(equipItem("item-1")).rejects.toThrow("Item not owned");
  });

  it("updates equippedTitle for TITLE items", async () => {
    authedSession();
    mockItemFind.mockResolvedValue(makeItem({ type: "TITLE", value: "hero" }));
    mockInvFind.mockResolvedValue({ userId: "user-1", itemId: "item-1" });
    mockProgUpdate.mockResolvedValue({});

    await equipItem("item-1");

    expect(mockProgUpdate).toHaveBeenCalledWith(expect.objectContaining({
      data: { equippedTitle: "hero" },
    }));
  });

  it("updates equippedFrame for FRAME items", async () => {
    authedSession();
    mockItemFind.mockResolvedValue(makeItem({ type: "FRAME", value: "gold" }));
    mockInvFind.mockResolvedValue({ userId: "user-1", itemId: "item-1" });
    mockProgUpdate.mockResolvedValue({});

    await equipItem("item-1");

    expect(mockProgUpdate).toHaveBeenCalledWith(expect.objectContaining({
      data: { equippedFrame: "gold" },
    }));
  });

  it("updates equippedAvatar and user pfp for AVATAR items", async () => {
    authedSession();
    mockItemFind.mockResolvedValue(makeItem({ type: "AVATAR", value: "fox" }));
    mockInvFind.mockResolvedValue({ userId: "user-1", itemId: "item-1" });
    mockProgUpdate.mockResolvedValue({});
    mockUserUpdate.mockResolvedValue({});

    await equipItem("item-1");

    expect(mockUserUpdate).toHaveBeenCalledWith(expect.objectContaining({
      data: { pfp: "avatar:fox" },
    }));
  });
});

// unequipItem
describe("unequipItem", () => {
  it("throws Unauthorized when not logged in", async () => {
    mockSession.mockResolvedValue(null);
    await expect(unequipItem("AVATAR")).rejects.toThrow("Unauthorized");
  });

  it("clears equippedTitle for TITLE type", async () => {
    authedSession();
    mockProgUpdate.mockResolvedValue({});
    await unequipItem("TITLE");
    expect(mockProgUpdate).toHaveBeenCalledWith(expect.objectContaining({
      data: { equippedTitle: null },
    }));
  });

  it("clears equippedFrame for FRAME type", async () => {
    authedSession();
    mockProgUpdate.mockResolvedValue({});
    await unequipItem("FRAME");
    expect(mockProgUpdate).toHaveBeenCalledWith(expect.objectContaining({
      data: { equippedFrame: null },
    }));
  });

  it("clears equippedAvatar and nulls pfp when pfp is avatar-prefixed", async () => {
    authedSession();
    mockProgUpdate.mockResolvedValue({});
    mockUserFind.mockResolvedValue({ pfp: "avatar:fox" });
    mockUserUpdate.mockResolvedValue({});

    await unequipItem("AVATAR");

    expect(mockUserUpdate).toHaveBeenCalledWith(expect.objectContaining({
      data: { pfp: null },
    }));
  });

  it("does not update user pfp when pfp is not avatar-prefixed", async () => {
    authedSession();
    mockProgUpdate.mockResolvedValue({});
    mockUserFind.mockResolvedValue({ pfp: "https://example.com/img.png" });

    await unequipItem("AVATAR");

    expect(mockUserUpdate).not.toHaveBeenCalled();
  });
});