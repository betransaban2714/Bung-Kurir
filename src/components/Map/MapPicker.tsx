'use client';

import { useEffect, useRef, useState } from 'react';
import L from 'leaflet';
import { Button } from '@/components/ui/button';
import { MapPin, Check } from 'lucide-react';

interface MapPickerProps {
  onSelect: (coords: { lat: number; lng: number }) => void;
}

export default function MapPicker({ onSelect }: MapPickerProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<L.Map | null>(null);
  const markerRef = useRef<L.Marker | null>(null);
  const [selectedCoords, setSelectedCoords] = useState<{ lat: number; lng: number } | null>(null);

  useEffect(() => {
    if (!containerRef.current || mapRef.current) return;

    const map = L.map(containerRef.current, {
      zoomControl: false,
      maxZoom: 20,
    }).setView([-2.5489, 118.0149], 5);

    mapRef.current = map;

    // Satelit Layer
    L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}', {
      maxZoom: 20
    }).addTo(map);

    // Label Layer
    L.tileLayer('https://{s}.basemaps.cartocdn.com/rastertiles/voyager_only_labels/{z}/{x}/{y}{r}.png', {
      subdomains: 'abcd',
      maxZoom: 20,
      zIndex: 500
    }).addTo(map);

    L.control.zoom({ position: 'bottomright' }).addTo(map);

    // Event Klik di Map
    map.on('click', (e) => {
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
        markerRef.current = L.marker([lat, lng], { icon }).addTo(map);
      }
    });

    // Coba ambil lokasi user sekarang sebagai titik awal picker
    if ("geolocation" in navigator) {
      navigator.geolocation.getCurrentPosition((pos) => {
        map.flyTo([pos.coords.latitude, pos.coords.longitude], 16);
      });
    }

    return () => {
      if (mapRef.current) {
        mapRef.current.remove();
        mapRef.current = null;
      }
    };
  }, []);

  return (
    <div className="w-full h-full relative">
      <div ref={containerRef} className="w-full h-full z-0 bg-black" />
      
      {/* Overlay Instruksi */}
      {!selectedCoords && (
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 pointer-events-none z-10 text-center space-y-2">
          <div className="bg-black/60 backdrop-blur-md px-4 py-3 rounded-2xl border border-white/10 shadow-2xl">
            <MapPin className="w-8 h-8 text-primary mx-auto mb-2 animate-bounce" />
            <p className="font-black text-xs text-white uppercase tracking-widest">Klik di Peta Buat Tandai Lokasi</p>
          </div>
        </div>
      )}

      {/* Button Konfirmasi */}
      {selectedCoords && (
        <div className="absolute bottom-6 left-1/2 -translate-x-1/2 z-30 w-[80%]">
          <Button 
            onClick={() => onSelect(selectedCoords)}
            className="w-full h-14 bg-primary text-white font-black text-lg rounded-2xl shadow-2xl glow-blue active:scale-95 transition-all gap-2"
          >
            <Check className="w-6 h-6" /> KONFIRMASI LOKASI
          </Button>
        </div>
      )}
    </div>
  );
}
