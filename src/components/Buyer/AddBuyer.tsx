'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
  DialogDescription,
} from '@/components/ui/dialog';
import { Plus, Loader2, MapPin, Send, Map as MapIcon } from 'lucide-react';
import { extractLocationData } from '@/ai/flows/location-data-extractor';
import { useToast } from '@/hooks/use-toast';
import dynamic from 'next/dynamic';

const MapPicker = dynamic(() => import('@/components/Map/MapPicker'), { 
  ssr: false,
  loading: () => <div className="h-[400px] w-full bg-secondary/20 animate-pulse flex items-center justify-center font-black italic text-xs uppercase text-muted-foreground">SABAR, MAPS ADA LOADING... 🌍</div>
});

interface AddBuyerProps {
  onAdd: (data: any) => void;
  disabled?: boolean;
}

export function AddBuyer({ onAdd, disabled }: AddBuyerProps) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [showPicker, setShowPicker] = useState(false);
  const { toast } = useToast();

  const [formData, setFormData] = useState({
    name: '',
    locationInput: '',
    manualCoords: null as { lat: number; lng: number } | null,
  });

  const handleManualLocation = (coords: { lat: number; lng: number }) => {
    setFormData({ 
      ...formData, 
      manualCoords: coords, 
      locationInput: `Lokasi Manual (${coords.lat.toFixed(5)}, ${coords.lng.toFixed(5)})` 
    });
    setShowPicker(false);
    toast({ title: 'Lokasi Terpasang!', description: 'Koordinat su tersimpan otomatis.' });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name || !formData.locationInput) {
      toast({ title: 'Isi dolo!', description: 'Nama deng lokasi jang kosong e.', variant: 'destructive' });
      return;
    }

    setLoading(true);
    try {
      let latitude: number;
      let longitude: number;
      let address: string = formData.locationInput;

      if (formData.manualCoords) {
        latitude = formData.manualCoords.lat;
        longitude = formData.manualCoords.lng;
      } else {
        // DISINI FUNGSI AI NYA PACE: Baca teks lokasi kotor jadi koordinat bersih
        const location = await extractLocationData({ locationInput: formData.locationInput });
        latitude = location.latitude;
        longitude = location.longitude;
        address = location.parsedAddress || formData.locationInput;
      }
      
      onAdd({
        name: formData.name,
        address: address,
        latitude: latitude,
        longitude: longitude,
      });

      setOpen(false);
      setFormData({
        name: '',
        locationInput: '',
        manualCoords: null,
      });
      toast({ title: 'Mantap!', description: 'Buyer su masuk daftar.' });
    } catch (error) {
      console.error(error);
      toast({ title: 'Gagal e!', description: 'Lokasi tra terbaca, coba cek link maps atau pilih manual dolo.', variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogTrigger asChild>
          <Button 
            disabled={disabled}
            className="w-full h-16 text-xl font-black rounded-3xl bg-primary hover:bg-primary/90 shadow-2xl glow-blue active:scale-95 transition-all gap-3"
          >
            <Plus className="w-8 h-8" /> TAMBAH BUYER
          </Button>
        </DialogTrigger>
        <DialogContent className="glass w-[92vw] mx-auto sm:max-w-[450px] rounded-[2.5rem] border-none shadow-2xl p-6 md:p-8 overflow-y-auto max-h-[90dvh]">
          <DialogHeader className="space-y-1">
            <DialogTitle className="text-3xl font-black flex items-center gap-2 text-white">
              <MapPin className="text-primary w-8 h-8" /> MO ANTAR KA MANA?
            </DialogTitle>
            <DialogDescription className="text-muted-foreground font-medium italic text-sm">
              Tulis Nama deng Lokasi saja Pace, biar AI yang urus sisanya! 🔥
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-6 pt-4">
            <div className="space-y-2">
              <Label htmlFor="name" className="text-muted-foreground font-black uppercase tracking-widest text-[10px]">Nama Buyer</Label>
              <Input
                id="name"
                placeholder="Tulis Nama Penerima"
                className="bg-secondary/40 h-14 text-lg font-black rounded-2xl border-white/5 focus:ring-primary"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              />
            </div>

            <div className="space-y-2">
              <div className="flex justify-between items-center px-1">
                <Label htmlFor="location" className="text-muted-foreground font-black uppercase tracking-widest text-[10px]">Lokasi Antar (Bisa Paste Link Maps)</Label>
                <Button 
                  type="button" 
                  variant="ghost" 
                  size="sm" 
                  className="text-primary h-8 gap-1 font-black text-[11px] hover:bg-primary/10 rounded-lg"
                  onClick={() => setShowPicker(true)}
                >
                  <MapIcon className="w-4 h-4" /> PILIH DI MAPS
                </Button>
              </div>
              <Input
                id="location"
                placeholder="Paste Link Maps atau Koordinat"
                className={`bg-secondary/40 h-14 text-xs rounded-2xl border-white/5 transition-all ${formData.manualCoords ? 'border-primary/50 ring-2 ring-primary/20 bg-primary/5' : ''}`}
                value={formData.locationInput}
                onChange={(e) => setFormData({ ...formData, locationInput: e.target.value, manualCoords: null })}
              />
            </div>

            <DialogFooter className="pt-2">
              <Button 
                type="submit" 
                className="w-full h-16 text-2xl font-black bg-accent hover:bg-accent/90 rounded-2xl glow-orange transition-all active:scale-95"
                disabled={loading}
              >
                {loading ? (
                  <>
                    <Loader2 className="mr-2 h-7 w-7 animate-spin" /> PROSES LOKASI...
                  </>
                ) : (
                  <>
                    GAS TAMBAH! <Send className="ml-2 w-7 h-7" />
                  </>
                )}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <Dialog open={showPicker} onOpenChange={setShowPicker}>
        <DialogContent className="w-[94vw] h-[85dvh] p-0 glass rounded-[2.5rem] border-none overflow-hidden flex flex-col z-[200]">
          <DialogHeader className="p-5 bg-background/60 backdrop-blur-md border-b border-white/5 shrink-0">
            <DialogTitle className="font-black text-2xl text-white">PILIH LOKASI ANTAR 📍</DialogTitle>
          </DialogHeader>
          <div className="flex-1 relative">
            <MapPicker onSelect={handleManualLocation} />
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}