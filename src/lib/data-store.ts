import { revalidatePath } from "next/cache";
import {
  conversations as seedConversations,
  customers as seedCustomers,
  defaultSettings,
  hydrateConversations,
  hydrateOrders,
  initialProducts,
  messages as seedMessages,
  orderItems as seedOrderItems,
  orders as seedOrders,
} from "@/lib/mock-data";
import { applyKnownCustomerDetails, parseCustomerOrderMessage } from "@/lib/order-parser";
import { getSupabaseServerClient, hasSupabaseConfig } from "@/lib/supabase";
import type {
  Conversation,
  ConversationWithRelations,
  Customer,
  DashboardData,
  EditableOrderPayload,
  IncomingCustomerMessageInput,
  Message,
  Order,
  OrderItem,
  OrderStatus,
  OrderWithRelations,
  ParsedOrderResult,
  Product,
  ProcessedIncomingMessage,
  Settings,
  Unit,
} from "@/lib/types";
import { inferPickupDate } from "@/lib/date-utils";
import { createId, normalizePhone } from "@/lib/utils";

interface DemoState {
  customers: Customer[];
  conversations: Conversation[];
  messages: Message[];
  orders: Order[];
  orderItems: OrderItem[];
  products: Product[];
  settings: Settings;
}

const globalForDemo = globalThis as typeof globalThis & { bonHachamDemoState?: DemoState };

function clone<T>(value: T): T {
  return JSON.parse(JSON.stringify(value)) as T;
}

function getDemoState() {
  if (!globalForDemo.bonHachamDemoState) {
    globalForDemo.bonHachamDemoState = {
      customers: clone(seedCustomers),
      conversations: clone(seedConversations),
      messages: clone(seedMessages),
      orders: clone(seedOrders),
      orderItems: clone(seedOrderItems),
      products: clone(initialProducts),
      settings: clone(defaultSettings),
    };
  }

  return globalForDemo.bonHachamDemoState;
}

function timestamp() {
  return new Date().toISOString();
}

function hydrateDemoOrder(order: Order, state = getDemoState()): OrderWithRelations {
  return {
    ...order,
    customer: state.customers.find((customer) => customer.id === order.customer_id) ?? null,
    conversation:
      state.conversations.find((conversation) => conversation.id === order.conversation_id) ?? null,
    items: state.orderItems.filter((item) => item.order_id === order.id),
    messages: state.messages.filter((message) => message.conversation_id === order.conversation_id),
  };
}

function hydrateDemoConversation(conversation: Conversation, state = getDemoState()): ConversationWithRelations {
  const orders = state.orders
    .filter((order) => order.conversation_id === conversation.id)
    .map((order) => hydrateDemoOrder(order, state));

  return {
    ...conversation,
    customer: state.customers.find((customer) => customer.id === conversation.customer_id) ?? null,
    messages: state.messages.filter((message) => message.conversation_id === conversation.id),
    orders,
  };
}

function nextOrderNumber(existingOrders: Order[]) {
  const max = existingOrders.reduce((highest, order) => {
    const numeric = Number(order.order_number.replace(/\D/g, ""));
    return Number.isFinite(numeric) ? Math.max(highest, numeric) : highest;
  }, 1000);

  return `ORD-${max + 1}`;
}

function mergeMissingFields(order: Order, parsed: ParsedOrderResult) {
  const merged = new Set(order.missing_fields);
  for (const field of parsed.missingFields) merged.add(field);

  if (parsed.pickupTime) merged.delete("pickup_time");
  if (parsed.customerName) merged.delete("customer_name");
  if (parsed.phone) merged.delete("phone");
  if (parsed.items.some((item) => item.quantity !== null)) merged.delete("quantity");
  if (parsed.items.length > 0) merged.delete("items");

  return [...merged];
}

