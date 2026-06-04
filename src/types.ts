export interface Client {
  id: string;
  name: string;
  phone?: string;
  phone2?: string;
  address?: string;
  client_code: string;
  dob?: string;
  created_at: string;
  orders?: Order[];
}

export interface Product {
  id: string;
  serial: number;
  name: string;
  wholesale_price: number;
  selling_price: number;
  stock: number;
  created_at: string;
}

export interface Order {
  id: string;
  client_id: string;
  client_name?: string;
  client_code?: string;
  status: 'NEW' | 'CONFIRMED' | 'PROCESSING' | 'DELIVERED' | 'CANCELLED';
  date: string;
  discount_percentage: number;
  paid_amount: number;
  total: number;
  cost: number;
  profit: number;
  discount: number;
  notes?: string;
  created_at: string;
  items?: OrderItem[];
}

export interface OrderItem {
  id: string;
  order_id: string;
  product_id?: string;
  name: string;
  price: number;
  qty: number;
}

export interface User {
  id: string;
  name: string;
  email: string;
  role: 'super_admin' | 'employee';
  permissions: string[];
  created_at: string;
}
