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
      maxZoom: 20,
    }).setView([-2.5489, 118.0149], 5);

    // 1. Layer Dasar: Satelit (ESRI World Imagery)
    L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}', {
      attribution: 'Tiles &copy; Esri &mdash; Source: Esri, i-cubed, USDA, USGS, AEX, GeoEye, Getmapping, Aerogrid, IGN, IGP, UPR-EBP, and the GIS User Community',
      maxZoom: 20
    }).addTo(mapRef.current);

    // 2. Overlay: Jalan-jalan (ESRI World Transportation)
    L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/Reference/World_Transportation/MapServer/tile/{z}/{y}/{x}', {
      attribution: 'Esri, HERE, Garmin, © OpenStreetMap contributors',
      opacity: 0.7,
      maxZoom: 20
    }).addTo(mapRef.current);

    // 3. Overlay: Nama Tempat, Toko, & POI (CartoDB Voyager Labels)
    // Layer ini lebih detail untuk nama toko dan tempat dibanding ESRI standar
    L.tileLayer('https://{s}.basemaps.cartocdn.com/rastertiles/voyager_only_labels/{z}/{x}/{y}{r}.png', {
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>',
      subdomains: 'abcd',
      maxZoom: 20,
      zIndex: 1000
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
        html: `<div style="background-color: #3b82f6; width: 14px; height: 14px; border-radius: 50%; border: 3px solid white; box-shadow: 0 0 15px rgba(59, 130, 246, 0.9);"></div>`,
        iconSize: [14, 14],
      });
      L.marker([rencana.startLocation.latitude, rencana.startLocation.longitude], { icon: startIcon })
        .addTo(mapRef.current)
        .bindTooltip("Titik Start", { permanent: false, direction: 'top' });
      bounds.push([rencana.startLocation.latitude, rencana.startLocation.longitude]);
    }

    rencana.buyers.forEach((buyer) => {
      const color = buyer.status === 'DONE' ? '#64748b' : 
                   buyer.status === 'TIP' ? '#10b981' : '#ef4444';
      
      const icon = L.divIcon({
        className: 'custom-marker',
        html: `<div style="background-color: ${color}; width: 18px; height: 18px; border-radius: 50%; border: 3px solid white; box-shadow: 0 0 12px rgba(0,0,0,0.6);"></div>`,
        iconSize: [18, 18],
        iconAnchor: [9, 9],
      });

      const marker = L.marker([buyer.latitude, buyer.longitude], { icon })
        .addTo(mapRef.current!)
        .bindPopup(() => {
          const div = document.createElement('div');
          div.className = 'p-4 min-w-[260px] space-y-3';
          
          div.innerHTML = `
            <div class="space-y-1">
              <h3 class="font-bold text-lg flex items-center gap-2">
                <span class="text-primary">👤</span> ${buyer.name}
              </h3>
              <p class="text-[11px] leading-tight text-muted-foreground">${buyer.address}</p>
            </div>
            <div class="grid grid-cols-2 gap-2 py-2 border-y border-white/10">
              <div>
                <p class="text-[9px] text-muted-foreground uppercase font-black">Paket</p>
                <p class="text-xs font-bold">📦 ${buyer.packetType}</p>
              </div>
              <div>
                <p class="text-[9px] text-muted-foreground uppercase font-black">Bayar</p>
                <p class="text-xs font-bold">💰 ${buyer.paymentMethod}</p>
              </div>
            </div>
            <div class="flex justify-between items-center py-1">
               <span class="text-xs text-muted-foreground">Harga:</span>
               <span class="font-black text-primary">Rp${buyer.price.toLocaleString()}</span>
            </div>
            ${buyer.status !== 'PENDING' ? `
              <div class="bg-muted/30 p-2 rounded-xl text-xs space-y-1 border border-white/5">
                <div class="flex justify-between"><span>Status:</span> <span class="font-bold text-green-400">SELESAI</span></div>
                <div class="flex justify-between"><span>Diterima:</span> <span class="font-bold">Rp${(buyer.paidAmount || buyer.price).toLocaleString()}</span></div>
              </div>
            ` : ''}
            <div class="grid grid-cols-1 gap-2 pt-2">
              <div class="grid grid-cols-2 gap-2">
                <button id="nav-btn-${buyer.id}" class="flex items-center justify-center gap-2 bg-primary text-white py-3 rounded-xl font-bold text-xs shadow-lg active:scale-95 transition-all">
                  📍 Buka Jalan
                </button>
                <button id="chat-btn-${buyer.id}" class="flex items-center justify-center gap-2 bg-green-600 text-white py-3 rounded-xl font-bold text-xs shadow-lg active:scale-95 transition-all">
                  💬 Chat WA
                </button>
              </div>
              ${buyer.status === 'PENDING' ? `
                <button id="done-btn-${buyer.id}" class="flex items-center justify-center gap-2 bg-accent text-white py-4 rounded-xl font-black text-lg shadow-xl active:scale-95 transition-all glow-orange">
                  ✅ SU ANTAR!
                </button>
              ` : '<p class="text-center text-[10px] font-black text-muted-foreground py-2 uppercase tracking-widest bg-white/5 rounded-lg">ANTARAN SELESAI 🔥</p>'}
            </div>
          `;

          setTimeout(() => {
            const navBtn = document.getElementById(`nav-btn-${buyer.id}`);
            const chatBtn = document.getElementById(`chat-btn-${buyer.id}`);
            const doneBtn = document.getElementById(`done-btn-${buyer.id}`);

            navBtn?.addEventListener('click', () => {
              window.open(`https://www.google.com/maps/dir/?api=1&destination=${buyer.latitude},${buyer.longitude}`, '_blank');
            });

            chatBtn?.addEventListener('click', () => {
              window.open(`https://wa.me/${buyer.waNumber.replace(/[^0-9]/g, '')}`, '_blank');
            });

            doneBtn?.addEventListener('click', () => {
              onUpdateStatus(buyer.id, 'DONE', buyer.price);
              mapRef.current?.closePopup();
            });
          }, 0);

          return div;
        });

      markersRef.current[buyer.id] = marker;
      bounds.push([buyer.latitude, buyer.longitude]);
    });

    if (bounds.length > 0) {
      mapRef.current.fitBounds(L.latLngBounds(bounds), { padding: [40, 40] });
    }
  }, [rencana, onUpdateStatus]);

  return <div ref={containerRef} className="w-full h-full relative z-0" />;
}