function chooseStatusAfterUpdate(
  missingFields: string[],
  humanReviewRequired: boolean,
  currentStatus: OrderStatus,
): OrderStatus {
  if (currentStatus === "cancelled") return currentStatus;
  if (missingFields.length > 0) return "missing_details";
  if (humanReviewRequired) return "human_review";
  return "pending_review";
}

async function loadSupabaseCollections() {
  const supabase = getSupabaseServerClient();
  const [customersResult, conversationsResult, messagesResult, ordersResult, itemsResult, productsResult, settingsResult] =
    await Promise.all([
      supabase.from("customers").select("*").order("created_at", { ascending: true }),
      supabase.from("conversations").select("*").order("updated_at", { ascending: false }),
      supabase.from("messages").select("*").order("timestamp", { ascending: true }),
      supabase.from("orders").select("*").order("created_at", { ascending: false }),
      supabase.from("order_items").select("*").order("created_at", { ascending: true }),
      supabase.from("products").select("*").order("name", { ascending: true }),
      supabase.from("settings").select("*").limit(1).maybeSingle(),
    ]);

  for (const result of [
    customersResult,
    conversationsResult,
    messagesResult,
    ordersResult,
    itemsResult,
    productsResult,
    settingsResult,
  ]) {
    if (result.error) throw result.error;
  }

  const customers = (customersResult.data ?? []) as Customer[];
  const conversations = (conversationsResult.data ?? []) as Conversation[];
  const messages = (messagesResult.data ?? []) as Message[];
  const orders = (ordersResult.data ?? []) as Order[];
  const orderItems = (itemsResult.data ?? []) as OrderItem[];
  const products = ((productsResult.data ?? []) as Product[]).map((product) => ({
    ...product,
    aliases: product.aliases ?? [],
    cut_options: product.cut_options ?? [],
  }));
  const settings = (settingsResult.data as Settings | null) ?? defaultSettings;

  return { customers, conversations, messages, orders, orderItems, products, settings };
}

export async function getSettings() {
  if (!hasSupabaseConfig()) return getDemoState().settings;

  const supabase = getSupabaseServerClient();
  const { data, error } = await supabase.from("settings").select("*").limit(1).maybeSingle();
  if (error) throw error;
  return (data as Settings | null) ?? defaultSettings;
}

export async function getProducts() {
  if (!hasSupabaseConfig()) return getDemoState().products;

  const supabase = getSupabaseServerClient();
  const { data, error } = await supabase.from("products").select("*").order("name");
  if (error) throw error;
  return ((data ?? []) as Product[]).map((product) => ({
    ...product,
    aliases: product.aliases ?? [],
    cut_options: product.cut_options ?? [],
  }));
}

export async function getOrders() {
  if (!hasSupabaseConfig()) {
    const state = getDemoState();
    return hydrateOrders(state.orders, state.customers, state.conversations, state.messages, state.orderItems);
  }

  const collections = await loadSupabaseCollections();
  return hydrateOrders(
    collections.orders,
    collections.customers,
    collections.conversations,
    collections.messages,
    collections.orderItems,
  );
}

export async function getOrderById(id: string) {
  const orders = await getOrders();
  return orders.find((order) => order.id === id || order.order_number === id) ?? null;
}

export async function getConversations() {
  if (!hasSupabaseConfig()) {
    const state = getDemoState();
    const orders = hydrateOrders(state.orders, state.customers, state.conversations, state.messages, state.orderItems);
    return hydrateConversations(state.conversations, state.customers, state.messages, orders);
  }

  const collections = await loadSupabaseCollections();
  const orders = hydrateOrders(
    collections.orders,
    collections.customers,
    collections.conversations,
    collections.messages,
    collections.orderItems,
  );
  return hydrateConversations(collections.conversations, collections.customers, collections.messages, orders);
}

