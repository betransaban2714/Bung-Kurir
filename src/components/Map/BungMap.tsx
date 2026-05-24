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
  const buyerLayerGroupRef = useRef<L.LayerGroup | null>(null);
  const routeLayerGroupRef = useRef<L.LayerGroup | null>(null);
  const userMarkerRef = useRef<L.Marker | null>(null);
  const [locating, setLocating] = useState(false);

  const createUserIcon = () => L.divIcon({
    className: 'user-marker',
    html: `
      <div class="user-marker-pulse"></div>
      <div class="user-marker-dot"></div>
    `,
    iconSize: [32, 32],
    iconAnchor: [16, 16],
  });

  const fetchRoute = async (start: [number, number], end: [number, number]) => {
    try {
      const response = await fetch(
        `https://router.project-osrm.org/route/v1/driving/${start[1]},${start[0]};${end[1]},${end[0]}?overview=full&geometries=geojson`
      );
      const data = await response.json();
      if (data.routes && data.routes.length > 0) {
        return {
          coordinates: data.routes[0].geometry.coordinates.map((c: any) => [c[1], c[0]]),
          distance: data.routes[0].distance,
          duration: data.routes[0].duration,
        };
      }
    } catch (error) {
      console.error('Gagal ambil rute:', error);
    }
    return null;
  };

  useEffect(() => {
    if (!containerRef.current || mapRef.current) return;

    const map = L.map(containerRef.current, {
      zoomControl: false,
      maxZoom: 20,
    }).setView([-2.5489, 118.0149], 5);

    mapRef.current = map;

    // Layer Satelit
    L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}', {
      attribution: 'Tiles &copy; Esri',
      maxZoom: 20
    }).addTo(map);

    // Layer Label (Jalan & Nama Tempat)
    L.tileLayer('https://{s}.basemaps.cartocdn.com/rastertiles/voyager_only_labels/{z}/{x}/{y}{r}.png', {
      subdomains: 'abcd',
      maxZoom: 20,
      zIndex: 500
    }).addTo(map);

    L.control.zoom({ position: 'bottomright' }).addTo(map);

    buyerLayerGroupRef.current = L.layerGroup().addTo(map);
    routeLayerGroupRef.current = L.layerGroup().addTo(map);

    map.on('popupclose', () => {
      routeLayerGroupRef.current?.clearLayers();
    });

    return () => {
      if (mapRef.current) {
        mapRef.current.remove();
        mapRef.current = null;
        userMarkerRef.current = null;
      }
    };
  }, []);

  useEffect(() => {
    const map = mapRef.current;
    const buyerGroup = buyerLayerGroupRef.current;
    const routeGroup = routeLayerGroupRef.current;
    if (!map || !buyerGroup || !routeGroup) return;

    buyerGroup.clearLayers();
    const bounds: L.LatLngTuple[] = [];

    // Tampilkan titik biru animasi (Lokasi Start/User)
    const initialPos = rencana.startLocation;
    if (initialPos) {
      const { latitude, longitude } = initialPos;
      if (!userMarkerRef.current) {
        userMarkerRef.current = L.marker([latitude, longitude], { 
          icon: createUserIcon(),
          zIndexOffset: 1000 
        }).addTo(map);
      } else {
        userMarkerRef.current.setLatLng([latitude, longitude]);
        if (!map.hasLayer(userMarkerRef.current)) {
          userMarkerRef.current.addTo(map);
        }
      }
      bounds.push([latitude, longitude]);
    }

    rencana.buyers.forEach((buyer) => {
      const isDone = buyer.status === 'DONE' || buyer.status === 'TIP';
      const color = isDone ? '#22c55e' : '#ef4444';
      const glowColor = isDone ? 'rgba(34, 197, 94, 0.6)' : 'rgba(239, 68, 68, 0.6)';
      
      const icon = L.divIcon({
        className: 'custom-marker',
        html: `<div style="background-color: ${color}; width: 22px; height: 22px; border-radius: 50%; border: 3px solid white; box-shadow: 0 0 15px ${glowColor};"></div>`,
        iconSize: [22, 22],
        iconAnchor: [11, 11],
      });

      L.marker([buyer.latitude, buyer.longitude], { icon })
        .addTo(buyerGroup)
        .bindPopup(() => {
          const div = document.createElement('div');
          div.className = 'p-4 min-w-[280px] space-y-3';
          div.innerHTML = `
            <div class="space-y-1">
              <h3 class="font-bold text-lg flex items-center gap-2">
                <span class="text-primary">👤</span> ${buyer.name}
              </h3>
              <p class="text-[11px] leading-tight text-muted-foreground">${buyer.address}</p>
            </div>
            <div id="route-info-${buyer.id}" class="hidden py-1 px-3 bg-white/10 rounded-lg border border-white/20 flex items-center gap-2">
               <span class="text-[10px] font-black text-white uppercase">Rute:</span>
               <span id="dist-${buyer.id}" class="text-[10px] font-bold text-white">...</span>
               <span class="text-[10px] opacity-30 text-white">|</span>
               <span id="time-${buyer.id}" class="text-[10px] font-bold text-white">...</span>
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
               <span class="text-xs text-muted-foreground">Harga Paket:</span>
               <span class="font-black text-primary">Rp${buyer.price.toLocaleString()}</span>
            </div>
            
            ${buyer.status === 'PENDING' ? `
              <div id="action-area-${buyer.id}" class="space-y-2 pt-1">
                <button id="pre-done-btn-${buyer.id}" class="w-full bg-primary text-white py-4 rounded-xl font-black text-lg shadow-xl active:scale-95 transition-all glow-blue">
                  ✅ SELESAI
                </button>
                <div id="confirm-input-area-${buyer.id}" class="hidden space-y-2 animate-in fade-in slide-in-from-top-2 duration-300">
                  <p class="text-[10px] font-black text-accent uppercase">Uang yang Diterima:</p>
                  <input 
                    type="number" 
                    id="paid-input-${buyer.id}" 
                    class="w-full h-12 bg-secondary/50 border border-white/10 rounded-xl px-4 text-lg font-black text-white focus:ring-1 focus:ring-accent outline-none"
                    value="${buyer.price}"
                  />
                  <button id="done-btn-${buyer.id}" class="w-full bg-accent text-white py-4 rounded-xl font-black text-lg shadow-xl active:scale-95 transition-all glow-orange">
                    KONFIRMASI ✅
                  </button>
                </div>
              </div>
            ` : `
              <div class="bg-green-400/10 border border-green-400/20 rounded-lg p-3 text-center">
                <p class="text-[10px] font-black text-green-400 uppercase tracking-widest">ANTARAN BERHASIL 🔥</p>
                <p class="text-[9px] text-muted-foreground">Diterima: Rp${(buyer.paidAmount || buyer.price).toLocaleString()}</p>
              </div>
            `}

            <div class="grid grid-cols-2 gap-2 pt-2">
              <button id="nav-btn-${buyer.id}" class="flex items-center justify-center gap-2 bg-white/10 text-white py-3 rounded-xl font-bold text-xs hover:bg-white/20 transition-all">
                📍 Maps
              </button>
              <button id="chat-btn-${buyer.id}" class="flex items-center justify-center gap-2 bg-green-600/20 text-green-400 py-3 rounded-xl font-bold text-xs hover:bg-green-600/30 transition-all">
                💬 WA
              </button>
            </div>
          `;

          setTimeout(async () => {
            // Animasi Rute Putih
            if (userMarkerRef.current) {
              const start = userMarkerRef.current.getLatLng();
              const end = L.latLng(buyer.latitude, buyer.longitude);
              const routeData = await fetchRoute([start.lat, start.lng], [end.lat, end.lng]);
              
              if (routeData) {
                routeGroup.clearLayers();
                L.polyline(routeData.coordinates as L.LatLngExpression[], {
                  color: 'white',
                  weight: 6,
                  opacity: 0.9,
                  lineJoin: 'round',
                  dashArray: '1, 12'
                }).addTo(routeGroup);

                const infoBox = document.getElementById(`route-info-${buyer.id}`);
                const distSpan = document.getElementById(`dist-${buyer.id}`);
                const timeSpan = document.getElementById(`time-${buyer.id}`);
                
                if (infoBox && distSpan && timeSpan) {
                  infoBox.classList.remove('hidden');
                  distSpan.innerText = `${(routeData.distance / 1000).toFixed(1)} KM`;
                  timeSpan.innerText = `${Math.round(routeData.duration / 60)} Menit`;
                }
              }
            }

            // Event Listeners
            document.getElementById(`nav-btn-${buyer.id}`)?.addEventListener('click', () => {
              window.open(`https://www.google.com/maps/dir/?api=1&destination=${buyer.latitude},${buyer.longitude}`, '_blank');
            });
            document.getElementById(`chat-btn-${buyer.id}`)?.addEventListener('click', () => {
              window.open(`https://wa.me/${buyer.waNumber.replace(/[^0-9]/g, '')}`, '_blank');
            });

            // Logika Klik SELESAI -> Muncul Form Input
            const preBtn = document.getElementById(`pre-done-btn-${buyer.id}`);
            const inputArea = document.getElementById(`confirm-input-area-${buyer.id}`);
            const doneBtn = document.getElementById(`done-btn-${buyer.id}`);

            preBtn?.addEventListener('click', () => {
              preBtn.classList.add('hidden');
              inputArea?.classList.remove('hidden');
              document.getElementById(`paid-input-${buyer.id}`)?.focus();
            });

            doneBtn?.addEventListener('click', () => {
              const input = document.getElementById(`paid-input-${buyer.id}`) as HTMLInputElement;
              const paidAmount = parseFloat(input.value) || buyer.price;
              const status: DeliveryStatus = paidAmount > buyer.price ? 'TIP' : 'DONE';
              onUpdateStatus(buyer.id, status, paidAmount);
              map.closePopup();
            });
          }, 0);

          return div;
        });

      bounds.push([buyer.latitude, buyer.longitude]);
    });

    if (bounds.length > 0 && !map.getBounds().contains(L.latLngBounds(bounds))) {
      map.fitBounds(L.latLngBounds(bounds), { padding: [60, 60], maxZoom: 18 });
    }
  }, [rencana, onUpdateStatus]);

  const handleLocateMe = () => {
    if (!mapRef.current || locating) return;
    setLocating(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const { latitude, longitude } = pos.coords;
        if (userMarkerRef.current) {
          userMarkerRef.current.setLatLng([latitude, longitude]);
          if (!mapRef.current?.hasLayer(userMarkerRef.current)) {
            userMarkerRef.current.addTo(mapRef.current!);
          }
        }
        mapRef.current!.flyTo([latitude, longitude], 18, { duration: 1.5 });
        setLocating(false);
      },
      () => setLocating(false),
      { enableHighAccuracy: true }
    );
  };

  return (
    <div className="w-full h-full relative group">
      <div ref={containerRef} className="w-full h-full z-0" />
      <div className="absolute bottom-20 right-4 z-30 flex flex-col gap-2">
        <Button
          onClick={handleLocateMe}
          disabled={locating}
          className="w-14 h-14 rounded-full glass-dark glow-blue border-white/10 p-0 flex items-center justify-center hover:scale-110 active:scale-95 transition-all shadow-2xl"
        >
          {locating ? <Loader2 className="w-7 h-7 animate-spin text-primary" /> : <LocateFixed className="w-7 h-7 text-primary" />}
        </Button>
      </div>
    </div>
  );
}
