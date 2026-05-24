'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
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
import { PacketType, PaymentStatus } from '@/types';
import dynamic from 'next/dynamic';

const MapPicker = dynamic(() => import('@/components/Map/MapPicker'), { 
  ssr: false,
  loading: () => <div className="h-[400px] w-full bg-secondary/20 animate-pulse flex items-center justify-center font-black italic text-xs uppercase text-muted-foreground">SABAR, MAPS LAGI LOADING... 🌍</div>
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
    waNumber: '',
    locationInput: '',
    price: '',
    packetType: 'STD' as PacketType,
    paymentMethod: 'COD' as PaymentStatus,
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
        const location = await extractLocationData({ locationInput: formData.locationInput });
        latitude = location.latitude;
        longitude = location.longitude;
        address = location.parsedAddress || formData.locationInput;
      }
      
      onAdd({
        name: formData.name,
        waNumber: formData.waNumber,
        address: address,
        latitude: latitude,
        longitude: longitude,
        price: parseFloat(formData.price) || 0,
        packetType: formData.packetType,
        paymentMethod: formData.paymentMethod,
      });

      setOpen(false);
      setFormData({
        name: '',
        waNumber: '',
        locationInput: '',
        price: '',
        packetType: 'STD',
        paymentMethod: 'COD',
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
        <DialogContent className="glass w-[92vw] sm:max-w-[450px] rounded-[2.5rem] border-none shadow-2xl p-6 md:p-8 overflow-y-auto max-h-[90dvh]">
          <DialogHeader className="space-y-1">
            <DialogTitle className="text-3xl font-black flex items-center gap-2 text-white">
              <MapPin className="text-primary w-8 h-8" /> MO ANTAR KA MANA?
            </DialogTitle>
            <DialogDescription className="text-muted-foreground font-medium italic text-sm">
              Isi data buyer deng lokasi antaran yang jelas e.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-6 pt-4">
            <div className="space-y-2">
              <Label htmlFor="name" className="text-muted-foreground font-black uppercase tracking-widest text-[10px]">Nama Buyer</Label>
              <Input
                id="name"
                placeholder="Contoh: Mama Ina"
                className="bg-secondary/40 h-14 text-lg font-black rounded-2xl border-white/5 focus:ring-primary"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              />
            </div>

            <div className="space-y-2">
              <div className="flex justify-between items-center px-1">
                <Label htmlFor="location" className="text-muted-foreground font-black uppercase tracking-widest text-[10px]">Lokasi Antar</Label>
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
                placeholder="Paste link maps atau pilih manual..."
                className={`bg-secondary/40 h-14 text-xs rounded-2xl border-white/5 transition-all ${formData.manualCoords ? 'border-primary/50 ring-2 ring-primary/20 bg-primary/5' : ''}`}
                value={formData.locationInput}
                onChange={(e) => setFormData({ ...formData, locationInput: e.target.value, manualCoords: null })}
              />
              <p className="text-[10px] text-muted-foreground italic px-1">
                {formData.manualCoords ? '🔥 Lokasi manual su aktif!' : "Bung'Kurir su pintar baca link maps otomatis 🔥"}
              </p>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="wa" className="text-muted-foreground font-black uppercase tracking-widest text-[10px]">Nomor WA</Label>
                <Input
                  id="wa"
                  placeholder="0812..."
                  className="bg-secondary/40 h-14 text-lg font-black rounded-2xl border-white/5"
                  value={formData.waNumber}
                  onChange={(e) => setFormData({ ...formData, waNumber: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="price" className="text-muted-foreground font-black uppercase tracking-widest text-[10px]">Harga Paket</Label>
                <Input
                  id="price"
                  type="number"
                  placeholder="150000"
                  className="bg-secondary/40 h-14 text-lg font-black rounded-2xl border-white/5"
                  value={formData.price}
                  onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4 bg-white/5 p-4 rounded-3xl border border-white/5">
              <div className="space-y-3">
                <Label className="text-muted-foreground font-black uppercase tracking-widest text-[9px]">Jenis Paket</Label>
                <RadioGroup 
                  value={formData.packetType} 
                  onValueChange={(v) => setFormData({ ...formData, packetType: v as PacketType })}
                  className="flex gap-4"
                >
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="STD" id="std" className="w-5 h-5" />
                    <Label htmlFor="std" className="text-sm font-black">STD</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="ECO" id="eco" className="w-5 h-5" />
                    <Label htmlFor="eco" className="text-sm font-black">ECO</Label>
                  </div>
                </RadioGroup>
              </div>
              <div className="space-y-3">
                <Label className="text-muted-foreground font-black uppercase tracking-widest text-[9px]">Metode</Label>
                <RadioGroup 
                  value={formData.paymentMethod} 
                  onValueChange={(v) => setFormData({ ...formData, paymentMethod: v as PaymentStatus })}
                  className="flex gap-4"
                >
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="COD" id="cod" className="w-5 h-5" />
                    <Label htmlFor="cod" className="text-sm font-black">COD</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="Su Bayar" id="paid" className="w-5 h-5" />
                    <Label htmlFor="paid" className="text-sm font-black text-blue-400">LUNAS</Label>
                  </div>
                </RadioGroup>
              </div>
            </div>

            <DialogFooter className="pt-2">
              <Button 
                type="submit" 
                className="w-full h-16 text-2xl font-black bg-accent hover:bg-accent/90 rounded-2xl glow-orange transition-all active:scale-95"
                disabled={loading}
              >
                {loading ? (
                  <>
                    <Loader2 className="mr-2 h-7 w-7 animate-spin" /> PROSES DOLO...
                  </>
                ) : (
                  <>
                    GAS ANTAR! <Send className="ml-2 w-7 h-7" />
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
            <DialogDescription className="text-[11px] text-muted-foreground uppercase font-black tracking-widest">
              Klik atau tap di peta untuk pasang penanda antaran
            </DialogDescription>
          </DialogHeader>
          <div className="flex-1 relative">
            <MapPicker onSelect={handleManualLocation} />
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}