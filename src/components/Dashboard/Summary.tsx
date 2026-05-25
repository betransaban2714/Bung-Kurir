'use client';

import { useState } from 'react';
import { Jadwal } from '@/types';
import { Card } from '@/components/ui/card';
import { Package, Wallet, TrendingUp, Download, FileText, Banknote, Smartphone, Upload, X, History, ArrowLeft } from 'lucide-react';
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
    .reduce((sum, b) => sum + b.price, 0);

  const paidAtDelivery = allBuyers.filter(b => 
    (b.status === 'DONE' || b.status === 'TIP') && 
    (b.actualPaymentMethod === 'CASH' || b.actualPaymentMethod === 'QRIS')
  );

  const totalReceived = paidAtDelivery.reduce((sum, b) => sum + (b.paidAmount ?? b.price), 0);

  const totalCashSetoran = paidAtDelivery
    .filter((b) => b.actualPaymentMethod === 'CASH')
    .reduce((sum, b) => sum + (b.paidAmount ?? b.price), 0);

  const totalQris = paidAtDelivery
    .filter((b) => b.actualPaymentMethod === 'QRIS')
    .reduce((sum, b) => sum + (b.paidAmount ?? b.price), 0);

  const tips = paidAtDelivery.reduce((sum, b) => {
    const paid = b.paidAmount ?? b.price;
    return sum + Math.max(0, paid - b.price);
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
    const fileName = `Data_Pengantaran_Paket-(${hari},${tanggal}-${bulan}-${tahun}).txt`;

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
    content += `- Doi Ta Lebe: ${formatCurrency(tips)}\n\n`;
    
    content += `DETAIL PER JADWAL:\n`;
    jadwalList.forEach((r, idx) => {
      content += `${idx + 1}. Jadwal: ${r.name}\n`;
      r.buyers.forEach(b => {
        const statusText = b.status === 'PENDING' ? 'BELUM' : (b.actualPaymentMethod || b.paymentMethod);
        content += `   [${b.packetType}] ${b.name} | ${statusText} | ${formatCurrency(b.paidAmount ?? b.price)}\n`;
      });
      content += `\n`;
    });

    content += `------------------------------------------\n`;
    content += `ALAT TEMPUR KURIR INDONESIA TIMUR\n`;
    content += `BetranSaban\n`;

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
      const text = event.target?.result as string;
      if (!text) return;

      try {
        const lines = text.split('\n');
        const data: ImportedData = {
          date: '',
          totalJadwal: 0,
          totalBuyer: 0,
          selesai: 0,
          sisa: 0,
          targetCod: 0,
          doiMaso: 0,
          doiTaLebe: 0,
        };

        lines.forEach(line => {
          if (line.includes('Tanggal:')) data.date = line.split('Tanggal:')[1].trim();
          if (line.includes('- Total Jadwal:')) data.totalJadwal = parseInt(line.split(':')[1]) || 0;
          if (line.includes('- Total Buyer:')) data.totalBuyer = parseInt(line.split(':')[1]) || 0;
          if (line.includes('- Selesai:')) data.selesai = parseInt(line.split(':')[1]) || 0;
          if (line.includes('- Sisa:')) data.sisa = parseInt(line.split(':')[1]) || 0;
          if (line.includes('- Target COD:')) data.targetCod = parseInt(line.replace(/\D/g, '')) || 0;
          if (line.includes('- Doi Maso:')) data.doiMaso = parseInt(line.replace(/\D/g, '')) || 0;
          if (line.includes('- Doi Ta Lebe:')) data.doiTaLebe = parseInt(line.replace(/\D/g, '')) || 0;
        });

        if (!data.date && !data.totalBuyer) throw new Error("Format file salah");

        setReaderData(data);
        toast({ title: "Reader Aktif!", description: "Data lama su berhasil dibaca. Mantap!" });
      } catch (err) {
        toast({ title: "Gagal Baca!", description: "Format file tra terbaca, pastikan itu file .txt dari Bung'Kurir.", variant: "destructive" });
      }
    };
    reader.readAsText(file);
  };

  const activeStats = readerData ? {
    total: readerData.totalBuyer,
    done: readerData.selesai,
    pending: readerData.sisa,
    targetCod: readerData.targetCod,
    received: readerData.doiMaso,
    tips: readerData.doiTaLebe,
    date: readerData.date,
    isImported: true
  } : {
    total: total,
    done: done,
    pending: pending,
    targetCod: targetCOD,
    received: totalReceived,
    tips: tips,
    date: "HARI INI",
    isImported: false
  };

  return (
    <div className="space-y-4">
      {activeStats.isImported && (
        <div className="flex items-center justify-between bg-accent/20 border border-accent/20 p-3 rounded-2xl animate-in fade-in slide-in-from-top-2 duration-300">
          <div className="flex items-center gap-2">
            <History className="w-5 h-5 text-accent" />
            <div>
              <p className="text-[10px] font-black text-accent uppercase tracking-widest leading-none">Mode Reader Aktif</p>
              <p className="text-xs font-bold text-white mt-1">{activeStats.date}</p>
            </div>
          </div>
          <Button 
            variant="ghost" 
            size="sm" 
            className="h-8 font-black text-[10px] gap-1 hover:bg-accent/10 text-white rounded-xl"
            onClick={() => setReaderData(null)}
          >
            <ArrowLeft className="w-3 h-3" /> BALIK KE LIVE
          </Button>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card className={`glass p-4 border-none transition-all duration-500 ${activeStats.isImported ? 'glow-orange border-accent/20' : 'glow-blue'}`}>
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className={`p-2 rounded-xl ${activeStats.isImported ? 'bg-accent/20' : 'bg-primary/20'}`}>
                <Package className={`${activeStats.isImported ? 'text-accent' : 'text-primary'} w-5 h-5`} />
              </div>
              <h3 className="font-bold text-lg">Info Pengantaran</h3>
            </div>
            <span className={`text-[9px] font-black px-2 py-0.5 rounded-full border uppercase ${
              activeStats.isImported ? 'bg-accent/10 text-accent border-accent/20' : 'bg-primary/10 text-primary border-primary/20'
            }`}>
              {activeStats.isImported ? 'Data Lampau' : 'Harian'}
            </span>
          </div>
          <div className="grid grid-cols-3 gap-2 text-center">
            <div className="bg-white/5 rounded-xl py-2">
              <p className="text-muted-foreground text-[10px] uppercase font-black">Total</p>
              <p className="text-xl font-black">{activeStats.total}</p>
            </div>
            <div className="bg-green-500/10 rounded-xl py-2">
              <p className="text-muted-foreground text-[10px] uppercase font-black">Selesai</p>
              <p className="text-xl font-black text-green-400">{activeStats.done}</p>
            </div>
            <div className="bg-red-500/10 rounded-xl py-2">
              <p className="text-muted-foreground text-[10px] uppercase font-black">Sisa</p>
              <p className="text-xl font-black text-red-400">{activeStats.pending}</p>
            </div>
          </div>
        </Card>

        <Card className={`glass p-4 border-none transition-all duration-500 ${activeStats.isImported ? 'glow-orange' : 'glow-blue'}`}>
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className={`p-2 rounded-xl ${activeStats.isImported ? 'bg-accent/20' : 'bg-accent/20'}`}>
                <Wallet className="text-accent w-5 h-5" />
              </div>
              <h3 className="font-bold text-lg">Info Doi</h3>
            </div>
            <span className="text-[9px] font-black bg-accent/10 text-accent px-2 py-0.5 rounded-full border border-accent/20 uppercase">
              {activeStats.isImported ? 'Riwayat' : 'Harian'}
            </span>
          </div>
          <div className="space-y-3">
            <div className="flex justify-between items-center bg-white/5 p-2 rounded-lg">
              <span className="text-[11px] font-bold text-muted-foreground uppercase">Target COD:</span>
              <span className="font-black text-sm text-white">{formatCurrency(activeStats.targetCod)}</span>
            </div>

            <div className={`flex justify-between items-center p-2 rounded-lg border ${
              activeStats.isImported ? 'bg-accent/10 border-accent/20' : 'bg-primary/10 border-primary/20'
            }`}>
              <span className={`text-[11px] font-bold uppercase ${activeStats.isImported ? 'text-accent' : 'text-primary'}`}>Doi Maso (Total):</span>
              <span className={`font-black text-sm ${activeStats.isImported ? 'text-accent' : 'text-primary'}`}>{formatCurrency(activeStats.received)}</span>
            </div>
            
            {!activeStats.isImported && (
              <div className="grid grid-cols-2 gap-2">
                <div className="bg-green-400/10 p-2 rounded-xl border border-green-500/10">
                  <span className="text-[8px] font-black text-green-400 uppercase flex items-center gap-1"><Banknote className="w-2 h-2" /> SETORAN TUNAI:</span>
                  <p className="font-black text-xs text-green-400 mt-1">{formatCurrency(totalCashSetoran)}</p>
                </div>
                <div className="bg-blue-400/10 p-2 rounded-xl border border-blue-500/10">
                  <span className="text-[8px] font-black text-blue-400 uppercase flex items-center gap-1"><Smartphone className="w-2 h-2" /> TOTAL QRIS:</span>
                  <p className="font-black text-xs text-blue-400 mt-1">{formatCurrency(totalQris)}</p>
                </div>
              </div>
            )}
            
            <div className="flex justify-between items-center pt-2 border-t border-white/5">
              <span className="text-[11px] font-black text-accent flex items-center gap-1 uppercase">
                <TrendingUp className="w-3 h-3" /> Doi Ta Lebe:
              </span>
              <span className="font-black text-lg text-accent">
                {activeStats.tips > 0 ? formatCurrency(activeStats.tips) : 'Rp0'}
                {activeStats.tips > 0 && <span className="text-xs ml-1">🔥</span>}
              </span>
            </div>
          </div>
        </Card>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <Button 
          onClick={handleExport}
          className="h-14 bg-white/5 hover:bg-white/10 text-white font-black rounded-2xl border border-white/10 gap-2 active:scale-95 transition-all shadow-xl"
        >
          <FileText className="w-5 h-5 text-primary" /> EXPORT
        </Button>
        
        <div className="relative">
          <input 
            type="file" 
            accept=".txt" 
            onChange={handleImport}
            className="absolute inset-0 opacity-0 cursor-pointer z-10"
          />
          <Button 
            className="w-full h-14 bg-accent/10 hover:bg-accent/20 text-accent font-black rounded-2xl border border-accent/20 gap-2 active:scale-95 transition-all shadow-xl"
          >
            <Upload className="w-5 h-5" /> BACA DATA
          </Button>
        </div>
      </div>
    </div>
  );
}
