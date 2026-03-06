'use server'

import { prisma } from "@/src/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/src/lib/auth";
import { revalidatePath } from "next/cache";

// ─────────────────────────────────────────────────────────────────────────────
// STATIC SHOP CATALOGUE
// These are seeded once. Run seedShopItems() on app start or as a script.
// ─────────────────────────────────────────────────────────────────────────────
export const SHOP_CATALOGUE = [
  // ── TITLES ──────────────────────────────────────────────────────────────
  {
    name: "Cosmic Cadet",
    description: "Every legend starts somewhere. Show the galaxy you've arrived.",
    type: "TITLE" as const,
    price: 100,
    value: "Cosmic Cadet",
    icon: "🚀",
    rarity: "common",
  },
  {
    name: "Nebula Scout",
    description: "You've explored the edges of the known universe. Wear it proudly.",
    type: "TITLE" as const,
    price: 250,
    value: "Nebula Scout",
    icon: "🌌",
    rarity: "rare",
  },
  {
    name: "Star Commander",
    description: "You command the stars. Reserved for those who've proven themselves.",
    type: "TITLE" as const,
    price: 500,
    value: "Star Commander",
    icon: "⭐",
    rarity: "epic",
  },
  {
    name: "Void Walker",
    description: "You move through darkness others fear. A title for the truly dedicated.",
    type: "TITLE" as const,
    price: 750,
    value: "Void Walker",
    icon: "🌑",
    rarity: "epic",
  },
  {
    name: "Galaxy Brain",
    description: "Legendary status. Only the most productive minds earn this.",
    type: "TITLE" as const,
    price: 1500,
    value: "Galaxy Brain",
    icon: "🧠",
    rarity: "legendary",
  },

  // ── FRAMES ──────────────────────────────────────────────────────────────
  {
    name: "Solar Flare",
    description: "A blazing gold frame that radiates energy.",
    type: "FRAME" as const,
    price: 200,
    value: "solar-flare",
    icon: "☀️",
    rarity: "common",
  },
  {
    name: "Nebula Glow",
    description: "A dreamy purple-pink cosmic glow around your avatar.",
    type: "FRAME" as const,
    price: 400,
    value: "nebula-glow",
    icon: "💜",
    rarity: "rare",
  },
  {
    name: "Aurora Ring",
    description: "Northern lights dancing around your profile. Hypnotic.",
    type: "FRAME" as const,
    price: 600,
    value: "aurora-ring",
    icon: "🌈",
    rarity: "epic",
  },
  {
    name: "Event Horizon",
    description: "The legendary black hole frame. Warps reality itself.",
    type: "FRAME" as const,
    price: 2000,
    value: "event-horizon",
    icon: "🕳️",
    rarity: "legendary",
  },

  // ── FUNCTIONAL ──────────────────────────────────────────────────────────
  {
    name: "XP Boost",
    description: "Double your points for the next 24 hours. Grind hard.",
    type: "FUNCTIONAL" as const,
    price: 300,
    value: "xp-boost-24h",
    icon: "⚡",
    rarity: "rare",
  },
  {
    name: "Streak Shield",
    description: "Miss a day without breaking your streak. One-time use.",
    type: "FUNCTIONAL" as const,
    price: 150,
    value: "streak-shield",
    icon: "🛡️",
    rarity: "common",
  },
];

