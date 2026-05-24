'use client';

import { Rencana, Buyer } from '@/types';
import { Card } from '@/components/ui/card';
import { Package, Wallet, TrendingUp, Download, FileText } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';

interface SummaryProps {
  rencanaList: Rencana[];
}

export function Summary({ rencanaList }: SummaryProps) {
  const { toast } = useToast();
  
  // Ambil semua buyer dari semua rencana
  const allBuyers = rencanaList.flatMap(r => r.buyers);
  
  const total = allBuyers.length;
  const done = allBuyers.filter((b) => b.status === 'DONE' || b.status === 'TIP').length;
  const pending = total - done;

  // Total uang harian
  const totalCodExpected = allBuyers
    .filter((b) => b.paymentMethod === 'COD')
    .reduce((sum, b) => sum + b.price, 0);

  const totalReceived = allBuyers
    .filter((b) => b.paymentMethod === 'COD' && (b.status === 'DONE' || b.status === 'TIP'))
    .reduce((sum, b) => sum + (b.paidAmount ?? b.price), 0);

  const tips = totalReceived - allBuyers
    .filter((b) => b.paymentMethod === 'COD' && (b.status === 'DONE' || b.status === 'TIP'))
    .reduce((sum, b) => sum + b.price, 0);

  const formatCurrency = (val: number) => 
    new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(val);

  const handleExport = () => {
    if (rencanaList.length === 0) {
      toast({ title: "Kosong Bung!", description: "Belum ada data rencana harian buat di-export.", variant: "destructive" });
      return;
    }

    const now = new Date();
    const hari = now.toLocaleDateString('id-ID', { weekday: 'long' });
    const tanggal = now.toLocaleDateString('id-ID', { day: 'numeric' });
    const bulan = now.toLocaleDateString('id-ID', { month: 'long' });
    const tahun = now.toLocaleDateString('id-ID', { year: 'numeric' });
    
    const displayDate = `${hari}, ${tanggal} ${bulan} ${tahun}`;
    const fileName = `Data_Pengantaran_Paket-(${hari},${tanggal}-${bulan}-${tahun}).txt`;

    let content = `LAPORAN PENGANTARAN\n`;
    content += `Tanggal: ${displayDate}\n`;
    content += `---------------------------------------------\n\n`;
    
    content += `RINGKASAN HARIAN:\n`;
    content += `- Total Rencana: ${rencanaList.length}\n`;
    content += `- Total Buyer: ${total}\n`;
    content += `- Selesai: ${done}\n`;
    content += `- Sisa: ${pending}\n\n`;
    
    content += `LAPORAN DOI:\n`;
    content += `- Target COD: ${formatCurrency(totalCodExpected)}\n`;
    content += `- Doi Maso: ${formatCurrency(totalReceived)}\n`;
    content += `- Doi Ta Lebe: ${formatCurrency(tips)}\n\n`;
    
    content += `DETAIL PER RENCANA:\n`;
    rencanaList.forEach((r, idx) => {
      content += `${idx + 1}. Rencana: ${r.name}\n`;
      r.buyers.forEach(b => {
        content += `   [${b.packetType}] ${b.name} | ${b.paymentMethod} | ${formatCurrency(b.price)}\n`;
      });
      content += `\n`;
    });

    content += `------------------------------------------\n`;
    content += `ALAT TEMPUR KURIR INDONESIA TIMUR\n`;
    content += `byBetranSaban\n`;

    const element = document.createElement("a");
    const file = new Blob([content], { type: 'text/plain;charset=utf-8' });
    element.href = URL.createObjectURL(file);
    element.download = fileName;
    document.body.appendChild(element);
    element.click();
    document.body.removeChild(element);

    toast({ title: "Export Berhasil!", description: "File .txt su terdownload e. Mantap!" });
  };

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card className="glass p-4 glow-blue border-none">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-primary/20 rounded-xl">
                <Package className="text-primary w-5 h-5" />
              </div>
              <h3 className="font-bold text-lg">Info Pengantaran</h3>
            </div>
            <span className="text-[9px] font-black bg-primary/10 text-primary px-2 py-0.5 rounded-full border border-primary/20 uppercase">Harian</span>
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
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-accent/20 rounded-xl">
                <Wallet className="text-accent w-5 h-5" />
              </div>
              <h3 className="font-bold text-lg">Info Doi</h3>
            </div>
            <span className="text-[9px] font-black bg-accent/10 text-accent px-2 py-0.5 rounded-full border border-accent/20 uppercase">Harian</span>
          </div>
          <div className="space-y-3">
            <div className="flex justify-between items-center bg-white/5 p-2 rounded-lg">
              <span className="text-[11px] font-bold text-muted-foreground uppercase">Target COD:</span>
              <span className="font-black text-sm">{formatCurrency(totalCodExpected)}</span>
            </div>
            <div className="flex justify-between items-center bg-green-400/10 p-2 rounded-lg">
              <span className="text-[11px] font-bold text-green-400 uppercase">Doi Maso:</span>
              <span className="font-black text-sm text-green-400">{formatCurrency(totalReceived)}</span>
            </div>
            
            <div className="flex justify-between items-center pt-2 border-t border-white/5">
              <span className="text-[11px] font-black text-accent flex items-center gap-1 uppercase">
                <TrendingUp className="w-3 h-3" /> Doi Ta Lebe:
              </span>
              <span className="font-black text-lg text-accent">
                {tips > 0 ? formatCurrency(tips) : 'Rp0'}
                {tips > 0 && <span className="text-xs ml-1">🔥</span>}
              </span>
            </div>
          </div>
        </Card>
      </div>

      <Button 
        onClick={handleExport}
        className="w-full h-14 bg-white/5 hover:bg-white/10 text-white font-black rounded-2xl border border-white/10 gap-3 active:scale-95 transition-all shadow-xl"
      >
        <FileText className="w-6 h-6 text-primary" /> EXPORT DATA <Download className="w-5 h-5 opacity-50" />
      </Button>
    </div>
  );
}
