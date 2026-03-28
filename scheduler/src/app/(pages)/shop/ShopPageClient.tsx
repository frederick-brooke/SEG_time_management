"use client";

 /**
  * Client-side Shop page controller.
  * Manages shop state, purchases, equipment actions, and UI composition
  * for the Cosmic Avatar Shop feature.
  */

import { useState, useTransition, useCallback } from "react";
import { purchaseItem, equipItem, unequipItem } from "@/app/actions/shop";
import { Package } from "lucide-react";
import { GoldCoin } from "@/components/ui/gold-coin";
import { AVATAR_IMAGES } from "@/lib/shop-catalogue";
import LunarThemeWrapper from "@/components/layout/LunarThemeWrapper";
import { AvatarCard } from "./ShopCards";
import { ShopData } from "./shop.types";

/**
 * Custom hook to manage shop state and API interactions.
 * @param {ShopData} initialData - The initial server-provided shop data.
 * @returns {Object} Bound action handlers and reactive state for the view.
 */
function useShopManager(initialData: ShopData) {
  const [data, setData] = useState(initialData);
  const [isPending, startTransition] = useTransition();
  const [toast, setToast] = useState<{ message: string; type: "success" | "error" } | null>(null);

  const showToast = useCallback((message: string, type: "success" | "error") => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  }, []);

  const executeAction = useCallback((actionFn: () => Promise<void>, successMsg: string) => {
    startTransition(async () => {
      try {
        await actionFn();
        showToast(successMsg, "success");
      } catch (err: any) {
        showToast(err.message || "Action failed", "error");
      }
    });
  }, [showToast]);

  const buy = useCallback((id: string) => {
    const item = data.items.find((i) => i.id === id)!;
    executeAction(async () => {
      await purchaseItem(id);
      setData((p) => ({ ...p, points: p.points - item.price, items: p.items.map(i => i.id === id ? { ...i, owned: true } : i) }));
    }, `🎉 ${item.name} purchased!`);
  }, [data.items, executeAction]);

  const equip = useCallback((id: string) => {
    const item = data.items.find((i) => i.id === id)!;
    executeAction(async () => {
      await equipItem(id);
      setData((p) => ({ ...p, equippedAvatar: item.value }));
    }, `✨ ${item.name} equipped!`);
  }, [data.items, executeAction]);

  const unequip = useCallback(() => {
    executeAction(async () => {
      await unequipItem("AVATAR");
      setData((p) => ({ ...p, equippedAvatar: null }));
    }, "Avatar unequipped");
  }, [executeAction]);

  return { data, isPending, toast, buy, equip, unequip };
}

/**
 * Renders the page header and user's current coin balance.
 * @param {number} points - The user's available currency.
 */
const ShopHeader = ({ points }: { points: number }) => (
  <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6 bg-gray-900/80 backdrop-blur border border-white/10 rounded-3xl p-8">
    <div>
      <h1 className="text-3xl font-black text-white tracking-tight flex items-center gap-3">🛸 Cosmic Avatar Shop</h1>
      <p className="text-white/40 text-sm max-w-md mt-2">Unlock space-themed profile pictures and equip your favourite identity.</p>
    </div>
    <div className="bg-white/10 backdrop-blur border border-white/20 rounded-2xl px-6 py-4">
      <p className="text-white/40 text-xs font-bold uppercase tracking-widest">Your Balance</p>
      <div className="flex items-center gap-2 mt-1">
        <GoldCoin size={18} />
        <span className="text-3xl font-black text-white">{points.toLocaleString()}</span>
        <span className="text-white/40 text-sm">coins</span>
      </div>
    </div>
  </div>
);

/**
 * Renders the grid of available avatar items in the shop.
 * @param {any[]} items - List of strictly avatar items.
 * @param {string | null} equipped - The currently equipped avatar value.
 * @param {boolean} isPending - Transition state for UI locking.
 * @param {Function} buy - Handler for purchasing.
 * @param {Function} equip - Handler for equipping.
 * @param {Function} unequip - Handler for unequipping.
 */
const AvatarGrid = ({ items, equipped, isPending, buy, equip, unequip }: any) => (
  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 mt-8">
    {items.map((item: any) => (
      <AvatarCard key={item.id} item={item} equippedAvatar={equipped} onPurchase={buy} onEquip={equip} onUnequip={unequip} isPending={isPending} />
    ))}
  </div>
);

/**
 * Renders a clickable thumbnail for an owned avatar.
 * @param {any} item - The avatar item object.
 * @param {boolean} isEquipped - True if this avatar is currently active.
 * @param {Function} onClick - Handler for equipping/unequipping.
 */
const AvatarThumbnail = ({ item, isEquipped, onClick }: { item: any, isEquipped: boolean, onClick: () => void }) => (
  <div onClick={onClick} title={item.name} className={`relative w-14 h-14 rounded-full overflow-hidden ring-2 cursor-pointer transition-transform hover:scale-110 ${isEquipped ? "ring-yellow-400" : "ring-white/20"}`}>
    <img src={AVATAR_IMAGES[item.value as keyof typeof AVATAR_IMAGES]} alt={item.name} className="w-full h-full object-cover" />
    {isEquipped && <div className="absolute inset-0 bg-yellow-400/20 flex items-end justify-center pb-1"><span className="text-[8px] font-black text-yellow-900 bg-yellow-300 px-1 rounded">ON</span></div>}
  </div>
);

/**
 * Main Shop View.
 * @param {ShopData} initialData - Prefetched server data.
 */
export default function ShopPageClient({ initialData }: { initialData: ShopData }) {
  const { data, isPending, toast, buy, equip, unequip } = useShopManager(initialData);
  
  // Isolate only the avatars for the entire view
  const avatarItems = data.items.filter((i: any) => i.type === "AVATAR");
  const ownedAvatars = avatarItems.filter((i: any) => i.owned);

  return (
    <LunarThemeWrapper>
      <div className="flex flex-1 flex-col p-6 pt-0">
        <div className="max-w-6xl w-full mx-auto py-8 space-y-8">
          
          <ShopHeader points={data.points} />

          <AvatarGrid items={avatarItems} equipped={data.equippedAvatar} isPending={isPending} buy={buy} equip={equip} unequip={unequip} />

          {ownedAvatars.length > 0 && (
            <div className="bg-white/[0.04] border border-white/10 rounded-2xl p-6">
              <h2 className="text-sm font-black text-white/40 uppercase tracking-widest mb-4 flex items-center gap-2">
                <Package size={16} /> My Avatar Collection
              </h2>
              <div className="flex gap-3 flex-wrap">
                {ownedAvatars.map(item => (
                  <AvatarThumbnail key={item.id} item={item} isEquipped={data.equippedAvatar === item.value} onClick={() => data.equippedAvatar === item.value ? unequip() : equip(item.id)} />
                ))}
              </div>
            </div>
          )}

        </div>

        {toast && (
          <div className={`fixed bottom-6 right-6 z-50 px-5 py-3 rounded-2xl shadow-xl font-bold text-sm ${toast.type === "success" ? "bg-gray-900 text-white" : "bg-red-500 text-white"}`}>
            {toast.message}
          </div>
        )}
      </div>
    </LunarThemeWrapper>
  );
}