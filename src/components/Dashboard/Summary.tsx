'use client';

import { Rencana } from '@/types';
import { Card } from '@/components/ui/card';
import { Package, Wallet, TrendingUp } from 'lucide-react';

interface SummaryProps {
  rencana: Rencana;
}

export function Summary({ rencana }: SummaryProps) {
  const total = rencana.buyers.length;
  const done = rencana.buyers.filter((b) => b.status === 'DONE' || b.status === 'TIP').length;
  const pending = total - done;

  // Total uang yang harusnya diterima dari COD
  const totalCodExpected = rencana.buyers
    .filter((b) => b.paymentMethod === 'COD')
    .reduce((sum, b) => sum + b.price, 0);

  // Total uang asli yang masuk (termasuk tip/kelebihan)
  const totalReceived = rencana.buyers
    .filter((b) => b.paymentMethod === 'COD' && (b.status === 'DONE' || b.status === 'TIP'))
    .reduce((sum, b) => sum + (b.paidAmount ?? b.price), 0);

  // Selisih uang lebih (tips)
  const tips = totalReceived - rencana.buyers
    .filter((b) => b.paymentMethod === 'COD' && (b.status === 'DONE' || b.status === 'TIP'))
    .reduce((sum, b) => sum + b.price, 0);

  const formatCurrency = (val: number) => 
    new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(val);

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      <Card className="glass p-4 glow-blue border-none">
        <div className="flex items-center gap-3 mb-4">
          <div className="p-2 bg-primary/20 rounded-xl">
            <Package className="text-primary w-5 h-5" />
          </div>
          <h3 className="font-bold text-lg">Status Antaran</h3>
        </div>
        <div className="grid grid-cols-3 gap-2 text-center">
          <div className="bg-white/5 rounded-xl py-2">
            <p className="text-muted-foreground text-[10px] uppercase font-black">Total</p>
            <p className="text-xl font-black">{total}</p>
          </div>
          <div className="bg-green-500/10 rounded-xl py-2">
            <p className="text-muted-foreground text-[10px] uppercase font-black">Selesai</p>
            <p className="text-xl font-black text-green-400">{done}</p>
          </div>
          <div className="bg-red-500/10 rounded-xl py-2">
            <p className="text-muted-foreground text-[10px] uppercase font-black">Sisa</p>
            <p className="text-xl font-black text-red-400">{pending}</p>
          </div>
        </div>
      </Card>

      <Card className="glass p-4 glow-orange border-none">
        <div className="flex items-center gap-3 mb-4">
          <div className="p-2 bg-accent/20 rounded-xl">
            <Wallet className="text-accent w-5 h-5" />
          </div>
          <h3 className="font-bold text-lg">Laporan Uang</h3>
        </div>
        <div className="space-y-3">
          <div className="flex justify-between items-center bg-white/5 p-2 rounded-lg">
            <span className="text-[11px] font-bold text-muted-foreground uppercase">Target COD:</span>
            <span className="font-black text-sm">{formatCurrency(totalCodExpected)}</span>
          </div>
          <div className="flex justify-between items-center bg-green-400/10 p-2 rounded-lg">
            <span className="text-[11px] font-bold text-green-400 uppercase">Uang Masuk:</span>
            <span className="font-black text-sm text-green-400">{formatCurrency(totalReceived)}</span>
          </div>
          
          <div className="flex justify-between items-center pt-2 border-t border-white/5">
            <span className="text-[11px] font-black text-accent flex items-center gap-1 uppercase">
              <TrendingUp className="w-3 h-3" /> Uang Lebih:
            </span>
            <span className="font-black text-lg text-accent">
              {tips > 0 ? formatCurrency(tips) : 'Rp0'}
              {tips > 0 && <span className="text-xs ml-1">🔥</span>}
            </span>
          </div>
        </div>
      </Card>
    </div>
  );
}
