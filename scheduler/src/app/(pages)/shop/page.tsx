import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { authOptions } from "@/lib/auth";
import { getShopData } from "@/app/actions/shop";
import ShopPageClient from "./ShopPageClient";
import type { ShopData, ItemRarity } from "./shop.types"; // <-- Added ItemRarity import

/**
 * Server Component orchestrating the Cosmic Avatar Shop.
 * Responsible for authenticating the request, pre-fetching user-specific shop data,
 * sanitizing the payload, and passing it to the interactive client component.
 *
 * @returns {Promise<JSX.Element>} The fully populated client view or a redirect to login.
 */
export default async function ShopPage() {
  // 1. Authenticate the request
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) {
    redirect("/login");
  }

  // 2. Fetch raw data from the database actions
  const data = await getShopData();
  if (!data) {
    redirect("/login");
  }

  // 3. Sanitize and Filter Payload
  const formattedData: ShopData = {
    points: data.points,
    equippedAvatar: data.equippedAvatar,
    items: data.items
      .filter((item) => item.type === "AVATAR")
      .map((item) => ({
        ...item,
        type: "AVATAR", 
        // Cast the Prisma string to our strict literal type
        rarity: item.rarity as ItemRarity, 
      })),
  };

  // 4. Render the client boundary
  return <ShopPageClient initialData={formattedData} />;
}