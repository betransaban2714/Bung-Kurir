'use client';

import { useState } from 'react';
import { Buyer, PaymentStatus } from '@/types';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Card } from '@/components/ui/card';
import { CheckCircle2, Clock, Trash2, MapPin, AlertTriangle, TrendingUp, Settings2, Wallet } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
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
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from '@/components/ui/dialog';
import { useKurirStore } from '@/store/useKurirStore';

interface BuyerListProps {
  buyers: Buyer[];
  onDelete: (id: string) => void;
}

export function BuyerList({ buyers, onDelete }: BuyerListProps) {
  const { activeJadwalId, updateBuyerInfo } = useKurirStore();
  const [editingBuyer, setEditingBuyer] = useState<Buyer | null>(null);
  const [editData, setEditData] = useState({ price: '', method: 'COD' as PaymentStatus });

  if (buyers.length === 0) {
    return (
      <div className="h-full flex flex-col items-center justify-center p-8 text-center space-y-4 opacity-50">
        <Clock className="w-12 h-12 text-muted-foreground" />
        <div>
          <h3 className="font-bold text-lg text-white">BELUM ADA BUYER</h3>
          <p className="text-xs text-muted-foreground">Klik tombol "Tambah Buyer" di bawah buat tambah Buyer.</p>
        </div>
      </div>
    );
  }

  const handleOpenEdit = (buyer: Buyer) => {
    setEditingBuyer(buyer);
    setEditData({ 
      price: buyer.price ? buyer.price.toString() : '', 
      method: buyer.paymentMethod || 'COD' 
    });
  };

  const handleSaveEdit = () => {
    if (editingBuyer && activeJadwalId) {
      updateBuyerInfo(activeJadwalId, editingBuyer.id, {
        price: parseFloat(editData.price) || 0,
        paymentMethod: editData.method
      });
      setEditingBuyer(null);
    }
  };

  return (
    <div className="h-full flex flex-col bg-background/50">
      <div className="px-6 py-5 flex items-center justify-between border-b border-white/5 glass-dark">
        <div>
          <h2 className="font-black text-sm uppercase tracking-widest text-muted-foreground">Daftar Buyer</h2>
          <p className="text-[10px] text-primary font-bold">Total {buyers.length} Buyer Hari Ini</p>
        </div>
        <span className="bg-primary/20 text-primary text-[10px] font-black px-3 py-1 rounded-full border border-primary/20">
          AKTIF
        </span>
      </div>
      <ScrollArea className="flex-1 px-4 py-4">
        <div className="space-y-3">
          {buyers.map((buyer) => (
            <Card 
              key={buyer.id} 
              className={`glass p-4 border-none shadow-xl transition-all relative group ${
                buyer.status === 'DONE' || buyer.status === 'TIP' ? 'opacity-50 grayscale-[0.5]' : 'glow-blue'
              }`}
            >
              <div className="flex items-start justify-between gap-3">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1.5">
                    <span className="font-black text-lg truncate text-white">{buyer.name}</span>
                    {(buyer.status === 'DONE' || buyer.status === 'TIP') && (
                      <CheckCircle2 className="w-5 h-5 text-green-400 shrink-0" />
                    )}
                  </div>
                  <div className="flex items-center gap-2 mb-3">
                    <span className={`text-[10px] font-black px-2 py-0.5 rounded-lg border ${
                      buyer.paymentMethod === 'COD' 
                        ? 'bg-orange-500/10 text-orange-400 border-orange-500/20' 
                        : 'bg-blue-500/10 text-blue-400 border-blue-500/20'
                    }`}>
                      {buyer.paymentMethod || 'BELUM SET'}
                    </span>
                    {buyer.price && buyer.price > 0 ? (
                       <span className="text-[10px] font-black text-primary bg-primary/10 border border-primary/20 px-2 py-0.5 rounded-lg">
                         Rp{buyer.price.toLocaleString()}
                       </span>
                    ) : (
                      <span className="text-[10px] font-black text-muted-foreground bg-white/5 border border-white/5 px-2 py-0.5 rounded-lg italic">
                        Harga Kosong
                      </span>
                    )}
                  </div>
                  <div className="flex items-start gap-1.5 text-muted-foreground">
                    <MapPin className="w-3 h-3 mt-0.5 shrink-0" />
                    <p className="text-[11px] leading-tight italic line-clamp-2">{buyer.address}</p>
                  </div>
                </div>
                
                <div className="text-right flex flex-col items-end justify-between self-stretch">
                   <div className="flex gap-2">
                      {buyer.status === 'PENDING' && (
                        <Button 
                          size="icon" 
                          variant="ghost" 
                          className="h-9 w-9 text-primary hover:bg-primary/10 rounded-xl"
                          onClick={() => handleOpenEdit(buyer)}
                        >
                          <Settings2 className="w-5 h-5" />
                        </Button>
                      )}
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button
                            size="icon"
                            variant="ghost"
                            className="h-9 w-9 text-red-400 hover:bg-red-400/10 rounded-xl active:scale-90 transition-all"
                          >
                            <Trash2 className="w-5 h-5" />
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent className="glass border-none rounded-[2rem] shadow-2xl max-w-[320px] mx-auto">
                          <AlertDialogHeader className="items-center text-center">
                            <div className="w-16 h-16 bg-red-500/10 rounded-full flex items-center justify-center mb-2">
                               <AlertTriangle className="w-8 h-8 text-red-500" />
                            </div>
                            <AlertDialogTitle className="text-xl font-black text-white italic">HAPUS BUYER?</AlertDialogTitle>
                            <AlertDialogDescription className="text-xs font-medium text-muted-foreground">
                              Yakin mo hapus <span className="text-white font-bold">{buyer.name}</span> dari daftar antaran?
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter className="flex-col sm:flex-col gap-2 mt-4">
                            <AlertDialogAction 
                              onClick={() => onDelete(buyer.id)}
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
                  
                  {buyer.status === 'TIP' && buyer.paidAmount && buyer.price && (
                    <div className="flex flex-col items-end gap-0.5 mt-2">
                      <div className="flex items-center gap-1 text-accent animate-pulse">
                        <TrendingUp className="w-3 h-3" />
                        <p className="text-[9px] font-black uppercase">Doi Ta Lebe 🔥</p>
                      </div>
                      <p className="text-[10px] font-black text-accent">+Rp{(buyer.paidAmount - buyer.price).toLocaleString()}</p>
                    </div>
                  )}
                </div>
              </div>
            </Card>
          ))}
        </div>
        <div className="h-32" />
      </ScrollArea>

      <Dialog open={!!editingBuyer} onOpenChange={(o) => !o && setEditingBuyer(null)}>
        <DialogContent className="glass border-none rounded-[2rem] w-[90vw] max-w-[350px]">
          <DialogHeader>
            <DialogTitle className="text-xl font-black text-white italic">SET INFO PEMBAYARAN 💰</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Metode Bayar</Label>
              <RadioGroup 
                value={editData.method} 
                onValueChange={(v) => setEditData({ ...editData, method: v as PaymentStatus })}
                className="flex gap-4 bg-white/5 p-3 rounded-xl"
              >
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="COD" id="edit-cod" />
                  <Label htmlFor="edit-cod" className="font-bold">COD</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="LUNAS" id="edit-lunas" />
                  <Label htmlFor="edit-lunas" className="font-bold text-blue-400">LUNAS</Label>
                </div>
              </RadioGroup>
            </div>

            {editData.method === 'COD' && (
              <div className="space-y-2">
                <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Harga Paket (Rp)</Label>
                <Input 
                  type="number"
                  placeholder="Contoh: 150000"
                  className="h-12 bg-secondary/50 font-black text-lg border-white/5 rounded-xl"
                  value={editData.price}
                  onChange={(e) => setEditData({ ...editData, price: e.target.value })}
                />
              </div>
            )}
          </div>
          <DialogFooter>
            <Button onClick={handleSaveEdit} className="w-full h-12 bg-primary font-black rounded-xl">SIMPAN INFO</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
