export type OrderStatus = 'Pending' | 'Preparing' | 'Out for Delivery' | 'Delivered' | 'Cancelled';

export interface Order {
  id: string;
  store_name: string;
  amount: number;
  items: number;
  user_phone: string;
  status: OrderStatus;
  driver_name?: string;
  driver_phone?: string;
  created_at?: string;
}

export interface Store {
  id: string;
  name: string;
  description: string;
  rating: number;
  eta_minutes: number;
  latitude: number;
  longitude: number;
  category: string;
  is_online: boolean;
}

export interface Product {
  id: string;
  store_id?: string;
  name: string;
  category: string;
  price: number;
  original_price: number;
  unit: string;
  stock: number;
  barcode: string;
  description: string;
  emoji: string;
  image_url?: string;
}

export interface Category {
  id: string;
  name: string;
  slug?: string;
  description?: string;
  image_url?: string;
  created_at?: string;
}

export interface Profile {
  phone: string;
  email: string;
  name: string;
  joined_date: string;
  id: string;
}

export interface Address {
  id: string;
  phone: string;
  details: string;
  label?: string;
}