export async function seedShopItems() {
  for (const item of SHOP_CATALOGUE) {
    await prisma.shopItem.upsert({
      where: { 
        // upsert by name so re-running is safe
        name: item.name 
      } as any,
      create: item,
      update: { price: item.price, description: item.description },
    });
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// GET SHOP DATA (items + user's owned items + balance)
// ─────────────────────────────────────────────────────────────────────────────
export async function getShopData() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return null;

  const [items, progress] = await Promise.all([
    prisma.shopItem.findMany({
      where: { isActive: true },
      orderBy: [{ type: "asc" }, { price: "asc" }],
    }),
    prisma.userProgress.findUnique({
      where: { userId: session.user.id },
      include: {
        inventory: { include: { item: true } },
      },
    }),
  ]);

  // Auto-create progress if missing
  const userProgress = progress ?? await prisma.userProgress.create({
    data: {
      userId: session.user.id,
      points: 0, level: 1, experience: 0, streak: 0,
    },
    include: { inventory: { include: { item: true } } },
  });

  const ownedItemIds = new Set(userProgress.inventory.map((inv: any) => inv.itemId));

  return {
    items: items.map(item => ({
      ...item,
      owned: ownedItemIds.has(item.id),
      canAfford: userProgress.points >= item.price,
    })),
    points: userProgress.points,
    equippedTitle: userProgress.equippedTitle ?? null,
    equippedFrame: userProgress.equippedFrame ?? null,
    xpBoostExpires: userProgress.xpBoostExpires ?? null,
    streakShields: userProgress.streakShields ?? 0,
    inventory: userProgress.inventory,
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// PURCHASE ITEM
// ─────────────────────────────────────────────────────────────────────────────
export async function purchaseItem(itemId: string) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) throw new Error("Unauthorized");

  const [item, progress] = await Promise.all([
    prisma.shopItem.findUnique({ where: { id: itemId } }),
    prisma.userProgress.findUnique({
      where: { userId: session.user.id },
      include: { inventory: true },
    }),
  ]);

  if (!item) throw new Error("Item not found");
  if (!progress) throw new Error("User progress not found");
  if (progress.points < item.price) throw new Error("Not enough points");

  const alreadyOwned = progress.inventory.some((inv: any) => inv.itemId === itemId);
  if (alreadyOwned) throw new Error("Already owned");

  // Deduct points and add to inventory in a transaction
  await prisma.$transaction([
    prisma.userProgress.update({
      where: { userId: session.user.id },
      data: { points: { decrement: item.price } },
    }),
    prisma.userInventory.create({
      data: {
        userId: session.user.id,
        itemId,
        progressId: progress.id,
      },
    }),
    // Log the transaction
    prisma.pointTransaction.create({
      data: {
        progressId: progress.id,
        amount: -item.price,
        reason: `Purchased: ${item.name}`,
      },
    }),
  ]);

  // For functional items, apply the effect immediately
  if (item.type === "FUNCTIONAL") {
    if (item.value === "xp-boost-24h") {
      const expires = new Date(Date.now() + 24 * 60 * 60 * 1000);
      await prisma.userProgress.update({
        where: { userId: session.user.id },
        data: { xpBoostExpires: expires },
      });
    }
    if (item.value === "streak-shield") {
      await prisma.userProgress.update({
        where: { userId: session.user.id },
        data: { streakShields: { increment: 1 } },
      });
    }
  }

  revalidatePath("/shop");
  revalidatePath("/profile");
  return { success: true };
}

// ─────────────────────────────────────────────────────────────────────────────
// EQUIP ITEM (titles and frames)
// ─────────────────────────────────────────────────────────────────────────────
export async function equipItem(itemId: string) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) throw new Error("Unauthorized");

  const item = await prisma.shopItem.findUnique({ where: { id: itemId } });
  if (!item) throw new Error("Item not found");

  // Verify ownership
  const owned = await prisma.userInventory.findUnique({
    where: { userId_itemId: { userId: session.user.id, itemId } },
  });
  if (!owned) throw new Error("Item not owned");

  if (item.type === "TITLE") {
    await prisma.userProgress.update({
      where: { userId: session.user.id },
      data: { equippedTitle: item.value },
    });
  } else if (item.type === "FRAME") {
    await prisma.userProgress.update({
      where: { userId: session.user.id },
      data: { equippedFrame: item.value },
    });
  }

  revalidatePath("/profile");
  revalidatePath("/shop");
  return { success: true };
}

// ─────────────────────────────────────────────────────────────────────────────
// UNEQUIP ITEM
// ─────────────────────────────────────────────────────────────────────────────
export async function unequipItem(type: "TITLE" | "FRAME") {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) throw new Error("Unauthorized");

  await prisma.userProgress.update({
    where: { userId: session.user.id },
    data: type === "TITLE" ? { equippedTitle: null } : { equippedFrame: null },
  });

  revalidatePath("/profile");
  revalidatePath("/shop");
}