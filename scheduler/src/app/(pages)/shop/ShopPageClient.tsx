'use client';

import { useState, useTransition } from "react";
import { purchaseItem, equipItem, unequipItem } from "@/src/app/actions/shop";
import { Zap, Shield, ShoppingBag, CheckCircle, Package, User, Sparkles } from "lucide-react";
import { GoldCoin } from "components/ui/gold-coin";
import { AVATAR_IMAGES } from "@/src/lib/shop-catalogue";

// ─────────────────────────────────────────────────────────────────────────────
// RARITY CONFIG
// ─────────────────────────────────────────────────────────────────────────────
const RARITY_CONFIG: Record<string, { label: string; bg: string; text: string; border: string; glow: string; ring: string }> = {
  common:    { label: "Common",    bg: "bg-gray-100",    text: "text-gray-600",   border: "border-gray-200",   glow: "",                          ring: "ring-gray-300"    },
  rare:      { label: "Rare",      bg: "bg-blue-50",     text: "text-blue-600",   border: "border-blue-200",   glow: "hover:shadow-blue-100",     ring: "ring-blue-400"    },
  epic:      { label: "Epic",      bg: "bg-purple-50",   text: "text-purple-600", border: "border-purple-200", glow: "hover:shadow-purple-100",   ring: "ring-purple-500"  },
  legendary: { label: "Legendary", bg: "bg-yellow-50",   text: "text-yellow-600", border: "border-yellow-300", glow: "hover:shadow-yellow-100",   ring: "ring-yellow-400"  },
};

// Static star positions
const STARS = [
  { size: "2px", top: "8%",  left: "12%",  opacity: 0.6 },
  { size: "2px", top: "23%", left: "34%",  opacity: 0.4 },
  { size: "3px", top: "5%",  left: "55%",  opacity: 0.8 },
  { size: "2px", top: "41%", left: "78%",  opacity: 0.5 },
  { size: "2px", top: "67%", left: "91%",  opacity: 0.7 },
  { size: "3px", top: "14%", left: "7%",   opacity: 0.9 },
  { size: "2px", top: "82%", left: "23%",  opacity: 0.4 },
  { size: "2px", top: "31%", left: "47%",  opacity: 0.6 },
  { size: "2px", top: "56%", left: "63%",  opacity: 0.5 },
  { size: "3px", top: "73%", left: "82%",  opacity: 0.8 },
  { size: "2px", top: "19%", left: "88%",  opacity: 0.4 },
  { size: "2px", top: "90%", left: "41%",  opacity: 0.6 },
  { size: "2px", top: "46%", left: "15%",  opacity: 0.7 },
  { size: "3px", top: "3%",  left: "72%",  opacity: 0.5 },
  { size: "2px", top: "61%", left: "38%",  opacity: 0.9 },
  { size: "2px", top: "77%", left: "59%",  opacity: 0.4 },
  { size: "2px", top: "35%", left: "96%",  opacity: 0.6 },
  { size: "3px", top: "52%", left: "28%",  opacity: 0.7 },
  { size: "2px", top: "88%", left: "5%",   opacity: 0.5 },
  { size: "2px", top: "11%", left: "43%",  opacity: 0.8 },
];

const TYPE_TABS = [
  { key: "ALL",        label: "All Items",  icon: ShoppingBag },
  { key: "AVATAR",     label: "Avatars",    icon: User        },
  { key: "FUNCTIONAL", label: "Power-Ups",  icon: Zap         },
];

interface ShopItem {
  id: string;
  name: string;
  description: string;
  type: "AVATAR" | "FUNCTIONAL";
  price: number;
  value: string;
  icon: string;
  rarity: string;
  owned: boolean;
  canAfford: boolean;
}

