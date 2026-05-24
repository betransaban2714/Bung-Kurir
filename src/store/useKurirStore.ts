'use client';

import { useState, useEffect } from 'react';
import type { Rencana, Buyer, DeliveryStatus } from '@/types';

const STORAGE_KEY = 'bungkurir_data_v2';

export function useKurirStore() {
  const [rencanaList, setRencanaList] = useState<Rencana[]>([]);
  const [activeRencanaId, setActiveRencanaId] = useState<string | null>(null);
  const [isHydrated, setIsHydrated] = useState(false);

  useEffect(() => {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      try {
        const parsed = JSON.parse(stored);
        setRencanaList(parsed.rencanaList || []);
        setActiveRencanaId(parsed.activeRencanaId || null);
      } catch (e) {
        console.error('Failed to parse storage', e);
      }
    }
    setIsHydrated(true);
  }, []);

  useEffect(() => {
    if (!isHydrated) return;
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ rencanaList, activeRencanaId }));
  }, [rencanaList, activeRencanaId, isHydrated]);

  const activeRencana = rencanaList.find((r) => r.id === activeRencanaId) || null;

  const createRencana = (name: string, location?: { latitude: number; longitude: number; address: string }) => {
    const newRencana: Rencana = {
      id: crypto.randomUUID(),
      name,
      startLocation: location,
      buyers: [],
      createdAt: Date.now(),
    };
    setRencanaList((prev) => [...prev, newRencana]);
    setActiveRencanaId(newRencana.id);
    return newRencana;
  };

  const deleteRencana = (id: string) => {
    setRencanaList((prev) => prev.filter((r) => r.id !== id));
    if (activeRencanaId === id) setActiveRencanaId(null);
  };

  const addBuyer = (rencanaId: string, buyerData: Omit<Buyer, 'id' | 'status' | 'createdAt'>) => {
    const newBuyer: Buyer = {
      ...buyerData,
      id: crypto.randomUUID(),
      status: 'PENDING',
      createdAt: Date.now(),
    };
    setRencanaList((prev) =>
      prev.map((r) => (r.id === rencanaId ? { ...r, buyers: [...r.buyers, newBuyer] } : r))
    );
  };

  const updateBuyerStatus = (rencanaId: string, buyerId: string, status: DeliveryStatus, paidAmount?: number) => {
    setRencanaList((prev) =>
      prev.map((r) =>
        r.id === rencanaId
          ? {
              ...r,
              buyers: r.buyers.map((b) =>
                b.id === buyerId ? { ...b, status, paidAmount } : b
              ),
            }
          : r
      )
    );
  };

  const deleteBuyer = (rencanaId: string, buyerId: string) => {
    setRencanaList((prev) =>
      prev.map((r) =>
        r.id === rencanaId
          ? { ...r, buyers: r.buyers.filter((b) => b.id !== buyerId) }
          : r
      )
    );
  };

  return {
    rencanaList,
    activeRencana,
    activeRencanaId,
    setActiveRencanaId,
    createRencana,
    deleteRencana,
    addBuyer,
    updateBuyerStatus,
    deleteBuyer,
    isHydrated,
  };
}