export async function getDashboardData(): Promise<DashboardData> {
  if (!hasSupabaseConfig()) {
    const state = getDemoState();
    const orders = hydrateOrders(state.orders, state.customers, state.conversations, state.messages, state.orderItems);
    const conversations = hydrateConversations(state.conversations, state.customers, state.messages, orders);
    return {
      orders,
      conversations,
      products: state.products,
      settings: state.settings,
      persistenceMode: "demo",
    };
  }

  const collections = await loadSupabaseCollections();
  const orders = hydrateOrders(
    collections.orders,
    collections.customers,
    collections.conversations,
    collections.messages,
    collections.orderItems,
  );
  const conversations = hydrateConversations(
    collections.conversations,
    collections.customers,
    collections.messages,
    orders,
  );

  return {
    orders,
    conversations,
    products: collections.products,
    settings: collections.settings,
    persistenceMode: "supabase",
  };
}

async function findOrCreateDemoCustomer(phone: string, name?: string | null) {
  const state = getDemoState();
  const normalizedPhone = normalizePhone(phone);
  let customer = state.customers.find((item) => item.phone === normalizedPhone);

  if (!customer) {
    customer = {
      id: createId("cust"),
      name: name || null,
      phone: normalizedPhone,
      created_at: timestamp(),
      updated_at: timestamp(),
    };
    state.customers.push(customer);
  } else if (name && customer.name !== name) {
    customer.name = name;
    customer.updated_at = timestamp();
  }

  return customer;
}

async function findOrCreateDemoConversation(customer: Customer) {
  const state = getDemoState();
  let conversation = state.conversations.find((item) => item.phone === customer.phone);

  if (!conversation) {
    conversation = {
      id: createId("conv"),
      customer_id: customer.id,
      phone: customer.phone,
      status: "open",
      created_at: timestamp(),
      updated_at: timestamp(),
    };
    state.conversations.push(conversation);
  } else {
    conversation.updated_at = timestamp();
  }

  return conversation;
}

async function findOrCreateSupabaseCustomer(phone: string, name?: string | null) {
  const supabase = getSupabaseServerClient();
  const normalizedPhone = normalizePhone(phone);
  const existing = await supabase.from("customers").select("*").eq("phone", normalizedPhone).maybeSingle();
  if (existing.error) throw existing.error;

  if (existing.data) {
    if (name && existing.data.name !== name) {
      const { data, error } = await supabase
        .from("customers")
        .update({ name, updated_at: timestamp() })
        .eq("id", existing.data.id)
        .select("*")
        .single();
      if (error) throw error;
      return data as Customer;
    }

    return existing.data as Customer;
  }

  const { data, error } = await supabase
    .from("customers")
    .insert({ name: name || null, phone: normalizedPhone })
    .select("*")
    .single();
  if (error) throw error;
  return data as Customer;
}

async function findOrCreateSupabaseConversation(customer: Customer) {
  const supabase = getSupabaseServerClient();
  const existing = await supabase
    .from("conversations")
    .select("*")
    .eq("phone", customer.phone)
    .order("updated_at", { ascending: false })
    .limit(1)
    .maybeSingle();
  if (existing.error) throw existing.error;

  if (existing.data) {
    const { data, error } = await supabase
      .from("conversations")
      .update({ updated_at: timestamp(), customer_id: customer.id })
      .eq("id", existing.data.id)
      .select("*")
      .single();
    if (error) throw error;
    return data as Conversation;
  }

  const { data, error } = await supabase
    .from("conversations")
    .insert({ customer_id: customer.id, phone: customer.phone, status: "open" })
    .select("*")
    .single();
  if (error) throw error;
  return data as Conversation;
}

function createMessage(conversationId: string, direction: "incoming" | "outgoing", text: string, source: "simulator" | "whatsapp_future" | "system", time?: string): Message {
  const created = time ?? timestamp();
  return {
    id: createId("msg"),
    conversation_id: conversationId,
    direction,
    text,
    timestamp: created,
    source,
    created_at: timestamp(),
  };
}

