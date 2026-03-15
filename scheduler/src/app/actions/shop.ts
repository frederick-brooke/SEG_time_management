'use server'

import { prisma } from "@/src/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/src/lib/auth";
import { revalidatePath } from "next/cache";
import { SHOP_CATALOGUE } from "@/src/lib/shop-catalogue";

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

  const userProgress = progress ?? await prisma.userProgress.create({
    data: {
      userId: session.user.id,
      points: 0, level: 1, experience: 0, streak: 0, streakShields: 0,
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
  };
}

export async function seedShopItems() {
  for (const item of SHOP_CATALOGUE) {
    await prisma.shopItem.upsert({
      where: { name: item.name },
      create: { ...item, isActive: true },
      update: { price: item.price, description: item.description },
    });
  }
}

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

  await prisma.$transaction([
    prisma.userProgress.update({
      where: { userId: session.user.id },
      data: { points: { decrement: item.price } },
    }),
    prisma.userInventory.create({
      data: { userId: session.user.id, itemId, progressId: progress.id },
    }),
    prisma.pointTransaction.create({
      data: {
        progressId: progress.id,
        amount: -item.price,
        reason: `Purchased: ${item.name}`,
      },
    }),
  ]);

  if (item.type === "FUNCTIONAL") {
    if (item.value === "xp-boost-24h") {
      await prisma.userProgress.update({
        where: { userId: session.user.id },
        data: { xpBoostExpires: new Date(Date.now() + 24 * 60 * 60 * 1000) },
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

export async function equipItem(itemId: string) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) throw new Error("Unauthorized");

  const item = await prisma.shopItem.findUnique({ where: { id: itemId } });
  if (!item) throw new Error("Item not found");

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