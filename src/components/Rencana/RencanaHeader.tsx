'use client';

import { useState } from 'react';
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
import { Plus, ChevronDown, Trash2, CalendarDays, Info, ExternalLink } from 'lucide-react';
import { Rencana } from '@/types';
import { CreateRencanaDialog } from './CreateRencanaDialog';

interface RencanaHeaderProps {
  rencanaList: Rencana[];
  activeRencana: Rencana | null;
  onSelect: (id: string) => void;
  onCreate: (name: string, location?: any) => void;
  onDelete: (id: string) => void;
}

export function RencanaHeader({ rencanaList, activeRencana, onSelect, onCreate, onDelete }: RencanaHeaderProps) {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isInfoOpen, setIsInfoOpen] = useState(false);

  return (
    <div className="flex items-center justify-between gap-4">
      <div className="flex-1">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="h-auto p-0 hover:bg-transparent text-left block w-full group">
              <div className="flex items-center gap-2 mb-1">
                <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">RENCANA AKTIF</span>
                <ChevronDown className="w-3 h-3 text-muted-foreground group-hover:text-foreground" />
              </div>
              <h1 className="text-2xl font-black truncate max-w-[200px] text-primary">
                {activeRencana ? activeRencana.name : 'PILIH RENCANA...'}
              </h1>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent className="glass w-64 p-2 rounded-2xl border-none shadow-2xl">
            {rencanaList.length === 0 && (
              <p className="text-xs text-muted-foreground p-3 text-center italic">Belum ada rencana, buat dolo!</p>
            )}
            {rencanaList.map((r) => (
              <div key={r.id} className="flex items-center gap-1">
                <DropdownMenuItem 
                  className="flex-1 cursor-pointer font-bold h-10 px-3 rounded-xl focus:bg-primary/20"
                  onClick={() => onSelect(r.id)}
                >
                  <span className="truncate">{r.name}</span>
                </DropdownMenuItem>
                <Button 
                  size="icon" 
                  variant="ghost" 
                  className="h-8 w-8 text-muted-foreground hover:text-red-400 shrink-0"
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    onDelete(r.id);
                  }}
                >
                  <Trash2 className="w-4 h-4" />
                </Button>
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
              <Plus className="w-4 h-4 mr-2" /> BUAT RENCANA BARU
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
          className="h-10 w-10 rounded-2xl bg-primary/10 border border-primary/20 text-primary hover:bg-primary/20 active:scale-90 transition-all"
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

      {/* DIALOG KREDIT */}
      <Dialog open={isInfoOpen} onOpenChange={setIsInfoOpen}>
        <DialogContent className="glass border-none shadow-2xl rounded-[2.5rem] w-[90vw] sm:max-w-[400px] p-8">
          <DialogHeader className="space-y-4">
            <div className="w-20 h-20 bg-primary/20 rounded-full flex items-center justify-center mx-auto border-4 border-primary/30 animate-pulse">
               <Info className="w-10 h-10 text-primary" />
            </div>
            <DialogTitle className="text-3xl font-black text-center text-white italic tracking-tighter uppercase">
              Bung'Kurir 📦
            </DialogTitle>
            <DialogDescription className="sr-only">Informasi Pembuat Aplikasi</DialogDescription>
          </DialogHeader>
          
          <div className="py-6 space-y-6">
            <div className="text-center space-y-2">
              <p className="text-[10px] font-black text-muted-foreground uppercase tracking-[0.3em]">Developer / Pembuat</p>
              <h2 className="text-2xl font-black text-primary">Betran Saban</h2>
            </div>

            <div className="bg-white/5 p-5 rounded-3xl border border-white/5 space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-bold text-muted-foreground uppercase">Status:</span>
                <span className="text-[11px] font-black text-green-400 bg-green-400/10 px-3 py-1 rounded-full border border-green-400/20">ONLINE 🔥</span>
              </div>
              <div className="h-px bg-white/5 w-full" />
              <div className="space-y-2">
                <p className="text-[11px] font-bold text-muted-foreground uppercase">Hubungi Saya:</p>
                <Button 
                  className="w-full h-14 bg-green-500 hover:bg-green-600 font-black text-white rounded-2xl gap-2 active:scale-95 transition-all shadow-xl"
                  onClick={() => window.open('https://wa.me/6282196913604', '_blank')}
                >
                  WHATSAPP <ExternalLink className="w-4 h-4" />
                </Button>
              </div>
            </div>

            <p className="text-[9px] text-center text-muted-foreground font-medium italic leading-relaxed px-4">
              "Aplikasi ini dibuat khusus untuk mempermudah operasional kurir di wilayah Indonesia Timur. Terus semangat antar paket dolo Bung! 🔥"
            </p>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
