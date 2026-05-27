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
  onUpdateStatus: (buyerId: string, status: DeliveryStatus, data: any) => void;
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
    html: `<div class="user-marker-pulse"></div><div class="user-marker-dot"></div>`,
    iconSize: [40, 40],
    iconAnchor: [20, 20],
  });

  const fetchRoute = async (start: [number, number], end: [number, number]) => {
    try {
      const response = await fetch(`https://router.project-osrm.org/route/v1/driving/${start[1]},${start[0]};${end[1]},${end[0]}?overview=full&geometries=geojson`);
      if (!response.ok) return null;
      const data = await response.json();
      if (data.routes && data.routes.length > 0) {
        return {
          coordinates: data.routes[0].geometry.coordinates.map((c: any) => [c[1], c[0]]),
          distance: data.routes[0].distance,
          duration: data.routes[0].duration,
        };
      }
    } catch (e) {}
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
      className: 'google-dark-tiles' 
    });

    satelliteLayerRef.current = L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}', { maxZoom: 20 });
    satelliteLabelsRef.current = L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_only_labels/{z}/{x}/{y}{r}.png', { subdomains: 'abcd', maxZoom: 20 });

    streetLayerRef.current.addTo(map);
    L.control.zoom({ position: 'bottomright' }).addTo(map);
    buyerLayerGroupRef.current = L.layerGroup().addTo(map);
    routeLayerGroupRef.current = L.layerGroup().addTo(map);

    return () => { 
      if (mapRef.current) {
        mapRef.current.remove();
        mapRef.current = null;
      }
    };
  }, []);

  useEffect(() => {
    const map = mapRef.current;
    if (!map || !streetLayerRef.current || !satelliteLayerRef.current || !satelliteLabelsRef.current) return;

    try {
      if (mapType === 'street') {
        if (!map.hasLayer(streetLayerRef.current)) map.addLayer(streetLayerRef.current);
        if (map.hasLayer(satelliteLayerRef.current)) map.removeLayer(satelliteLayerRef.current);
        if (map.hasLayer(satelliteLabelsRef.current)) map.removeLayer(satelliteLabelsRef.current);
      } else {
        if (!map.hasLayer(satelliteLayerRef.current)) map.addLayer(satelliteLayerRef.current);
        if (!map.hasLayer(satelliteLabelsRef.current)) map.addLayer(satelliteLabelsRef.current);
        if (map.hasLayer(streetLayerRef.current)) map.removeLayer(streetLayerRef.current);
      }
    } catch (err) {
      console.warn('Gagal ganti layer:', err);
    }
  }, [mapType]);

  useEffect(() => {
    const map = mapRef.current;
    const buyerGroup = buyerLayerGroupRef.current;
    if (!map || !buyerGroup) return;

    buyerGroup.clearLayers();
    const bounds: L.LatLngTuple[] = [];

    if (rencana.startLocation) {
      const { latitude, longitude } = rencana.startLocation;
      if (!userMarkerRef.current) {
        userMarkerRef.current = L.marker([latitude, longitude], { icon: createUserIcon(), zIndexOffset: 3000 }).addTo(map);
      } else {
        userMarkerRef.current.setLatLng([latitude, longitude]).addTo(map);
      }
      bounds.push([latitude, longitude]);
    }

    rencana.buyers.forEach((buyer) => {
      const isDone = buyer.status === 'DONE' || buyer.status === 'TIP';
      const color = isDone ? '#22c55e' : '#ff3131';
      
      const icon = L.divIcon({
        className: 'custom-marker',
        html: `<div style="background-color: ${color}; width: 22px; height: 22px; border-radius: 50%; border: 3px solid white; box-shadow: 0 0 10px rgba(0,0,0,0.5);"></div>`,
        iconSize: [22, 22],
        iconAnchor: [11, 11],
      });

      L.marker([buyer.latitude, buyer.longitude], { icon, zIndexOffset: 1000 })
        .addTo(buyerGroup)
        .bindPopup(() => {
          const div = document.createElement('div');
          div.className = 'p-3 min-w-[260px] text-white';
          
          div.innerHTML = `
            <div class="space-y-1">
              <h3 class="font-black text-base truncate">👤 ${buyer.name}</h3>
              <p class="text-[10px] text-white/60 italic line-clamp-1">${buyer.address}</p>
            </div>
            
            <div id="route-info-${buyer.id}" class="hidden py-1.5 px-3 bg-white/5 rounded-xl border border-white/5 flex items-center justify-around my-2">
               <div class="text-center">
                 <p class="text-[8px] font-black opacity-40">JARAK</p>
                 <span id="dist-${buyer.id}" class="text-[11px] font-black">...</span>
               </div>
               <div class="text-center">
                 <p class="text-[8px] font-black opacity-40">WAKTU</p>
                 <span id="time-${buyer.id}" class="text-[11px] font-black">...</span>
               </div>
            </div>

            ${buyer.status === 'PENDING' ? `
              <div class="space-y-2 mt-2">
                <button id="done-btn-${buyer.id}" class="w-full bg-primary h-11 rounded-xl font-black text-sm glow-blue">✅ SELESAI</button>
                <div id="action-area-${buyer.id}" class="hidden space-y-2 animate-in fade-in slide-in-from-top-1">
                   ${!buyer.price || buyer.price === 0 ? `
                     <div class="space-y-2">
                       <p class="text-[9px] font-black text-center text-accent uppercase">Harga Paket Belum Diisi!</p>
                       <input id="price-input-${buyer.id}" type="number" placeholder="Isi Harga Paket" class="w-full bg-white/10 h-10 rounded-lg text-center font-black text-sm border border-white/10" />
                     </div>
                   ` : ''}
                  <div class="grid grid-cols-2 gap-2">
                    <button id="confirm-cash-${buyer.id}" class="bg-accent h-10 rounded-lg font-black text-[10px]">💵 CASH</button>
                    <button id="confirm-qris-${buyer.id}" class="bg-blue-600 h-10 rounded-lg font-black text-[10px]">📱 QRIS</button>
                  </div>
                </div>
              </div>
            ` : `
              <div class="bg-green-500/10 border border-green-500/20 rounded-xl p-3 text-center mt-2">
                <span class="text-[8px] font-black text-green-400 uppercase">BERHASIL 🔥</span>
                <p class="text-sm font-black">Rp${(buyer.paidAmount || buyer.price || 0).toLocaleString()}</p>
              </div>
            `}

            <div class="grid grid-cols-2 gap-2 mt-3">
              <button id="nav-btn-${buyer.id}" class="bg-white/5 h-8 rounded-lg font-black text-[9px] border border-white/5">📍 MAPS</button>
              <button id="chat-btn-${buyer.id}" class="bg-green-500/10 text-green-400 h-8 rounded-lg font-black text-[9px] border border-green-500/10">💬 WA</button>
            </div>
          `;

          setTimeout(async () => {
            if (userMarkerRef.current && mapRef.current) {
              const start = userMarkerRef.current.getLatLng();
              const routeData = await fetchRoute([start.lat, start.lng], [buyer.latitude, buyer.longitude]);
              if (routeData && routeLayerGroupRef.current) {
                routeLayerGroupRef.current.clearLayers();
                L.polyline(routeData.coordinates as L.LatLngExpression[], { color: '#ffffff', weight: 4, opacity: 0.9 }).addTo(routeLayerGroupRef.current);
                const distSpan = document.getElementById(`dist-${buyer.id}`);
                const timeSpan = document.getElementById(`time-${buyer.id}`);
                if (distSpan) distSpan.innerText = `${(routeData.distance / 1000).toFixed(1)} KM`;
                if (timeSpan) timeSpan.innerText = `${Math.round(routeData.duration / 60)} MIN`;
                document.getElementById(`route-info-${buyer.id}`)?.classList.remove('hidden');
              }
            }

            document.getElementById(`nav-btn-${buyer.id}`)?.addEventListener('click', () => window.open(`https://www.google.com/maps/dir/?api=1&destination=${buyer.latitude},${buyer.longitude}`));
            document.getElementById(`chat-btn-${buyer.id}`)?.addEventListener('click', () => window.open(`https://wa.me/?text=Halo ${buyer.name}, saya Kurir sedang menuju ke lokasi.`));

            const doneBtn = document.getElementById(`done-btn-${buyer.id}`);
            const actionArea = document.getElementById(`action-area-${buyer.id}`);
            
            doneBtn?.addEventListener('click', () => {
              if (buyer.paymentMethod === 'LUNAS') {
                onUpdateStatus(buyer.id, 'DONE', { paymentMethod: 'LUNAS', price: 0, paidAmount: 0 });
                if (mapRef.current) mapRef.current.closePopup();
              } else {
                doneBtn.classList.add('hidden');
                actionArea?.classList.remove('hidden');
              }
            });

            const submit = (method: ActualPaymentMethod) => {
              const priceInput = document.getElementById(`price-input-${buyer.id}`) as HTMLInputElement;
              const finalPrice = priceInput ? (parseFloat(priceInput.value) || 0) : (buyer.price || 0);
              
              onUpdateStatus(buyer.id, 'DONE', { 
                paymentMethod: 'COD', 
                actualPaymentMethod: method, 
                price: finalPrice,
                paidAmount: finalPrice 
              });
              if (mapRef.current) mapRef.current.closePopup();
            };
            document.getElementById(`confirm-cash-${buyer.id}`)?.addEventListener('click', () => submit('CASH'));
            document.getElementById(`confirm-qris-${buyer.id}`)?.addEventListener('click', () => submit('QRIS'));
          }, 50);

          return div;
        });

      bounds.push([buyer.latitude, buyer.longitude]);
    });

    if (bounds.length > 0 && mapRef.current) mapRef.current.fitBounds(L.latLngBounds(bounds), { padding: [50, 50], maxZoom: 18 });
  }, [rencana, onUpdateStatus]);

  return (
    <div className="w-full h-full relative">
      <div ref={containerRef} className="w-full h-full z-0" />
      <div className="absolute bottom-36 right-4 z-30 flex flex-col gap-3">
        <Button onClick={() => setMapType(prev => prev === 'street' ? 'satellite' : 'street')} className="h-11 w-11 rounded-2xl bg-black/60 text-white border border-white/10 shadow-2xl backdrop-blur-md"><Layers className="w-5 h-5" /></Button>
        <Button onClick={() => {
          if (navigator.geolocation && mapRef.current) {
            navigator.geolocation.getCurrentPosition((pos) => {
              const { latitude, longitude } = pos.coords;
              if (userMarkerRef.current) userMarkerRef.current.setLatLng([latitude, longitude]).addTo(mapRef.current!);
              mapRef.current!.flyTo([latitude, longitude], 18);
            });
          }
        }} className="h-11 w-11 rounded-2xl bg-black/60 text-primary border border-white/10 shadow-2xl backdrop-blur-md"><LocateFixed className="w-5 h-5" /></Button>
      </div>
    </div>
  );
}