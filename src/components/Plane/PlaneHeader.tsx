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
import { Plus, ChevronDown, Trash2, CalendarDays, MapPin } from 'lucide-react';
import { Plane } from '@/types';

interface PlaneHeaderProps {
  planes: Plane[];
  activePlane: Plane | null;
  onSelect: (id: string) => void;
  onCreate: (name: string) => void;
  onDelete: (id: string) => void;
}

export function PlaneHeader({ planes, activePlane, onSelect, onCreate, onDelete }: PlaneHeaderProps) {
  const [newPlaneName, setNewPlaneName] = useState('');
  const [open, setOpen] = useState(false);

  const handleCreate = () => {
    if (newPlaneName.trim()) {
      onCreate(newPlaneName);
      setNewPlaneName('');
      setOpen(false);
    }
  };

  return (
    <div className="flex items-center justify-between gap-4">
      <div className="flex-1">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="h-auto p-0 hover:bg-transparent text-left block w-full group">
              <div className="flex items-center gap-2 mb-1">
                <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">PLANE AKTIF</span>
                <ChevronDown className="w-3 h-3 text-muted-foreground group-hover:text-foreground" />
              </div>
              <h1 className="text-2xl font-black truncate max-w-[200px] text-primary">
                {activePlane ? activePlane.name : 'PILIH PLANE...'}
              </h1>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent className="glass w-56 p-2">
            {planes.length === 0 && (
              <p className="text-xs text-muted-foreground p-3 text-center italic">Belum ada plane, buat dolo!</p>
            )}
            {planes.map((p) => (
              <div key={p.id} className="flex items-center gap-1">
                <DropdownMenuItem 
                  className="flex-1 cursor-pointer font-bold h-10 px-3"
                  onClick={() => onSelect(p.id)}
                >
                  {p.name}
                </DropdownMenuItem>
                <Button 
                  size="icon" 
                  variant="ghost" 
                  className="h-8 w-8 text-muted-foreground hover:text-red-400"
                  onClick={(e) => {
                    e.stopPropagation();
                    onDelete(p.id);
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
                  <Plus className="w-4 h-4 mr-2" /> BUAT PLANE BARU
                </DropdownMenuItem>
              </DialogTrigger>
              <DialogContent className="glass border-none">
                <DialogHeader>
                  <DialogTitle className="text-2xl font-black">GAS PLANE BARU! 📦</DialogTitle>
                </DialogHeader>
                <div className="py-4 space-y-4">
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-muted-foreground">KASI NAMA PLANE</label>
                    <Input 
                      placeholder="Contoh: Gas Pagi, Keliling Kota Dolo..." 
                      className="h-12 text-lg font-bold bg-secondary/50"
                      value={newPlaneName}
                      onChange={(e) => setNewPlaneName(e.target.value)}
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
                  <Button onClick={handleCreate} className="w-full h-12 text-lg font-black bg-primary">BUAT SEKARANG!</Button>
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