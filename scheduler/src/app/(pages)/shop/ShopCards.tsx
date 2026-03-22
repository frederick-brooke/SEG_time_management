'use client';

import { CheckCircle } from "lucide-react";
import { GoldCoin } from "@/components/ui/gold-coin";
import { AVATAR_IMAGES } from "@/lib/shop-catalogue";
import { RARITY_CONFIG, ShopItem } from "./shop.types";

function BuyButton({ canAfford, isPending, onClick }: { canAfford: boolean; isPending: boolean; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      disabled={isPending || !canAfford}
      className={`text-xs font-bold px-4 py-1.5 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed ${
        canAfford
          ? "bg-white text-gray-900 hover:bg-white/90"
          : "bg-white/5 text-white/30 border border-white/10 cursor-not-allowed"
      }`}
    >
      {canAfford ? "Buy" : "Too expensive"}
    </button>
  );
}

function PriceTag({ price }: { price: number }) {
  return (
    <div className="flex items-center gap-1.5">
      <GoldCoin size={24} />
      <span className="font-black text-white text-lg">{price.toLocaleString()}</span>
      <span className="text-xs text-white/30 font-medium">coins</span>
    </div>
  );
}

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
  const avatarSrc = AVATAR_IMAGES[item.value];

  return (
    <div className={`relative bg-white/[0.04] border-2 rounded-2xl p-5 flex flex-col gap-3 transition-all duration-200 hover:shadow-lg backdrop-blur-sm ${
      isEquipped ? "border-yellow-400/60 shadow-yellow-500/10" : rarity.border
    } ${rarity.glow}`}>
      <div className="flex items-center justify-between">
        <span className={`text-[10px] font-black uppercase tracking-widest px-2 py-0.5 rounded-full ${rarity.bg} ${rarity.text}`}>
          {rarity.label}
        </span>
        {isEquipped && (
          <span className="text-[10px] font-black uppercase tracking-widest px-2 py-0.5 rounded-full bg-yellow-500/20 text-yellow-400 flex items-center gap-1">
            <CheckCircle size={10} /> Equipped
          </span>
        )}
        {item.owned && !isEquipped && (
          <span className="text-[10px] font-black uppercase tracking-widest px-2 py-0.5 rounded-full bg-green-500/10 text-green-400">
            Owned
          </span>
        )}
      </div>

      <div className="flex flex-col items-center gap-2 py-2">
        <div className={`w-24 h-24 rounded-full overflow-hidden flex-shrink-0 ring-4 ring-offset-2 ring-offset-transparent ${rarity.ring} ${
          isEquipped ? "ring-yellow-400 shadow-lg shadow-yellow-500/20" : ""
        }`}>
          {avatarSrc ? (
            <img src={avatarSrc} alt={item.name} className="w-full h-full object-cover" />
          ) : (
            <div className={`w-full h-full flex items-center justify-center text-4xl ${rarity.bg}`}>
              {item.icon}
            </div>
          )}
        </div>
        <div className="text-center">
          <h3 className="font-black text-white text-base leading-tight">{item.name}</h3>
          <p className="text-xs text-white/40 mt-1 leading-relaxed max-w-[180px]">{item.description}</p>
        </div>
      </div>

      <div className="flex items-center justify-between mt-auto pt-3 border-t border-white/10">
        <PriceTag price={item.price} />
        {item.owned ? (
          isEquipped ? (
            <button onClick={onUnequip} disabled={isPending}
              className="text-xs font-bold text-white/60 bg-white/5 px-3 py-1.5 rounded-lg border border-white/10 hover:bg-white/10 transition-colors disabled:opacity-50">
              Unequip
            </button>
          ) : (
            <button onClick={() => onEquip(item.id)} disabled={isPending}
              className="text-xs font-bold text-blue-400 bg-blue-500/10 px-3 py-1.5 rounded-lg border border-blue-500/30 hover:bg-blue-500/20 transition-colors disabled:opacity-50">
              Equip
            </button>
          )
        ) : (
          <BuyButton canAfford={item.canAfford} isPending={isPending} onClick={() => onPurchase(item.id)} />
        )}
      </div>
    </div>
  );
}

export function FunctionalCard({
  item, onPurchase, isPending,
}: {
  item: ShopItem;
  onPurchase: (id: string) => void;
  isPending: boolean;
}) {
  const rarity = RARITY_CONFIG[item.rarity] ?? RARITY_CONFIG.common;

  return (
    <div className={`relative bg-white/[0.04] border-2 rounded-2xl p-5 flex flex-col gap-3 transition-all duration-200 hover:shadow-md backdrop-blur-sm ${rarity.border} ${rarity.glow}`}>
      <div className="flex items-center justify-between">
        <span className={`text-[10px] font-black uppercase tracking-widest px-2 py-0.5 rounded-full ${rarity.bg} ${rarity.text}`}>
          {rarity.label}
        </span>
        {item.owned && (
          <span className="text-[10px] font-black uppercase tracking-widest px-2 py-0.5 rounded-full bg-green-500/10 text-green-400">
            ✓ Active
          </span>
        )}
      </div>

      <div className="flex items-center gap-3">
        <div className={`w-14 h-14 rounded-2xl flex items-center justify-center text-3xl ${rarity.bg} border ${rarity.border} flex-shrink-0`}>
          {item.icon}
        </div>
        <div>
          <h3 className="font-black text-white text-base leading-tight">{item.name}</h3>
          <p className="text-xs text-white/40 mt-0.5 leading-relaxed">{item.description}</p>
        </div>
      </div>

      <div className="flex items-center justify-between mt-auto pt-2 border-t border-white/10">
        <PriceTag price={item.price} />
        <BuyButton canAfford={item.canAfford} isPending={isPending} onClick={() => onPurchase(item.id)} />
      </div>
    </div>
  );
}
