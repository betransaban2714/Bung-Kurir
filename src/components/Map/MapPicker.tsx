'use client';

import { useEffect, useRef, useState } from 'react';
import L from 'leaflet';
import { Button } from '@/components/ui/button';
import { MapPin, Check, Layers, Map as MapIcon } from 'lucide-react';

if (typeof window !== 'undefined') {
  delete (L.Icon.Default.prototype as any)._getIconUrl;
  L.Icon.Default.mergeOptions({
    iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
    iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
    shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
  });
}

interface MapPickerProps {
  onSelect: (coords: { lat: number; lng: number }) => void;
}

type MapType = 'street' | 'satellite';

export default function MapPicker({ onSelect }: MapPickerProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<L.Map | null>(null);
  const markerRef = useRef<L.Marker | null>(null);
  
  const streetLayerRef = useRef<L.TileLayer | null>(null);
  const satelliteLayerRef = useRef<L.TileLayer | null>(null);

  const [selectedCoords, setSelectedCoords] = useState<{ lat: number; lng: number } | null>(null);
  const [hasInteracted, setHasInteracted] = useState(false);
  const [mapType, setMapType] = useState<MapType>('street');

  useEffect(() => {
    if (!containerRef.current || mapRef.current) return;

    const map = L.map(containerRef.current, {
      zoomControl: false,
      maxZoom: 20,
      attributionControl: false,
    }).setView([-2.5489, 118.0149], 5);

    mapRef.current = map;

    // TEMA TERANG: CartoDB Voyager
    streetLayerRef.current = L.tileLayer('https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png', {
      subdomains: 'abcd',
      maxZoom: 20
    });

    satelliteLayerRef.current = L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}', {
      maxZoom: 20,
    });

    streetLayerRef.current.addTo(map);
    L.control.zoom({ position: 'bottomright' }).addTo(map);

    map.on('movestart', () => setHasInteracted(true));
    map.on('click', (e) => {
      setHasInteracted(true);
      const { lat, lng } = e.latlng;
      setSelectedCoords({ lat, lng });

      if (markerRef.current) {
        markerRef.current.setLatLng([lat, lng]);
      } else {
        const icon = L.divIcon({
          className: 'custom-marker',
          html: `<div style="background-color: #ef4444; width: 26px; height: 26px; border-radius: 50%; border: 3px solid white; box-shadow: 0 4px 15px rgba(239, 44, 44, 0.4);"></div>`,
          iconSize: [26, 26],
          iconAnchor: [13, 13],
        });
        markerRef.current = L.marker([lat, lng], { icon, zIndexOffset: 1000 }).addTo(map);
      }
    });

    if ("geolocation" in navigator) {
      navigator.geolocation.getCurrentPosition((pos) => {
        if (mapRef.current) mapRef.current.flyTo([pos.coords.latitude, pos.coords.longitude], 16);
      });
    }

    return () => {
      if (mapRef.current) {
        mapRef.current.remove();
        mapRef.current = null;
      }
    };
  }, []);

  useEffect(() => {
    const map = mapRef.current;
    if (!map || !streetLayerRef.current || !satelliteLayerRef.current) return;

    if (mapType === 'street') {
      map.addLayer(streetLayerRef.current);
      if (map.hasLayer(satelliteLayerRef.current)) map.removeLayer(satelliteLayerRef.current);
    } else {
      map.addLayer(satelliteLayerRef.current);
      if (map.hasLayer(streetLayerRef.current)) map.removeLayer(streetLayerRef.current);
    }
  }, [mapType]);

  return (
    <div className="w-full h-full relative">
      <div ref={containerRef} className="w-full h-full z-0 bg-slate-50" />
      <div className="absolute top-4 right-4 z-30">
        <Button
          onClick={() => setMapType(prev => prev === 'street' ? 'satellite' : 'street')}
          className="h-11 w-11 rounded-2xl bg-white/80 border border-border shadow-lg backdrop-blur-md p-0 flex items-center justify-center active:scale-90 transition-all"
        >
          <Layers className="w-5 h-5 text-foreground" />
        </Button>
      </div>

      {!selectedCoords && !hasInteracted && (
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 pointer-events-none z-10 text-center space-y-2 animate-in fade-in duration-500">
          <div className="bg-white/90 backdrop-blur-md px-6 py-4 rounded-3xl border border-border shadow-2xl">
            <MapPin className="w-10 h-10 text-primary mx-auto mb-2 animate-bounce" />
            <p className="font-black text-sm text-foreground uppercase tracking-widest">Klik di Peta Buat Tandai Lokasi</p>
          </div>
        </div>
      )}

      {selectedCoords && (
        <div className="absolute bottom-8 left-1/2 -translate-x-1/2 z-30 w-[85%] animate-in slide-in-from-bottom-4 duration-300">
          <Button 
            onClick={() => onSelect(selectedCoords)}
            className="w-full h-16 bg-primary text-white font-black text-xl rounded-2xl shadow-2xl glow-blue active:scale-95 transition-all gap-2"
          >
            <Check className="w-7 h-7" /> KONFIRMASI LOKASI 🔥
          </Button>
        </div>
      )}
    </div>
  );
}