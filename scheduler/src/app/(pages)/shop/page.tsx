/**
 * Server-side Shop page.
 * Authenticates the user, fetches shop data, sanitizes and formats
 * avatar items, and passes the prepared data to the client shop UI.
 */

import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { authOptions } from "@/lib/auth";
import { getShopData } from "@/app/actions/shop";
import ShopPageClient from "./ShopPageClient";
import StarBackground from "@/components/StarBackground";
import type { ShopData, ItemRarity } from "./shop.types";

/**
 * Server Component orchestrating the Cosmic Avatar Shop.
 * Responsible for authenticating the request, pre-fetching user-specific shop data,
 * sanitizing the payload, and passing it to the interactive client component.
 *
 * @returns {Promise<JSX.Element>} The fully populated client view or a redirect to login.
 */
export default async function ShopPage() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) {
    redirect("/login");
  }

  const data = await getShopData();
  if (!data) {
    redirect("/login");
  }

  const formattedData: ShopData = {
    points: data.points,
    equippedAvatar: data.equippedAvatar,
    items: data.items
      .filter((item) => item.type === "AVATAR")
      .map((item) => ({
        ...item,
        type: "AVATAR",
        rarity: item.rarity as ItemRarity,
      })),
  };

  return <ShopPageClient initialData={formattedData} />;
}
