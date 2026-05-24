export type MessageDirection = "incoming" | "outgoing";

export type MessageSource = "simulator" | "whatsapp_future" | "system";

export type OrderStatus =
  | "draft_from_whatsapp"
  | "missing_details"
  | "pending_review"
  | "approved"
  | "in_preparation"
  | "ready"
  | "picked_up"
  | "cancelled"
  | "human_review";

export type Unit = "kg" | "unit" | "tray" | "unknown";

export type Urgency = "normal" | "urgent";

export interface Customer {
  id: string;
  name: string | null;
  phone: string;
  created_at: string;
  updated_at: string;
}

export interface Conversation {
  id: string;
  customer_id: string;
  phone: string;
  status: string;
  created_at: string;
  updated_at: string;
}

export interface Message {
  id: string;
  conversation_id: string;
  direction: MessageDirection;
  text: string;
  timestamp: string;
  source: MessageSource;
  created_at: string;
}

export interface Order {
  id: string;
  order_number: string;
  customer_id: string;
  conversation_id: string;
  status: OrderStatus;
  pickup_date: string | null;
  pickup_date_text: string | null;
  pickup_time: string | null;
  urgency: Urgency;
  raw_messages: string[];
  ai_confidence: number;
  missing_fields: string[];
  human_review_required: boolean;
  notes: string | null;
  customer_notes: string | null;
  created_at: string;
  updated_at: string;
}

export interface OrderItem {
  id: string;
  order_id: string;
  product_name: string;
  quantity: number | null;
  unit: Unit;
  cut_style: string | null;
  notes: string;
  created_at: string;
}

export interface Product {
  id: string;
  name: string;
  aliases: string[];
  cut_options: string[];
  active: boolean;
  created_at: string;
  updated_at: string;
}

export interface Settings {
  id: string;
  business_name: string;
  opening_hours: Record<string, string>;
  pickup_windows: string[];
  after_hours_auto_reply: string;
  minimum_confidence_threshold: number;
  require_human_approval: boolean;
  default_ai_order_status: OrderStatus;
  created_at: string;
  updated_at: string;
}

export interface ParsedOrderItem {
  productName: string;
  quantity: number | null;
  unit: Unit;
  cutStyle: string | null;
  notes: string;
}

export interface ParsedOrderResult {
  customerName: string | null;
  phone: string | null;
  pickupDateText: string | null;
  pickupTime: string | null;
  items: ParsedOrderItem[];
  missingFields: string[];
  aiConfidence: number;
  humanReviewRequired: boolean;
  suggestedReply: string;
  status: OrderStatus;
  urgency: Urgency;
}

export interface OrderWithRelations extends Order {
  customer: Customer | null;
  conversation: Conversation | null;
  items: OrderItem[];
  messages: Message[];
}

export interface ConversationWithRelations extends Conversation {
  customer: Customer | null;
  messages: Message[];
  orders: OrderWithRelations[];
}

export interface DashboardData {
  orders: OrderWithRelations[];
  conversations: ConversationWithRelations[];
  products: Product[];
  settings: Settings;
  persistenceMode: "supabase" | "demo";
}

export interface IncomingCustomerMessageInput {
  phone: string;
  name?: string | null;
  text: string;
  timestamp?: string;
  source: MessageSource;
}

export interface ProcessedIncomingMessage {
  customer: Customer;
  conversation: ConversationWithRelations;
  incomingMessage: Message;
  outgoingMessage: Message | null;
  order: OrderWithRelations | null;
  parsed: ParsedOrderResult;
}

export interface EditableOrderPayload {
  pickup_date_text: string | null;
  pickup_time: string | null;
  notes: string | null;
  customer_notes: string | null;
  missing_fields: string[];
  human_review_required: boolean;
  items: Array<{
    id: string | "new";
    product_name: string;
    quantity: number | null;
    unit: Unit;
    cut_style: string | null;
    notes: string;
  }>;
}
