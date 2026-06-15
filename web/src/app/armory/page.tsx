"use client";

import React, { useEffect, useState } from "react";
import { useGameStore } from "@/lib/game-store";
import { Card, Badge } from "@/components/ui/card";
import { featuredAssetPaths, getItem, getItemImagePath, shopInventory } from "@/lib/game-data";
import { Swords, Shield, ShoppingBag, Eye, RefreshCw, ShieldAlert } from "lucide-react";
import { ArmoryInteriorPlaceholder } from "@/components/game/placeholder-art";
import { UiAssetIcon } from "@/components/game/ui-asset-icon";
import { playCoinSound, playDefeatSound, playPageSound } from "@/lib/sounds";

import { PageTransition } from "@/components/game/page-transition";

export default function ArmoryPage() {
  const { soldier, buyItem, sellItem, payTownBribe } = useGameStore();
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [selectedItemId, setSelectedItemId] = useState<string>("rusty_pike");
  const [notification, setNotification] = useState<{ text: string; isError: boolean } | null>(null);
  const [mounted, setMounted] = useState(false);
  const [refreshSeconds, setRefreshSeconds] = useState(120);

  useEffect(() => {
    setMounted(true);
    
    // Refresh timer simulation
    const interval = setInterval(() => {
      setRefreshSeconds((prev) => (prev > 0 ? prev - 1 : 120));
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  if (!mounted) {
    return <div className="text-center font-cinzel py-12 text-gold animate-pulse">Cargando armería...</div>;
  }

  if (soldier.banMissionsLeft > 0) {
    return (
      <PageTransition>
        <div className="max-w-xl mx-auto text-center space-y-6 py-12">
          <Card title="¡ACCESO PROHIBIDO!">
            <div className="p-6 space-y-6 text-center">
              <div className="w-20 h-20 bg-danger/10 border border-danger/30 rounded-full flex items-center justify-center mx-auto animate-pulse">
                <ShieldAlert className="w-10 h-10 text-danger" />
              </div>
              <div className="space-y-2">
                <h3 className="font-cinzel text-xl font-bold text-gold uppercase">Expulsado del Pueblo</h3>
                <p className="text-xs text-text-muted font-mono uppercase">
                  Falta de disciplina y desmanes en la comarca
                </p>
              </div>
              <p className="text-sm font-serif italic text-text-muted leading-relaxed">
                "¡Fuera de aquí, ralea del Tercio! Los mercaderes han cerrado sus tiendas y el cirujano ha trancado su puerta. No toleramos a ladrones ni saqueadores en nuestras murallas. Volved al camino y no regreséis hasta que hayáis cumplido vuestro castigo militar."
              </p>
              <div className="p-3 bg-stone-900 border border-iron rounded-xs text-xs font-mono">
                <p>Quedan <strong className="text-danger">{soldier.banMissionsLeft}</strong> misiones de destierro para expiar tus faltas.</p>
              </div>
              <div className="pt-4 border-t border-iron/50 space-y-3">
                <p className="text-[10px] text-text-muted font-sans">
                  Puedes sobornar al alguacil del pueblo para que haga la vista gorda y te permita volver de inmediato.
                </p>
                <button
                  onClick={() => {
                    const res = payTownBribe();
                    if (res.ok) {
                      playCoinSound();
                    } else {
                      playDefeatSound();
                    }
                  }}
                  disabled={soldier.coins < 50}
                  className={`px-6 py-2.5 text-xs font-mono font-bold uppercase tracking-wider border rounded-xs transition-all cursor-pointer ${
                    soldier.coins >= 50
                      ? "bg-gold/15 border-gold text-gold hover:bg-gold/25"
                      : "bg-stone-900 border-iron text-muted cursor-not-allowed"
                  }`}
                >
                  Sobornar al Alguacil (50 doblones)
                </button>
              </div>
            </div>
          </Card>
        </div>
      </PageTransition>
    );
  }

  const handleBuy = (itemId: string) => {
    const res = buyItem(itemId);
    if (res.ok) {
      playCoinSound();
      setNotification({ text: `¡Éxito! ${res.message}`, isError: false });
    } else {
      playDefeatSound();
      setNotification({ text: `Error: ${res.message}`, isError: true });
    }
    setTimeout(() => setNotification(null), 3000);
  };


  const shopItems = shopInventory;

  // Filter items
  const filteredItems = shopItems.filter((shopItem) => {
    const item = getItem(shopItem.itemId);
    if (!item) return false;
    if (categoryFilter === "all") return true;
    if (categoryFilter === "weapons") return ["pike", "sword", "firearm"].includes(item.category);
    if (categoryFilter === "armor") return ["armor", "helmet", "boots"].includes(item.category);
    if (categoryFilter === "consumables") return ["medicine", "food"].includes(item.category);
    return false;
  });

  const selectedItemDef = getItem(selectedItemId);
  const selectedShopItem = shopItems.find((s) => s.itemId === selectedItemId);

  // Compare stats
  const getComparison = (item: any) => {
    if (!item) return [];
    return Object.entries(item.effects).map(([stat, val]) => {
      const current = soldier.stats[stat as keyof typeof soldier.stats] ?? 0;
      return {
        stat,
        val: Number(val),
        current,
      };
    });
  };

  const comparisons = selectedItemDef ? getComparison(selectedItemDef) : [];

  return (
    <PageTransition>
      <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center border-b border-iron pb-3">
        <div>
          <h1 className="font-cinzel text-3xl font-extrabold tracking-wider text-gold">ARMERÍA DEL TERCIO</h1>
          <p className="text-xs text-text-muted">Adquiere armas y provisiones autorizadas por el sargento de suministros</p>
        </div>
        <div className="flex items-center gap-2 text-[10px] font-mono text-text-muted bg-stone-900 border border-iron px-2.5 py-1">
          <RefreshCw className="w-3.5 h-3.5 animate-spin" />
          <span>Próxima Suministro: {Math.floor(refreshSeconds / 60)}:{(refreshSeconds % 60).toString().padStart(2, "0")}</span>
        </div>
      </div>

      {/* Alert Notification */}
      {notification && (
        <div 
          className={`p-3 text-xs font-mono border rounded-xs transition-all ${
            notification.isError 
              ? "bg-danger/20 border-danger text-danger" 
              : "bg-success/20 border-success text-success"
          }`}
        >
          {notification.text}
        </div>
      )}

      {/* Armory Layout */}
      <div className="grid gap-6 lg:grid-cols-[2.2fr_1.1fr]">
        {/* Left: Store items */}
        <div className="space-y-4">
          <Card title="Pertrechos en Venta">
            {/* Filters */}
            <div className="flex border-b border-iron/40 mb-4 text-xs font-mono gap-1">
              {["all", "weapons", "armor", "consumables"].map((cat) => (
                <button
                  key={cat}
                  onClick={() => { playPageSound(); setCategoryFilter(cat); }}
                  className={`px-3 py-1.5 cursor-pointer uppercase transition-all border-b-2 ${
                    categoryFilter === cat 
                      ? "border-gold text-gold font-bold" 
                      : "border-transparent text-text-muted hover:text-text"
                  }`}
                >
                  {cat === "all" && "Todo"}
                  {cat === "weapons" && "Armas"}
                  {cat === "armor" && "Defensas"}
                  {cat === "consumables" && "Provisiones"}
                </button>
              ))}
            </div>

            {/* Shop Table */}
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs font-sans">
                <thead>
                  <tr className="border-b border-iron/60 text-text-muted text-[10px] uppercase tracking-wider font-mono">
                    <th className="py-2.5 px-2">Objeto</th>
                    <th className="py-2.5 px-2">Efectos</th>
                    <th className="py-2.5 px-2">Disponibilidad</th>
                    <th className="py-2.5 px-2 text-right">Coste</th>
                    <th className="py-2.5 px-2 text-right">Acción</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-iron/35">
                  {filteredItems.map((shopItem) => {
                    const item = getItem(shopItem.itemId)!;
                    const isSelected = selectedItemId === shopItem.itemId;
                    const isWeapon = ["pike", "sword", "firearm"].includes(item.category);
                    const canAfford = soldier.coins >= shopItem.buyPrice;

                    return (
                      <tr 
                        key={shopItem.itemId}
                        className={`hover:bg-panel-soft/40 transition-colors ${
                          isSelected ? "bg-panel-raised/50" : ""
                        }`}
                      >
                        <td className="py-3 px-2 font-mono">
                          <div className="flex items-center gap-3">
                            <div className="asset-icon-frame w-12 h-12 rounded-xs flex-shrink-0 flex items-center justify-center p-1 overflow-hidden">
                              <img
                                src={getItemImagePath(shopItem.itemId)}
                                alt={item.name}
                                className="asset-icon-image w-full h-full object-contain"
                                onError={(e) => {
                                  e.currentTarget.style.display = "none";
                                }}
                              />
                            </div>
                            <div className="min-w-0">
                              <button 
                                onClick={() => { playPageSound(); setSelectedItemId(shopItem.itemId); }}
                                className="font-bold text-gold-soft hover:underline block text-left cursor-pointer truncate"
                              >
                                {item.name}
                              </button>
                              <span className="text-[10px] text-muted italic font-sans block truncate max-w-[150px]">
                                {item.description}
                              </span>
                            </div>
                          </div>
                        </td>
                        <td className="py-3 px-2 font-mono text-[10px] text-text-muted">
                          {Object.entries(item.effects).map(([effect, val]) => (
                            <div key={effect} className="inline-block mr-2">
                              {effect === "pike" && "Pica"}
                              {effect === "sword" && "Espada"}
                              {effect === "arquebus" && "Arcabuz"}
                              {effect === "discipline" && "Disc."}
                              {effect === "vigor" && "Vigor"}
                              {effect === "cunning" && "Astucia"}
                              {effect === "fatigue" && "Fatiga"}
                              {effect === "woundTreatment" && "Trat."}:{" "}
                              <span className={Number(val) > 0 ? "text-success font-bold" : "text-danger font-bold"}>
                                {Number(val) > 0 ? `+${val}` : val}
                              </span>
                            </div>
                          ))}
                        </td>
                        <td className="py-3 px-2 font-mono text-text-muted">
                          {shopItem.stock} unidades
                        </td>
                        <td className="py-3 px-2 font-mono text-gold-soft font-bold text-right">
                          <span className="inline-flex items-center gap-0.5">
                            <UiAssetIcon id="coins" label="Doblones" className="h-4 w-4" />
                            {shopItem.buyPrice}
                          </span>
                        </td>
                        <td className="py-3 px-2 text-right">
                          <div className="inline-flex gap-1">
                            <button
                              onClick={() => { playPageSound(); setSelectedItemId(shopItem.itemId); }}
                              className="px-2 py-1 border border-iron text-[10px] uppercase font-mono text-text hover:border-gold hover:text-gold cursor-pointer"
                              title="Examinar detalles"
                            >
                              <Eye className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={() => handleBuy(shopItem.itemId)}
                              disabled={!canAfford}
                              className={`px-3 py-1 border text-[10px] font-mono font-bold uppercase rounded-xs cursor-pointer transition-all ${
                                canAfford
                                  ? "bg-blood border-blood-bright text-text hover:bg-blood-bright"
                                  : "bg-stone-900 border-iron text-muted cursor-not-allowed"
                              }`}
                            >
                              Comprar
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </Card>
        </div>

        {/* Right: Selected details & Shopkeeper bubble */}
        <div className="space-y-4">
          {/* Shopkeeper conversation bubble */}
          <div className="game-panel p-4 border border-iron rounded-xs bg-linear-to-b from-stone-900 to-stone-950 flex gap-3">
            <div className="w-12 h-12 border border-gold/30 bg-panel-raised rounded-full shrink-0 overflow-hidden flex items-center justify-center">
              <img
                src={featuredAssetPaths.armorerPortrait}
                alt="Armero"
                className="portrait-realism w-full h-full object-cover"
                onError={(e) => {
                  e.currentTarget.style.display = "none";
                }}
              />
            </div>
            <div>
              <p className="text-[10px] text-gold uppercase font-mono tracking-widest font-bold">Fiel de Pertrechos</p>
              <p className="text-[11px] font-serif italic text-text-muted mt-1 leading-relaxed">
                "¡Por Santiago! ¿Pretendes marchar con esas botas rotas y esa pica carcomida? Consigue doblones y compra algo decente antes de que el lodo de Brabante te trague vivo."
              </p>
            </div>
          </div>

          {/* Detailed Item panel */}
          <Card title="Detalles e Inspección">
            {selectedItemDef && selectedShopItem ? (
              <div className="space-y-4">
                <div>
                  <h3 className="font-cinzel text-base font-bold text-gold">{selectedItemDef.name}</h3>
                  <p className="text-xs text-text-muted font-serif italic">"{selectedItemDef.description}"</p>
                </div>

                <div className="asset-icon-frame asset-icon-frame--showcase h-44 rounded-xs overflow-hidden flex items-center justify-center p-3 relative">
                  <img
                    src={getItemImagePath(selectedItemDef.id)}
                    alt={selectedItemDef.name}
                    className="asset-icon-image h-36 object-contain z-10 transition-transform duration-300 hover:scale-105"
                    onError={(e) => {
                      e.currentTarget.style.display = "none";
                    }}
                  />
                </div>

                {/* Attribute Comparison */}
                <div className="space-y-2">
                  <h4 className="text-[10px] uppercase font-mono tracking-widest text-muted">Efecto en tus atributos:</h4>
                  <div className="p-2.5 bg-background border border-iron rounded-xs space-y-1.5 text-xs font-mono">
                    {comparisons.map((c) => (
                      <div key={c.stat} className="flex justify-between">
                        <span className="capitalize text-text-muted">
                          {c.stat === "pike" && "Pica"}
                          {c.stat === "sword" && "Espada"}
                          {c.stat === "arquebus" && "Arcabuz"}
                          {c.stat === "discipline" && "Disciplina"}
                          {c.stat === "vigor" && "Vigor"}
                          {c.stat === "cunning" && "Astucia"}
                          {c.stat === "command" && "Mando"}
                        </span>
                        <span className="flex items-center gap-1.5">
                          <span>{c.current}</span>
                          <span className="text-muted">→</span>
                          <span className="text-success font-bold">{c.current + c.val}</span>
                        </span>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="pt-2">
                  <button
                    onClick={() => handleBuy(selectedItemDef.id)}
                    disabled={soldier.coins < selectedShopItem.buyPrice}
                    className={`w-full py-2.5 text-xs font-mono font-bold uppercase tracking-wider border rounded-xs transition-all cursor-pointer ${
                      soldier.coins >= selectedShopItem.buyPrice
                        ? "bg-blood border-blood-bright text-text hover:bg-blood-bright hover:text-white"
                        : "bg-stone-900 border-iron text-muted cursor-not-allowed"
                    }`}
                  >
                    Comprar por {selectedShopItem.buyPrice} doblones
                  </button>
                </div>
              </div>
            ) : (
              <p className="text-xs text-muted italic text-center py-6">Selecciona un pertrecho para iniciar la inspección.</p>
            )}
          </Card>
        </div>
      </div>
    </div>
    </PageTransition>
  );
}