function shouldUpdateExistingOrder(existingOrder: Order | undefined, parsed: ParsedOrderResult) {
  if (!existingOrder) return false;
  if (!["missing_details", "human_review", "draft_from_whatsapp"].includes(existingOrder.status)) return false;
  return parsed.items.length === 0 || parsed.missingFields.length < existingOrder.missing_fields.length;
}

async function processIncomingDemo(input: IncomingCustomerMessageInput): Promise<ProcessedIncomingMessage> {
  const state = getDemoState();
  const customer = await findOrCreateDemoCustomer(input.phone, input.name);
  const conversation = await findOrCreateDemoConversation(customer);
  const incomingMessage = createMessage(
    conversation.id,
    "incoming",
    input.text,
    input.source,
    input.timestamp ?? timestamp(),
  );
  state.messages.push(incomingMessage);

  const baseParsed = parseCustomerOrderMessage(input.text, state.products, state.settings);
  const parsed = applyKnownCustomerDetails(
    baseParsed,
    { name: input.name ?? customer.name, phone: input.phone ?? baseParsed.phone },
    state.settings,
  );
  const existingOrder = state.orders
    .filter((order) => order.conversation_id === conversation.id)
    .sort((a, b) => b.created_at.localeCompare(a.created_at))[0];

  let order: Order;
  if (shouldUpdateExistingOrder(existingOrder, parsed)) {
    const missingFields = mergeMissingFields(existingOrder, parsed);
    existingOrder.pickup_time = parsed.pickupTime ?? existingOrder.pickup_time;
    existingOrder.pickup_date_text = parsed.pickupDateText ?? existingOrder.pickup_date_text;
    existingOrder.pickup_date = inferPickupDate(existingOrder.pickup_date_text) ?? existingOrder.pickup_date;
    existingOrder.status = chooseStatusAfterUpdate(
      missingFields,
      existingOrder.human_review_required || parsed.humanReviewRequired,
      existingOrder.status,
    );
    existingOrder.missing_fields = missingFields;
    existingOrder.ai_confidence = Math.max(existingOrder.ai_confidence, parsed.aiConfidence);
    existingOrder.human_review_required = existingOrder.human_review_required || parsed.humanReviewRequired;
    existingOrder.raw_messages = [...existingOrder.raw_messages, input.text];
    existingOrder.updated_at = timestamp();
    order = existingOrder;
  } else {
    order = {
      id: createId("order"),
      order_number: nextOrderNumber(state.orders),
      customer_id: customer.id,
      conversation_id: conversation.id,
      status: parsed.status,
      pickup_date: inferPickupDate(parsed.pickupDateText),
      pickup_date_text: parsed.pickupDateText,
      pickup_time: parsed.pickupTime,
      urgency: parsed.urgency,
      raw_messages: [input.text],
      ai_confidence: parsed.aiConfidence,
      missing_fields: parsed.missingFields,
      human_review_required: parsed.humanReviewRequired,
      notes: null,
      customer_notes: null,
      created_at: timestamp(),
      updated_at: timestamp(),
    };
    state.orders.push(order);

    for (const item of parsed.items) {
      state.orderItems.push({
        id: createId("item"),
        order_id: order.id,
        product_name: item.productName,
        quantity: item.quantity,
        unit: item.unit,
        cut_style: item.cutStyle,
        notes: item.notes,
        created_at: timestamp(),
      });
    }
  }

  const outgoingMessage = createMessage(conversation.id, "outgoing", parsed.suggestedReply, "system");
  state.messages.push(outgoingMessage);
  conversation.status = parsed.status;
  conversation.updated_at = timestamp();

  const hydratedOrder = hydrateDemoOrder(order, state);
  return {
    customer,
    conversation: hydrateDemoConversation(conversation, state),
    incomingMessage,
    outgoingMessage,
    order: hydratedOrder,
    parsed,
  };
}

