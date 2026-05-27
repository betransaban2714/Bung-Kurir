export type PaymentStatus = 'COD' | 'LUNAS';
export type DeliveryStatus = 'PENDING' | 'DONE' | 'TIP';
export type ActualPaymentMethod = 'CASH' | 'QRIS';

export interface Buyer {
  id: string;
  name: string;
  latitude: number;
  longitude: number;
  address: string;
  status: DeliveryStatus;
  createdAt: number;
  // Field opsional yang bisa diisi nanti
  paymentMethod?: PaymentStatus;
  price?: number; 
  paidAmount?: number;
  actualPaymentMethod?: ActualPaymentMethod;
}

export interface Jadwal {
  id: string;
  name: string;
  startLocation?: {
    latitude: number;
    longitude: number;
    address: string;
  };
  buyers: Buyer[];
  createdAt: number;
}
