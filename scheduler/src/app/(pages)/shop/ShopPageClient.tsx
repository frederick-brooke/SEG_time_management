'use client';

import { useState, useTransition } from "react";
import { purchaseItem, equipItem, unequipItem } from "@/src/app/actions/shop";
import { AppSidebar } from "components/app-sidebar";
import { SidebarInset, SidebarProvider } from "components/ui/sidebar";
import { SiteHeader } from "components/site-header";
import { Zap, Shield, Crown, Sparkles, ShoppingBag, CheckCircle, Package } from "lucide-react";

// ─────────────────────────────────────────────────────────────────────────────
// FRAME STYLES — maps frame `value` → Tailwind classes applied to avatar border
// ─────────────────────────────────────────────────────────────────────────────
export const FRAME_STYLES: Record<string, string> = {
  "solar-flare":   "ring-4 ring-yellow-400 ring-offset-2 shadow-[0_0_20px_4px_rgba(250,204,21,0.6)]",
  "nebula-glow":   "ring-4 ring-purple-500 ring-offset-2 shadow-[0_0_20px_4px_rgba(168,85,247,0.6)]",
  "aurora-ring":   "ring-4 ring-offset-2 shadow-lg",   // animated — see AuroraFrame below
  "event-horizon": "ring-4 ring-gray-900 ring-offset-2 shadow-[0_0_30px_8px_rgba(0,0,0,0.9)]",
};

// ─────────────────────────────────────────────────────────────────────────────
// RARITY CONFIG
// ─────────────────────────────────────────────────────────────────────────────
const RARITY_CONFIG: Record<string, { label: string; bg: string; text: string; border: string; glow: string }> = {
  common:    { label: "Common",    bg: "bg-gray-100",    text: "text-gray-600",   border: "border-gray-200",   glow: "" },
  rare:      { label: "Rare",      bg: "bg-blue-50",     text: "text-blue-600",   border: "border-blue-200",   glow: "hover:shadow-blue-100" },
  epic:      { label: "Epic",      bg: "bg-purple-50",   text: "text-purple-600", border: "border-purple-200", glow: "hover:shadow-purple-100" },
  legendary: { label: "Legendary", bg: "bg-yellow-50",   text: "text-yellow-600", border: "border-yellow-300", glow: "hover:shadow-yellow-100" },
};

const TYPE_TABS = [
  { key: "ALL",        label: "All Items",  icon: ShoppingBag },
  { key: "TITLE",      label: "Titles",     icon: Crown },
  { key: "FRAME",      label: "Frames",     icon: Sparkles },
  { key: "FUNCTIONAL", label: "Power-Ups",  icon: Zap },
];

