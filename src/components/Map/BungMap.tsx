'use client';

import { useEffect, useRef, useState } from 'react';
import L from 'leaflet';
import { Rencana, DeliveryStatus } from '@/types';
import { LocateFixed, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface BungMapProps {
  rencana: Rencana;
  onUpdateStatus: (buyerId: string, status: DeliveryStatus, paidAmount?: number) => void;
}

export default function BungMap({ rencana, onUpdateStatus }: BungMapProps) {
  const mapRef = useRef<L.Map | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const markersRef = useRef<Record<string, L.Marker>>({});
  const userMarkerRef = useRef<L.Marker | null>(null);
  const [locating, setLocating] = useState(false);

  // Helper to create the Blue Animated User Icon
  const createUserIcon = () => L.divIcon({
    className: 'user-marker',
    html: `<div class="relative flex items-center justify-center">
            <div class="absolute w-8 h-8 bg-blue-500/30 rounded-full animate-ping"></div>
            <div style="background-color: #3b82f6; width: 16px; height: 16px; border-radius: 50%; border: 3px solid white; box-shadow: 0 0 10px rgba(59, 130, 246, 1);"></div>
          </div>`,
    iconSize: [16, 16],
  });

  useEffect(() => {
    if (!containerRef.current || mapRef.current) return;

    // Initialize Map
    mapRef.current = L.map(containerRef.current, {
      zoomControl: false,
      maxZoom: 20,
    }).setView([-2.5489, 118.0149], 5);

    // 1. Layer Satelit (ESRI)
    L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}', {
      attribution: 'Tiles &copy; Esri',
      maxZoom: 20
    }).addTo(mapRef.current);

    // 2. Layer Jalan (ESRI)
    L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/Reference/World_Transportation/MapServer/tile/{z}/{y}/{x}', {
      opacity: 0.6,
      maxZoom: 20
    }).addTo(mapRef.current);

    // 3. Layer Label (Nama Toko, Jalan, Gedung)
    L.tileLayer('https://{s}.basemaps.cartocdn.com/rastertiles/voyager_only_labels/{z}/{x}/{y}{r}.png', {
      subdomains: 'abcd',
      maxZoom: 20,
      zIndex: 1000
    }).addTo(mapRef.current);

    // Standard Zoom Control
    L.control.zoom({ position: 'bottomright' }).addTo(mapRef.current);

    return () => {
      if (mapRef.current) {
        mapRef.current.remove();
        mapRef.current = null;
      }
    };
  }, []);

  // Update Markers when rencana changes
  useEffect(() => {
    if (!mapRef.current) return;

    // 1. CLEAR OLD BUYER MARKERS (BUT KEEP USER MARKER)
    Object.values(markersRef.current).forEach(m => m.remove());
    markersRef.current = {};

    const bounds: L.LatLngTuple[] = [];

    // 2. USER LOCATION MARKER - ALWAYS ONLY ONE
    if (rencana.startLocation) {
      const { latitude, longitude } = rencana.startLocation;
      
      if (!userMarkerRef.current) {
        userMarkerRef.current = L.marker([latitude, longitude], { icon: createUserIcon() })
          .addTo(mapRef.current)
          .bindTooltip("Saya Ada Sini", { direction: 'top' });
      } else {
        // Just move existing one if it's the first render of a new plan
        // We don't want to force it to startLocation if the user has already clicked 'Locate Me'
        // But for a fresh plan, it's good.
      }
      bounds.push([latitude, longitude]);
    }

    // 3. ADD BUYER MARKERS
    rencana.buyers.forEach((buyer) => {
      const isDone = buyer.status === 'DONE' || buyer.status === 'TIP';
      const color = isDone ? '#22c55e' : '#ef4444';
      const glowColor = isDone ? 'rgba(34, 197, 94, 0.6)' : 'rgba(239, 68, 68, 0.6)';
      
      const icon = L.divIcon({
        className: 'custom-marker',
        html: `<div style="background-color: ${color}; width: 20px; height: 20px; border-radius: 50%; border: 3px solid white; box-shadow: 0 0 15px ${glowColor};"></div>`,
        iconSize: [20, 20],
        iconAnchor: [10, 10],
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
              ` : '<p class="text-center text-[10px] font-black text-green-400 py-2 uppercase tracking-widest bg-green-400/10 border border-green-400/20 rounded-lg">ANTARAN BERHASIL 🔥</p>'}
            </div>
          `;

          setTimeout(() => {
            document.getElementById(`nav-btn-${buyer.id}`)?.addEventListener('click', () => {
              window.open(`https://www.google.com/maps/dir/?api=1&destination=${buyer.latitude},${buyer.longitude}`, '_blank');
            });

            document.getElementById(`chat-btn-${buyer.id}`)?.addEventListener('click', () => {
              window.open(`https://wa.me/${buyer.waNumber.replace(/[^0-9]/g, '')}`, '_blank');
            });

            document.getElementById(`done-btn-${buyer.id}`)?.addEventListener('click', () => {
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
      mapRef.current.fitBounds(L.latLngBounds(bounds), { padding: [60, 60], maxZoom: 18 });
    }
  }, [rencana, onUpdateStatus]);

  const handleLocateMe = () => {
    if (!mapRef.current || locating) return;
    
    setLocating(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const { latitude, longitude } = pos.coords;
        
        if (!userMarkerRef.current) {
          userMarkerRef.current = L.marker([latitude, longitude], { icon: createUserIcon() })
            .addTo(mapRef.current!)
            .bindTooltip("Saya Ada Sini", { direction: 'top' });
        } else {
          userMarkerRef.current.setLatLng([latitude, longitude]);
        }

        mapRef.current!.flyTo([latitude, longitude], 18, { duration: 1.5 });
        setLocating(false);
      },
      (err) => {
        console.error("GPS Error:", err);
        setLocating(false);
      },
      { enableHighAccuracy: true }
    );
  };

  return (
    <div className="w-full h-full relative group">
      <div ref={containerRef} className="w-full h-full z-0" />
      
      {/* LOCATE ME FLOATING BUTTON */}
      <div className="absolute bottom-20 right-4 z-30">
        <Button
          onClick={handleLocateMe}
          disabled={locating}
          className="w-14 h-14 rounded-full glass-dark glow-blue border-white/10 p-0 flex items-center justify-center hover:scale-110 active:scale-95 transition-all shadow-2xl"
        >
          {locating ? (
            <Loader2 className="w-7 h-7 animate-spin text-primary" />
          ) : (
            <LocateFixed className="w-7 h-7 text-primary" />
          )}
        </Button>
      </div>
    </div>
  );
}
