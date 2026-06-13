"use client";

import React, { useEffect, useState } from "react";
import { useGameStore } from "@/lib/game-store";
import { Card, Badge } from "@/components/ui/card";
import { getItem, getItemImagePath } from "@/lib/game-data";
import { Shield, Swords, Backpack, Coins, Search, Sparkles } from "lucide-react";
import { playSwordSound, playCoinSound, playPageSound } from "@/lib/sounds";

import { PageTransition } from "@/components/game/page-transition";

export default function InventoryPage() {
  const { soldier, equipItem, sellItem, unequipItem } = useGameStore();
  const [activeTab, setActiveTab] = useState<"inventario" | "equipamiento" | "almacen">("inventario");
  const [selectedItemId, setSelectedItemId] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [mounted, setMounted] = useState(false);
  const [notification, setNotification] = useState<string | null>(null);

  useEffect(() => {
    setMounted(true);
    // Select first item by default if available
    if (soldier.inventory.length > 0) {
      setSelectedItemId(soldier.inventory[0].itemId);
    }
  }, []);

  if (!mounted) {
    return <div className="text-center font-cinzel py-12 text-gold animate-pulse">Cargando inventario...</div>;
  }

  const handleEquip = (itemId: string) => {
    const res = equipItem(itemId);
    if (res.ok) {
      playSwordSound();
    }
    setNotification(res.message);
    setTimeout(() => setNotification(null), 3000);
  };

  const handleUnequip = (slot: any) => {
    const res = unequipItem(slot);
    if (res.ok) {
      playSwordSound();
    }
    setNotification(res.message);
    setTimeout(() => setNotification(null), 3000);
  };

  const handleSell = (itemId: string) => {
    const res = sellItem(itemId);
    if (res.ok) {
      playCoinSound();
    }
    setNotification(res.message);
    setTimeout(() => setNotification(null), 3000);
    // If quantity is now 0, reset selection
    const updated = soldier.inventory.find(i => i.itemId === itemId);
    if (!updated || updated.quantity <= 1) {
      setSelectedItemId(null);
    }
  };


  // Filter items
  const filteredItems = soldier.inventory.filter((invItem) => {
    const item = getItem(invItem.itemId);
    if (!item) return false;
    
    const matchesSearch = item.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          item.description.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesCategory = categoryFilter === "all" || item.category === categoryFilter;
    
    return matchesSearch && matchesCategory;
  });

  const selectedItemDef = selectedItemId ? getItem(selectedItemId) : null;
  const selectedInvQuantity = selectedItemId 
    ? soldier.inventory.find((i) => i.itemId === selectedItemId)?.quantity ?? 0
    : 0;

  // Carry weight calculations
  const totalItemsCount = soldier.inventory.reduce((sum, i) => sum + i.quantity, 0);
  const carryCapacity = 30;

  return (
    <PageTransition>
      <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center border-b border-iron pb-3">
        <div>
          <h1 className="font-cinzel text-3xl font-extrabold tracking-wider text-gold">INVENTARIO Y EQUIPO</h1>
          <p className="text-xs text-text-muted">Gestiona tus pertrechos y armas de campaña</p>
        </div>
      </div>

      {/* Notification Banner */}
      {notification && (
        <div className="p-2.5 bg-success/20 border border-success text-success text-xs font-mono rounded-xs animate-fade-in">
          {notification}
        </div>
      )}

      {/* Tabs */}
      <div className="flex border-b border-iron/60 gap-1">
        {(["inventario", "equipamiento", "almacen"] as const).map((tab) => (
          <button
            key={tab}
            onClick={() => { playPageSound(); setActiveTab(tab); }}
            className={`px-4 py-2 text-xs font-mono uppercase tracking-wider transition-all rounded-t-sm border-t border-x cursor-pointer ${
              activeTab === tab
                ? "bg-panel border-iron border-b-background text-gold font-bold"
                : "border-transparent bg-transparent text-text-muted hover:text-text hover:bg-panel-soft/50"
            }`}
          >
            {tab === "inventario" && "Inventario"}
            {tab === "equipamiento" && "Equipamiento"}
            {tab === "almacen" && "Almacén de Compañía"}
          </button>
        ))}
      </div>

      {activeTab === "inventario" && (
        <div className="grid gap-6 lg:grid-cols-[2fr_1fr]">
          {/* Left: Inventory Grid & Filters */}
          <div className="space-y-4">
            <Card title="Pertrechos en el Macuto">
              {/* Search & Filters */}
              <div className="flex flex-col sm:flex-row gap-3 mb-4">
                {/* Search */}
                <div className="flex-1 relative flex items-center">
                  <Search className="w-4 h-4 text-muted absolute left-3" />
                  <input
                    type="text"
                    placeholder="Buscar objeto..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full pl-9 pr-4 py-1.5 bg-background border border-iron text-xs font-sans rounded-xs focus:outline-hidden focus:border-gold/50"
                  />
                </div>
                {/* Category Filter */}
                <select
                  value={categoryFilter}
                  onChange={(e) => { playPageSound(); setCategoryFilter(e.target.value); }}
                  className="bg-background border border-iron text-xs font-sans rounded-xs px-3 py-1.5 focus:outline-hidden focus:border-gold/50"
                >
                  <option value="all">Todas las categorías</option>
                  <option value="pike">Picas</option>
                  <option value="sword">Espadas</option>
                  <option value="firearm">Armas de Fuego</option>
                  <option value="helmet">Morriones / Cascos</option>
                  <option value="armor">Corazas / Armaduras</option>
                  <option value="clothing">Jubones / Ropa</option>
                  <option value="boots">Calzado</option>
                  <option value="medicine">Vendas / Medicina</option>
                  <option value="food">Raciones / Comida</option>
                  <option value="relic">Reliquias</option>
                </select>
              </div>

              {/* Items Grid */}
              {filteredItems.length === 0 ? (
                <div className="border border-dashed border-iron p-12 text-center text-xs text-muted">
                  No se encontraron objetos en esta categoría.
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                  {filteredItems.map((invItem) => {
                    const item = getItem(invItem.itemId)!;
                    const isSelected = selectedItemId === invItem.itemId;
                    const isEquipped = Object.values(soldier.equipment).includes(invItem.itemId);

                    return (
                      <button
                        key={invItem.itemId}
                        onClick={() => { playPageSound(); setSelectedItemId(invItem.itemId); }}
                        className={`p-3 bg-panel-soft border rounded-xs flex flex-col justify-between text-left transition-all cursor-pointer ${
                          isSelected 
                            ? "border-gold bg-panel-raised shadow-md" 
                            : "border-iron hover:border-iron-light"
                        }`}
                      >
                        <div>
                          {/* Item Icon Preview */}
                          <div className="w-full h-24 sm:h-28 bg-background/40 border border-iron/80 rounded-xs flex items-center justify-center p-2 overflow-hidden mb-2 relative">
                            <img
                              src={getItemImagePath(invItem.itemId)}
                              alt={item.name}
                              className="w-full h-full object-contain filter drop-shadow-[0_2px_4px_rgba(0,0,0,0.15)]"
                              onError={(e) => {
                                e.currentTarget.style.display = "none";
                              }}
                            />
                          </div>

                          <div className="flex justify-between items-start gap-1">
                            <span className="font-cinzel text-xs font-bold text-text-muted truncate">
                              {item.name}
                            </span>
                            {isEquipped && (
                              <span className="text-[8px] bg-gold/15 border border-gold/40 text-gold px-1 rounded-xs uppercase tracking-wider font-mono">
                                Eq
                              </span>
                            )}
                          </div>
                          <p className="text-[10px] text-muted capitalize font-sans mt-0.5">{item.category}</p>
                        </div>

                        <div className="mt-3 flex justify-between items-center">
                          <span className="text-[10px] font-mono bg-stone-900 px-1.5 py-0.5 rounded-xs border border-iron text-text-muted">
                            Cant: {invItem.quantity}
                          </span>
                          <span className="text-xs font-mono text-gold-soft flex items-center gap-0.5">
                            <Coins className="w-3 h-3 text-gold" />
                            {item.value}
                          </span>
                        </div>
                      </button>
                    );
                  })}
                </div>
              )}

              {/* Capacity Footer */}
              <div className="mt-6 pt-3 border-t border-iron flex justify-between text-[11px] font-mono text-text-muted">
                <span>Capacidad del Macuto</span>
                <span>{totalItemsCount} / {carryCapacity} Pertrechos</span>
              </div>
            </Card>
          </div>

          {/* Right: Selected Item Details */}
          <div className="space-y-4">
            <Card title="Detalles del Pertrecho">
              {selectedItemDef ? (
                <div className="space-y-4">
                  {/* Large Item Icon Illustration */}
                  <div className="w-full h-56 bg-stone-950/80 border border-iron/80 rounded-md flex items-center justify-center p-4 relative overflow-hidden">
                    <img
                      src={getItemImagePath(selectedItemDef.id)}
                      alt={selectedItemDef.name}
                      className="w-40 h-40 object-contain z-10 filter drop-shadow-[0_4px_16px_rgba(201,162,79,0.3)] transition-transform duration-300 hover:scale-105"
                      onError={(e) => {
                        e.currentTarget.style.display = "none";
                      }}
                    />
                    <div className="absolute inset-0 bg-radial from-stone-900/60 to-stone-950 pointer-events-none" />
                  </div>

                  <div className="pb-3 border-b border-iron">
                    <h3 className="font-cinzel text-lg font-bold text-gold">{selectedItemDef.name}</h3>
                    <Badge variant="gold">
                      Categoría: <span className="capitalize">{selectedItemDef.category}</span>
                    </Badge>
                  </div>

                  <p className="text-xs font-serif italic text-text-muted leading-relaxed">
                    "{selectedItemDef.description}"
                  </p>

                  {/* Effects panel */}
                  <div className="space-y-2">
                    <h4 className="text-[11px] uppercase font-mono tracking-wider text-muted">Efectos:</h4>
                    <div className="p-2 bg-background border border-iron rounded-xs space-y-1 text-xs font-mono">
                      {Object.keys(selectedItemDef.effects).length === 0 ? (
                        <p className="text-muted text-[11px] italic">Sin efectos en los atributos.</p>
                      ) : (
                        Object.entries(selectedItemDef.effects).map(([effect, val]) => (
                          <div key={effect} className="flex justify-between">
                            <span className="capitalize text-text-muted">
                              {effect === "pike" && "Pica"}
                              {effect === "sword" && "Espada"}
                              {effect === "arquebus" && "Arcabuz"}
                              {effect === "discipline" && "Disciplina"}
                              {effect === "vigor" && "Vigor"}
                              {effect === "cunning" && "Astucia"}
                              {effect === "command" && "Mando"}
                              {effect === "fatigue" && "Fatiga"}
                              {effect === "woundTreatment" && "Tratamiento de Heridas"}
                            </span>
                            <span className={Number(val) > 0 ? "text-success font-bold" : "text-danger font-bold"}>
                              {Number(val) > 0 ? `+${val}` : val}
                            </span>
                          </div>
                        ))
                      )}
                    </div>
                  </div>

                  {/* Pricing / Owned details */}
                  <div className="grid grid-cols-2 gap-2 text-xs font-mono bg-stone-900/40 p-2 border border-iron rounded-xs">
                    <div>
                      <span className="text-text-muted block text-[10px] uppercase">En posesión</span>
                      <span className="text-text font-bold">{selectedInvQuantity} unidades</span>
                    </div>
                    <div>
                      <span className="text-text-muted block text-[10px] uppercase">Valor sugerido</span>
                      <span className="text-gold flex items-center gap-1 font-bold">
                        <Coins className="w-3.5 h-3.5" />
                        {selectedItemDef.value} dob.
                      </span>
                    </div>
                  </div>

                  {/* Action buttons */}
                  <div className="space-y-2 pt-2">
                    {selectedItemDef.slot !== "consumable" && (
                      <button
                        onClick={() => handleEquip(selectedItemDef.id)}
                        className="w-full py-2.5 bg-blood hover:bg-blood-bright border border-blood-bright text-xs font-mono font-bold uppercase tracking-wider text-text hover:text-white rounded-xs cursor-pointer transition-all"
                      >
                        Equipar Pertrecho
                      </button>
                    )}
                    
                    {selectedItemDef.slot === "consumable" && (
                      <button
                        onClick={() => {
                          if (selectedItemDef.id === "clean_bandage") {
                            setNotification("Usa las vendas desde el Hospital para tratar las heridas abiertas.");
                          } else {
                            // Wine skin or hard bread: reduce fatigue
                            const res = sellItem(selectedItemDef.id); // Deduct item
                            if (res.ok) {
                              // manually apply effect since it's client state
                              const currentFatigue = useGameStore.getState().soldier.fatigue;
                              const fatigueEffect = selectedItemDef.effects.fatigue ?? 0;
                              useGameStore.setState((state) => ({
                                soldier: {
                                  ...state.soldier,
                                  fatigue: Math.max(0, currentFatigue + fatigueEffect)
                                }
                              }));
                              setNotification(`Has consumido ${selectedItemDef.name}. Fatiga reducida.`);
                            }
                          }
                        }}
                        className="w-full py-2.5 bg-yellow-800/80 hover:bg-yellow-700/80 border border-yellow-600/40 text-xs font-mono font-bold uppercase tracking-wider text-text rounded-xs cursor-pointer transition-all"
                      >
                        Consumir objeto
                      </button>
                    )}

                    <button
                      onClick={() => handleSell(selectedItemDef.id)}
                      className="w-full py-2 bg-stone-900 hover:bg-stone-800 border border-iron text-xs font-mono font-bold uppercase tracking-wider text-text-muted hover:text-text rounded-xs cursor-pointer transition-all"
                    >
                      Vender Pertrecho
                    </button>
                  </div>
                </div>
              ) : (
                <p className="text-xs text-muted italic text-center py-8">Selecciona un objeto para ver los detalles.</p>
              )}
            </Card>
          </div>
        </div>
      )}

      {activeTab === "equipamiento" && (
        <div className="grid gap-6 md:grid-cols-[1.2fr_1fr]">
          {/* Mannequin View */}
          <Card title="Pertrechos Equipados">
            <div className="p-4 bg-stone-900/20 border border-iron rounded-xs flex flex-col items-center justify-center min-h-[300px]">
              {/* Silhouette diagram with slot positions */}
              <div className="w-full max-w-sm grid grid-cols-3 gap-6 relative">
                {/* YELMO (Cabeza) - Row 1, Center */}
                <div className="col-start-2 flex flex-col items-center">
                  <span className="text-[10px] text-text-muted uppercase font-mono mb-1">Cabeza</span>
                  <div className="equipment-slot rounded-xs shadow-inner overflow-hidden">
                    {soldier.equipment.head ? (
                      <button 
                        onClick={() => handleUnequip("head")} 
                        className="w-full h-full p-0.5 flex items-center justify-center relative group/btn cursor-pointer"
                        title={`Desequipar ${getItem(soldier.equipment.head)?.name}`}
                      >
                        <img
                          src={getItemImagePath(soldier.equipment.head)}
                          alt={getItem(soldier.equipment.head)?.name}
                          className="w-full h-full object-contain filter drop-shadow-[0_2px_4px_rgba(0,0,0,0.15)] transition-transform group-hover/btn:scale-105"
                        />
                        <span className="absolute top-0.5 right-0.5 text-danger font-bold text-[8px] bg-background/90 px-0.5 rounded-xs border border-iron/40 opacity-0 group-hover/btn:opacity-100 transition-opacity">X</span>
                      </button>
                    ) : (
                      <Shield className="w-5 h-5 text-muted opacity-40" />
                    )}
                  </div>
                </div>

                {/* CORAZA / PECHO - Row 2, Center */}
                <div className="col-start-2 flex flex-col items-center">
                  <span className="text-[10px] text-text-muted uppercase font-mono mb-1">Cuerpo</span>
                  <div className="equipment-slot rounded-xs shadow-inner overflow-hidden">
                    {soldier.equipment.body ? (
                      <button 
                        onClick={() => handleUnequip("body")}
                        className="w-full h-full p-0.5 flex items-center justify-center relative group/btn cursor-pointer"
                        title={`Desequipar ${getItem(soldier.equipment.body)?.name}`}
                      >
                        <img
                          src={getItemImagePath(soldier.equipment.body)}
                          alt={getItem(soldier.equipment.body)?.name}
                          className="w-full h-full object-contain filter drop-shadow-[0_2px_4px_rgba(0,0,0,0.15)] transition-transform group-hover/btn:scale-105"
                        />
                        <span className="absolute top-0.5 right-0.5 text-danger font-bold text-[8px] bg-background/90 px-0.5 rounded-xs border border-iron/40 opacity-0 group-hover/btn:opacity-100 transition-opacity">X</span>
                      </button>
                    ) : (
                      <Shield className="w-5 h-5 text-muted opacity-40" />
                    )}
                  </div>
                </div>

                {/* ARMA PRINCIPAL (Mano Izq) - Row 2, Left */}
                <div className="col-start-1 col-span-1 flex flex-col items-center">
                  <span className="text-[10px] text-text-muted uppercase font-mono mb-1">Mano Principal</span>
                  <div className="equipment-slot rounded-xs shadow-inner overflow-hidden">
                    {soldier.equipment.mainHand ? (
                      <button 
                        onClick={() => handleUnequip("mainHand")}
                        className="w-full h-full p-0.5 flex items-center justify-center relative group/btn cursor-pointer"
                        title={`Desequipar ${getItem(soldier.equipment.mainHand)?.name}`}
                      >
                        <img
                          src={getItemImagePath(soldier.equipment.mainHand)}
                          alt={getItem(soldier.equipment.mainHand)?.name}
                          className="w-full h-full object-contain filter drop-shadow-[0_2px_4px_rgba(0,0,0,0.15)] transition-transform group-hover/btn:scale-105"
                        />
                        <span className="absolute top-0.5 right-0.5 text-danger font-bold text-[8px] bg-background/90 px-0.5 rounded-xs border border-iron/40 opacity-0 group-hover/btn:opacity-100 transition-opacity">X</span>
                      </button>
                    ) : (
                      <Swords className="w-5 h-5 text-muted opacity-40" />
                    )}
                  </div>
                </div>

                {/* MANO SECUNDARIA - Row 2, Right */}
                <div className="col-start-3 col-span-1 flex flex-col items-center">
                  <span className="text-[10px] text-text-muted uppercase font-mono mb-1">Secundaria</span>
                  <div className="equipment-slot rounded-xs shadow-inner overflow-hidden">
                    {soldier.equipment.offHand ? (
                      <button 
                        onClick={() => handleUnequip("offHand")}
                        className="w-full h-full p-0.5 flex items-center justify-center relative group/btn cursor-pointer"
                        title={`Desequipar ${getItem(soldier.equipment.offHand)?.name}`}
                      >
                        <img
                          src={getItemImagePath(soldier.equipment.offHand)}
                          alt={getItem(soldier.equipment.offHand)?.name}
                          className="w-full h-full object-contain filter drop-shadow-[0_2px_4px_rgba(0,0,0,0.15)] transition-transform group-hover/btn:scale-105"
                        />
                        <span className="absolute top-0.5 right-0.5 text-danger font-bold text-[8px] bg-background/90 px-0.5 rounded-xs border border-iron/40 opacity-0 group-hover/btn:opacity-100 transition-opacity">X</span>
                      </button>
                    ) : (
                      <Shield className="w-5 h-5 text-muted opacity-40" />
                    )}
                  </div>
                </div>

                {/* ARCABUZ (Fuego) - Row 3, Left */}
                <div className="col-start-1 flex flex-col items-center">
                  <span className="text-[10px] text-text-muted uppercase font-mono mb-1">Fuego</span>
                  <div className="equipment-slot rounded-xs shadow-inner overflow-hidden">
                    {soldier.equipment.firearm ? (
                      <button 
                        onClick={() => handleUnequip("firearm")}
                        className="w-full h-full p-0.5 flex items-center justify-center relative group/btn cursor-pointer"
                        title={`Desequipar ${getItem(soldier.equipment.firearm)?.name}`}
                      >
                        <img
                          src={getItemImagePath(soldier.equipment.firearm)}
                          alt={getItem(soldier.equipment.firearm)?.name}
                          className="w-full h-full object-contain filter drop-shadow-[0_2px_4px_rgba(0,0,0,0.15)] transition-transform group-hover/btn:scale-105"
                        />
                        <span className="absolute top-0.5 right-0.5 text-danger font-bold text-[8px] bg-background/90 px-0.5 rounded-xs border border-iron/40 opacity-0 group-hover/btn:opacity-100 transition-opacity">X</span>
                      </button>
                    ) : (
                      <Swords className="w-5 h-5 text-muted opacity-40" />
                    )}
                  </div>
                </div>

                {/* CALZADO - Row 3, Center */}
                <div className="col-start-2 flex flex-col items-center">
                  <span className="text-[10px] text-text-muted uppercase font-mono mb-1">Calzado</span>
                  <div className="equipment-slot rounded-xs shadow-inner overflow-hidden">
                    {soldier.equipment.boots ? (
                      <button 
                        onClick={() => handleUnequip("boots")}
                        className="w-full h-full p-0.5 flex items-center justify-center relative group/btn cursor-pointer"
                        title={`Desequipar ${getItem(soldier.equipment.boots)?.name}`}
                      >
                        <img
                          src={getItemImagePath(soldier.equipment.boots)}
                          alt={getItem(soldier.equipment.boots)?.name}
                          className="w-full h-full object-contain filter drop-shadow-[0_2px_4px_rgba(0,0,0,0.15)] transition-transform group-hover/btn:scale-105"
                        />
                        <span className="absolute top-0.5 right-0.5 text-danger font-bold text-[8px] bg-background/90 px-0.5 rounded-xs border border-iron/40 opacity-0 group-hover/btn:opacity-100 transition-opacity">X</span>
                      </button>
                    ) : (
                      <Shield className="w-5 h-5 text-muted opacity-40" />
                    )}
                  </div>
                </div>

                {/* ACCESORIO - Row 3, Right */}
                <div className="col-start-3 flex flex-col items-center">
                  <span className="text-[10px] text-text-muted uppercase font-mono mb-1">Reliquia</span>
                  <div className="equipment-slot rounded-xs shadow-inner overflow-hidden">
                    {soldier.equipment.accessory ? (
                      <button 
                        onClick={() => handleUnequip("accessory")}
                        className="w-full h-full p-0.5 flex items-center justify-center relative group/btn cursor-pointer"
                        title={`Desequipar ${getItem(soldier.equipment.accessory)?.name}`}
                      >
                        <img
                          src={getItemImagePath(soldier.equipment.accessory)}
                          alt={getItem(soldier.equipment.accessory)?.name}
                          className="w-full h-full object-contain filter drop-shadow-[0_2px_4px_rgba(0,0,0,0.15)] transition-transform group-hover/btn:scale-105"
                        />
                        <span className="absolute top-0.5 right-0.5 text-danger font-bold text-[8px] bg-background/90 px-0.5 rounded-xs border border-iron/40 opacity-0 group-hover/btn:opacity-100 transition-opacity">X</span>
                      </button>
                    ) : (
                      <Sparkles className="w-5 h-5 text-muted opacity-40" />
                    )}
                  </div>
                </div>
              </div>

              <p className="text-[10px] text-text-muted italic mt-8 text-center max-w-xs leading-normal">
                Haz clic en la "X" roja del objeto equipado para desequiparlo y devolverlo a tu inventario activo.
              </p>
            </div>
          </Card>

          {/* Guidelines */}
          <Card title="Glosario Militar">
            <div className="space-y-4 text-xs leading-relaxed text-text-muted">
              <p>
                <strong>Armas de Formation:</strong> Las picas oxidables y de acero aumentan tu atributo de Pica y Disciplina, vitales para las misiones de guardia y asaltos cerrados.
              </p>
              <p>
                <strong>Armas de Fuego:</strong> Los arcabuces gastados y españoles aumentan tu atributo de Arcabuz, ideales para emboscadas y escoltas de pólvora.
              </p>
              <p>
                <strong>Morriones y Corazas:</strong> Ofrecen protección física. Incrementan tu Vigor a costa de penalizar ligeramente la Disciplina debido a su peso.
              </p>
            </div>
          </Card>
        </div>
      )}

      {activeTab === "almacen" && (
        <Card title="Almacén Comunal del Tercio">
          <div className="border border-dashed border-iron p-12 text-center text-xs text-muted max-w-lg mx-auto space-y-2">
            <h3 className="font-cinzel text-sm text-gold font-bold">ALMACÉN BLOQUEADO</h3>
            <p>El almacén de la Compañía de Flandes requiere rango militar superior de <strong>Cabo de Escuadra</strong> o <strong>Sargento</strong> para poder depositar y extraer pertrechos.</p>
            <p className="text-[10px] text-muted italic">Esta opción se habilitará en las próximas fases del despliegue militar.</p>
          </div>
        </Card>
      )}
    </div>
    </PageTransition>
  );
}