interface ShopItem {
  id: string;
  name: string;
  description: string;
  type: "TITLE" | "FRAME" | "FUNCTIONAL";
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
    equippedTitle: string | null;
    equippedFrame: string | null;
    xpBoostExpires: string | null;
    streakShields: number;
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// ITEM CARD
// ─────────────────────────────────────────────────────────────────────────────
function ItemCard({
  item,
  equippedTitle,
  equippedFrame,
  onPurchase,
  onEquip,
  onUnequip,
  isPending,
}: {
  item: ShopItem;
  equippedTitle: string | null;
  equippedFrame: string | null;
  onPurchase: (id: string) => void;
  onEquip: (id: string) => void;
  onUnequip: (type: "TITLE" | "FRAME") => void;
  isPending: boolean;
}) {
  const rarity = RARITY_CONFIG[item.rarity] ?? RARITY_CONFIG.common;
  const isEquipped =
    (item.type === "TITLE" && equippedTitle === item.value) ||
    (item.type === "FRAME" && equippedFrame === item.value);

  return (
    <div className={`
      relative bg-white border-2 rounded-2xl p-5 flex flex-col gap-3 transition-all duration-200 shadow-sm hover:shadow-md
      ${isEquipped ? "border-yellow-400 shadow-yellow-100" : rarity.border}
      ${rarity.glow}
    `}>
      {/* Rarity badge */}
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

      {/* Icon + name */}
      <div className="flex items-center gap-3">
        <div className={`w-14 h-14 rounded-2xl flex items-center justify-center text-3xl ${rarity.bg} border ${rarity.border} flex-shrink-0`}>
          {item.icon}
        </div>
        <div>
          <h3 className="font-black text-gray-900 text-base leading-tight">{item.name}</h3>
          <p className="text-xs text-gray-500 mt-0.5 leading-relaxed">{item.description}</p>
        </div>
      </div>

      {/* Preview for titles */}
      {item.type === "TITLE" && (
        <div className="bg-gray-50 rounded-xl px-3 py-2 border border-gray-100">
          <p className="text-[10px] text-gray-400 uppercase font-bold tracking-wider mb-1">Preview</p>
          <p className="text-sm font-bold text-gray-700">{item.icon} {item.value}</p>
        </div>
      )}

      {/* Preview for frames */}
      {item.type === "FRAME" && (
        <div className="bg-gray-50 rounded-xl px-3 py-2 border border-gray-100 flex items-center gap-3">
          <p className="text-[10px] text-gray-400 uppercase font-bold tracking-wider">Preview</p>
          <div className={`w-8 h-8 rounded-full bg-gray-300 ${FRAME_STYLES[item.value] ?? ""}`} />
        </div>
      )}

      {/* Price + action */}
      <div className="flex items-center justify-between mt-auto pt-2 border-t border-gray-100">
        <div className="flex items-center gap-1.5">
          <span className="text-lg">⭐</span>
          <span className="font-black text-gray-900 text-lg">{item.price.toLocaleString()}</span>
          <span className="text-xs text-gray-400 font-medium">pts</span>
        </div>

        {item.owned ? (
          item.type === "FUNCTIONAL" ? (
            <span className="text-xs font-bold text-green-600 bg-green-50 px-3 py-1.5 rounded-lg border border-green-200">
              ✓ Active
            </span>
          ) : isEquipped ? (
            <button
              onClick={() => onUnequip(item.type as "TITLE" | "FRAME")}
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
          items: prev.items.map(i =>
            i.id === itemId ? { ...i, owned: true } : i
          ),
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
          equippedTitle: item.type === "TITLE" ? item.value : prev.equippedTitle,
          equippedFrame: item.type === "FRAME" ? item.value : prev.equippedFrame,
        }));
        showToast(`✨ ${item.name} equipped!`, "success");
      } catch (e: any) {
        showToast(e.message ?? "Equip failed", "error");
      }
    });
  };

  const handleUnequip = (type: "TITLE" | "FRAME") => {
    startTransition(async () => {
      try {
        await unequipItem(type);
        setData(prev => ({
          ...prev,
          equippedTitle: type === "TITLE" ? null : prev.equippedTitle,
          equippedFrame: type === "FRAME" ? null : prev.equippedFrame,
        }));
        showToast("Item unequipped", "success");
      } catch (e: any) {
        showToast(e.message ?? "Failed", "error");
      }
    });
  };

  const filtered = activeTab === "ALL"
    ? data.items
    : data.items.filter(i => i.type === activeTab);

  const ownedItems = data.items.filter(i => i.owned);

  return (
    <SidebarProvider
      defaultOpen={true}
      style={{
        "--sidebar-width": "calc(var(--spacing) * 72)",
        "--header-height": "calc(var(--spacing) * 12)",
      } as React.CSSProperties}
    >
      <AppSidebar variant="inset" />
      <SidebarInset>
        <SiteHeader />

        <div className="flex flex-1 flex-col p-6 pt-0">
          <div className="max-w-6xl w-full mx-auto py-8 space-y-8">

            {/* ── HERO BANNER ── */}
            <div className="relative bg-gray-900 rounded-3xl p-8 overflow-hidden">
              {/* Star field background */}
              <div className="absolute inset-0 overflow-hidden rounded-3xl">
                {[...Array(40)].map((_, i) => (
                  <div
                    key={i}
                    className="absolute rounded-full bg-white"
                    style={{
                      width: Math.random() > 0.8 ? "3px" : "2px",
                      height: Math.random() > 0.8 ? "3px" : "2px",
                      top: `${Math.random() * 100}%`,
                      left: `${Math.random() * 100}%`,
                      opacity: Math.random() * 0.7 + 0.3,
                    }}
                  />
                ))}
              </div>

              <div className="relative flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
                <div>
                  <div className="flex items-center gap-3 mb-2">
                    <span className="text-4xl">🛸</span>
                    <h1 className="text-3xl font-black text-white tracking-tight">
                      Cosmic Shop
                    </h1>
                  </div>
                  <p className="text-gray-400 text-sm max-w-md">
                    Spend your hard-earned points on titles, avatar frames, and power-ups.
                    Complete tasks to earn more.
                  </p>
                </div>

                {/* Points balance */}
                <div className="bg-white/10 backdrop-blur border border-white/20 rounded-2xl px-6 py-4 flex items-center gap-4 flex-shrink-0">
                  <div>
                    <p className="text-gray-400 text-xs font-bold uppercase tracking-widest">Your Balance</p>
                    <div className="flex items-center gap-2 mt-1">
                      <span className="text-2xl">⭐</span>
                      <span className="text-3xl font-black text-white">{data.points.toLocaleString()}</span>
                      <span className="text-gray-400 text-sm">pts</span>
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
                      <span className="text-blue-300 text-sm font-bold">
                        {data.streakShields}x Streak Shield
                      </span>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* ── EQUIPPED LOADOUT ── */}
            {(data.equippedTitle || data.equippedFrame) && (
              <div className="bg-white border border-yellow-200 rounded-2xl p-6 shadow-sm">
                <h2 className="text-sm font-black text-gray-500 uppercase tracking-widest mb-4 flex items-center gap-2">
                  <Package size={16} /> Current Loadout
                </h2>
                <div className="flex gap-4 flex-wrap">
                  {data.equippedTitle && (
                    <div className="flex items-center gap-3 bg-yellow-50 border border-yellow-200 rounded-xl px-4 py-3">
                      <Crown size={18} className="text-yellow-600" />
                      <div>
                        <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Title</p>
                        <p className="font-bold text-gray-900">{data.equippedTitle}</p>
                      </div>
                    </div>
                  )}
                  {data.equippedFrame && (
                    <div className="flex items-center gap-3 bg-purple-50 border border-purple-200 rounded-xl px-4 py-3">
                      <Sparkles size={18} className="text-purple-600" />
                      <div>
                        <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Frame</p>
                        <p className="font-bold text-gray-900 capitalize">{data.equippedFrame.replace("-", " ")}</p>
                      </div>
                    </div>
                  )}
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
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {filtered.map(item => (
                <ItemCard
                  key={item.id}
                  item={item}
                  equippedTitle={data.equippedTitle}
                  equippedFrame={data.equippedFrame}
                  onPurchase={handlePurchase}
                  onEquip={handleEquip}
                  onUnequip={handleUnequip}
                  isPending={isPending}
                />
              ))}
            </div>

            {/* ── OWNED ITEMS ── */}
            {ownedItems.length > 0 && (
              <div className="bg-white border border-gray-200 rounded-2xl p-6 shadow-sm">
                <h2 className="text-sm font-black text-gray-500 uppercase tracking-widest mb-4 flex items-center gap-2">
                  <Package size={16} /> My Inventory ({ownedItems.length})
                </h2>
                <div className="flex gap-2 flex-wrap">
                  {ownedItems.map(item => (
                    <div
                      key={item.id}
                      className="flex items-center gap-2 bg-gray-50 border border-gray-200 rounded-xl px-3 py-2"
                    >
                      <span>{item.icon}</span>
                      <span className="text-sm font-bold text-gray-700">{item.name}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

          </div>
        </div>

        {/* ── TOAST ── */}
        {toast && (
          <div className={`fixed bottom-6 right-6 z-50 flex items-center gap-3 px-5 py-3 rounded-2xl shadow-xl font-bold text-sm transition-all ${
            toast.type === "success"
              ? "bg-gray-900 text-white"
              : "bg-red-500 text-white"
          }`}>
            {toast.message}
          </div>
        )}

      </SidebarInset>
    </SidebarProvider>
  );
}
