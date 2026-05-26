'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Plus, ChevronDown, Trash2, CalendarDays, Info, AlertTriangle, Copyright, Download } from 'lucide-react';
import { Jadwal } from '@/types';
import { CreateRencanaDialog } from './CreateRencanaDialog';

interface RencanaHeaderProps {
  jadwalList: Jadwal[];
  activeJadwal: Jadwal | null;
  onSelect: (id: string) => void;
  onCreate: (name: string, location?: any) => void;
  onDelete: (id: string) => void;
}

export function RencanaHeader({ jadwalList, activeJadwal, onSelect, onCreate, onDelete }: RencanaHeaderProps) {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isInfoOpen, setIsInfoOpen] = useState(false);
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [isStandalone, setIsStandalone] = useState(false);

  useEffect(() => {
    // Detect if app is running in standalone mode (installed)
    const checkStandalone = () => {
      const isStandaloneMode = window.matchMedia('(display-mode: standalone)').matches 
        || (navigator as any).standalone 
        || document.referrer.includes('android-app://');
      setIsStandalone(isStandaloneMode);
    };

    checkStandalone();

    const handleBeforeInstallPrompt = (e: any) => {
      e.preventDefault();
      setDeferredPrompt(e);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    };
  }, []);

  const handleInstallClick = async () => {
    if (!deferredPrompt) return;
    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    if (outcome === 'accepted') {
      setDeferredPrompt(null);
    }
  };

  return (
    <div className="flex items-center justify-between gap-4">
      <div className="flex-1">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="h-auto p-0 hover:bg-transparent text-left block w-full group">
              <div className="flex items-center gap-2 mb-1">
                <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">JADWAL AKTIF</span>
                <ChevronDown className="w-3 h-3 text-muted-foreground group-hover:text-foreground" />
              </div>
              <h1 className="text-2xl font-black truncate max-w-[200px] text-primary">
                {activeJadwal ? activeJadwal.name : 'PILIH JADWAL...'}
              </h1>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent className="glass w-64 p-2 rounded-2xl border-none shadow-2xl">
            {jadwalList.length === 0 && (
              <p className="text-xs text-muted-foreground p-3 text-center italic">Belum ada jadwal, buat dolo!</p>
            )}
            {jadwalList.map((r) => (
              <div key={r.id} className="flex items-center gap-1">
                <DropdownMenuItem 
                  className="flex-1 cursor-pointer font-bold h-10 px-3 rounded-xl focus:bg-primary/20"
                  onClick={() => onSelect(r.id)}
                >
                  <span className="truncate">{r.name}</span>
                </DropdownMenuItem>
                
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button 
                      size="icon" 
                      variant="ghost" 
                      className="h-8 w-8 text-muted-foreground hover:text-red-400 shrink-0"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent className="glass border-none rounded-[2.5rem] shadow-2xl max-w-[320px] mx-auto">
                    <AlertDialogHeader className="items-center text-center">
                      <div className="w-16 h-16 bg-red-500/10 rounded-full flex items-center justify-center mb-2">
                         <AlertTriangle className="w-8 h-8 text-red-500" />
                      </div>
                      <AlertDialogTitle className="text-xl font-black text-white italic">HAPUS JADWAL?</AlertDialogTitle>
                      <AlertDialogDescription className="text-xs font-medium text-muted-foreground">
                        Yakin mo hapus jadwal <span className="text-white font-bold">{r.name}</span>? Semua data buyer di dalam situ nanti hilang e.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter className="flex-col sm:flex-col gap-2 mt-4">
                      <AlertDialogAction 
                        onClick={() => onDelete(r.id)}
                        className="w-full bg-red-500 hover:bg-red-600 text-white font-black h-12 rounded-2xl"
                      >
                        IYO, HAPUS!
                      </AlertDialogAction>
                      <AlertDialogCancel className="w-full bg-white/5 border-none hover:bg-white/10 text-white font-black h-12 rounded-2xl m-0">
                        TRA JADI
                      </AlertDialogCancel>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              </div>
            ))}
            <DropdownMenuSeparator className="bg-white/5 mx-2" />
            <DropdownMenuItem 
              className="cursor-pointer font-bold h-10 px-3 text-accent focus:text-accent focus:bg-accent/10 rounded-xl"
              onSelect={(e) => {
                e.preventDefault();
                setIsDialogOpen(true);
              }}
            >
              <Plus className="w-4 h-4 mr-2" /> BUAT JADWAL BARU
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      <div className="flex items-center gap-2">
        <div className="p-2 bg-secondary/60 rounded-2xl flex items-center gap-2 border border-white/5 shadow-inner">
          <CalendarDays className="w-4 h-4 text-muted-foreground" />
          <span className="text-[10px] font-black text-muted-foreground uppercase">
            {new Date().toLocaleDateString('id-ID', { day: 'numeric', month: 'short' })}
          </span>
        </div>

        <Button 
          variant="ghost" 
          size="icon" 
          className="h-10 w-10 rounded-2xl bg-primary/10 border border-primary/20 text-primary hover:bg-primary/20 active:scale-90 transition-all shadow-xl"
          onClick={() => setIsInfoOpen(true)}
        >
          <Info className="w-5 h-5" />
        </Button>
      </div>

      <CreateRencanaDialog 
        open={isDialogOpen}
        onOpenChange={setIsDialogOpen}
        onCreate={(name, loc) => {
          onCreate(name, loc);
          setIsDialogOpen(false);
        }}
      />

      <Dialog open={isInfoOpen} onOpenChange={setIsInfoOpen}>
        <DialogContent className="glass-dark border border-white/10 shadow-[0_0_50px_-12px_rgba(59,130,246,0.3)] rounded-[3rem] w-[92vw] sm:max-w-[420px] p-0 overflow-hidden">
          <div className="relative p-8 space-y-8">
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-48 h-48 bg-primary/20 blur-[80px] -z-10 rounded-full" />
            
            <DialogHeader className="space-y-4">
              <div className="w-24 h-24 bg-gradient-to-br from-primary/30 to-primary/5 rounded-[2rem] flex items-center justify-center mx-auto border border-white/10 shadow-2xl relative">
                 <div className="absolute inset-0 bg-primary/10 rounded-[2rem] animate-pulse" />
                 <span className="text-4xl">📦</span>
              </div>
              <div className="space-y-1">
                <DialogTitle className="text-4xl font-black text-center text-white italic tracking-tighter uppercase leading-none text-glow">
                  Bung'Kurir
                </DialogTitle>
                <p className="text-[10px] text-center font-black text-primary tracking-[0.4em] uppercase opacity-80">
                  Alat Tempur Kurir Modern
                </p>
              </div>
              <DialogDescription className="sr-only">Informasi Pembuat Aplikasi</DialogDescription>
            </DialogHeader>
            
            <div className="space-y-6">
              <div className="text-center space-y-3">
                <div className="flex items-center justify-center gap-2 text-muted-foreground">
                  <span className="h-px w-8 bg-white/10" />
                  <p className="text-[10px] font-black uppercase tracking-[0.3em]">Pembuat</p>
                  <span className="h-px w-8 bg-white/10" />
                </div>
                <h2 
                  onClick={() => window.open('https://wa.me/6282196913604', '_blank')}
                  className="text-3xl font-black text-white drop-shadow-[0_0_15px_rgba(255,255,255,0.3)] cursor-pointer hover:text-primary transition-all active:scale-95"
                >
                  Betran Saban
                </h2>
              </div>

              <div className="glass-dark p-6 rounded-[2.5rem] border border-white/10 space-y-4 shadow-2xl">
                <div className="flex items-center justify-center gap-2 px-2">
                  <span className="text-[11px] font-black text-primary uppercase tracking-widest text-center">Apa fungsi App ini? 🤔</span>
                </div>

                <div className="h-px bg-gradient-to-r from-transparent via-white/10 to-transparent w-full" />
                
                <div className="px-2">
                  <p className="text-[10px] text-center text-muted-foreground/80 font-medium italic leading-relaxed">
                    Aplikasi ini dibuat hanya untuk mempermudah rute pengantaran, agar Kurir dapat menentukan lokasi pengantaran mana yang harus dituju duluan agar tidak bolak balik keliling kota, dan juga memantau kinerja harian.
                  </p>
                </div>
              </div>

              {/* Install button only shows in browser mode, hidden in PWA mode */}
              {deferredPrompt && !isStandalone && (
                <div className="animate-in fade-in zoom-in-95 duration-500 pt-2">
                  <Button 
                    onClick={handleInstallClick}
                    className="w-full h-11 bg-primary/20 hover:bg-primary/30 text-primary font-black text-sm rounded-xl border border-primary/30 gap-2 active:scale-95 transition-all"
                  >
                    <Download className="w-4 h-4" /> INSTAL APLIKASI
                  </Button>
                </div>
              )}
            </div>

            <div className="pt-2 flex items-center justify-center gap-2 opacity-30">
              <Copyright className="w-3 h-3" />
              <span className="text-[9px] font-black uppercase tracking-widest">2026 BetranSaban</span>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
