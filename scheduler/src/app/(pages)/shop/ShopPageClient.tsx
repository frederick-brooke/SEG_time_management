'use client';

import { useState, useTransition } from "react";
import { purchaseItem, equipItem, unequipItem } from "@/app/actions/shop";
import { Zap, Shield, Package, Sparkles } from "lucide-react";
import { GoldCoin } from "@/components/ui/gold-coin";
import { AVATAR_IMAGES } from "@/lib/shop-catalogue";
import LunarThemeWrapper from "@/components/layout/LunarThemeWrapper";
import { AvatarCard, FunctionalCard } from "./ShopCards";
import { ShopData, TYPE_TABS } from "./shop.types";

export default function ShopPageClient({ initialData }: { initialData: ShopData }) {
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
        showToast(`✨ ${item.name} equipped!`, "success");
      } catch (e: any) {
        showToast(e.message ?? "Equip failed", "error");
      }
    });
  };

  const handleUnequip = () => {
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

  const filtered = activeTab === "ALL" ? data.items : data.items.filter(i => i.type === activeTab);
  const ownedAvatars = data.items.filter(i => i.type === "AVATAR" && i.owned);
  const equippedAvatarItem = data.items.find(i => i.type === "AVATAR" && i.value === data.equippedAvatar);

  return (
    <LunarThemeWrapper>
      <div className="flex flex-1 flex-col p-6 pt-0">
        <div className="max-w-6xl w-full mx-auto py-8 space-y-8">

          <div className="relative bg-gray-900/80 backdrop-blur border border-white/10 rounded-3xl p-8">
            <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
              <div>
                <div className="flex items-center gap-3 mb-2">
                  <span className="text-4xl">🛸</span>
                  <h1 className="text-3xl font-black text-white tracking-tight">Cosmic Avatar Shop</h1>
                </div>
                <p className="text-white/40 text-sm max-w-md">
                  Unlock space-themed profile pictures. Earn coins by completing tasks, then equip your favourite cosmic identity.
                </p>
              </div>
              <div className="bg-white/10 backdrop-blur border border-white/20 rounded-2xl px-6 py-4 flex-shrink-0">
                <p className="text-white/40 text-xs font-bold uppercase tracking-widest">Your Balance</p>
                <div className="flex items-center gap-2 mt-1">
                  <GoldCoin size={18} />
                  <span className="text-3xl font-black text-white">{data.points.toLocaleString()}</span>
                  <span className="text-white/40 text-sm">coins</span>
                </div>
              </div>
            </div>

            {(data.xpBoostExpires || data.streakShields > 0) && (
              <div className="mt-6 flex gap-3 flex-wrap">
                {data.xpBoostExpires && new Date(data.xpBoostExpires) > new Date() && (
                  <div className="flex items-center gap-2 bg-yellow-500/20 border border-yellow-500/40 rounded-xl px-4 py-2">
                    <Zap size={16} className="text-yellow-400" />
                    <span className="text-yellow-300 text-sm font-bold">XP Boost Active</span>
                    <span className="text-yellow-500 text-xs">expires {new Date(data.xpBoostExpires).toLocaleTimeString()}</span>
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

          {equippedAvatarItem && data.equippedAvatar && (
            <div className="bg-white/[0.04] border border-yellow-500/30 rounded-2xl p-6">
              <h2 className="text-sm font-black text-white/40 uppercase tracking-widest mb-4 flex items-center gap-2">
                <Sparkles size={16} className="text-yellow-400" /> Active Avatar
              </h2>
              <div className="flex items-center gap-4">
                <div className="w-16 h-16 rounded-full overflow-hidden ring-4 ring-yellow-400/60 ring-offset-2 ring-offset-transparent">
                  <img src={AVATAR_IMAGES[data.equippedAvatar]} alt={equippedAvatarItem.name} className="w-full h-full object-cover" />
                </div>
                <div>
                  <p className="font-black text-white text-lg">{equippedAvatarItem.name}</p>
                  <p className="text-sm text-white/40">{equippedAvatarItem.description}</p>
                </div>
              </div>
            </div>
          )}

          <div className="flex gap-2 flex-wrap">
            {TYPE_TABS.map(tab => {
              const Icon = tab.icon;
              const count = tab.key === "ALL" ? data.items.length : data.items.filter(i => i.type === tab.key).length;
              return (
                <button key={tab.key} onClick={() => setActiveTab(tab.key)}
                  className={`flex items-center gap-2 px-4 py-2 rounded-xl font-bold text-sm transition-all ${
                    activeTab === tab.key
                      ? "bg-white text-gray-900 shadow-md"
                      : "bg-white/5 border border-white/10 text-white/60 hover:bg-white/10"
                  }`}>
                  <Icon size={16} />
                  {tab.label}
                  <span className={`text-xs px-1.5 py-0.5 rounded-full font-black ${
                    activeTab === tab.key ? "bg-black/10 text-gray-900" : "bg-white/5 text-white/40"
                  }`}>{count}</span>
                </button>
              );
            })}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {filtered.map(item =>
              item.type === "AVATAR" ? (
                <AvatarCard key={item.id} item={item} equippedAvatar={data.equippedAvatar}
                  onPurchase={handlePurchase} onEquip={handleEquip} onUnequip={handleUnequip} isPending={isPending} />
              ) : (
                <FunctionalCard key={item.id} item={item} onPurchase={handlePurchase} isPending={isPending} />
              )
            )}
          </div>

          {ownedAvatars.length > 0 && (
            <div className="bg-white/[0.04] border border-white/10 rounded-2xl p-6">
              <h2 className="text-sm font-black text-white/40 uppercase tracking-widest mb-4 flex items-center gap-2">
                <Package size={16} /> My Avatar Collection ({ownedAvatars.length})
              </h2>
              <div className="flex gap-3 flex-wrap">
                {ownedAvatars.map(item => (
                  <div key={item.id}
                    className={`relative w-14 h-14 rounded-full overflow-hidden ring-2 ring-offset-1 ring-offset-transparent cursor-pointer transition-transform hover:scale-110 ${
                      data.equippedAvatar === item.value ? "ring-yellow-400" : "ring-white/20"
                    }`}
                    title={item.name}
                    onClick={() => data.equippedAvatar === item.value ? handleUnequip() : handleEquip(item.id)}
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

        {toast && (
          <div className={`fixed bottom-6 right-6 z-50 flex items-center gap-3 px-5 py-3 rounded-2xl shadow-xl font-bold text-sm ${
            toast.type === "success" ? "bg-gray-900 text-white border border-white/10" : "bg-red-500 text-white"
          }`}>
            {toast.message}
          </div>
        )}
      </div>
    </LunarThemeWrapper>
  );
}
