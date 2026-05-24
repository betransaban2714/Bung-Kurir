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

  const totalCodExpected = rencana.buyers
    .filter((b) => b.paymentMethod === 'COD')
    .reduce((sum, b) => sum + b.price, 0);

  const totalReceived = rencana.buyers
    .filter((b) => b.paymentMethod === 'COD' && (b.status === 'DONE' || b.status === 'TIP'))
    .reduce((sum, b) => sum + (b.paidAmount ?? b.price), 0);

  const tips = totalReceived - rencana.buyers
    .filter((b) => b.paymentMethod === 'COD' && (b.status === 'DONE' || b.status === 'TIP'))
    .reduce((sum, b) => sum + b.price, 0);

  const formatCurrency = (val: number) => 
    new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(val);

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      <Card className="glass p-4 glow-blue">
        <div className="flex items-center gap-3 mb-4">
          <div className="p-2 bg-primary/20 rounded-xl">
            <Package className="text-primary w-5 h-5" />
          </div>
          <h3 className="font-bold text-lg">Paket Hari Ini</h3>
        </div>
        <div className="grid grid-cols-3 gap-2 text-center">
          <div>
            <p className="text-muted-foreground text-xs">Total</p>
            <p className="text-xl font-bold">{total}</p>
          </div>
          <div>
            <p className="text-muted-foreground text-xs">Su Antar</p>
            <p className="text-xl font-bold text-green-400">{done}</p>
          </div>
          <div>
            <p className="text-muted-foreground text-xs">Sisa</p>
            <p className="text-xl font-bold text-red-400">{pending}</p>
          </div>
        </div>
      </Card>

      <Card className="glass p-4 glow-orange">
        <div className="flex items-center gap-3 mb-4">
          <div className="p-2 bg-accent/20 rounded-xl">
            <Wallet className="text-accent w-5 h-5" />
          </div>
          <h3 className="font-bold text-lg">Uang COD</h3>
        </div>
        <div className="space-y-2">
          <div className="flex justify-between items-center">
            <span className="text-xs text-muted-foreground">Total COD:</span>
            <span className="font-semibold text-sm">{formatCurrency(totalCodExpected)}</span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-xs text-muted-foreground">Uang Masuk:</span>
            <span className="font-semibold text-sm text-green-400">{formatCurrency(totalReceived)}</span>
          </div>
          {tips > 0 && (
            <div className="flex justify-between items-center pt-2 border-t border-white/5">
              <span className="text-xs font-bold text-accent flex items-center gap-1">
                <TrendingUp className="w-3 h-3" /> Uang Lebih:
              </span>
              <span className="font-bold text-accent">{formatCurrency(tips)} 😭🔥</span>
            </div>
          )}
        </div>
      </Card>
    </div>
  );
}
