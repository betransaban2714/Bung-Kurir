'use client';

import { useState, useEffect } from 'react';
import type { Jadwal, Buyer, DeliveryStatus, ActualPaymentMethod, PaymentStatus } from '@/types';

const STORAGE_KEY = 'bungkurir_data_v2';

const generateId = () => {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) {
    return crypto.randomUUID();
  }
  return Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
};

export function useKurirStore() {
  const [jadwalList, setJadwalList] = useState<Jadwal[]>([]);
  const [activeJadwalId, setActiveJadwalId] = useState<string | null>(null);
  const [isHydrated, setIsHydrated] = useState(false);

  useEffect(() => {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      try {
        const parsed = JSON.parse(stored);
        if (parsed.jadwalList) setJadwalList(parsed.jadwalList);
        if (parsed.activeJadwalId) setActiveJadwalId(parsed.activeJadwalId);
      } catch (e) {
        console.error('Failed to parse storage', e);
      }
    }
    setIsHydrated(true);
  }, []);

  useEffect(() => {
    if (!isHydrated) return;
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify({ jadwalList, activeJadwalId }));
    } catch (e) {
      console.error('Failed to save to storage', e);
    }
  }, [jadwalList, activeJadwalId, isHydrated]);

  const activeJadwal = jadwalList.find((r) => r.id === activeJadwalId) || null;

  const createJadwal = (name: string, location?: { latitude: number; longitude: number; address: string }) => {
    const newJadwal: Jadwal = {
      id: generateId(),
      name,
      startLocation: location,
      buyers: [],
      createdAt: Date.now(),
    };
    setJadwalList((prev) => [...prev, newJadwal]);
    setActiveJadwalId(newJadwal.id);
    return newJadwal;
  };

  const deleteJadwal = (id: string) => {
    setJadwalList((prev) => prev.filter((r) => r.id !== id));
    if (activeJadwalId === id) setActiveJadwalId(null);
  };

  const addBuyer = (jadwalId: string, buyerData: Pick<Buyer, 'name' | 'address' | 'latitude' | 'longitude'>) => {
    const newBuyer: Buyer = {
      ...buyerData,
      id: generateId(),
      status: 'PENDING',
      createdAt: Date.now(),
      paymentMethod: 'COD', // Default
      price: 0
    };
    setJadwalList((prev) =>
      prev.map((r) => (r.id === jadwalId ? { ...r, buyers: [...r.buyers, newBuyer] } : r))
    );
  };

  const updateBuyerInfo = (jadwalId: string, buyerId: string, info: Partial<Buyer>) => {
    setJadwalList((prev) =>
      prev.map((r) =>
        r.id === jadwalId
          ? {
              ...r,
              buyers: r.buyers.map((b) =>
                b.id === buyerId ? { ...b, ...info } : b
              ),
            }
          : r
      )
    );
  };

  const updateBuyerStatus = (
    jadwalId: string, 
    buyerId: string, 
    status: DeliveryStatus, 
    data: { paidAmount?: number, price?: number, actualPaymentMethod?: ActualPaymentMethod, paymentMethod?: PaymentStatus }
  ) => {
    setJadwalList((prev) =>
      prev.map((r) =>
        r.id === jadwalId
          ? {
              ...r,
              buyers: r.buyers.map((b) =>
                b.id === buyerId ? { ...b, status, ...data } : b
              ),
            }
          : r
      )
    );
  };

  const deleteBuyer = (jadwalId: string, buyerId: string) => {
    setJadwalList((prev) =>
      prev.map((r) =>
        r.id === jadwalId
          ? { ...r, buyers: r.buyers.filter((b) => b.id !== buyerId) }
          : r
      )
    );
  };

  return {
    jadwalList,
    activeJadwal,
    activeJadwalId,
    setActiveJadwalId,
    createJadwal,
    deleteJadwal,
    addBuyer,
    updateBuyerInfo,
    updateBuyerStatus,
    deleteBuyer,
    isHydrated,
  };
}