async function processIncomingSupabase(input: IncomingCustomerMessageInput): Promise<ProcessedIncomingMessage> {
  const supabase = getSupabaseServerClient();
  const [settings, products] = await Promise.all([getSettings(), getProducts()]);
  const customer = await findOrCreateSupabaseCustomer(input.phone, input.name);
  const conversation = await findOrCreateSupabaseConversation(customer);
  const incoming = createMessage(
    conversation.id,
    "incoming",
    input.text,
    input.source,
    input.timestamp ?? timestamp(),
  );
  const { data: incomingMessage, error: incomingError } = await supabase
    .from("messages")
    .insert({
      conversation_id: incoming.conversation_id,
      direction: incoming.direction,
      text: incoming.text,
      timestamp: incoming.timestamp,
      source: incoming.source,
    })
    .select("*")
    .single();
  if (incomingError) throw incomingError;

  const baseParsed = parseCustomerOrderMessage(input.text, products, settings);
  const parsed = applyKnownCustomerDetails(
    baseParsed,
    { name: input.name ?? customer.name, phone: input.phone ?? baseParsed.phone },
    settings,
  );
  const latestOrder = await supabase
    .from("orders")
    .select("*")
    .eq("conversation_id", conversation.id)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();
  if (latestOrder.error) throw latestOrder.error;

  let order: Order;
  const existingOrder = latestOrder.data as Order | null;
  if (shouldUpdateExistingOrder(existingOrder ?? undefined, parsed) && existingOrder) {
    const missingFields = mergeMissingFields(existingOrder, parsed);
    const updatedOrder = {
      pickup_time: parsed.pickupTime ?? existingOrder.pickup_time,
      pickup_date_text: parsed.pickupDateText ?? existingOrder.pickup_date_text,
      pickup_date: inferPickupDate(parsed.pickupDateText ?? existingOrder.pickup_date_text),
      status: chooseStatusAfterUpdate(
        missingFields,
        existingOrder.human_review_required || parsed.humanReviewRequired,
        existingOrder.status,
      ),
      missing_fields: missingFields,
      ai_confidence: Math.max(existingOrder.ai_confidence, parsed.aiConfidence),
      human_review_required: existingOrder.human_review_required || parsed.humanReviewRequired,
      raw_messages: [...existingOrder.raw_messages, input.text],
      updated_at: timestamp(),
    };
    const { data, error } = await supabase
      .from("orders")
      .update(updatedOrder)
      .eq("id", existingOrder.id)
      .select("*")
      .single();
    if (error) throw error;
    order = data as Order;
  } else {
    const collections = await loadSupabaseCollections();
    const { data, error } = await supabase
      .from("orders")
      .insert({
        order_number: nextOrderNumber(collections.orders),
        customer_id: customer.id,
        conversation_id: conversation.id,
        status: parsed.status,
        pickup_date: inferPickupDate(parsed.pickupDateText),
        pickup_date_text: parsed.pickupDateText,
        pickup_time: parsed.pickupTime,
        urgency: parsed.urgency,
        raw_messages: [input.text],
        ai_confidence: parsed.aiConfidence,
        missing_fields: parsed.missingFields,
        human_review_required: parsed.humanReviewRequired,
      })
      .select("*")
      .single();
    if (error) throw error;
    order = data as Order;

    if (parsed.items.length > 0) {
      const { error: itemError } = await supabase.from("order_items").insert(
        parsed.items.map((item) => ({
          order_id: order.id,
          product_name: item.productName,
          quantity: item.quantity,
          unit: item.unit,
          cut_style: item.cutStyle,
          notes: item.notes,
        })),
      );
      if (itemError) throw itemError;
    }
  }

  const outgoing = createMessage(conversation.id, "outgoing", parsed.suggestedReply, "system");
  const { data: outgoingMessage, error: outgoingError } = await supabase
    .from("messages")
    .insert({
      conversation_id: outgoing.conversation_id,
      direction: outgoing.direction,
      text: outgoing.text,
      timestamp: outgoing.timestamp,
      source: outgoing.source,
    })
    .select("*")
    .single();
  if (outgoingError) throw outgoingError;

  await supabase
    .from("conversations")
    .update({ status: parsed.status, updated_at: timestamp() })
    .eq("id", conversation.id);

  const refreshedOrder = await getOrderById(order.id);
  const refreshedConversation = (await getConversations()).find((item) => item.id === conversation.id);

  return {
    customer,
    conversation: refreshedConversation ?? {
      ...conversation,
      customer,
      messages: [incomingMessage as Message, outgoingMessage as Message],
      orders: refreshedOrder ? [refreshedOrder] : [],
    },
    incomingMessage: incomingMessage as Message,
    outgoingMessage: outgoingMessage as Message,
    order: refreshedOrder,
    parsed,
  };
}

