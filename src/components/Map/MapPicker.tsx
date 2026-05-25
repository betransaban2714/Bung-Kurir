'use client';

import { useEffect, useRef, useState } from 'react';
import L from 'leaflet';
import { Button } from '@/components/ui/button';
import { MapPin, Check, Layers, Map as MapIcon } from 'lucide-react';

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
  const satelliteLabelsRef = useRef<L.TileLayer | null>(null);

  const [selectedCoords, setSelectedCoords] = useState<{ lat: number; lng: number } | null>(null);
  const [hasInteracted, setHasInteracted] = useState(false);
  const [mapType, setMapType] = useState<MapType>('street');

  useEffect(() => {
    if (!containerRef.current || mapRef.current) return;

    let isMounted = true;

    const map = L.map(containerRef.current, {
      zoomControl: false,
      maxZoom: 20,
    }).setView([-2.5489, 118.0149], 5);

    mapRef.current = map;

    // Persiapkan Layer-layer peta
    streetLayerRef.current = L.tileLayer('https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png', {
      subdomains: 'abcd',
      maxZoom: 20,
    });

    satelliteLayerRef.current = L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}', {
      maxZoom: 20,
    });

    satelliteLabelsRef.current = L.tileLayer('https://{s}.basemaps.cartocdn.com/rastertiles/voyager_only_labels/{z}/{x}/{y}{r}.png', {
      subdomains: 'abcd',
      maxZoom: 20,
    });

    // Default: Street Map (Ringan)
    streetLayerRef.current.addTo(map);

    L.control.zoom({ position: 'bottomright' }).addTo(map);

    // HILANGKAN PANDUAN SAAT INTERAKSI
    map.on('movestart', () => setHasInteracted(true));
    map.on('dragstart', () => setHasInteracted(true));
    map.on('zoomstart', () => setHasInteracted(true));

    map.on('click', (e) => {
      setHasInteracted(true);
      const { lat, lng } = e.latlng;
      setSelectedCoords({ lat, lng });

      if (markerRef.current) {
        markerRef.current.setLatLng([lat, lng]);
      } else {
        const icon = L.divIcon({
          className: 'custom-marker',
          html: `<div style="background-color: #ef4444; width: 24px; height: 24px; border-radius: 50%; border: 3px solid white; box-shadow: 0 0 15px rgba(239, 68, 68, 0.8);"></div>`,
          iconSize: [24, 24],
          iconAnchor: [12, 12],
        });
        markerRef.current = L.marker([lat, lng], { icon, zIndexOffset: 1000 }).addTo(map);
      }
    });

    // Otomatis hilangkan panduan setelah 5 detik jika tra ada interaksi
    const timer = setTimeout(() => {
      if (isMounted) setHasInteracted(true);
    }, 5000);

    if ("geolocation" in navigator) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          if (isMounted && mapRef.current) {
            try {
              mapRef.current.flyTo([pos.coords.latitude, pos.coords.longitude], 16, { duration: 0.5 });
            } catch (err) {
              console.warn('Gagal flyTo:', err);
            }
          }
        },
        null,
        { enableHighAccuracy: true, timeout: 5000 }
      );
    }

    return () => {
      isMounted = false;
      clearTimeout(timer);
      if (mapRef.current) {
        mapRef.current.remove();
        mapRef.current = null;
        markerRef.current = null;
      }
    };
  }, []);

  // Effect untuk ganti layer peta
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

  const toggleMapType = () => {
    setMapType(prev => prev === 'street' ? 'satellite' : 'street');
  };

  return (
    <div className="w-full h-full relative">
      <div ref={containerRef} className="w-full h-full z-0 bg-black" />
      
      {/* Tombol Ganti Layer */}
      <div className="absolute top-4 right-4 z-30">
        <Button
          onClick={toggleMapType}
          className={`h-11 w-11 rounded-2xl backdrop-blur-md border-white/10 p-0 flex items-center justify-center active:scale-90 transition-all duration-200 shadow-2xl ${
            mapType === 'satellite' ? 'bg-primary text-white' : 'bg-black/60 text-white'
          }`}
        >
          {mapType === 'street' ? <Layers className="w-5 h-5" /> : <MapIcon className="w-5 h-5" />}
        </Button>
      </div>

      {!selectedCoords && !hasInteracted && (
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 pointer-events-none z-10 text-center space-y-2 animate-in fade-in fade-out duration-500">
          <div className="bg-black/60 backdrop-blur-md px-6 py-4 rounded-3xl border border-white/10 shadow-2xl">
            <MapPin className="w-10 h-10 text-primary mx-auto mb-2 animate-bounce" />
            <p className="font-black text-sm text-white uppercase tracking-widest">Klik di Peta Buat Tandai Lokasi</p>
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
