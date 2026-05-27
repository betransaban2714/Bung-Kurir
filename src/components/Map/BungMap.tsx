'use client';

import { useEffect, useRef, useState } from 'react';
import L from 'leaflet';
import { Buyer, DeliveryStatus, ActualPaymentMethod, PaymentStatus } from '@/types';
import { LocateFixed, Loader2, Layers, Map as MapIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';

if (typeof window !== 'undefined') {
  delete (L.Icon.Default.prototype as any)._getIconUrl;
  L.Icon.Default.mergeOptions({
    iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
    iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
    shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
  });
}

interface BungMapProps {
  rencana: { id: string, buyers: Buyer[], startLocation?: any };
  onUpdateStatus: (buyerId: string, status: DeliveryStatus, data: { paidAmount?: number, price?: number, actualPaymentMethod?: ActualPaymentMethod, paymentMethod?: PaymentStatus }) => void;
}

type MapType = 'street' | 'satellite';

export default function BungMap({ rencana, onUpdateStatus }: BungMapProps) {
  const mapRef = useRef<L.Map | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const buyerLayerGroupRef = useRef<L.LayerGroup | null>(null);
  const routeLayerGroupRef = useRef<L.LayerGroup | null>(null);
  const userMarkerRef = useRef<L.Marker | null>(null);
  
  const streetLayerRef = useRef<L.TileLayer | null>(null);
  const satelliteLayerRef = useRef<L.TileLayer | null>(null);
  const satelliteLabelsRef = useRef<L.TileLayer | null>(null);

  const [locating, setLocating] = useState(false);
  const [mapType, setMapType] = useState<MapType>('street');

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

    streetLayerRef.current = L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', {
      subdomains: 'abcd',
      maxZoom: 20,
    });

    satelliteLayerRef.current = L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}', {
      maxZoom: 20,
    });

    satelliteLabelsRef.current = L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_only_labels/{z}/{x}/{y}{r}.png', {
      subdomains: 'abcd',
      maxZoom: 20,
    });

    streetLayerRef.current.addTo(map);

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
    if (!map || !streetLayerRef.current || !satelliteLayerRef.current || !satelliteLabelsRef.current) return;

    if (mapType === 'street') {
      map.addLayer(streetLayerRef.current);
      map.removeLayer(satelliteLayerRef.current);
      map.removeLayer(satelliteLabelsRef.current);
    } else {
      map.addLayer(satelliteLayerRef.current);
      map.addLayer(satelliteLabelsRef.current);
      map.removeLayer(streetLayerRef.current);
    }
  }, [mapType]);

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
          div.className = 'p-3 min-w-[260px] max-w-[80vw] space-y-3 bg-transparent text-white';
          
          const formatNumber = (val: number) => val.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ".");

          div.innerHTML = `
            <div class="space-y-0.5">
              <h3 class="font-black text-base flex items-center gap-2">
                👤 ${buyer.name}
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

            ${buyer.status === 'PENDING' ? `
              <div id="action-area-${buyer.id}" class="space-y-2">
                <button id="main-done-btn-${buyer.id}" class="w-full bg-primary text-white h-11 rounded-xl font-black text-sm shadow-lg active:scale-95 transition-all glow-blue">
                  ✅ SELESAI
                </button>
                
                <div id="method-choice-${buyer.id}" class="hidden grid grid-cols-2 gap-2 animate-in fade-in duration-200">
                  <button id="choice-cod-${buyer.id}" class="bg-accent text-white h-12 rounded-xl font-black text-xs active:scale-95 transition-all shadow-xl">
                    💵 COD
                  </button>
                  <button id="choice-lunas-${buyer.id}" class="bg-blue-600 text-white h-12 rounded-xl font-black text-xs active:scale-95 transition-all shadow-xl">
                    ✅ LUNAS
                  </button>
                </div>

                <div id="cod-input-area-${buyer.id}" class="hidden space-y-3 animate-in fade-in slide-in-from-top-1 duration-200 bg-black/40 p-3 rounded-2xl border border-white/5">
                  <div class="space-y-1">
                    <p class="text-[8px] font-black text-white/40 uppercase px-1">Harga Paket (Rp):</p>
                    <input 
                      type="text" 
                      inputmode="numeric"
                      id="price-input-${buyer.id}" 
                      placeholder="Harga Paket"
                      class="w-full h-10 bg-black/60 border border-white/10 rounded-lg px-3 text-sm font-black text-white focus:ring-1 focus:ring-accent outline-none"
                      value="${buyer.price ? formatNumber(buyer.price) : ''}"
                    />
                  </div>

                  <div class="space-y-1">
                    <p class="text-[8px] font-black text-white/40 uppercase px-1">Uang Diterima (Rp):</p>
                    <input 
                      type="text" 
                      inputmode="numeric"
                      id="paid-input-${buyer.id}" 
                      placeholder="Uang Diterima"
                      class="w-full h-10 bg-black/60 border border-white/10 rounded-lg px-3 text-sm font-black text-accent focus:ring-1 focus:ring-accent outline-none"
                      value="${buyer.price ? formatNumber(buyer.price) : ''}"
                    />
                  </div>
                  
                  <div class="grid grid-cols-2 gap-2 pt-1">
                    <button id="confirm-cod-cash-${buyer.id}" class="bg-accent text-white h-10 rounded-lg font-black text-[10px] shadow-lg active:scale-95 transition-all">
                      💵 CASH
                    </button>
                    <button id="confirm-cod-qris-${buyer.id}" class="bg-blue-600 text-white h-10 rounded-lg font-black text-[10px] shadow-lg active:scale-95 transition-all">
                      📱 QRIS
                    </button>
                  </div>
                </div>
              </div>
            ` : `
              <div class="bg-green-500/10 border border-green-500/20 rounded-xl p-3 text-center">
                <div class="flex items-center justify-center gap-2 mb-1">
                  <span class="text-[8px] font-black text-green-400 uppercase tracking-widest">BERHASIL 🔥</span>
                  <span class="text-[7px] font-black bg-white/10 px-1.5 py-0.5 rounded text-white/60 uppercase">${buyer.paymentMethod || 'LUNAS'}</span>
                </div>
                ${buyer.paymentMethod === 'COD' ? `<p class="text-sm font-black">Rp${(buyer.paidAmount || buyer.price || 0).toLocaleString()}</p>` : ''}
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
                  color: 'white', weight: 5, opacity: 0.9, lineJoin: 'round', lineCap: 'round', dashArray: '1, 8'
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

            const mainDoneBtn = document.getElementById(`main-done-btn-${buyer.id}`);
            const methodChoice = document.getElementById(`method-choice-${buyer.id}`);
            const codArea = document.getElementById(`cod-input-area-${buyer.id}`);
            
            const btnCod = document.getElementById(`choice-cod-${buyer.id}`);
            const btnLunas = document.getElementById(`choice-lunas-${buyer.id}`);
            
            const priceInput = document.getElementById(`price-input-${buyer.id}`) as HTMLInputElement;
            const paidInput = document.getElementById(`paid-input-${buyer.id}`) as HTMLInputElement;
            
            const confirmCash = document.getElementById(`confirm-cod-cash-${buyer.id}`);
            const confirmQris = document.getElementById(`confirm-cod-qris-${buyer.id}`);

            const setupMask = (input: HTMLInputElement) => {
              input?.addEventListener('input', (e) => {
                const target = e.target as HTMLInputElement;
                const raw = target.value.replace(/\D/g, '');
                target.value = raw.replace(/\B(?=(\d{3})+(?!\d))/g, ".");
              });
            };
            if(priceInput) setupMask(priceInput);
            if(paidInput) setupMask(paidInput);

            mainDoneBtn?.addEventListener('click', () => {
              mainDoneBtn.classList.add('hidden');
              
              if (buyer.paymentMethod === 'LUNAS') {
                 onUpdateStatus(buyer.id, 'DONE', { paymentMethod: 'LUNAS', price: 0, paidAmount: 0 });
                 map.closePopup();
              } else if (buyer.paymentMethod === 'COD' && buyer.price && buyer.price > 0) {
                 codArea?.classList.remove('hidden');
                 if (paidInput) paidInput.focus();
              } else {
                 methodChoice?.classList.remove('hidden');
              }
            });

            btnLunas?.addEventListener('click', () => {
              onUpdateStatus(buyer.id, 'DONE', { paymentMethod: 'LUNAS', price: 0, paidAmount: 0 });
              map.closePopup();
            });

            btnCod?.addEventListener('click', () => {
              methodChoice?.classList.add('hidden');
              codArea?.classList.remove('hidden');
              if (priceInput) priceInput.focus();
            });

            const submitCod = (method: ActualPaymentMethod) => {
              const rawPrice = priceInput.value.replace(/\./g, '');
              const rawPaid = paidInput.value.replace(/\./g, '');
              const price = parseFloat(rawPrice) || 0;
              const paidAmount = parseFloat(rawPaid) || price;
              const status: DeliveryStatus = paidAmount > price ? 'TIP' : 'DONE';
              
              onUpdateStatus(buyer.id, status, { 
                paymentMethod: 'COD', 
                price, 
                paidAmount, 
                actualPaymentMethod: method 
              });
              map.closePopup();
            };

            confirmCash?.addEventListener('click', () => submitCod('CASH'));
            confirmQris?.addEventListener('click', () => submitCod('QRIS'));

          }, 50);

          return div;
        }, { maxWidth: 280, minWidth: 260, className: 'elegant-popup' });

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
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
    );
  };

  const toggleMapType = () => {
    setMapType(prev => prev === 'street' ? 'satellite' : 'street');
  };

  return (
    <div className="w-full h-full relative group">
      <div ref={containerRef} className="w-full h-full z-0" />
      <div className="absolute bottom-36 right-4 z-30 flex flex-col gap-3">
        <Button
          onClick={toggleMapType}
          className={`h-11 w-11 rounded-2xl backdrop-blur-md border-white/10 p-0 flex items-center justify-center active:scale-90 transition-all duration-200 shadow-2xl ${
            mapType === 'satellite' ? 'bg-primary text-white' : 'bg-black/60 text-white'
          }`}
        >
          {mapType === 'street' ? <Layers className="w-5 h-5" /> : <MapIcon className="w-5 h-5" />}
        </Button>
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