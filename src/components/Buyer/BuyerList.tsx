'use client';

import { Buyer } from '@/types';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Card } from '@/components/ui/card';
import { CheckCircle2, Clock, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface BuyerListProps {
  buyers: Buyer[];
  onDelete: (id: string) => void;
}

export function BuyerList({ buyers, onDelete }: BuyerListProps) {
  if (buyers.length === 0) {
    return (
      <div className="h-full flex flex-col items-center justify-center p-8 text-center space-y-4 opacity-50">
        <Clock className="w-12 h-12" />
        <div>
          <h3 className="font-bold text-lg">BELUM ADA PAKET</h3>
          <p className="text-xs">Klik tombol "Tambah Buyer" di bawah buat gas paket dolo.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col">
      <div className="px-6 py-4 flex items-center justify-between border-b border-white/5">
        <h2 className="font-black text-sm uppercase tracking-widest text-muted-foreground">Daftar Antaran</h2>
        <span className="bg-primary/20 text-primary text-[10px] font-black px-2 py-1 rounded-full">{buyers.length} PAKET</span>
      </div>
      <ScrollArea className="flex-1 px-4 py-4">
        <div className="space-y-3">
          {buyers.map((buyer) => (
            <Card 
              key={buyer.id} 
              className={`glass p-3 border-none shadow-md hover:glow-blue transition-all cursor-pointer relative group ${
                buyer.status === 'DONE' || buyer.status === 'TIP' ? 'opacity-60' : ''
              }`}
            >
              <div className="flex items-start justify-between gap-2">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="font-bold text-base truncate">{buyer.name}</span>
                    {buyer.status !== 'PENDING' && <CheckCircle2 className="w-4 h-4 text-green-400 shrink-0" />}
                  </div>
                  <div className="flex items-center gap-2 mb-2">
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                      buyer.paymentMethod === 'COD' ? 'bg-orange-500/20 text-orange-400' : 'bg-blue-500/20 text-blue-400'
                    }`}>
                      {buyer.paymentMethod}
                    </span>
                    <span className="text-[10px] font-bold text-muted-foreground bg-white/5 px-2 py-0.5 rounded-full uppercase">
                      {buyer.packetType}
                    </span>
                  </div>
                  <p className="text-[11px] text-muted-foreground truncate italic">📍 {buyer.address}</p>
                </div>
                <div className="text-right flex flex-col items-end gap-1">
                  <p className="font-black text-sm">Rp{buyer.price.toLocaleString()}</p>
                  <Button
                    size="icon"
                    variant="ghost"
                    className="h-7 w-7 opacity-0 group-hover:opacity-100 transition-opacity text-red-400"
                    onClick={(e) => {
                      e.stopPropagation();
                      onDelete(buyer.id);
                    }}
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            </Card>
          ))}
        </div>
        <div className="h-24" /> {/* Spacer for bottom buttons */}
      </ScrollArea>
    </div>
  );
}