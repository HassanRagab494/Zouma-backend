import dotenv from "dotenv";
dotenv.config();

import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_KEY;

if (!supabaseUrl || !supabaseKey) {
  throw new Error("SUPABASE_URL and SUPABASE_KEY must be set in .env file");
}

const supabaseClient = createClient(supabaseUrl, supabaseKey);

console.log("Supabase Client initialized successfully");

export const db = {
  clients: {
    list: async () => {
      const { data, error } = await supabaseClient
        .from("clients")
        .select("*")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
    get: async (id) => {
      const { data, error } = await supabaseClient
        .from("clients")
        .select("*")
        .eq("id", id)
        .maybeSingle();
      if (error) throw error;
      return data;
    },
    getByCode: async (code) => {
      const { data, error } = await supabaseClient
        .from("clients")
        .select("*")
        .eq("client_code", code)
        .maybeSingle();
      if (error) throw error;
      return data;
    },
    create: async (payload) => {
      const { data, error } = await supabaseClient
        .from("clients")
        .insert([payload])
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    update: async (id, payload) => {
      const { data, error } = await supabaseClient
        .from("clients")
        .update(payload)
        .eq("id", id)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    delete: async (id) => {
      const { data, error } = await supabaseClient
        .from("clients")
        .delete()
        .eq("id", id)
        .select()
        .maybeSingle();
      if (error) throw error;
      return data;
    }
  },

  products: {
    list: async () => {
      const { data, error } = await supabaseClient
        .from("products")
        .select("*")
        .order("serial", { ascending: true });
      if (error) throw error;
      return data;
    },
    get: async (id) => {
      const { data, error } = await supabaseClient
        .from("products")
        .select("*")
        .eq("id", id)
        .maybeSingle();
      if (error) throw error;
      return data;
    },
    create: async (payload) => {
      const { data, error } = await supabaseClient
        .from("products")
        .insert([payload])
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    update: async (id, payload) => {
      const { data, error } = await supabaseClient
        .from("products")
        .update(payload)
        .eq("id", id)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    updateStock: async (id, change) => {
      const { data: prod, error: fetchErr } = await supabaseClient
        .from("products")
        .select("stock")
        .eq("id", id)
        .single();
      if (fetchErr) throw fetchErr;
      const newStock = Math.max(0, (prod?.stock || 0) + change);
      const { data, error } = await supabaseClient
        .from("products")
        .update({ stock: newStock })
        .eq("id", id)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    delete: async (id) => {
      const { data, error } = await supabaseClient
        .from("products")
        .delete()
        .eq("id", id)
        .select()
        .maybeSingle();
      if (error) throw error;
      return data;
    }
  },

  orders: {
    list: async () => {
      const { data, error } = await supabaseClient
        .from("orders")
        .select("*, clients(name, client_code)")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return (data || []).map(o => ({
        ...o,
        client_name: o.clients ? o.clients.name : "عميل محذوف",
        client_code: o.clients ? o.clients.client_code : ""
      }));
    },
    get: async (id) => {
      const { data: order, error: orderErr } = await supabaseClient
        .from("orders")
        .select("*")
        .eq("id", id)
        .maybeSingle();
      if (orderErr) throw orderErr;
      if (!order) return null;

      const { data: client } = await supabaseClient
        .from("clients")
        .select("name, client_code, phone")
        .eq("id", order.client_id)
        .maybeSingle();

      const { data: items } = await supabaseClient
        .from("order_items")
        .select("*")
        .eq("order_id", id);

      return { ...order, client: client || null, items: items || [] };
    },
    create: async (orderPayload, items) => {
      const { data: order, error: orderErr } = await supabaseClient
        .from("orders")
        .insert([orderPayload])
        .select()
        .single();
      if (orderErr) throw orderErr;

      const rawItems = items.map(item => ({
        order_id: order.id,
        product_id: item.product_id || null,
        name: item.name,
        price: item.price,
        qty: item.qty
      }));

      const { error: itemsErr } = await supabaseClient
        .from("order_items")
        .insert(rawItems);
      if (itemsErr) throw itemsErr;

      for (const item of items) {
        if (item.product_id) {
          await db.products.updateStock(item.product_id, -item.qty);
        }
      }

      return order;
    },
    update: async (id, payload) => {
      const { data, error } = await supabaseClient
        .from("orders")
        .update(payload)
        .eq("id", id)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    getOrderItems: async (orderId) => {
      const { data, error } = await supabaseClient
        .from("order_items")
        .select("*")
        .eq("order_id", orderId);
      if (error) throw error;
      return data;
    },
    delete: async (id) => {
      const { data, error } = await supabaseClient
        .from("orders")
        .delete()
        .eq("id", id)
        .select()
        .maybeSingle();
      if (error) throw error;
      return data;
    }
  },

  users: {
    list: async () => {
      const { data, error } = await supabaseClient
        .from("users")
        .select("id, name, email, role, permissions, created_at")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
    getByEmail: async (email) => {
      try {
        const cleanEmail = email.toLowerCase().trim();
        const { data, error } = await supabaseClient
          .from("users")
          .select("*")
          .eq("email", cleanEmail)
          .maybeSingle();
        if (error) throw error;
        return data;
      } catch (err) {
        console.error("Error inside getByEmail:", err);
        return null;
      }
    },
    get: async (id) => {
      const { data, error } = await supabaseClient
        .from("users")
        .select("*")
        .eq("id", id)
        .maybeSingle();
      if (error) throw error;
      return data;
    },
    create: async (payload) => {
      const { data, error } = await supabaseClient
        .from("users")
        .insert([payload])
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    update: async (id, payload) => {
      const { data, error } = await supabaseClient
        .from("users")
        .update(payload)
        .eq("id", id)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    delete: async (id) => {
      const { data, error } = await supabaseClient
        .from("users")
        .delete()
        .eq("id", id)
        .select()
        .maybeSingle();
      if (error) throw error;
      return data;
    }
  }
};