export async function processIncomingCustomerMessage(input: IncomingCustomerMessageInput) {
  const result = hasSupabaseConfig() ? await processIncomingSupabase(input) : await processIncomingDemo(input);
  revalidateOperationalPaths();
  return result;
}

function revalidateOperationalPaths() {
  for (const path of ["/dashboard", "/inbox", "/orders", "/catalog", "/settings"]) {
    revalidatePath(path);
  }
}

export async function updateOrderStatus(orderId: string, status: OrderStatus) {
  if (!hasSupabaseConfig()) {
    const state = getDemoState();
    const order = state.orders.find((item) => item.id === orderId);
    if (!order) return null;

    order.status = status;
    order.updated_at = timestamp();
    if (status === "approved") {
      order.human_review_required = false;
      order.missing_fields = [];
      const message = createMessage(
        order.conversation_id,
        "outgoing",
        "ההזמנה שלך אושרה ונמצאת בהכנה. נעדכן כשהיא תהיה מוכנה לאיסוף.",
        "system",
      );
      state.messages.push(message);
    }

    revalidateOperationalPaths();
    revalidatePath(`/orders/${orderId}`);
    return hydrateDemoOrder(order, state);
  }

  const supabase = getSupabaseServerClient();
  const updates: Partial<Order> = { status, updated_at: timestamp() };
  if (status === "approved") {
    updates.human_review_required = false;
    updates.missing_fields = [];
  }

  const { data, error } = await supabase.from("orders").update(updates).eq("id", orderId).select("*").single();
  if (error) throw error;

  if (status === "approved") {
    await supabase.from("messages").insert({
      conversation_id: data.conversation_id,
      direction: "outgoing",
      text: "ההזמנה שלך אושרה ונמצאת בהכנה. נעדכן כשהיא תהיה מוכנה לאיסוף.",
      timestamp: timestamp(),
      source: "system",
    });
  }

  revalidateOperationalPaths();
  revalidatePath(`/orders/${orderId}`);
  return getOrderById(orderId);
}

