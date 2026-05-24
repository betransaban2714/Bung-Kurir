'use client';

import dynamic from 'next/dynamic';
import { useState } from 'react';
import { useKurirStore } from '@/store/useKurirStore';
import { RencanaHeader } from '@/components/Rencana/RencanaHeader';
import { Summary } from '@/components/Dashboard/Summary';
import { AddBuyer } from '@/components/Buyer/AddBuyer';
import { BuyerList } from '@/components/Buyer/BuyerList';
import { 
  Menu, 
  LayoutDashboard, 
  Package 
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { 
  Sheet, 
  SheetContent, 
  SheetTrigger,
  SheetHeader,
  SheetTitle,
  SheetDescription
} from '@/components/ui/sheet';

// Dynamic import for Leaflet to avoid SSR issues
const BungMap = dynamic(() => import('@/components/Map/BungMap'), { 
  ssr: false,
  loading: () => <div className="w-full h-full bg-secondary/50 animate-pulse flex items-center justify-center text-muted-foreground">SABAR DOLO, MAPS LAGI MASUK... 🌍</div>
});

export default function Home() {
  const { 
    rencanaList, 
    activeRencana, 
    isHydrated, 
    setActiveRencanaId, 
    createRencana, 
    deleteRencana,
    addBuyer,
    updateBuyerStatus,
    deleteBuyer
  } = useKurirStore();

  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [showSummary, setShowSummary] = useState(false);

  if (!isHydrated) return null;

  return (
    <div className="relative h-screen w-full flex flex-col overflow-hidden">
      {/* HEADER SECTION */}
      <header className="z-20 p-4 pb-2 glass border-b border-white/5">
        <div className="max-w-4xl mx-auto space-y-4">
          <RencanaHeader 
            rencanaList={rencanaList}
            activeRencana={activeRencana}
            onSelect={setActiveRencanaId}
            onCreate={createRencana}
            onDelete={deleteRencana}
          />
        </div>
      </header>

      {/* MAP SECTION - FULL SCREEN BACKGROUND */}
      <main className="flex-1 relative z-10">
        {activeRencana ? (
          <BungMap 
            rencana={activeRencana} 
            onUpdateStatus={(bid, status, paid) => updateBuyerStatus(activeRencana.id, bid, status, paid)}
          />
        ) : (
          <div className="w-full h-full flex flex-col items-center justify-center p-8 text-center space-y-6">
            <div className="p-8 bg-primary/10 rounded-full glow-blue">
               <Package className="w-20 h-20 text-primary animate-bounce" />
            </div>
            <div>
              <h2 className="text-3xl font-black mb-2 italic">BUNG'KURIR📦</h2>
              <p className="text-muted-foreground text-sm max-w-xs mx-auto">
                Halo Bung! Sio, ko belum ada antaran? 
                Buat rencana dolo baru gas keliling kota!
              </p>
            </div>
            <Button 
              size="lg" 
              className="px-10 h-16 text-xl font-black bg-primary glow-blue rounded-2xl"
              onClick={() => {
                const names = ['Gas Pagi', 'Keliling Kota Dolo', 'Paket Hari Ini', 'Gas Sore'];
                const randomName = names[Math.floor(Math.random() * names.length)];
                createRencana(randomName);
              }}
            >
              GAS BUAT RENCANA!
            </Button>
          </div>
        )}

        {/* FLOATING ACTION BUTTONS */}
        {activeRencana && (
          <div className="absolute top-4 right-4 flex flex-col gap-3 z-30">
            <Sheet open={sidebarOpen} onOpenChange={setSidebarOpen}>
              <SheetTrigger asChild>
                <Button size="icon" className="w-14 h-14 rounded-2xl glass glow-blue">
                  <Menu className="w-7 h-7" />
                </Button>
              </SheetTrigger>
              <SheetContent side="right" className="p-0 glass border-none w-[320px]">
                <SheetHeader className="sr-only">
                  <SheetTitle>Daftar Antaran</SheetTitle>
                  <SheetDescription>Daftar paket yang harus diantar hari ini dalam rencana aktif.</SheetDescription>
                </SheetHeader>
                <BuyerList 
                  buyers={activeRencana.buyers} 
                  onDelete={(id) => deleteBuyer(activeRencana.id, id)}
                />
              </SheetContent>
            </Sheet>

            <Button 
              size="icon" 
              className={`w-14 h-14 rounded-2xl glass transition-all ${showSummary ? 'bg-accent text-white' : 'glow-orange'}`}
              onClick={() => setShowSummary(!showSummary)}
            >
              <LayoutDashboard className="w-7 h-7" />
            </Button>
          </div>
        )}
      </main>

      {/* BOTTOM SECTION - CONTROLS & SUMMARY */}
      <footer className="z-20 p-4 max-w-4xl mx-auto w-full">
        {activeRencana && (
          <div className="space-y-4">
            {showSummary && (
              <div className="animate-in slide-in-from-bottom-4 duration-300">
                 <Summary rencana={activeRencana} />
              </div>
            )}
            
            <div className="flex gap-4">
              <AddBuyer 
                onAdd={(data) => addBuyer(activeRencana.id, data)}
                disabled={!activeRencana}
              />
            </div>
          </div>
        )}
      </footer>

      {/* EASTERN INDONESIA VIBE BADGE */}
      <div className="fixed bottom-2 left-4 text-[10px] font-black text-muted-foreground/30 uppercase tracking-[0.2em] pointer-events-none z-50">
        ALAT TEMPUR KURIR INDONESIA TIMUR 🔥
      </div>
    </div>
  );
}
