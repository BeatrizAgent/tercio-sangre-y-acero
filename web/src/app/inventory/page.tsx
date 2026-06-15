"use client";

import React, { useEffect, useState } from "react";
import { useGameStore } from "@/lib/game-store";
import { Card, Badge } from "@/components/ui/card";
import { getItem, getItemImagePath } from "@/lib/game-data";
import { Shield, Swords, Backpack, Search, Sparkles } from "lucide-react";
import { UiAssetIcon } from "@/components/game/ui-asset-icon";
import { playSwordSound, playCoinSound, playPageSound } from "@/lib/sounds";

import { PageTransition } from "@/components/game/page-transition";

export default function InventoryPage() {
  const { soldier, equipItem, sellItem, unequipItem } = useGameStore();
  const [activeTab, setActiveTab] = useState<"inventario" | "almacen">("inventario");
  const [selectedItemId, setSelectedItemId] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [mounted, setMounted] = useState(false);
  const [notification, setNotification] = useState<string | null>(null);

  // Drag and drop states
  const [draggingItemId, setDraggingItemId] = useState<string | null>(null);
  const [draggedOverSlot, setDraggedOverSlot] = useState<string | null>(null);
  const [draggingSlot, setDraggingSlot] = useState<string | null>(null);
  const [isOverBackpack, setIsOverBackpack] = useState(false);

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

  // Drag and drop handlers
  const handleDragStart = (itemId: string, e: React.DragEvent) => {
    setDraggingItemId(itemId);
    e.dataTransfer.effectAllowed = "move";
    e.dataTransfer.setData("text/plain", itemId);
  };

  const handleDragEnd = () => {
    setDraggingItemId(null);
    setDraggedOverSlot(null);
    setDraggingSlot(null);
    setIsOverBackpack(false);
  };

  const handleDragStartSlot = (slotKey: string, e: React.DragEvent) => {
    setDraggingSlot(slotKey);
    e.dataTransfer.effectAllowed = "move";
    e.dataTransfer.setData("text/plain", `slot:${slotKey}`);
  };

  const handleDragOverSlot = (slotKey: string, e: React.DragEvent) => {
    if (!draggingItemId) return;
    const item = getItem(draggingItemId);
    if (item && item.slot === slotKey) {
      e.preventDefault();
      if (draggedOverSlot !== slotKey) {
        setDraggedOverSlot(slotKey);
      }
    }
  };

  const handleDragLeaveSlot = () => {
    setDraggedOverSlot(null);
  };

  const handleDropOnSlot = (slotKey: string, e: React.DragEvent) => {
    e.preventDefault();
    const itemId = e.dataTransfer.getData("text/plain");
    if (itemId && !itemId.startsWith("slot:")) {
      handleEquip(itemId);
    }
    setDraggingItemId(null);
    setDraggedOverSlot(null);
  };

  const handleDragOverBackpack = (e: React.DragEvent) => {
    if (draggingSlot) {
      e.preventDefault();
      setIsOverBackpack(true);
    }
  };

  const handleDragLeaveBackpack = () => {
    setIsOverBackpack(false);
  };

  const handleDropOnBackpack = (e: React.DragEvent) => {
    e.preventDefault();
    const data = e.dataTransfer.getData("text/plain");
    if (data && data.startsWith("slot:")) {
      const slotKey = data.split(":")[1];
      handleUnequip(slotKey);
    } else if (draggingSlot) {
      handleUnequip(draggingSlot);
    }
    setDraggingSlot(null);
    setIsOverBackpack(false);
  };

  const getSlotHighlightClass = (slotKey: string) => {
    if (!draggingItemId) return "";
    const item = getItem(draggingItemId);
    if (!item || item.slot !== slotKey) return "";
    
    if (draggedOverSlot === slotKey) {
      return "border-gold bg-gold/25 ring-2 ring-gold/45 scale-110 shadow-[0_0_20px_rgba(201,162,79,0.7)] z-10 animate-pulse";
    }
    return "border-gold-soft border-dashed bg-gold-soft/10 scale-105 shadow-[0_0_10px_rgba(201,162,79,0.3)] animate-pulse";
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

  const isSelectedEquipped = selectedItemDef 
    ? Object.values(soldier.equipment).includes(selectedItemDef.id)
    : false;

  // Carry weight calculations
  const totalItemsCount = soldier.inventory.reduce((sum, i) => sum + i.quantity, 0);
  const carryCapacity = 30;

  const renderMannequinSlot = (slotKey: string, label: string, IconComponent: any) => {
    const equippedItemId = soldier.equipment[slotKey as keyof typeof soldier.equipment];
    const item = equippedItemId ? getItem(equippedItemId) : null;
    const highlightClass = getSlotHighlightClass(slotKey);

    return (
      <div 
        className="flex flex-col items-center"
        onDragOver={(e) => handleDragOverSlot(slotKey, e)}
        onDragLeave={handleDragLeaveSlot}
        onDrop={(e) => handleDropOnSlot(slotKey, e)}
      >
        <span className="text-[10px] text-text-muted uppercase font-mono mb-1">{label}</span>
        <div 
          className={`equipment-slot rounded-xs shadow-inner overflow-hidden transition-all duration-200 ${highlightClass} ${
            draggingItemId && getItem(draggingItemId)?.slot === slotKey ? "border-gold/60" : ""
          }`}
        >
          {item ? (
            <button
              draggable={true}
              onDragStart={(e) => handleDragStartSlot(slotKey, e)}
              onDragEnd={handleDragEnd}
              onDoubleClick={() => handleUnequip(slotKey)}
              onClick={() => { playPageSound(); setSelectedItemId(item.id); }}
              className="w-full h-full p-0.5 flex items-center justify-center relative group/btn cursor-pointer"
              title={`Arrastra para desequipar o haz doble clic. ${item.name}`}
            >
              <img
                src={getItemImagePath(item.id)}
                alt={item.name}
                className="asset-icon-image w-full h-full object-contain transition-transform group-hover/btn:scale-105"
                onError={(e) => {
                  e.currentTarget.style.display = "none";
                }}
              />
              <span className="absolute top-0.5 right-0.5 text-danger font-bold text-[8px] bg-background/90 px-0.5 rounded-xs border border-iron/40 opacity-0 group-hover/btn:opacity-100 transition-opacity">
                X
              </span>
            </button>
          ) : (
            <IconComponent className="w-5 h-5 text-muted opacity-40" />
          )}
        </div>
      </div>
    );
  };

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
          {(["inventario", "almacen"] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => { playPageSound(); setActiveTab(tab); }}
              className={`px-4 py-2 text-xs font-mono uppercase tracking-wider transition-all rounded-t-sm border-t border-x cursor-pointer ${
                activeTab === tab
                  ? "bg-panel border-iron border-b-background text-gold font-bold"
                  : "border-transparent bg-transparent text-text-muted hover:text-text hover:bg-panel-soft/50"
              }`}
            >
              {tab === "inventario" && "Mochila y Equipamiento"}
              {tab === "almacen" && "Almacén de Compañía"}
            </button>
          ))}
        </div>

        {activeTab === "inventario" && (
          <div className="grid gap-6 grid-cols-1 lg:grid-cols-12">
            
            {/* Column 1: Mannequin View (equipped items) */}
            <div className="col-span-1 lg:col-span-4 xl:col-span-3">
              <Card title="Pertrechos Equipados">
                <div className="p-4 bg-stone-900/20 border border-iron rounded-xs flex flex-col items-center justify-center min-h-[300px]">
                  {/* Silhouette diagram with slot positions */}
                  <div className="w-full max-w-sm grid grid-cols-3 gap-6 relative">
                    {/* YELMO (Cabeza) - Row 1, Center */}
                    <div className="col-start-2">
                      {renderMannequinSlot("head", "Cabeza", Shield)}
                    </div>

                    {/* CORAZA / PECHO - Row 2, Center */}
                    <div className="col-start-2">
                      {renderMannequinSlot("body", "Cuerpo", Shield)}
                    </div>

                    {/* ARMA PRINCIPAL (Mano Izq) - Row 2, Left */}
                    <div className="col-start-1 col-span-1">
                      {renderMannequinSlot("mainHand", "Mano Principal", Swords)}
                    </div>

                    {/* MANO SECUNDARIA - Row 2, Right */}
                    <div className="col-start-3 col-span-1">
                      {renderMannequinSlot("offHand", "Secundaria", Shield)}
                    </div>

                    {/* ARCABUZ (Fuego) - Row 3, Left */}
                    <div className="col-start-1">
                      {renderMannequinSlot("firearm", "Fuego", Swords)}
                    </div>

                    {/* CALZADO - Row 3, Center */}
                    <div className="col-start-2">
                      {renderMannequinSlot("boots", "Calzado", Shield)}
                    </div>

                    {/* ACCESORIO - Row 3, Right */}
                    <div className="col-start-3">
                      {renderMannequinSlot("accessory", "Reliquia", Sparkles)}
                    </div>
                  </div>

                  <p className="text-[10px] text-text-muted italic mt-8 text-center max-w-xs leading-normal">
                    Arrastra los pertrechos de la mochila aquí para equiparlos. Arrastra los equipados a la mochila para desequiparlos, o haz doble clic.
                  </p>
                </div>
              </Card>
            </div>

            {/* Column 2: Backpack (Inventory Grid & Filters) */}
            <div 
              onDragOver={handleDragOverBackpack}
              onDragLeave={handleDragLeaveBackpack}
              onDrop={handleDropOnBackpack}
              className={`col-span-1 lg:col-span-8 xl:col-span-6 transition-all duration-300 rounded-sm ${
                isOverBackpack 
                  ? "ring-2 ring-gold/50 bg-gold/5 shadow-[0_0_20px_rgba(201,162,79,0.2)] p-1 border border-dashed border-gold" 
                  : ""
              }`}
            >
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
                      const isEquipable = item.slot !== "consumable";

                      return (
                        <button
                          key={invItem.itemId}
                          onClick={() => { playPageSound(); setSelectedItemId(invItem.itemId); }}
                          onDoubleClick={() => {
                            if (isEquipable) {
                              if (isEquipped) {
                                const slotKey = Object.keys(soldier.equipment).find(
                                  (key) => soldier.equipment[key as keyof typeof soldier.equipment] === invItem.itemId
                                );
                                if (slotKey) handleUnequip(slotKey);
                              } else {
                                handleEquip(invItem.itemId);
                              }
                            }
                          }}
                          draggable={isEquipable}
                          onDragStart={(e) => handleDragStart(invItem.itemId, e)}
                          onDragEnd={handleDragEnd}
                          className={`p-3 bg-panel-soft border rounded-xs flex flex-col justify-between text-left transition-all cursor-pointer ${
                            isSelected 
                              ? "border-gold bg-panel-raised shadow-md" 
                              : "border-iron hover:border-iron-light"
                          } ${draggingItemId === invItem.itemId ? "opacity-40 border-dashed border-gold/40 scale-95" : ""} ${
                            draggingItemId && getItem(draggingItemId)?.slot === item.slot ? "ring-1 ring-gold/25" : ""
                          }`}
                          title={isEquipable ? "Arrastra este objeto al maniquí para equiparlo o haz doble clic." : "Este objeto no es equipable."}
                        >
                          <div>
                            {/* Item Icon Preview */}
                            <div className="asset-icon-frame asset-icon-frame--tile w-full h-24 sm:h-28 rounded-xs flex items-center justify-center p-2 overflow-hidden mb-2 relative">
                              <img
                                src={getItemImagePath(invItem.itemId)}
                                alt={item.name}
                                className="asset-icon-image w-full h-full object-contain"
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
                              <UiAssetIcon id="coins" label="Doblones" className="h-4 w-4" />
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

            {/* Column 3: Selected Item Details & Guidelines */}
            <div className="col-span-1 lg:col-span-12 xl:col-span-3 space-y-6">
              
              {/* Details card */}
              <Card title="Detalles del Pertrecho">
                {selectedItemDef ? (
                  <div className="space-y-4">
                    {/* Large Item Icon Illustration */}
                    <div className="asset-icon-frame asset-icon-frame--showcase w-full h-56 rounded-md flex items-center justify-center p-4 relative overflow-hidden">
                      <img
                        src={getItemImagePath(selectedItemDef.id)}
                        alt={selectedItemDef.name}
                        className="asset-icon-image w-40 h-40 object-contain z-10 transition-transform duration-300 hover:scale-105"
                        onError={(e) => {
                          e.currentTarget.style.display = "none";
                        }}
                      />
                    </div>

                    <div className="pb-3 border-b border-iron">
                      <div className="flex justify-between items-start">
                        <h3 className="font-cinzel text-lg font-bold text-gold">{selectedItemDef.name}</h3>
                        {isSelectedEquipped && (
                          <span className="text-[10px] bg-gold/15 border border-gold/40 text-gold px-1.5 py-0.5 rounded-xs uppercase tracking-wider font-mono">
                            Equipado
                          </span>
                        )}
                      </div>
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
                          <UiAssetIcon id="coins" label="Doblones" className="h-4 w-4" />
                          {selectedItemDef.value} dob.
                        </span>
                      </div>
                    </div>

                    {/* Action buttons */}
                    <div className="space-y-2 pt-2">
                      {selectedItemDef.slot !== "consumable" && (
                        isSelectedEquipped ? (
                          <button
                            onClick={() => {
                              const slotKey = Object.keys(soldier.equipment).find(
                                (key) => soldier.equipment[key as keyof typeof soldier.equipment] === selectedItemDef.id
                              );
                              if (slotKey) {
                                handleUnequip(slotKey);
                              }
                            }}
                            className="w-full py-2.5 bg-stone-850 hover:bg-stone-800 border border-iron text-xs font-mono font-bold uppercase tracking-wider text-text rounded-xs cursor-pointer transition-all"
                          >
                            Desequipar Pertrecho
                          </button>
                        ) : (
                          <button
                            onClick={() => handleEquip(selectedItemDef.id)}
                            className="w-full py-2.5 bg-blood hover:bg-blood-bright border border-blood-bright text-xs font-mono font-bold uppercase tracking-wider text-text hover:text-white rounded-xs cursor-pointer transition-all"
                          >
                            Equipar Pertrecho
                          </button>
                        )
                      )}
                      
                      {selectedItemDef.slot === "consumable" && (
                        <button
                          onClick={() => {
                            if (selectedItemDef.id === "clean_bandage") {
                              setNotification("Usa las vendas desde el Hospital para tratar las heridas abiertas.");
                            } else {
                              const res = sellItem(selectedItemDef.id);
                              if (res.ok) {
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

              {/* Guidelines */}
              <Card title="Glosario Militar">
                <div className="space-y-4 text-xs leading-relaxed text-text-muted">
                  <p>
                    <strong>Armas de Formación:</strong> Las picas de acero aumentan tu atributo de Pica y Disciplina, vitales para las misiones de guardia y asaltos cerrados.
                  </p>
                  <p>
                    <strong>Armas de Fuego:</strong> Los arcabuces aumentan tu atributo de Arcabuz, ideales para emboscadas y escoltas de pólvora.
                  </p>
                  <p>
                    <strong>Morriones y Corazas:</strong> Ofrecen protección física. Incrementan tu Vigor a costa de penalizar ligeramente la Disciplina debido a su peso.
                  </p>
                </div>
              </Card>
            </div>

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
