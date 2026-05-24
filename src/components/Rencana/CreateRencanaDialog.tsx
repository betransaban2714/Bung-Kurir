'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from '@/components/ui/dialog';
import { MapPin, Loader2 } from 'lucide-react';

interface CreateRencanaDialogProps {
  onCreate: (name: string, location?: any) => void;
  trigger?: React.ReactNode;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
}

export function CreateRencanaDialog({ onCreate, trigger, open: controlledOpen, onOpenChange }: CreateRencanaDialogProps) {
  const [internalOpen, setInternalOpen] = useState(false);
  const [newName, setNewName] = useState('');
  const [loading, setLoading] = useState(false);

  const open = controlledOpen !== undefined ? controlledOpen : internalOpen;
  const setOpen = onOpenChange !== undefined ? onOpenChange : setInternalOpen;

  const handleCreate = () => {
    if (!newName.trim()) return;
    
    setLoading(true);
    
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
    <Dialog open={open} onOpenChange={setOpen}>
      {trigger && <DialogTrigger asChild>{trigger}</DialogTrigger>}
      <DialogContent className="glass border-none shadow-2xl z-[100]">
        <DialogHeader>
          <DialogTitle className="text-2xl font-black text-white">GAS RENCANA BARU! 📦</DialogTitle>
        </DialogHeader>
        <div className="py-4 space-y-4">
          <div className="space-y-2">
            <label className="text-xs font-bold text-muted-foreground uppercase">KASI NAMA RENCANA</label>
            <Input 
              placeholder="Contoh: Gas Pagi, Keliling Kota..." 
              className="h-14 text-lg font-bold bg-secondary/50 border-white/5 focus:ring-primary"
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleCreate()}
              autoFocus
            />
          </div>
          <div className="p-4 bg-primary/10 rounded-2xl border border-primary/20 flex gap-3 items-start">
            <MapPin className="text-primary w-6 h-6 shrink-0" />
            <p className="text-[11px] text-muted-foreground leading-snug">
              Bung'Kurir akan otomatis ambil lokasi ko sekarang sebagai titik start pengantaran. Pastikan GPS nyala e! 🔥
            </p>
          </div>
        </div>
        <DialogFooter>
          <Button 
            onClick={handleCreate} 
            disabled={loading || !newName.trim()}
            className="w-full h-14 text-xl font-black bg-primary glow-blue active:scale-95 transition-all"
          >
            {loading ? <Loader2 className="animate-spin mr-2" /> : "BUAT SEKARANG!"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
