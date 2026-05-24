'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
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
  DialogTrigger,
  DialogFooter,
} from '@/components/ui/dialog';
import { Plus, ChevronDown, Trash2, CalendarDays, MapPin, Loader2 } from 'lucide-react';
import { Rencana } from '@/types';

interface RencanaHeaderProps {
  rencanaList: Rencana[];
  activeRencana: Rencana | null;
  onSelect: (id: string) => void;
  onCreate: (name: string, location?: any) => void;
  onDelete: (id: string) => void;
}

export function RencanaHeader({ rencanaList, activeRencana, onSelect, onCreate, onDelete }: RencanaHeaderProps) {
  const [newName, setNewName] = useState('');
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleCreate = () => {
    if (!newName.trim()) return;
    
    setLoading(true);
    
    // Try to get current location
    if ("geolocation" in navigator) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          onCreate(newName, {
            latitude: position.coords.latitude,
            longitude: position.coords.longitude,
            address: "Lokasi Start Saya"
          });
          setNewName('');
          setOpen(false);
          setLoading(false);
        },
        () => {
          // Fallback if geo fails
          onCreate(newName);
          setNewName('');
          setOpen(false);
          setLoading(false);
        }
      );
    } else {
      onCreate(newName);
      setNewName('');
      setOpen(false);
      setLoading(false);
    }
  };

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
          <DropdownMenuContent className="glass w-56 p-2">
            {rencanaList.length === 0 && (
              <p className="text-xs text-muted-foreground p-3 text-center italic">Belum ada rencana, buat dolo!</p>
            )}
            {rencanaList.map((r) => (
              <div key={r.id} className="flex items-center gap-1">
                <DropdownMenuItem 
                  className="flex-1 cursor-pointer font-bold h-10 px-3"
                  onClick={() => onSelect(r.id)}
                >
                  {r.name}
                </DropdownMenuItem>
                <Button 
                  size="icon" 
                  variant="ghost" 
                  className="h-8 w-8 text-muted-foreground hover:text-red-400"
                  onClick={(e) => {
                    e.stopPropagation();
                    onDelete(r.id);
                  }}
                >
                  <Trash2 className="w-4 h-4" />
                </Button>
              </div>
            ))}
            <DropdownMenuSeparator className="bg-white/5" />
            <Dialog open={open} onOpenChange={setOpen}>
              <DialogTrigger asChild>
                <DropdownMenuItem 
                  className="cursor-pointer font-bold h-10 px-3 text-accent focus:text-accent"
                  onSelect={(e) => e.preventDefault()}
                >
                  <Plus className="w-4 h-4 mr-2" /> BUAT RENCANA BARU
                </DropdownMenuItem>
              </DialogTrigger>
              <DialogContent className="glass border-none">
                <DialogHeader>
                  <DialogTitle className="text-2xl font-black">GAS RENCANA BARU! 📦</DialogTitle>
                </DialogHeader>
                <div className="py-4 space-y-4">
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-muted-foreground">KASI NAMA RENCANA</label>
                    <Input 
                      placeholder="Contoh: Gas Pagi, Keliling Kota Dolo..." 
                      className="h-12 text-lg font-bold bg-secondary/50"
                      value={newName}
                      onChange={(e) => setNewName(e.target.value)}
                      onKeyDown={(e) => e.key === 'Enter' && handleCreate()}
                    />
                  </div>
                  <div className="p-3 bg-primary/10 rounded-xl border border-primary/20 flex gap-3 items-start">
                    <MapPin className="text-primary w-5 h-5 shrink-0" />
                    <p className="text-xs text-muted-foreground leading-tight">
                      Bung'Kurir akan otomatis ambil lokasi ko sekarang sebagai titik start pengantaran. Mantap toh? 🔥
                    </p>
                  </div>
                </div>
                <DialogFooter>
                  <Button 
                    onClick={handleCreate} 
                    disabled={loading}
                    className="w-full h-12 text-lg font-black bg-primary"
                  >
                    {loading ? <Loader2 className="animate-spin" /> : "BUAT SEKARANG!"}
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      <div className="p-2 bg-secondary rounded-2xl flex items-center gap-2 border border-white/5 shadow-inner">
        <CalendarDays className="w-4 h-4 text-muted-foreground" />
        <span className="text-[10px] font-bold text-muted-foreground uppercase">
          {new Date().toLocaleDateString('id-ID', { day: 'numeric', month: 'short' })}
        </span>
      </div>
    </div>
  );
}
