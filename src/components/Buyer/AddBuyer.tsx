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
} from '@/components/ui/dialog';
import { Plus, Loader2, MapPin, Send } from 'lucide-react';
import { extractLocationData } from '@/ai/flows/location-data-extractor';
import { useToast } from '@/hooks/use-toast';
import { PacketType, PaymentStatus } from '@/types';

interface AddBuyerProps {
  onAdd: (data: any) => void;
  disabled?: boolean;
}

export function AddBuyer({ onAdd, disabled }: AddBuyerProps) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const [formData, setFormData] = useState({
    name: '',
    waNumber: '',
    locationInput: '',
    price: '',
    packetType: 'STD' as PacketType,
    paymentMethod: 'COD' as PaymentStatus,
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name || !formData.locationInput) {
      toast({ title: 'Isi dolo!', description: 'Nama deng lokasi jang kosong e.', variant: 'destructive' });
      return;
    }

    setLoading(true);
    try {
      const location = await extractLocationData({ locationInput: formData.locationInput });
      
      onAdd({
        name: formData.name,
        waNumber: formData.waNumber,
        address: location.parsedAddress || formData.locationInput,
        latitude: location.latitude,
        longitude: location.longitude,
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
      });
      toast({ title: 'Mantap!', description: 'Buyer su masuk daftar.' });
    } catch (error) {
      console.error(error);
      toast({ title: 'Gagal e!', description: 'Lokasi tra terbaca, coba cek link maps dolo.', variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button 
          disabled={disabled}
          className="w-full py-8 text-xl font-black rounded-2xl bg-primary hover:bg-primary/90 shadow-2xl glow-blue active:scale-95 transition-all gap-3"
        >
          <Plus className="w-8 h-8" /> TAMBAH BUYER
        </Button>
      </DialogTrigger>
      <DialogContent className="glass sm:max-w-[425px] border-none shadow-2xl p-6">
        <DialogHeader>
          <DialogTitle className="text-2xl font-black flex items-center gap-2">
            <MapPin className="text-primary" /> MO ANTAR KA MANA?
          </DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-6 pt-4">
          <div className="space-y-2">
            <Label htmlFor="name" className="text-muted-foreground font-bold">Nama Buyer</Label>
            <Input
              id="name"
              placeholder="Contoh: Mama Ina"
              className="bg-secondary/50 h-12 text-lg font-bold border-white/5"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="location" className="text-muted-foreground font-bold">Lokasi (Link Maps / Shareloc WA)</Label>
            <Input
              id="location"
              placeholder="Paste link shareloc di sini..."
              className="bg-secondary/50 h-12 text-lg border-white/5"
              value={formData.locationInput}
              onChange={(e) => setFormData({ ...formData, locationInput: e.target.value })}
            />
            <p className="text-[10px] text-muted-foreground italic">Bung'Kurir su pintar baca link maps otomatis 🔥</p>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="wa" className="text-muted-foreground font-bold">Nomor WA</Label>
              <Input
                id="wa"
                placeholder="0812..."
                className="bg-secondary/50 h-12 text-lg border-white/5"
                value={formData.waNumber}
                onChange={(e) => setFormData({ ...formData, waNumber: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="price" className="text-muted-foreground font-bold">Harga Paket</Label>
              <Input
                id="price"
                type="number"
                placeholder="150000"
                className="bg-secondary/50 h-12 text-lg font-bold border-white/5"
                value={formData.price}
                onChange={(e) => setFormData({ ...formData, price: e.target.value })}
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-3">
              <Label className="text-muted-foreground font-bold">Jenis Paket</Label>
              <RadioGroup 
                value={formData.packetType} 
                onValueChange={(v) => setFormData({ ...formData, packetType: v as PacketType })}
                className="flex gap-4"
              >
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="STD" id="std" />
                  <Label htmlFor="std">STD</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="ECO" id="eco" />
                  <Label htmlFor="eco">ECO</Label>
                </div>
              </RadioGroup>
            </div>
            <div className="space-y-3">
              <Label className="text-muted-foreground font-bold">Metode</Label>
              <RadioGroup 
                value={formData.paymentMethod} 
                onValueChange={(v) => setFormData({ ...formData, paymentMethod: v as PaymentStatus })}
                className="flex gap-4"
              >
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="COD" id="cod" />
                  <Label htmlFor="cod">COD</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="Su Bayar" id="paid" />
                  <Label htmlFor="paid">Lunas</Label>
                </div>
              </RadioGroup>
            </div>
          </div>

          <DialogFooter>
            <Button 
              type="submit" 
              className="w-full h-14 text-xl font-black bg-accent hover:bg-accent/90 glow-orange"
              disabled={loading}
            >
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-6 w-6 animate-spin" /> PROSES DOLO...
                </>
              ) : (
                <>
                  GAS ANTAR! <Send className="ml-2 w-6 h-6" />
                </>
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}