interface ShopPageClientProps {
  initialData: {
    items: ShopItem[];
    points: number;
    equippedAvatar: string | null;
    xpBoostExpires: string | Date | null;
    streakShields: number;
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// AVATAR CARD
// ─────────────────────────────────────────────────────────────────────────────
function AvatarCard({
  item,
  equippedAvatar,
  onPurchase,
  onEquip,
  onUnequip,
  isPending,
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
    <div className={`
      relative bg-white border-2 rounded-2xl p-5 flex flex-col gap-3 transition-all duration-200 shadow-sm hover:shadow-lg
      ${isEquipped ? "border-yellow-400 shadow-yellow-100" : rarity.border}
      ${rarity.glow}
    `}>
      {/* Rarity + status badges */}
      <div className="flex items-center justify-between">
        <span className={`text-[10px] font-black uppercase tracking-widest px-2 py-0.5 rounded-full ${rarity.bg} ${rarity.text}`}>
          {rarity.label}
        </span>
        {isEquipped && (
          <span className="text-[10px] font-black uppercase tracking-widest px-2 py-0.5 rounded-full bg-yellow-100 text-yellow-700 flex items-center gap-1">
            <CheckCircle size={10} /> Equipped
          </span>
        )}
        {item.owned && !isEquipped && (
          <span className="text-[10px] font-black uppercase tracking-widest px-2 py-0.5 rounded-full bg-green-50 text-green-600">
            Owned
          </span>
        )}
      </div>

      {/* Avatar preview — large and centred */}
      <div className="flex flex-col items-center gap-2 py-2">
        <div className={`
          w-24 h-24 rounded-full overflow-hidden flex-shrink-0
          ring-4 ring-offset-2 ${rarity.ring}
          ${isEquipped ? "ring-yellow-400 shadow-lg shadow-yellow-200" : ""}
        `}>
          {avatarSrc ? (
            <img src={avatarSrc} alt={item.name} className="w-full h-full object-cover" />
          ) : (
            <div className={`w-full h-full flex items-center justify-center text-4xl ${rarity.bg}`}>
              {item.icon}
            </div>
          )}
        </div>
        <div className="text-center">
          <h3 className="font-black text-gray-900 text-base leading-tight">{item.name}</h3>
          <p className="text-xs text-gray-500 mt-1 leading-relaxed max-w-[180px]">{item.description}</p>
        </div>
      </div>

      {/* Price + action */}
      <div className="flex items-center justify-between mt-auto pt-3 border-t border-gray-100">
        <div className="flex items-center gap-1.5">
          <GoldCoin size={24} />
          <span className="font-black text-gray-900 text-lg">{item.price.toLocaleString()}</span>
          <span className="text-xs text-gray-400 font-medium">coins</span>
        </div>

        {item.owned ? (
          isEquipped ? (
            <button
              onClick={onUnequip}
              disabled={isPending}
              className="text-xs font-bold text-gray-600 bg-gray-100 px-3 py-1.5 rounded-lg border border-gray-200 hover:bg-gray-200 transition-colors disabled:opacity-50"
            >
              Unequip
            </button>
          ) : (
            <button
              onClick={() => onEquip(item.id)}
              disabled={isPending}
              className="text-xs font-bold text-blue-700 bg-blue-50 px-3 py-1.5 rounded-lg border border-blue-200 hover:bg-blue-100 transition-colors disabled:opacity-50"
            >
              Equip
            </button>
          )
        ) : (
          <button
            onClick={() => onPurchase(item.id)}
            disabled={isPending || !item.canAfford}
            className={`text-xs font-bold px-4 py-1.5 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed ${
              item.canAfford
                ? "bg-black text-white hover:bg-gray-800"
                : "bg-gray-100 text-gray-400 border border-gray-200 cursor-not-allowed"
            }`}
          >
            {item.canAfford ? "Buy" : "Too expensive"}
          </button>
        )}
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// FUNCTIONAL ITEM CARD (power-ups)
// ─────────────────────────────────────────────────────────────────────────────
function FunctionalCard({
  item,
  onPurchase,
  isPending,
}: {
  item: ShopItem;
  onPurchase: (id: string) => void;
  isPending: boolean;
}) {
  const rarity = RARITY_CONFIG[item.rarity] ?? RARITY_CONFIG.common;

  return (
    <div className={`
      relative bg-white border-2 rounded-2xl p-5 flex flex-col gap-3 transition-all duration-200 shadow-sm hover:shadow-md
      ${rarity.border} ${rarity.glow}
    `}>
      <div className="flex items-center justify-between">
        <span className={`text-[10px] font-black uppercase tracking-widest px-2 py-0.5 rounded-full ${rarity.bg} ${rarity.text}`}>
          {rarity.label}
        </span>
        {item.owned && (
          <span className="text-[10px] font-black uppercase tracking-widest px-2 py-0.5 rounded-full bg-green-50 text-green-600">
            ✓ Active
          </span>
        )}
      </div>

      <div className="flex items-center gap-3">
        <div className={`w-14 h-14 rounded-2xl flex items-center justify-center text-3xl ${rarity.bg} border ${rarity.border} flex-shrink-0`}>
          {item.icon}
        </div>
        <div>
          <h3 className="font-black text-gray-900 text-base leading-tight">{item.name}</h3>
          <p className="text-xs text-gray-500 mt-0.5 leading-relaxed">{item.description}</p>
        </div>
      </div>

      <div className="flex items-center justify-between mt-auto pt-2 border-t border-gray-100">
        <div className="flex items-center gap-1.5">
          <GoldCoin size={24} />
          <span className="font-black text-gray-900 text-lg">{item.price.toLocaleString()}</span>
          <span className="text-xs text-gray-400 font-medium">coins</span>
        </div>
        <button
          onClick={() => onPurchase(item.id)}
          disabled={isPending || !item.canAfford}
          className={`text-xs font-bold px-4 py-1.5 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed ${
            item.canAfford
              ? "bg-black text-white hover:bg-gray-800"
              : "bg-gray-100 text-gray-400 border border-gray-200 cursor-not-allowed"
          }`}
        >
          {item.canAfford ? "Buy" : "Too expensive"}
        </button>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// MAIN SHOP PAGE
// ─────────────────────────────────────────────────────────────────────────────
export default function ShopPageClient({ initialData }: ShopPageClientProps) {
  const [data, setData] = useState(initialData);
  const [activeTab, setActiveTab] = useState("ALL");
  const [isPending, startTransition] = useTransition();
  const [toast, setToast] = useState<{ message: string; type: "success" | "error" } | null>(null);

  const showToast = (message: string, type: "success" | "error") => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  };

  const handlePurchase = (itemId: string) => {
    startTransition(async () => {
      try {
        await purchaseItem(itemId);
        const item = data.items.find(i => i.id === itemId)!;
        setData(prev => ({
          ...prev,
          points: prev.points - item.price,
          items: prev.items.map(i => i.id === itemId ? { ...i, owned: true } : i),
        }));
        showToast(`🎉 ${item.name} purchased!`, "success");
      } catch (e: any) {
        showToast(e.message ?? "Purchase failed", "error");
      }
    });
  };

  const handleEquip = (itemId: string) => {
    startTransition(async () => {
      try {
        await equipItem(itemId);
        const item = data.items.find(i => i.id === itemId)!;
        setData(prev => ({
          ...prev,
          equippedAvatar: item.type === "AVATAR" ? item.value : prev.equippedAvatar,
        }));
        showToast(`✨ ${item.name} equipped as your avatar!`, "success");
      } catch (e: any) {
        showToast(e.message ?? "Equip failed", "error");
      }
    });
  };

  const handleUnequipAvatar = () => {
    startTransition(async () => {
      try {
        await unequipItem("AVATAR");
        setData(prev => ({ ...prev, equippedAvatar: null }));
        showToast("Avatar unequipped", "success");
      } catch (e: any) {
        showToast(e.message ?? "Failed", "error");
      }
    });
  };

  const filtered = activeTab === "ALL"
    ? data.items
    : data.items.filter(i => i.type === activeTab);

  const ownedAvatars = data.items.filter(i => i.type === "AVATAR" && i.owned);
  const equippedAvatarItem = data.items.find(i => i.type === "AVATAR" && i.value === data.equippedAvatar);

  return (
    <div className="flex flex-1 flex-col p-6 pt-0">
      <div className="max-w-6xl w-full mx-auto py-8 space-y-8">

        {/* ── HERO BANNER ── */}
        <div className="relative bg-gray-900 rounded-3xl p-8 overflow-hidden">
          <div className="absolute inset-0 overflow-hidden rounded-3xl">
            {STARS.map((star, i) => (
              <div
                key={i}
                className="absolute rounded-full bg-white"
                style={{ width: star.size, height: star.size, top: star.top, left: star.left, opacity: star.opacity }}
              />
            ))}
          </div>

          <div className="relative flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
            <div>
              <div className="flex items-center gap-3 mb-2">
                <span className="text-4xl">🛸</span>
                <h1 className="text-3xl font-black text-white tracking-tight">Cosmic Avatar Shop</h1>
              </div>
              <p className="text-gray-400 text-sm max-w-md">
                Unlock space-themed profile pictures that appear everywhere on your profile.
                Earn coins by completing tasks, then equip your favourite cosmic identity.
              </p>
            </div>

            {/* Balance */}
            <div className="bg-white/10 backdrop-blur border border-white/20 rounded-2xl px-6 py-4 flex items-center gap-4 flex-shrink-0">
              <div>
                <p className="text-gray-400 text-xs font-bold uppercase tracking-widest">Your Balance</p>
                <div className="flex items-center gap-2 mt-1">
                  <GoldCoin size={18} />
                  <span className="text-3xl font-black text-white">{data.points.toLocaleString()}</span>
                  <span className="text-gray-400 text-sm">coins</span>
                </div>
              </div>
            </div>
          </div>

          {/* Active boosts */}
          {(data.xpBoostExpires || data.streakShields > 0) && (
            <div className="relative mt-6 flex gap-3 flex-wrap">
              {data.xpBoostExpires && new Date(data.xpBoostExpires) > new Date() && (
                <div className="flex items-center gap-2 bg-yellow-500/20 border border-yellow-500/40 rounded-xl px-4 py-2">
                  <Zap size={16} className="text-yellow-400" />
                  <span className="text-yellow-300 text-sm font-bold">XP Boost Active</span>
                  <span className="text-yellow-500 text-xs">
                    expires {new Date(data.xpBoostExpires).toLocaleTimeString()}
                  </span>
                </div>
              )}
              {data.streakShields > 0 && (
                <div className="flex items-center gap-2 bg-blue-500/20 border border-blue-500/40 rounded-xl px-4 py-2">
                  <Shield size={16} className="text-blue-400" />
                  <span className="text-blue-300 text-sm font-bold">{data.streakShields}x Streak Shield</span>
                </div>
              )}
            </div>
          )}
        </div>

        {/* ── EQUIPPED AVATAR PREVIEW ── */}
        {equippedAvatarItem && data.equippedAvatar && (
          <div className="bg-white border border-yellow-200 rounded-2xl p-6 shadow-sm">
            <h2 className="text-sm font-black text-gray-500 uppercase tracking-widest mb-4 flex items-center gap-2">
              <Sparkles size={16} className="text-yellow-500" /> Active Avatar
            </h2>
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 rounded-full overflow-hidden ring-4 ring-yellow-400 ring-offset-2 shadow-lg shadow-yellow-100">
                <img
                  src={AVATAR_IMAGES[data.equippedAvatar]}
                  alt={equippedAvatarItem.name}
                  className="w-full h-full object-cover"
                />
              </div>
              <div>
                <p className="font-black text-gray-900 text-lg">{equippedAvatarItem.name}</p>
                <p className="text-sm text-gray-500">{equippedAvatarItem.description}</p>
              </div>
            </div>
          </div>
        )}

        {/* ── TABS ── */}
        <div className="flex gap-2 flex-wrap">
          {TYPE_TABS.map(tab => {
            const Icon = tab.icon;
            const count = tab.key === "ALL"
              ? data.items.length
              : data.items.filter(i => i.type === tab.key).length;
            return (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key)}
                className={`flex items-center gap-2 px-4 py-2 rounded-xl font-bold text-sm transition-all ${
                  activeTab === tab.key
                    ? "bg-gray-900 text-white shadow-md"
                    : "bg-white border border-gray-200 text-gray-600 hover:bg-gray-50"
                }`}
              >
                <Icon size={16} />
                {tab.label}
                <span className={`text-xs px-1.5 py-0.5 rounded-full font-black ${
                  activeTab === tab.key ? "bg-white/20 text-white" : "bg-gray-100 text-gray-500"
                }`}>{count}</span>
              </button>
            );
          })}
        </div>

        {/* ── ITEMS GRID ── */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {filtered.map(item =>
            item.type === "AVATAR" ? (
              <AvatarCard
                key={item.id}
                item={item}
                equippedAvatar={data.equippedAvatar}
                onPurchase={handlePurchase}
                onEquip={handleEquip}
                onUnequip={handleUnequipAvatar}
                isPending={isPending}
              />
            ) : (
              <FunctionalCard
                key={item.id}
                item={item}
                onPurchase={handlePurchase}
                isPending={isPending}
              />
            )
          )}
        </div>

        {/* ── OWNED AVATARS ── */}
        {ownedAvatars.length > 0 && (
          <div className="bg-white border border-gray-200 rounded-2xl p-6 shadow-sm">
            <h2 className="text-sm font-black text-gray-500 uppercase tracking-widest mb-4 flex items-center gap-2">
              <Package size={16} /> My Avatar Collection ({ownedAvatars.length})
            </h2>
            <div className="flex gap-3 flex-wrap">
              {ownedAvatars.map(item => (
                <div
                  key={item.id}
                  className={`relative w-14 h-14 rounded-full overflow-hidden ring-2 ring-offset-1 cursor-pointer transition-transform hover:scale-110 ${
                    data.equippedAvatar === item.value
                      ? "ring-yellow-400 shadow-md shadow-yellow-200"
                      : "ring-gray-300"
                  }`}
                  title={item.name}
                  onClick={() => data.equippedAvatar === item.value ? handleUnequipAvatar() : handleEquip(item.id)}
                >
                  <img src={AVATAR_IMAGES[item.value]} alt={item.name} className="w-full h-full object-cover" />
                  {data.equippedAvatar === item.value && (
                    <div className="absolute inset-0 bg-yellow-400/20 flex items-end justify-center pb-1">
                      <span className="text-[8px] font-black text-yellow-900 bg-yellow-300 px-1 rounded">ON</span>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

      </div>

      {/* ── TOAST ── */}
      {toast && (
        <div className={`fixed bottom-6 right-6 z-50 flex items-center gap-3 px-5 py-3 rounded-2xl shadow-xl font-bold text-sm transition-all ${
          toast.type === "success" ? "bg-gray-900 text-white" : "bg-red-500 text-white"
        }`}>
          {toast.message}
        </div>
      )}
    </div>
  );
}
