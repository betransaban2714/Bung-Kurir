'use client';

import { useEffect, useRef } from 'react';
import L from 'leaflet';
import { Rencana, DeliveryStatus } from '@/types';

interface BungMapProps {
  rencana: Rencana;
  onUpdateStatus: (buyerId: string, status: DeliveryStatus, paidAmount?: number) => void;
}

export default function BungMap({ rencana, onUpdateStatus }: BungMapProps) {
  const mapRef = useRef<L.Map | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const markersRef = useRef<Record<string, L.Marker>>({});

  useEffect(() => {
    if (!containerRef.current || mapRef.current) return;

    mapRef.current = L.map(containerRef.current, {
      zoomControl: false,
    }).setView([-2.5489, 118.0149], 5); // Default to Indonesia center

    L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', {
      attribution: '&copy; OpenStreetMap &copy; CARTO',
    }).addTo(mapRef.current);

    L.control.zoom({ position: 'bottomright' }).addTo(mapRef.current);

    return () => {
      if (mapRef.current) {
        mapRef.current.remove();
        mapRef.current = null;
      }
    };
  }, []);

  useEffect(() => {
    if (!mapRef.current) return;

    // Clear old markers
    Object.values(markersRef.current).forEach(m => m.remove());
    markersRef.current = {};

    const bounds: L.LatLngTuple[] = [];

    // Add start location marker if exists
    if (rencana.startLocation) {
       const startIcon = L.divIcon({
        className: 'start-marker',
        html: `<div style="background-color: #3b82f6; width: 10px; height: 10px; border-radius: 50%; border: 2px solid white;"></div>`,
        iconSize: [10, 10],
      });
      L.marker([rencana.startLocation.latitude, rencana.startLocation.longitude], { icon: startIcon })
        .addTo(mapRef.current)
        .bindTooltip("Titik Start");
      bounds.push([rencana.startLocation.latitude, rencana.startLocation.longitude]);
    }

    rencana.buyers.forEach((buyer) => {
      const color = buyer.status === 'DONE' ? '#64748b' : 
                   buyer.status === 'TIP' ? '#10b981' : '#ef4444';
      
      const icon = L.divIcon({
        className: 'custom-marker',
        html: `<div style="background-color: ${color}; width: 14px; height: 14px; border-radius: 50%; border: 2px solid white; box-shadow: 0 0 10px rgba(0,0,0,0.5);"></div>`,
        iconSize: [14, 14],
        iconAnchor: [7, 7],
      });

      const marker = L.marker([buyer.latitude, buyer.longitude], { icon })
        .addTo(mapRef.current!)
        .bindPopup(() => {
          const div = document.createElement('div');
          div.className = 'p-4 min-w-[240px] space-y-3';
          
          div.innerHTML = `
            <div class="space-y-1">
              <h3 class="font-bold text-lg flex items-center gap-2">
                <span class="text-primary">👤</span> ${buyer.name}
              </h3>
              <p class="text-xs text-muted-foreground">${buyer.address}</p>
            </div>
            <div class="grid grid-cols-2 gap-2 py-2 border-y border-white/10">
              <div>
                <p class="text-[10px] text-muted-foreground uppercase">Jenis</p>
                <p class="text-sm font-semibold">📦 ${buyer.packetType}</p>
              </div>
              <div>
                <p class="text-[10px] text-muted-foreground uppercase">Bayar</p>
                <p class="text-sm font-semibold">💰 ${buyer.paymentMethod}</p>
              </div>
            </div>
            <div class="flex justify-between items-center py-1">
               <span class="text-xs text-muted-foreground">Harga:</span>
               <span class="font-bold">Rp${buyer.price.toLocaleString()}</span>
            </div>
            ${buyer.paymentMethod === 'COD' && buyer.status === 'PENDING' ? `
              <div class="space-y-2">
                <p class="text-xs font-medium">Buyer bayar berapa?</p>
                <input type="number" id="paid-input-${buyer.id}" placeholder="Masukkan jumlah" class="w-full bg-secondary border border-border rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-primary" />
              </div>
            ` : ''}
            ${buyer.status !== 'PENDING' ? `
              <div class="bg-muted/30 p-2 rounded-lg text-xs space-y-1">
                <div class="flex justify-between"><span>Diterima:</span> <span>Rp${(buyer.paidAmount || buyer.price).toLocaleString()}</span></div>
                ${(buyer.paidAmount || 0) > buyer.price ? `
                  <div class="flex justify-between text-accent font-bold"><span>Uang Lebih:</span> <span>Rp${((buyer.paidAmount || 0) - buyer.price).toLocaleString()} 🔥</span></div>
                ` : ''}
              </div>
            ` : ''}
            <div class="grid grid-cols-1 gap-2 pt-2">
              <div class="grid grid-cols-2 gap-2">
                <button id="nav-btn-${buyer.id}" class="flex items-center justify-center gap-2 bg-primary text-white py-3 rounded-xl font-bold text-sm shadow-lg active:scale-95 transition-all">
                  📍 Buka Jalan
                </button>
                <button id="chat-btn-${buyer.id}" class="flex items-center justify-center gap-2 bg-green-600 text-white py-3 rounded-xl font-bold text-sm shadow-lg active:scale-95 transition-all">
                  💬 Chat
                </button>
              </div>
              ${buyer.status === 'PENDING' ? `
                <button id="done-btn-${buyer.id}" class="flex items-center justify-center gap-2 bg-accent text-white py-4 rounded-xl font-black text-lg shadow-xl active:scale-95 transition-all glow-orange">
                  ✅ Su Antar
                </button>
              ` : '<p class="text-center text-xs font-bold text-muted-foreground py-2">PAKET SU SELESAI 🔥</p>'}
            </div>
          `;

          // Event Listeners
          setTimeout(() => {
            const navBtn = document.getElementById(`nav-btn-${buyer.id}`);
            const chatBtn = document.getElementById(`chat-btn-${buyer.id}`);
            const doneBtn = document.getElementById(`done-btn-${buyer.id}`);
            const paidInput = document.getElementById(`paid-input-${buyer.id}`) as HTMLInputElement;

            navBtn?.addEventListener('click', () => {
              window.open(`https://www.google.com/maps/dir/?api=1&destination=${buyer.latitude},${buyer.longitude}`, '_blank');
            });

            chatBtn?.addEventListener('click', () => {
              window.open(`https://wa.me/${buyer.waNumber.replace(/[^0-9]/g, '')}`, '_blank');
            });

            doneBtn?.addEventListener('click', () => {
              const paidAmount = paidInput ? parseFloat(paidInput.value) : buyer.price;
              const status: DeliveryStatus = isNaN(paidAmount) || paidAmount <= buyer.price ? 'DONE' : 'TIP';
              onUpdateStatus(buyer.id, status, isNaN(paidAmount) ? buyer.price : paidAmount);
              mapRef.current?.closePopup();
            });
          }, 0);

          return div;
        });

      markersRef.current[buyer.id] = marker;
      bounds.push([buyer.latitude, buyer.longitude]);
    });

    if (bounds.length > 0) {
      mapRef.current.fitBounds(L.latLngBounds(bounds), { padding: [50, 50] });
    }
  }, [rencana, onUpdateStatus]);

  return <div ref={containerRef} className="w-full h-full relative z-0" />;
}
