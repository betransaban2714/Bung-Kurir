'use client';

import { Buyer } from '@/types';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Card } from '@/components/ui/card';
import { CheckCircle2, Clock, Trash2, MapPin } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface BuyerListProps {
  buyers: Buyer[];
  onDelete: (id: string) => void;
}

export function BuyerList({ buyers, onDelete }: BuyerListProps) {
  if (buyers.length === 0) {
    return (
      <div className="h-full flex flex-col items-center justify-center p-8 text-center space-y-4 opacity-50">
        <Clock className="w-12 h-12 text-muted-foreground" />
        <div>
          <h3 className="font-bold text-lg text-white">BELUM ADA ANTARAN</h3>
          <p className="text-xs text-muted-foreground">Klik tombol "Tambah Buyer" di bawah buat gas paket dolo.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col bg-background/50">
      <div className="px-6 py-5 flex items-center justify-between border-b border-white/5 glass-dark">
        <div>
          <h2 className="font-black text-sm uppercase tracking-widest text-muted-foreground">Daftar Antaran</h2>
          <p className="text-[10px] text-primary font-bold">Total {buyers.length} Paket Hari Ini</p>
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
                      {buyer.paymentMethod}
                    </span>
                    <span className="text-[10px] font-black text-muted-foreground bg-white/5 border border-white/5 px-2 py-0.5 rounded-lg uppercase">
                      {buyer.packetType}
                    </span>
                  </div>
                  <div className="flex items-start gap-1.5 text-muted-foreground">
                    <MapPin className="w-3 h-3 mt-0.5 shrink-0" />
                    <p className="text-[11px] leading-tight italic line-clamp-2">{buyer.address}</p>
                  </div>
                </div>
                
                <div className="text-right flex flex-col items-end justify-between self-stretch">
                  <div className="space-y-1">
                    <p className="font-black text-base text-primary">Rp{buyer.price.toLocaleString()}</p>
                    {buyer.status === 'TIP' && buyer.paidAmount && (
                      <p className="text-[9px] font-black text-accent uppercase">Untung 🔥</p>
                    )}
                  </div>
                  
                  <Button
                    size="icon"
                    variant="ghost"
                    className="h-9 w-9 text-red-400 hover:bg-red-400/10 rounded-xl active:scale-90 transition-all mt-2"
                    onClick={(e) => {
                      e.stopPropagation();
                      onDelete(buyer.id);
                    }}
                  >
                    <Trash2 className="w-5 h-5" />
                  </Button>
                </div>
              </div>
            </Card>
          ))}
        </div>
        <div className="h-32" /> {/* Extra space for floating elements */}
      </ScrollArea>
    </div>
  );
}
