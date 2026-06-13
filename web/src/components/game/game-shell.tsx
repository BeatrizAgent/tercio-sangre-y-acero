"use client";

import React, { useEffect, useState } from "react";
import { SidebarNav } from "./sidebar-nav";

export function GameShell({ children }: { children: React.ReactNode }) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  return (
    <div className="flex flex-row bg-background text-text font-sans selection:bg-gold/30 selection:text-gold-soft w-screen h-screen overflow-hidden">
      {/* Sidebar - fixed and scrollable independently */}
      <SidebarNav />

      {/* Main Game Viewport - scrollable independently */}
      <div className="flex-1 h-full overflow-y-auto flex flex-col bg-background">
        <main className="flex-1 p-4 md:p-6 lg:p-8 max-w-7xl w-full mx-auto">
          {!mounted ? (
            <div className="flex items-center justify-center min-h-[50vh]">
              <div className="text-center space-y-4">
                <div className="w-10 h-10 border-2 border-t-gold border-r-transparent border-b-transparent border-l-transparent rounded-full animate-spin mx-auto" />
                <p className="font-cinzel text-sm text-gold tracking-widest uppercase animate-pulse">
                  Estableciendo Campamento...
                </p>
              </div>
            </div>
          ) : (
            children
          )}
        </main>
      </div>
    </div>
  );
}
