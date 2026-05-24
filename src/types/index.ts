export type PaymentStatus = 'COD' | 'Su Bayar';
export type PacketType = 'STD' | 'ECO';
export type DeliveryStatus = 'PENDING' | 'DONE' | 'TIP';
export type ActualPaymentMethod = 'CASH' | 'QRIS';

export interface Buyer {
  id: string;
  name: string;
  waNumber: string;
  packetType: PacketType;
  paymentMethod: PaymentStatus;
  actualPaymentMethod?: ActualPaymentMethod;
  price: number;
  paidAmount?: number;
  latitude: number;
  longitude: number;
  address: string;
  status: DeliveryStatus;
  createdAt: number;
}

export interface Rencana {
  id: string;
  name: string;
  startLocation?: {
    latitude: number;
    longitude: number;
    address: string;
  };
  endLocation?: {
    latitude: number;
    longitude: number;
    address: string;
  };
  buyers: Buyer[];
  createdAt: number;
}
