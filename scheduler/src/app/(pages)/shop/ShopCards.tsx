'use client';

 /**
  * Client-side Avatar Shop UI.
  * Composes reusable UI primitives to render avatar cards with pricing,
  * rarity styling, and purchase/equip/unequip actions.
  */

import { CheckCircle } from "lucide-react";
import { GoldCoin } from "@/components/ui/GoldCoin";
import { AVATAR_IMAGES } from "@/lib/shop-catalogue";
import { RARITY_CONFIG, ShopItem } from "./shop.types";

/**
 * Displays the item's cost alongside the currency icon.
 * @param {number} price - The cost of the item in cosmic coins.
 */
function PriceTag({ price }: { price: number }) {
  return (
    <div className="flex items-center gap-1.5">
      <GoldCoin size={24} />
      <span className="font-black text-white text-lg">{price.toLocaleString()}</span>
      <span className="text-xs text-white/30 font-medium">coins</span>
    </div>
  );
}

/**
 * Renders the status badges at the top of the avatar card.
 * @param {any} rarityTheme - The extracted Tailwind classes for the item's rarity.
 * @param {boolean} isEquipped - True if the user currently has this avatar active.
 * @param {boolean} isOwned - True if the user has purchased this avatar.
 */
function AvatarBadges({ rarityTheme, isEquipped, isOwned }: { rarityTheme: any; isEquipped: boolean; isOwned: boolean }) {
  return (
    <div className="flex items-center justify-between">
      <span className={`text-[10px] font-black uppercase tracking-widest px-2 py-0.5 rounded-full ${rarityTheme.bg} ${rarityTheme.text}`}>
        {rarityTheme.label}
      </span>
      {isEquipped && (
        <span className="text-[10px] font-black uppercase tracking-widest px-2 py-0.5 rounded-full bg-yellow-500/20 text-yellow-400 flex items-center gap-1">
          <CheckCircle size={10} /> Equipped
        </span>
      )}
      {isOwned && !isEquipped && (
        <span className="text-[10px] font-black uppercase tracking-widest px-2 py-0.5 rounded-full bg-green-500/10 text-green-400">
          Owned
        </span>
      )}
    </div>
  );
}

/**
 * Evaluates the item's ownership state and renders the appropriate action button.
 *
 * @param {ShopItem} item - The current shop item data.
 * @param {boolean} isEquipped - True if the avatar is currently active.
 * @param {boolean} isPending - True if a network request is currently executing.
 * @param {Function} onPurchase - Handler for buying the item.
 * @param {Function} onEquip - Handler for equipping the item.
 * @param {Function} onUnequip - Handler for unequipping the item.
 */
function AvatarActionButtons({
  item, isEquipped, isPending, onPurchase, onEquip, onUnequip
}: {
  item: ShopItem;
  isEquipped: boolean;
  isPending: boolean;
  onPurchase: (id: string) => void;
  onEquip: (id: string) => void;
  onUnequip: () => void;
}) {
  if (isEquipped) {
    return (
      <button onClick={onUnequip} disabled={isPending} className="text-xs font-bold text-white/60 bg-white/5 px-3 py-1.5 rounded-lg border border-white/10 hover:bg-white/10 transition-colors disabled:opacity-50">
        Unequip
      </button>
    );
  }

  if (item.owned) {
    return (
      <button onClick={() => onEquip(item.id)} disabled={isPending} className="text-xs font-bold text-blue-400 bg-blue-500/10 px-3 py-1.5 rounded-lg border border-blue-500/30 hover:bg-blue-500/20 transition-colors disabled:opacity-50">
        Equip
      </button>
    );
  }

  return (
    <button onClick={() => onPurchase(item.id)} disabled={isPending || !item.canAfford} className={`text-xs font-bold px-4 py-1.5 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed ${item.canAfford ? "bg-white text-gray-900 hover:bg-white/90" : "bg-white/5 text-white/30 border border-white/10"}`}>
      {item.canAfford ? "Buy" : "Too expensive"}
    </button>
  );
}

/**
 * Renders a complete storefront card for an Avatar item.
 *
 * @param {ShopItem} item - The full item data payload.
 * @param {string | null} equippedAvatar - The string value of the globally active avatar.
 * @param {Function} onPurchase - Action triggered when the user attempts to buy.
 * @param {Function} onEquip - Action triggered when the user attempts to equip.
 * @param {Function} onUnequip - Action triggered when the user attempts to unequip.
 * @param {boolean} isPending - UI lock state during network transitions.
 */
export function AvatarCard({
  item, equippedAvatar, onPurchase, onEquip, onUnequip, isPending,
}: {
  item: ShopItem;
  equippedAvatar: string | null;
  onPurchase: (id: string) => void;
  onEquip: (id: string) => void;
  onUnequip: () => void;
  isPending: boolean;
}) {
  const rarity = RARITY_CONFIG[item.rarity] ?? RARITY_CONFIG.common;
  const isEquipped = equippedAvatar === item.value;
  const avatarSrc = AVATAR_IMAGES[item.value as keyof typeof AVATAR_IMAGES];

  return (
    <div className={`relative bg-white/[0.04] border-2 rounded-2xl p-5 flex flex-col gap-3 transition-all duration-200 hover:shadow-lg backdrop-blur-sm ${isEquipped ? "border-yellow-400/60 shadow-yellow-500/10" : rarity.border} ${rarity.glow}`}>
      
      <AvatarBadges rarityTheme={rarity} isEquipped={isEquipped} isOwned={item.owned} />

      <div className="flex flex-col items-center gap-2 py-2">
        <div className={`w-24 h-24 rounded-full overflow-hidden flex-shrink-0 ring-4 ring-offset-2 ring-offset-transparent ${rarity.ring} ${isEquipped ? "ring-yellow-400 shadow-lg shadow-yellow-500/20" : ""}`}>
          {avatarSrc ? (
            <img src={avatarSrc} alt={item.name} className="w-full h-full object-cover" />
          ) : (
            <div className={`w-full h-full flex items-center justify-center text-4xl ${rarity.bg}`}>{item.icon}</div>
          )}
        </div>
        <div className="text-center">
          <h3 className="font-black text-white text-base leading-tight">{item.name}</h3>
          <p className="text-xs text-white/40 mt-1 leading-relaxed max-w-[180px]">{item.description}</p>
        </div>
      </div>

      <div className="flex items-center justify-between mt-auto pt-3 border-t border-white/10">
        <PriceTag price={item.price} />
        <AvatarActionButtons item={item} isEquipped={isEquipped} isPending={isPending} onPurchase={onPurchase} onEquip={onEquip} onUnequip={onUnequip} />
      </div>
      
    </div>
  );
}