'use server'

/**
 * Shop service
 *
 * Handles in-app economy features including shop browsing,
 * item seeding, purchases, and equipping/unequipping cosmetics
 * and functional upgrades tied to user progress and inventory.
 */

import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { revalidatePath } from "next/cache";
import { SHOP_CATALOGUE } from "@/lib/shop-catalogue";

type EquippableType = "TITLE" | "FRAME" | "AVATAR";

// Auth
async function requireUserId(): Promise<string> {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) throw new Error("Unauthorized");
  return session.user.id;
}

// Progress
async function findOrCreateProgress(userId: string) {
  const existing = await prisma.userProgress.findUnique({
    where: { userId },
    include: { inventory: { include: { item: true } } },
  });
  if (existing) return existing;

  return prisma.userProgress.create({
    data: { userId, points: 0, level: 1, experience: 0, coins: 0, streak: 0 },
    include: { inventory: { include: { item: true } } },
  });
}

function buildItemView(item: any, ownedIds: Set<string>, coins: number) {
  return { ...item, owned: ownedIds.has(item.id), canAfford: coins >= item.price };
}

/**
 * Returns shop data for the current user including available items,
 * ownership state, affordability, and equipped cosmetics.
 *
 * @returns {Promise<{
*   items: any[];
*   points: number;
*   equippedAvatar: string | null;
*   xpBoostExpires: Date | null;
* } | null>}
*/
export async function getShopData() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return null;

  const [items, progress] = await Promise.all([
    prisma.shopItem.findMany({
      where: { isActive: true },
      orderBy: [{ type: "asc" }, { price: "asc" }],
    }),
    findOrCreateProgress(session.user.id),
  ]);

  const ownedIds = new Set(progress.inventory.map((inv: any) => inv.itemId));

  return {
    items:          items.map(item => buildItemView(item, ownedIds, progress.coins)),
    points:         progress.coins,
    equippedAvatar: (progress as any).equippedAvatar ?? null,
    xpBoostExpires: progress.xpBoostExpires ?? null,
  };
}

/**
 * Seeds the shop with default items from the catalogue.
 * Upserts items to ensure existing entries are updated safely.
 *
 * @returns {Promise<void>}
 */
export async function seedShopItems() {
  for (const item of SHOP_CATALOGUE) {
    await prisma.shopItem.upsert({
      where:  { name: item.name },
      create: { ...item, isActive: true },
      update: { price: item.price, description: item.description },
    });
  }
}

// Purchase item

async function requireItem(itemId: string) {
  const item = await prisma.shopItem.findUnique({ where: { id: itemId } });
  if (!item) throw new Error("Item not found");
  return item;
}

async function requireProgress(userId: string) {
  const progress = await prisma.userProgress.findUnique({
    where: { userId },
    include: { inventory: true },
  });
  if (!progress) throw new Error("User progress not found");
  return progress;
}

function assertCanPurchase(progress: any, item: any) {
  if (progress.coins < item.price) throw new Error("Not enough coins");
  const alreadyOwned = progress.inventory.some((inv: any) => inv.itemId === item.id);
  if (alreadyOwned) throw new Error("Already owned");
}

async function applyPurchaseTransaction(userId: string, item: any, progressId: string) {
  await prisma.$transaction([
    prisma.userProgress.update({
      where: { userId },
      data:  { coins: { decrement: item.price } },
    }),
    prisma.userInventory.create({
      data: { userId, itemId: item.id, progressId },
    }),
    prisma.pointTransaction.create({
      data: { progressId, amount: -item.price, reason: `Purchased: ${item.name}` },
    }),
  ]);
}

async function applyFunctionalItem(userId: string, value: string) {
  if (value === "xp-boost-24h") {
    await prisma.userProgress.update({
      where: { userId },
      data:  { xpBoostExpires: new Date(Date.now() + 24 * 60 * 60 * 1000) },
    });
  }
}

/**
 * Purchases a shop item for the current user.
 * Deducts coins, creates inventory entry, and logs transaction.
 * Applies functional effects if applicable (e.g. boosts).
 *
 * @param {string} itemId - ID of the item to purchase
 * @returns {Promise<{ success: boolean }>}
 */
export async function purchaseItem(itemId: string) {
  const userId   = await requireUserId();
  const [item, progress] = await Promise.all([
    requireItem(itemId),
    requireProgress(userId),
  ]);

  assertCanPurchase(progress, item);
  await applyPurchaseTransaction(userId, item, progress.id);

  if (item.type === "FUNCTIONAL") await applyFunctionalItem(userId, item.value);

  revalidatePath("/shop");
  revalidatePath("/profile");
  return { success: true };
}

// Equip

async function requireOwnedItem(userId: string, itemId: string) {
  const owned = await prisma.userInventory.findUnique({
    where: { userId_itemId: { userId, itemId } },
  });
  if (!owned) throw new Error("Item not owned");
}

async function equipAvatar(userId: string, value: string) {
  await (prisma.userProgress as any).update({
    where: { userId },
    data:  { equippedAvatar: value },
  });
  await prisma.user.update({
    where: { id: userId },
    data:  { pfp: `avatar:${value}` },
  });
}

async function equipLegacyItem(userId: string, type: "TITLE" | "FRAME", value: string) {
  const field = type === "TITLE" ? "equippedTitle" : "equippedFrame";
  await prisma.userProgress.update({
    where: { userId },
    data:  { [field]: value },
  });
}

/**
 * Equips an owned shop item to the user's profile.
 * Supports avatars, titles, and frames.
 *
 * @param {string} itemId - ID of the item to equip
 * @returns {Promise<{ success: boolean }>}
 */
export async function equipItem(itemId: string) {
  const userId = await requireUserId();
  const item   = await requireItem(itemId);

  await requireOwnedItem(userId, itemId);

  if (item.type === "AVATAR") await equipAvatar(userId, item.value);
  if (item.type === "TITLE")  await equipLegacyItem(userId, "TITLE", item.value);
  if (item.type === "FRAME")  await equipLegacyItem(userId, "FRAME", item.value);

  revalidatePath("/shop");
  revalidatePath("/profile");
  return { success: true };
}

// Unequip

async function unequipAvatar(userId: string) {
  await (prisma.userProgress as any).update({
    where: { userId },
    data:  { equippedAvatar: null },
  });

  const user = await prisma.user.findUnique({
    where:  { id: userId },
    select: { pfp: true },
  });

  if (user?.pfp?.startsWith("avatar:")) {
    await prisma.user.update({ where: { id: userId }, data: { pfp: null } });
  }
}

async function unequipLegacyItem(userId: string, type: "TITLE" | "FRAME") {
  const field = type === "TITLE" ? "equippedTitle" : "equippedFrame";
  await prisma.userProgress.update({ where: { userId }, data: { [field]: null } });
}

/**
 * Unequips a currently equipped shop item type.
 *
 * @param {"TITLE" | "FRAME" | "AVATAR"} type - The equipment slot to clear
 * @returns {Promise<void>}
 */
export async function unequipItem(type: EquippableType) {
  const userId = await requireUserId();

  if (type === "AVATAR") await unequipAvatar(userId);
  if (type === "TITLE")  await unequipLegacyItem(userId, "TITLE");
  if (type === "FRAME")  await unequipLegacyItem(userId, "FRAME");

  revalidatePath("/shop");
  revalidatePath("/profile");
}