export async function saveOrderDetails(orderId: string, payload: EditableOrderPayload) {
  if (!hasSupabaseConfig()) {
    const state = getDemoState();
    const order = state.orders.find((item) => item.id === orderId);
    if (!order) return null;

    order.pickup_date_text = payload.pickup_date_text;
    order.pickup_date = inferPickupDate(payload.pickup_date_text);
    order.pickup_time = payload.pickup_time;
    order.notes = payload.notes;
    order.customer_notes = payload.customer_notes;
    order.missing_fields = payload.missing_fields;
    order.human_review_required = payload.human_review_required;
    order.updated_at = timestamp();

    for (const item of payload.items) {
      if (!item.product_name.trim()) continue;

      if (item.id === "new") {
        state.orderItems.push({
          id: createId("item"),
          order_id: order.id,
          product_name: item.product_name,
          quantity: item.quantity,
          unit: item.unit,
          cut_style: item.cut_style,
          notes: item.notes,
          created_at: timestamp(),
        });
      } else {
        const existingItem = state.orderItems.find((entry) => entry.id === item.id);
        if (existingItem) {
          existingItem.product_name = item.product_name;
          existingItem.quantity = item.quantity;
          existingItem.unit = item.unit;
          existingItem.cut_style = item.cut_style;
          existingItem.notes = item.notes;
        }
      }
    }

    revalidateOperationalPaths();
    revalidatePath(`/orders/${orderId}`);
    return hydrateDemoOrder(order, state);
  }

  const supabase = getSupabaseServerClient();
  const { data, error } = await supabase
    .from("orders")
    .update({
      pickup_date_text: payload.pickup_date_text,
      pickup_date: inferPickupDate(payload.pickup_date_text),
      pickup_time: payload.pickup_time,
      notes: payload.notes,
      customer_notes: payload.customer_notes,
      missing_fields: payload.missing_fields,
      human_review_required: payload.human_review_required,
      updated_at: timestamp(),
    })
    .eq("id", orderId)
    .select("*")
    .single();
  if (error) throw error;

  for (const item of payload.items) {
    if (!item.product_name.trim()) continue;

    if (item.id === "new") {
      const { error: insertError } = await supabase.from("order_items").insert({
        order_id: orderId,
        product_name: item.product_name,
        quantity: item.quantity,
        unit: item.unit,
        cut_style: item.cut_style,
        notes: item.notes,
      });
      if (insertError) throw insertError;
    } else {
      const { error: itemError } = await supabase
        .from("order_items")
        .update({
          product_name: item.product_name,
          quantity: item.quantity,
          unit: item.unit,
          cut_style: item.cut_style,
          notes: item.notes,
        })
        .eq("id", item.id);
      if (itemError) throw itemError;
    }
  }

  revalidateOperationalPaths();
  revalidatePath(`/orders/${orderId}`);
  return getOrderById(data.id);
}

export async function saveSettings(input: Partial<Settings>) {
  if (!hasSupabaseConfig()) {
    const state = getDemoState();
    state.settings = {
      ...state.settings,
      ...input,
      updated_at: timestamp(),
    };
    revalidatePath("/settings");
    return state.settings;
  }

  const supabase = getSupabaseServerClient();
  const settings = await getSettings();
  const { data, error } = await supabase
    .from("settings")
    .upsert({ ...settings, ...input, updated_at: timestamp() })
    .select("*")
    .single();
  if (error) throw error;
  revalidatePath("/settings");
  return data as Settings;
}

export async function addProduct(input: Pick<Product, "name" | "aliases" | "cut_options" | "active">) {
  if (!hasSupabaseConfig()) {
    const state = getDemoState();
    const product: Product = {
      id: createId("prod"),
      ...input,
      created_at: timestamp(),
      updated_at: timestamp(),
    };
    state.products.push(product);
    revalidatePath("/catalog");
    return product;
  }

  const supabase = getSupabaseServerClient();
  const { data, error } = await supabase.from("products").insert(input).select("*").single();
  if (error) throw error;
  revalidatePath("/catalog");
  return data as Product;
}

export async function setProductActive(productId: string, active: boolean) {
  if (!hasSupabaseConfig()) {
    const state = getDemoState();
    const product = state.products.find((item) => item.id === productId);
    if (!product) return null;
    product.active = active;
    product.updated_at = timestamp();
    revalidatePath("/catalog");
    return product;
  }

  const supabase = getSupabaseServerClient();
  const { data, error } = await supabase
    .from("products")
    .update({ active, updated_at: timestamp() })
    .eq("id", productId)
    .select("*")
    .single();
  if (error) throw error;
  revalidatePath("/catalog");
  return data as Product;
}

export function coerceUnit(value: FormDataEntryValue | null): Unit {
  if (value === "kg" || value === "unit" || value === "tray" || value === "unknown") return value;
  return "unknown";
}
