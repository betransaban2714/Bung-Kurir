
'use client';

import dynamic from 'next/dynamic';
import { useState, useEffect } from 'react';
import { useKurirStore } from '@/store/useKurirStore';
import { RencanaHeader } from '@/components/Rencana/RencanaHeader';
import { Summary } from '@/components/Dashboard/Summary';
import { AddBuyer } from '@/components/Buyer/AddBuyer';
import { BuyerList } from '@/components/Buyer/BuyerList';
import { 
  Menu, 
  LayoutDashboard, 
  Package,
  Copyright
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
import { CreateRencanaDialog } from '@/components/Rencana/CreateRencanaDialog';

const BungMap = dynamic(() => import('@/components/Map/BungMap'), { 
  ssr: false,
  loading: () => (
    <div className="w-full h-full bg-black/40 animate-pulse flex flex-col items-center justify-center text-muted-foreground gap-4">
      <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
      <p className="font-black italic tracking-widest text-xs uppercase">SABAR EE BUNG, LOADING DULU...🌍</p>
    </div>
  )
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
  
  // ONBOARDING STATE
  const [onboardingStep, setOnboardingStep] = useState(0); // 0: idle, 1: buyer list, 2: summary, 3: finished

  useEffect(() => {
    if (isHydrated) {
      // Mulai panduan setelah hidrasi selesai
      const step1Timer = setTimeout(() => setOnboardingStep(1), 1000);
      const step2Timer = setTimeout(() => setOnboardingStep(2), 5000);
      const endTimer = setTimeout(() => setOnboardingStep(3), 9000);

      return () => {
        clearTimeout(step1Timer);
        clearTimeout(step2Timer);
        clearTimeout(endTimer);
      };
    }
  }, [isHydrated]);

  if (!isHydrated) return null;

  return (
    <div className="relative h-[100dvh] w-full flex flex-col overflow-hidden bg-[#050505] p-2 md:p-4">
      {/* HEADER */}
      <header className="z-20 p-4 pb-4 glass-dark rounded-3xl border border-white/5 shrink-0 mb-2">
        <div className="max-w-4xl mx-auto">
          <RencanaHeader 
            rencanaList={rencanaList}
            activeRencana={activeRencana}
            onSelect={setActiveRencanaId}
            onCreate={createRencana}
            onDelete={deleteRencana}
          />
        </div>
      </header>

      {/* MAP AREA */}
      <main className="flex-1 relative z-10 overflow-hidden rounded-[2rem] border border-white/5 bg-black/50 shadow-2xl">
        {activeRencana ? (
          <div className="w-full h-full p-1">
             <div className="w-full h-full rounded-[1.8rem] overflow-hidden border border-white/5 relative bg-black">
                <BungMap 
                  rencana={activeRencana} 
                  onUpdateStatus={(bid, status, paid) => updateBuyerStatus(activeRencana.id, bid, status, paid)}
                />
                
                <div className="absolute top-4 right-4 flex flex-col gap-3 z-30">
                  <div className="relative">
                    {/* PANDUAN DAFTAR BUYER */}
                    {onboardingStep === 1 && (
                      <div className="absolute right-full mr-4 top-1/2 -translate-y-1/2 whitespace-nowrap animate-in fade-in slide-in-from-right-4 duration-500">
                        <div className="glass-dark text-white font-black text-xs px-4 py-3 rounded-2xl shadow-2xl flex items-center gap-2 border border-white/10">
                          Pantau daftar Buyer di sini 👉
                        </div>
                      </div>
                    )}
                    <Sheet open={sidebarOpen} onOpenChange={setSidebarOpen}>
                      <SheetTrigger asChild>
                        <Button size="icon" className="w-14 h-14 rounded-2xl glass-dark shadow-2xl glow-blue active:scale-95 transition-all">
                          <Menu className="w-7 h-7" />
                        </Button>
                      </SheetTrigger>
                      <SheetContent side="right" className="p-0 glass border-none w-[85vw] sm:w-[350px]">
                        <SheetHeader className="sr-only">
                          <SheetTitle>Daftar Buyer</SheetTitle>
                          <SheetDescription>Daftar paket yang harus ngana antar hari ini.</SheetDescription>
                        </SheetHeader>
                        <BuyerList 
                          buyers={activeRencana.buyers} 
                          onDelete={(id) => deleteBuyer(activeRencana.id, id)}
                        />
                      </SheetContent>
                    </Sheet>
                  </div>

                  <div className="relative">
                    {/* PANDUAN INFO PENGANTARAN */}
                    {onboardingStep === 2 && (
                      <div className="absolute right-full mr-4 top-1/2 -translate-y-1/2 whitespace-nowrap animate-in fade-in slide-in-from-right-4 duration-500">
                        <div className="glass-dark text-white font-black text-xs px-4 py-3 rounded-2xl shadow-2xl flex items-center gap-2 border border-white/10">
                          Pantau pengantaran hari ini disini 👉
                        </div>
                      </div>
                    )}
                    <Button 
                      size="icon" 
                      className={`w-14 h-14 rounded-2xl glass-dark shadow-2xl transition-all active:scale-95 ${showSummary ? 'bg-accent text-white scale-110' : 'glow-orange'}`}
                      onClick={() => setShowSummary(!showSummary)}
                    >
                      <LayoutDashboard className="w-7 h-7" />
                    </Button>
                  </div>
                </div>
             </div>
          </div>
        ) : (
          <div className="w-full h-full flex flex-col items-center justify-center p-8 text-center space-y-8 bg-black/40">
            <div className="relative">
              <div className="absolute inset-0 bg-primary/20 blur-3xl rounded-full scale-150 animate-pulse"></div>
              <div className="relative p-10 bg-primary/10 rounded-full glow-blue">
                 <Package className="w-24 h-24 text-primary animate-bounce" />
              </div>
            </div>
            <div className="space-y-3">
              <h2 className="text-4xl font-black italic tracking-tighter uppercase text-white drop-shadow-2xl">Bung'Kurir 📦</h2>
              <div className="text-muted-foreground text-sm max-w-xs mx-auto font-medium space-y-1">
                <p>Halo Bung! Bolong ada rencana ba antar?</p>
                <p>Taru samua disini dulu, Baru Gass ba Antar!🔥</p>
              </div>
            </div>
            <div className="flex flex-col gap-4 w-full max-w-xs">
              <CreateRencanaDialog 
                onCreate={createRencana}
                trigger={
                  <Button 
                    size="lg" 
                    className="w-full h-16 text-xl font-black bg-primary hover:bg-primary/90 glow-blue rounded-2xl transition-all active:scale-95"
                  >
                    GAS BIKING RENCANA!
                  </Button>
                }
              />
              <div className="relative">
                {/* PANDUAN INFO PENGANTARAN (SAAT BELUM ADA RENCANA) */}
                {onboardingStep === 2 && (
                  <div className="absolute right-full mr-4 top-1/2 -translate-y-1/2 whitespace-nowrap animate-in fade-in slide-in-from-right-4 duration-500 z-50">
                    <div className="glass-dark text-white font-black text-xs px-4 py-3 rounded-2xl shadow-2xl flex items-center gap-2 border border-white/10">
                      Pantau pengantaran hari ini disini 👉
                    </div>
                  </div>
                )}
                <Button 
                  variant="ghost"
                  className={`h-12 w-full text-muted-foreground font-black text-xs tracking-widest uppercase hover:bg-white/5 rounded-xl ${onboardingStep === 2 ? 'bg-white/5 ring-1 ring-accent/30' : ''}`}
                  onClick={() => setShowSummary(!showSummary)}
                >
                  <LayoutDashboard className="w-4 h-4 mr-2" /> {showSummary ? "Tutup Laporan" : "Lihat Laporan Hari Ini"}
                </Button>
              </div>
            </div>
          </div>
        )}
      </main>

      {/* FOOTER / SUMMARY AREA */}
      <footer className="z-20 p-4 pt-4 max-w-4xl mx-auto w-full shrink-0 mt-2 glass-dark border border-white/5 rounded-3xl">
        <div className="space-y-4">
          {showSummary && (
            <div className="animate-in slide-in-from-bottom-8 duration-500 cubic-bezier(0.16, 1, 0.3, 1)">
               <Summary rencanaList={rencanaList} />
            </div>
          )}
          
          {activeRencana && (
            <div className="flex gap-4">
              <AddBuyer 
                onAdd={(data) => addBuyer(activeRencana.id, data)}
                disabled={!activeRencana}
              />
            </div>
          )}
        </div>
      </footer>

      {/* WATERMARK CENTER */}
      <div className="fixed bottom-1 left-1/2 -translate-x-1/2 text-[8px] font-black text-white/10 uppercase tracking-[0.3em] pointer-events-none z-50 whitespace-nowrap">
        ALAT TEMPUR KURIR INDONESIA TIMUR 🔥
      </div>

      {/* WATERMARK BETRAN - Polos, Transparansi 18% */}
      <div className="fixed bottom-4 right-4 text-[10px] font-medium flex items-center gap-1 pointer-events-none z-50">
        <Copyright className="w-3 h-3 text-white/[0.18]" /> <span className="text-white/[0.18] tracking-wider font-normal">byBetranSaban</span>
      </div>
    </div>
  );
}
