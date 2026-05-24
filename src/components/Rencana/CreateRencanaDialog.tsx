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
}

export function CreateRencanaDialog({ onCreate, trigger }: CreateRencanaDialogProps) {
  const [newName, setNewName] = useState('');
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);

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
      <DialogTrigger asChild>
        {trigger}
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
  );
}
