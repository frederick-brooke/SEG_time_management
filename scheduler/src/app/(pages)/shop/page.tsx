import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import { getShopData } from "@/app/actions/shop";
import ShopPageClient from "./ShopPageClient";

export default async function ShopPage() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) redirect("/login");

  const data = await getShopData();
  if (!data) redirect("/login");

  const formattedData = {
	...data,
	items: data.items.map(item => ({
		...item,
		type: item.type as "AVATAR" | "FUNCTIONAL" | "TITLE",
	})),
  };
  return <ShopPageClient initialData={formattedData} />;
}
