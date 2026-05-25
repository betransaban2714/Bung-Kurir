'use client';

import { useEffect, useRef, useState } from 'react';
import L from 'leaflet';
import { Jadwal, DeliveryStatus, ActualPaymentMethod } from '@/types';
import { LocateFixed, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';

// Fix for Leaflet default icon issues in production
// @ts-ignore
if (typeof window !== 'undefined') {
  delete (L.Icon.Default.prototype as any)._getIconUrl;
  L.Icon.Default.mergeOptions({
    iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
    iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
    shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
  });
}

interface BungMapProps {
  rencana: Jadwal;
  onUpdateStatus: (buyerId: string, status: DeliveryStatus, paidAmount?: number, actualPaymentMethod?: ActualPaymentMethod) => void;
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
    iconSize: [40, 40],
    iconAnchor: [20, 20],
  });

  const fetchRoute = async (start: [number, number], end: [number, number]) => {
    try {
      const response = await fetch(
        `https://router.project-osrm.org/route/v1/driving/${start[1]},${start[0]};${end[1]},${end[0]}?overview=full&geometries=geojson`
      );
      if (!response.ok) return null;
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
      attributionControl: false,
    }).setView([-2.5489, 118.0149], 5);

    mapRef.current = map;

    L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}', {
      maxZoom: 20,
      zIndex: 1
    }).addTo(map);

    L.tileLayer('https://{s}.basemaps.cartocdn.com/rastertiles/voyager_only_labels/{z}/{x}/{y}{r}.png', {
      subdomains: 'abcd',
      maxZoom: 20,
      zIndex: 10
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

    const initialPos = rencana.startLocation;
    if (initialPos) {
      const { latitude, longitude } = initialPos;
      if (!userMarkerRef.current) {
        userMarkerRef.current = L.marker([latitude, longitude], { 
          icon: createUserIcon(),
          zIndexOffset: 3000 
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
      const glowColor = isDone ? 'rgba(34, 197, 94, 0.8)' : 'rgba(239, 68, 68, 0.8)';
      
      const icon = L.divIcon({
        className: 'custom-marker',
        html: `<div style="background-color: ${color}; width: 20px; height: 20px; border-radius: 50%; border: 3px solid white; box-shadow: 0 0 15px ${glowColor};"></div>`,
        iconSize: [20, 20],
        iconAnchor: [10, 10],
      });

      L.marker([buyer.latitude, buyer.longitude], { 
        icon,
        zIndexOffset: 1000 
      })
        .addTo(buyerGroup)
        .bindPopup(() => {
          const div = document.createElement('div');
          div.className = 'p-3 min-w-[250px] max-w-[80vw] space-y-3 bg-transparent text-white';
          
          const formatNumber = (val: number) => val.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ".");

          div.innerHTML = `
            <div class="space-y-0.5">
              <h3 class="font-black text-base flex items-center gap-2">
                <span class="text-primary text-xs">👤</span> ${buyer.name}
              </h3>
              <p class="text-[10px] leading-tight text-white/70 italic line-clamp-2">${buyer.address}</p>
            </div>
            
            <div id="route-info-${buyer.id}" class="hidden py-1.5 px-3 bg-white/10 rounded-xl border border-white/10 flex items-center justify-around">
               <div class="text-center">
                 <p class="text-[8px] font-black text-white/40 uppercase">Jarak</p>
                 <span id="dist-${buyer.id}" class="text-[11px] font-black">...</span>
               </div>
               <div class="h-4 w-px bg-white/10"></div>
               <div class="text-center">
                 <p class="text-[8px] font-black text-white/40 uppercase">Waktu</p>
                 <span id="time-${buyer.id}" class="text-[11px] font-black">...</span>
               </div>
            </div>

            <div class="grid grid-cols-2 gap-2 py-2 border-y border-white/5">
              <div class="bg-white/5 p-1.5 rounded-lg text-center">
                <p class="text-[8px] text-white/40 uppercase font-black">Paket</p>
                <p class="text-[10px] font-black text-primary">📦 ${buyer.packetType}</p>
              </div>
              <div class="bg-white/5 p-1.5 rounded-lg text-center">
                <p class="text-[8px] text-white/40 uppercase font-black">Bayar</p>
                <p class="text-[10px] font-black text-accent">💰 ${buyer.paymentMethod}</p>
              </div>
            </div>

            <div class="flex justify-between items-center px-1">
               <span class="text-[10px] font-bold text-white/50">Harga:</span>
               <span class="font-black text-base text-primary">Rp${buyer.price.toLocaleString()}</span>
            </div>
            
            ${buyer.status === 'PENDING' ? `
              <div id="action-area-${buyer.id}" class="space-y-2">
                <button id="pre-done-btn-${buyer.id}" class="w-full bg-primary text-white h-11 rounded-xl font-black text-sm shadow-lg active:scale-95 transition-all glow-blue">
                  ✅ SELESAI
                </button>
                
                <div id="payment-choice-area-${buyer.id}" class="hidden grid grid-cols-2 gap-2 animate-in fade-in duration-200">
                  <button id="choose-cash-${buyer.id}" class="bg-secondary text-white h-11 rounded-xl font-black text-[10px] border border-white/10 active:scale-95 transition-all">
                    💵 CASH (COD)
                  </button>
                  <button id="choose-qris-${buyer.id}" class="bg-blue-600/30 text-blue-400 h-11 rounded-xl font-black text-[10px] border border-blue-500/20 active:scale-95 transition-all">
                    📱 QRIS
                  </button>
                </div>

                <div id="confirm-input-area-${buyer.id}" class="hidden space-y-2 animate-in fade-in slide-in-from-top-1 duration-200 bg-black/40 p-2 rounded-xl border border-white/5">
                  <p class="text-[8px] font-black text-accent uppercase text-center">Uang yang Diterima:</p>
                  <input 
                    type="text" 
                    inputmode="numeric"
                    id="paid-input-${buyer.id}" 
                    class="w-full h-9 bg-black/60 border border-white/10 rounded-lg px-2 text-center text-base font-black text-white focus:ring-1 focus:ring-accent outline-none"
                    value="${formatNumber(buyer.price)}"
                  />
                  <button id="done-cash-btn-${buyer.id}" class="w-full bg-accent text-white h-10 rounded-lg font-black text-sm shadow-lg active:scale-95 transition-all glow-orange">
                    KONFIRMASI ✅
                  </button>
                </div>

                <div id="confirm-qris-area-${buyer.id}" class="hidden space-y-2 animate-in fade-in slide-in-from-top-1 duration-200 bg-blue-900/20 p-2 rounded-xl border border-blue-500/10">
                  <p class="text-[9px] font-black text-blue-400 uppercase text-center">Konfirmasi QRIS Berhasil?</p>
                  <button id="done-qris-btn-${buyer.id}" class="w-full bg-blue-600 text-white h-10 rounded-lg font-black text-sm shadow-lg active:scale-95 transition-all">
                    IYO, QRIS ✅
                  </button>
                </div>
              </div>
            ` : `
              <div class="bg-green-500/10 border border-green-500/20 rounded-xl p-2 text-center">
                <div class="flex items-center justify-center gap-2 mb-1">
                  <span class="text-[8px] font-black text-green-400 uppercase tracking-widest">BERHASIL 🔥</span>
                  <span class="text-[7px] font-black bg-white/10 px-1.5 py-0.5 rounded text-white/60 uppercase">${buyer.actualPaymentMethod || 'CASH'}</span>
                </div>
                <p class="text-sm font-black">Rp${(buyer.paidAmount || buyer.price).toLocaleString()}</p>
              </div>
            `}

            <div class="grid grid-cols-2 gap-2">
              <button id="nav-btn-${buyer.id}" class="flex items-center justify-center gap-1.5 bg-white/5 text-white h-9 rounded-lg font-black text-[9px] hover:bg-white/10 transition-all border border-white/5">
                📍 MAPS
              </button>
              <button id="chat-btn-${buyer.id}" class="flex items-center justify-center gap-1.5 bg-green-500/10 text-green-400 h-9 rounded-lg font-black text-[9px] hover:bg-green-500/20 transition-all border border-green-500/10">
                💬 WA
              </button>
            </div>
          `;

          setTimeout(async () => {
            if (userMarkerRef.current) {
              const start = userMarkerRef.current.getLatLng();
              const end = L.latLng(buyer.latitude, buyer.longitude);
              const routeData = await fetchRoute([start.lat, start.lng], [end.lat, end.lng]);
              
              if (routeData) {
                routeGroup.clearLayers();
                L.polyline(routeData.coordinates as L.LatLngExpression[], {
                  color: 'white',
                  weight: 5,
                  opacity: 0.9,
                  lineJoin: 'round',
                  lineCap: 'round',
                  dashArray: '1, 8'
                }).addTo(routeGroup);

                const infoBox = document.getElementById(`route-info-${buyer.id}`);
                const distSpan = document.getElementById(`dist-${buyer.id}`);
                const timeSpan = document.getElementById(`time-${buyer.id}`);
                
                if (infoBox && distSpan && timeSpan) {
                  infoBox.classList.remove('hidden');
                  distSpan.innerText = `${(routeData.distance / 1000).toFixed(1)} KM`;
                  timeSpan.innerText = `${Math.round(routeData.duration / 60)} MIN`;
                }
              }
            }

            document.getElementById(`nav-btn-${buyer.id}`)?.addEventListener('click', () => {
              window.open(`https://www.google.com/maps/dir/?api=1&destination=${buyer.latitude},${buyer.longitude}`, '_blank');
            });
            
            document.getElementById(`chat-btn-${buyer.id}`)?.addEventListener('click', () => {
              const phone = buyer.waNumber.replace(/[^0-9]/g, '');
              window.open(`https://wa.me/${phone}`, '_blank');
            });

            // LOGIKA PEMBAYARAN
            const preBtn = document.getElementById(`pre-done-btn-${buyer.id}`);
            const paymentChoice = document.getElementById(`payment-choice-area-${buyer.id}`);
            const cashArea = document.getElementById(`confirm-input-area-${buyer.id}`);
            const qrisArea = document.getElementById(`confirm-qris-area-${buyer.id}`);
            
            const btnCash = document.getElementById(`choose-cash-${buyer.id}`);
            const btnQris = document.getElementById(`choose-qris-${buyer.id}`);
            
            const doneCashBtn = document.getElementById(`done-cash-btn-${buyer.id}`);
            const doneQrisBtn = document.getElementById(`done-qris-btn-${buyer.id}`);
            const paidInput = document.getElementById(`paid-input-${buyer.id}`) as HTMLInputElement;

            paidInput?.addEventListener('input', (e) => {
              const target = e.target as HTMLInputElement;
              const raw = target.value.replace(/\D/g, '');
              target.value = raw.replace(/\B(?=(\d{3})+(?!\d))/g, ".");
            });

            preBtn?.addEventListener('click', () => {
              preBtn.classList.add('hidden');
              paymentChoice?.classList.remove('hidden');
            });

            btnCash?.addEventListener('click', () => {
              paymentChoice?.classList.add('hidden');
              cashArea?.classList.remove('hidden');
              paidInput?.focus();
            });

            btnQris?.addEventListener('click', () => {
              paymentChoice?.classList.add('hidden');
              qrisArea?.classList.remove('hidden');
            });

            doneCashBtn?.addEventListener('click', () => {
              const rawValue = paidInput.value.replace(/\./g, '');
              const paidAmount = parseFloat(rawValue) || buyer.price;
              const status: DeliveryStatus = paidAmount > buyer.price ? 'TIP' : 'DONE';
              onUpdateStatus(buyer.id, status, paidAmount, 'CASH');
              map.closePopup();
            });

            doneQrisBtn?.addEventListener('click', () => {
              onUpdateStatus(buyer.id, 'DONE', buyer.price, 'QRIS');
              map.closePopup();
            });
          }, 50);

          return div;
        }, { maxWidth: 280, minWidth: 240, className: 'elegant-popup' });

      bounds.push([buyer.latitude, buyer.longitude]);
    });

    if (bounds.length > 0) {
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
        } else {
          userMarkerRef.current = L.marker([latitude, longitude], { 
            icon: createUserIcon(),
            zIndexOffset: 3000 
          }).addTo(mapRef.current!);
        }
        mapRef.current!.flyTo([latitude, longitude], 18, { duration: 0.5 });
        setTimeout(() => setLocating(false), 200);
      },
      () => setLocating(false),
      { enableHighAccuracy: true, timeout: 5000 }
    );
  };

  return (
    <div className="w-full h-full relative group">
      <div ref={containerRef} className="w-full h-full z-0" />
      <div className="absolute bottom-36 right-4 z-30 flex flex-col gap-2">
        <Button
          onClick={handleLocateMe}
          disabled={locating}
          className="h-11 w-11 rounded-2xl bg-black/60 backdrop-blur-md border-white/10 p-0 flex items-center justify-center active:scale-90 transition-all duration-200 shadow-2xl"
        >
          {locating ? <Loader2 className="w-5 h-5 animate-spin text-primary" /> : <LocateFixed className="w-5 h-5 text-primary" />}
        </Button>
      </div>
    </div>
  );
}