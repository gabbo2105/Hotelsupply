export interface Customer {
  id: string;
  auth_user_id: string;
  email?: string;
  company_name: string;
  vat_number: string;
  hotel_name: string;
  hotel_address: string;
  contact_person: string;
  contact_role: string;
  phone: string;
  created_at: string;
  updated_at: string;
}

export interface CartItem {
  id: string;
  supplier_code?: string;
  description: string;
  supplier_name: string;
  price: number;
  selling_uom: string;
  qty: number;
}

export interface Order {
  id: string;
  customer_id: string;
  order_number: string;
  total: number;
  status: OrderStatus;
  delivery_hotel: string;
  delivery_address: string;
  billing_company: string;
  billing_vat: string;
  contact_person: string;
  contact_phone: string;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

export type OrderStatus =
  | "pending"
  | "confirmed"
  | "shipped"
  | "delivered"
  | "cancelled";

export interface OrderItem {
  id: string;
  order_id: string;
  product_id: string;
  supplier_code: string;
  description: string;
  supplier_name: string;
  selling_uom: string;
  unit_price: number;
  qty: number;
  created_at: string;
}

export interface ChatMessage {
  id: string;
  role: "user" | "bot";
  text: string;
  isStreaming?: boolean;
}

export interface CartAction {
  action: "add" | "remove" | "update_qty" | "clear";
  id?: string;
  description?: string;
  supplier_name?: string;
  supplier_code?: string;
  price?: number;
  selling_uom?: string;
  qty?: number;
}

export interface ProductData {
  id?: string;
  supplier_code?: string;
  description: string;
  supplier_name: string;
  price: number;
  selling_uom: string;
}
