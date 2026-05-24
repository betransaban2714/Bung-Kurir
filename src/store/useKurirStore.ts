'use client';

import { useState, useEffect } from 'react';
import type { Plane, Buyer, DeliveryStatus } from '@/types';

const STORAGE_KEY = 'bungkurir_data_v1';

export function useKurirStore() {
  const [planes, setPlanes] = useState<Plane[]>([]);
  const [activePlaneId, setActivePlaneId] = useState<string | null>(null);
  const [isHydrated, setIsHydrated] = useState(false);

  useEffect(() => {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      try {
        const parsed = JSON.parse(stored);
        setPlanes(parsed.planes || []);
        setActivePlaneId(parsed.activePlaneId || null);
      } catch (e) {
        console.error('Failed to parse storage', e);
      }
    }
    setIsHydrated(true);
  }, []);

  useEffect(() => {
    if (!isHydrated) return;
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ planes, activePlaneId }));
  }, [planes, activePlaneId, isHydrated]);

  const activePlane = planes.find((p) => p.id === activePlaneId) || null;

  const createPlane = (name: string, start?: any, end?: any) => {
    const newPlane: Plane = {
      id: crypto.randomUUID(),
      name,
      startLocation: start,
      endLocation: end,
      buyers: [],
      createdAt: Date.now(),
    };
    setPlanes((prev) => [...prev, newPlane]);
    setActivePlaneId(newPlane.id);
    return newPlane;
  };

  const deletePlane = (id: string) => {
    setPlanes((prev) => prev.filter((p) => p.id !== id));
    if (activePlaneId === id) setActivePlaneId(null);
  };

  const addBuyer = (planeId: string, buyerData: Omit<Buyer, 'id' | 'status' | 'createdAt'>) => {
    const newBuyer: Buyer = {
      ...buyerData,
      id: crypto.randomUUID(),
      status: 'PENDING',
      createdAt: Date.now(),
    };
    setPlanes((prev) =>
      prev.map((p) => (p.id === planeId ? { ...p, buyers: [...p.buyers, newBuyer] } : p))
    );
  };

  const updateBuyerStatus = (planeId: string, buyerId: string, status: DeliveryStatus, paidAmount?: number) => {
    setPlanes((prev) =>
      prev.map((p) =>
        p.id === planeId
          ? {
              ...p,
              buyers: p.buyers.map((b) =>
                b.id === buyerId ? { ...b, status, paidAmount } : b
              ),
            }
          : p
      )
    );
  };

  const deleteBuyer = (planeId: string, buyerId: string) => {
    setPlanes((prev) =>
      prev.map((p) =>
        p.id === planeId
          ? { ...p, buyers: p.buyers.filter((b) => b.id !== buyerId) }
          : p
      )
    );
  };

  return {
    planes,
    activePlane,
    activePlaneId,
    setActivePlaneId,
    createPlane,
    deletePlane,
    addBuyer,
    updateBuyerStatus,
    deleteBuyer,
    isHydrated,
  };
}