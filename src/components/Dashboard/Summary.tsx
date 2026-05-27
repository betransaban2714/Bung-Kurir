'use client';

import { useState } from 'react';
import { Jadwal } from '@/types';
import { Card } from '@/components/ui/card';
import { Package, Wallet, TrendingUp, FileText, Banknote, Smartphone, Upload, X, History, ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';

interface SummaryProps {
  jadwalList: Jadwal[];
}

interface ImportedData {
  date: string;
  totalJadwal: number;
  totalBuyer: number;
  selesai: number;
  sisa: number;
  targetCod: number;
  doiMaso: number;
  doiTaLebe: number;
  totalCashSetoran: number;
  totalQris: number;
}

export function Summary({ jadwalList }: SummaryProps) {
  const { toast } = useToast();
  const [readerData, setReaderData] = useState<ImportedData | null>(null);
  
  const allBuyers = jadwalList.flatMap(r => r.buyers);
  
  const total = allBuyers.length;
  const done = allBuyers.filter((b) => b.status === 'DONE' || b.status === 'TIP').length;
  const pending = total - done;

  const targetCOD = allBuyers
    .filter(b => b.paymentMethod === 'COD')
    .reduce((sum, b) => sum + (b.price || 0), 0);

  const paidAtDelivery = allBuyers.filter(b => 
    (b.status === 'DONE' || b.status === 'TIP') && 
    (b.actualPaymentMethod === 'CASH' || b.actualPaymentMethod === 'QRIS')
  );

  const totalReceived = paidAtDelivery.reduce((sum, b) => sum + (b.paidAmount || b.price || 0), 0);

  const totalCashSetoran = paidAtDelivery
    .filter((b) => b.actualPaymentMethod === 'CASH')
    .reduce((sum, b) => sum + (b.paidAmount || b.price || 0), 0);

  const totalQris = paidAtDelivery
    .filter((b) => b.actualPaymentMethod === 'QRIS')
    .reduce((sum, b) => sum + (b.paidAmount || b.price || 0), 0);

  const tips = paidAtDelivery.reduce((sum, b) => {
    const paid = b.paidAmount || b.price || 0;
    const price = b.price || 0;
    return sum + Math.max(0, paid - price);
  }, 0);

  const formatCurrency = (val: number) => 
    new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(val);

  const handleExport = () => {
    if (jadwalList.length === 0) {
      toast({ title: "Kosong Pace!", description: "Belum ada data jadwal harian buat di-export.", variant: "destructive" });
      return;
    }

    const now = new Date();
    const hari = now.toLocaleDateString('id-ID', { weekday: 'long' });
    const tanggal = now.toLocaleDateString('id-ID', { day: 'numeric' });
    const bulan = now.toLocaleDateString('id-ID', { month: 'long' });
    const tahun = now.toLocaleDateString('id-ID', { year: 'numeric' });
    
    const displayDate = `${hari}, ${tanggal} ${bulan} ${tahun}`;
    const fileName = `Laporan_BungKurir-(${hari},${tanggal}-${bulan}-${tahun}).txt`;

    let content = `LAPORAN PENGANTARAN\n`;
    content += `Tanggal: ${displayDate}\n`;
    content += `---------------------------------------------\n\n`;
    
    content += `RINGKASAN HARIAN:\n`;
    content += `- Total Jadwal: ${jadwalList.length}\n`;
    content += `- Total Buyer: ${total}\n`;
    content += `- Selesai: ${done}\n`;
    content += `- Sisa: ${pending}\n\n`;
    
    content += `LAPORAN DOI:\n`;
    content += `- Target COD: ${formatCurrency(targetCOD)}\n`;
    content += `- Doi Maso: ${formatCurrency(totalReceived)}\n`;
    content += `- Ba Stor: ${formatCurrency(totalCashSetoran)}\n`;
    content += `- Total QRIS: ${formatCurrency(totalQris)}\n`;
    content += `- Doi Ta Lebe: ${formatCurrency(tips)}\n\n`;
    
    content += `DETAIL PER JADWAL:\n`;
    jadwalList.forEach((r, idx) => {
      content += `${idx + 1}. Jadwal: ${r.name}\n`;
      r.buyers.forEach(b => {
        const statusText = b.status === 'PENDING' ? 'BELUM' : (b.actualPaymentMethod || b.paymentMethod);
        content += `   ${b.name} | ${statusText} | ${formatCurrency(b.paidAmount || b.price || 0)}\n`;
      });
      content += `\n`;
    });

    content += `------------------------------------------\n`;
    content += `ALAT TEMPUR KURIR INDONESIA TIMUR\n`;
    content += `© 2026 BetranSaban\n`;

    const element = document.createElement("a");
    const file = new Blob([content], { type: 'text/plain;charset=utf-8' });
    element.href = URL.createObjectURL(file);
    element.download = fileName;
    document.body.appendChild(element);
    element.click();
    document.body.removeChild(element);

    toast({ title: "Export Berhasil!", description: "File .txt su terdownload e. Mantap!" });
  };

  const handleImport = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result as string;
      try {
        const lines = content.split('\n');
        const data: Partial<ImportedData> = {};
        
        lines.forEach(line => {
          if (line.includes('Tanggal:')) data.date = line.split(':')[1].trim();
          if (line.includes('- Total Jadwal:')) data.totalJadwal = parseInt(line.split(':')[1]);
          if (line.includes('- Total Buyer:')) data.totalBuyer = parseInt(line.split(':')[1]);
          if (line.includes('- Selesai:')) data.selesai = parseInt(line.split(':')[1]);
          if (line.includes('- Sisa:')) data.sisa = parseInt(line.split(':')[1]);
          
          const parseCurrency = (str: string) => {
            const clean = str.replace(/[^\d]/g, '');
            return parseInt(clean) || 0;
          };

          if (line.includes('- Target COD:')) data.targetCod = parseCurrency(line.split(':')[1]);
          if (line.includes('- Doi Maso:')) data.doiMaso = parseCurrency(line.split(':')[1]);
          if (line.includes('- Ba Stor:')) data.totalCashSetoran = parseCurrency(line.split(':')[1]);
          if (line.includes('- Total QRIS:')) data.totalQris = parseCurrency(line.split(':')[1]);
          if (line.includes('- Doi Ta Lebe:')) data.doiTaLebe = parseCurrency(line.split(':')[1]);
        });

        setReaderData(data as ImportedData);
        toast({ title: "Laporan Terbaca!", description: "Ini data dari file laporan lama ko." });
      } catch (err) {
        toast({ variant: "destructive", title: "Gagal Baca!", description: "Format file tra pas, pastikan itu file .txt dari app ini." });
      }
    };
    reader.readAsText(file);
  };

  const activeStats = readerData || {
    date: 'Hari Ini',
    total: total,
    done: done,
    pending: pending,
    targetCod: targetCOD,
    received: totalReceived,
    tips: tips,
    cashSetoran: totalCashSetoran,
    qris: totalQris,
  };

  return (
    <div className="space-y-4">
      {readerData && (
        <div className="flex items-center justify-between bg-primary/10 p-3 rounded-2xl border border-primary/20 animate-in fade-in slide-in-from-top-2">
          <div className="flex items-center gap-2">
            <History className="w-4 h-4 text-primary" />
            <span className="text-[10px] font-black text-foreground uppercase tracking-widest">Melihat Laporan: {readerData.date}</span>
          </div>
          <Button 
            size="sm" 
            variant="ghost" 
            className="h-7 text-[10px] font-black text-primary hover:bg-primary/5 rounded-lg gap-1"
            onClick={() => setReaderData(null)}
          >
            <ArrowLeft className="w-3 h-3" /> KEMBALI
          </Button>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card className="glass p-4 border-none glow-blue">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className="bg-primary/10 p-2 rounded-xl">
                <Package className="text-primary w-5 h-5" />
              </div>
              <h3 className="font-bold text-lg">Info Pengantaran</h3>
            </div>
          </div>
          <div className="grid grid-cols-3 gap-2 text-center">
            <div className="bg-secondary rounded-xl py-2">
              <p className="text-muted-foreground text-[10px] uppercase font-black">Total</p>
              <p className="text-xl font-black">{'totalBuyer' in activeStats ? activeStats.totalBuyer : activeStats.total}</p>
            </div>
            <div className="bg-green-500/10 rounded-xl py-2">
              <p className="text-muted-foreground text-[10px] uppercase font-black">Selesai</p>
              <p className="text-xl font-black text-green-600">{'selesai' in activeStats ? activeStats.selesai : activeStats.done}</p>
            </div>
            <div className="bg-red-500/10 rounded-xl py-2">
              <p className="text-muted-foreground text-[10px] uppercase font-black">Sisa</p>
              <p className="text-xl font-black text-red-600">{'sisa' in activeStats ? activeStats.sisa : activeStats.pending}</p>
            </div>
          </div>
        </Card>

        <Card className="glass p-4 border-none glow-orange">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className="bg-accent/10 p-2 rounded-xl">
                <Wallet className="text-accent w-5 h-5" />
              </div>
              <h3 className="font-bold text-lg">Info Doi</h3>
            </div>
          </div>
          <div className="space-y-3">
            <div className="flex justify-between items-center bg-secondary p-2 rounded-lg">
              <span className="text-[11px] font-bold text-muted-foreground uppercase">Target COD:</span>
              <span className="font-black text-sm text-foreground">{formatCurrency('targetCod' in activeStats ? activeStats.targetCod : activeStats.targetCod)}</span>
            </div>

            <div className="flex justify-between items-center p-2 rounded-lg border bg-primary/5 border-primary/10">
              <span className="text-[11px] font-bold uppercase text-primary">Doi Maso (Total):</span>
              <span className="font-black text-sm text-primary">{formatCurrency('doiMaso' in activeStats ? activeStats.doiMaso : activeStats.received)}</span>
            </div>
            
            <div className="grid grid-cols-2 gap-2">
              <div className="bg-green-500/5 p-2 rounded-xl border border-green-500/10">
                <span className="text-[8px] font-black text-green-600 uppercase flex items-center gap-1"><Banknote className="w-2 h-2" /> BA STOR:</span>
                <p className="font-black text-xs text-green-600 mt-1">{formatCurrency('totalCashSetoran' in activeStats ? activeStats.totalCashSetoran : activeStats.cashSetoran)}</p>
              </div>
              <div className="bg-blue-500/5 p-2 rounded-xl border border-blue-500/10">
                <span className="text-[8px] font-black text-blue-600 uppercase flex items-center gap-1"><Smartphone className="w-2 h-2" /> TOTAL QRIS:</span>
                <p className="font-black text-xs text-blue-600 mt-1">{formatCurrency('totalQris' in activeStats ? activeStats.totalQris : activeStats.qris)}</p>
              </div>
            </div>
            
            <div className="flex justify-between items-center pt-2 border-t border-border">
              <span className="text-[11px] font-black text-accent flex items-center gap-1 uppercase">
                <TrendingUp className="w-3 h-3" /> Doi Ta Lebe:
              </span>
              <span className="font-black text-lg text-accent">
                {('doiTaLebe' in activeStats ? activeStats.doiTaLebe : activeStats.tips) > 0 ? formatCurrency('doiTaLebe' in activeStats ? activeStats.doiTaLebe : activeStats.tips) : 'Rp0'}
                {('doiTaLebe' in activeStats ? activeStats.doiTaLebe : activeStats.tips) > 0 && <span className="text-xs ml-1">🔥</span>}
              </span>
            </div>
          </div>
        </Card>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <Button 
          onClick={handleExport}
          className="h-14 bg-white hover:bg-slate-50 text-foreground font-black rounded-2xl border border-border shadow-md gap-2 active:scale-95 transition-all"
        >
          <FileText className="w-5 h-5 text-primary" /> EXPORT DATA
        </Button>
        <div className="relative">
          <input 
            type="file" 
            accept=".txt" 
            className="absolute inset-0 opacity-0 cursor-pointer z-10"
            onChange={handleImport}
          />
          <Button 
            className="w-full h-14 bg-white hover:bg-slate-50 text-foreground font-black rounded-2xl border border-border shadow-md gap-2 active:scale-95 transition-all"
          >
            <Upload className="w-5 h-5 text-accent" /> BACA DATA
          </Button>
        </div>
      </div>
    </div>
  );
}