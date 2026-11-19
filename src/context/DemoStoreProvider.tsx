"use client";

import React, {
  createContext,
  useContext,
  useState,
  useMemo,
  useCallback,
  useEffect,
  useRef,
} from "react";
import { supabase } from "@/lib/supabase";

export type CategorySlug = string;

export interface CategoryInfo {
  id: string;
  slug: CategorySlug;
  label: string;
  image: string;
  displayOrder?: number;
}

export interface MenuItem {
  id: string;
  name: string;
  price: number;
  category: CategorySlug;
  image: string;
  sold: number;
}

export interface OrderLineItem {
  menuItemId: string;
  name: string;
  unitPrice: number;
  quantity: number;
  image: string;
  lineTotalOverride?: number;
}

export type TableStatus = "Available" | "Preparing" | "Ready";

export interface TableRecord {
  id: string;
  number: string;
  status: TableStatus;
  items: OrderLineItem[];
  updatedAt?: string;
}

export interface OrderHistoryRecord {
  id: string;
  tableId?: string | null;
  tableNumber: string;
  items: OrderLineItem[];
  total: number;
  status: "Preparing" | "Ready" | "Completed";
  createdAt: string;
  createdAtIso: string;
}

export interface ReviewRecord {
  id: string;
  authorName: string;
  initials: string;
  rating: number;
  comment: string;
  createdAt: string;
}

export type TimeRange = "Today" | "Month" | "Year";

interface DbCategoryRow {
  id: string;
  slug: string;
  label: string;
  image: string;
  display_order: number;
}

interface DbMenuItemRow {
  id: string;
  name: string;
  price: number;
  category: string;
  image: string;
  sold: number;
}

interface DbRestaurantTableRow {
  id: string;
  table_number: string;
  status: TableStatus;
  display_order: number;
  updated_at: string;
}

interface DbOrderItemRow {
  id: string;
  order_id: string;
  menu_item_id: string | null;
  name: string;
  unit_price: number;
  quantity: number;
  image: string;
  line_total_override: number | null;
}

interface DbOrderRow {
  id: string;
  table_id: string | null;
  table_number: string;
  total: number;
  status: "Preparing" | "Ready" | "Completed";
  created_at: string;
  order_items?: DbOrderItemRow[];
}

interface DbReviewRow {
  id: string;
  author_name: string;
  initials: string;
  rating: number;
  comment: string;
  created_at: string;
}

interface DemoStoreContextValue {
  isLoading: boolean;
  categories: CategoryInfo[];
  menuItems: MenuItem[];
  reviews: ReviewRecord[];
  cart: Record<string, number>;
  cartItems: OrderLineItem[];
  cartCount: number;
  cartTotal: number;
  assignedTableId: string;
  assignedTableNumber: string;
  isTableVerifiedByQr: boolean;
  tables: TableRecord[];
  selectedTableId: string;
  selectedTable: TableRecord | null;
  orderHistory: OrderHistoryRecord[];
  lastConfirmedOrder: OrderHistoryRecord | null;
  incrementCart: (itemId: string) => void;
  decrementCart: (itemId: string) => void;
  setCartQuantity: (itemId: string, qty: number) => void;
  clearCart: () => void;
  confirmCustomerOrder: () => OrderHistoryRecord | null;
  resetConfirmationBanner: () => void;
  selectTable: (tableId: string) => void;
  assignOrderToTable: (tableId: string, lines: OrderLineItem[]) => void;
  markTableComplete: (tableId: string) => void;
  updateTableStatus: (tableId: string, status: TableStatus) => void;
  addTable: (customTableNumber?: string) => Promise<void>;
  addCategory: (input: { label: string; image: string; slug?: string }) => Promise<void>;
  updateCategory: (
    id: string,
    patch: { label?: string; image?: string; slug?: string }
  ) => Promise<void>;
  deleteCategory: (id: string) => Promise<void>;
  addMenuItem: (input: {
    name: string;
    price: number;
    category: CategorySlug;
    image?: string;
  }) => Promise<void>;
  updateMenuItem: (
    id: string,
    patch: {
      name?: string;
      price?: number;
      category?: CategorySlug;
      image?: string;
    }
  ) => Promise<void>;
  deleteMenuItem: (id: string) => Promise<void>;
  addReview: (input: {
    authorName: string;
    rating: number;
    comment: string;
  }) => Promise<boolean>;
  getLineTotal: (line: OrderLineItem) => number;
  getTableTotal: (table: TableRecord | null) => number;
}

const DemoStoreContext = createContext<DemoStoreContextValue | null>(null);

const CART_STORAGE_KEY = "saborea_active_cart_v1";

function formatOrderTime(isoString: string): string {
  const date = new Date(isoString);
  if (Number.isNaN(date.getTime())) return isoString;
  return date.toLocaleTimeString([], { hour: "numeric", minute: "2-digit" });
}

function getInitials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "G";
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return `${parts[0][0]}${parts[parts.length - 1][0]}`.toUpperCase();
}

function slugifyCategory(text: string): string {
  const base = text
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\u0600-\u06FF\s-]/g, "")
    .replace(/\s+/g, "-");
  return base || `cat-${Date.now().toString(36)}`;
}

function mapDbOrderItems(rows: DbOrderItemRow[] | undefined): OrderLineItem[] {
  if (!rows) return [];
  return rows.map((row) => ({
    menuItemId: row.menu_item_id ?? row.name.toLowerCase().replace(/\s+/g, "-"),
    name: row.name,
    unitPrice: row.unit_price,
    quantity: row.quantity,
    image: row.image,
    ...(typeof row.line_total_override === "number"
      ? { lineTotalOverride: row.line_total_override }
      : {}),
  }));
}

function mergeLineItems(lines: OrderLineItem[]): OrderLineItem[] {
  const merged = new Map<string, OrderLineItem>();
  for (const line of lines) {
    const existing = merged.get(line.menuItemId);
    if (existing) {
      merged.set(line.menuItemId, {
        ...existing,
        quantity: existing.quantity + line.quantity,
        lineTotalOverride: undefined,
      });
    } else {
      merged.set(line.menuItemId, { ...line });
    }
  }
  return Array.from(merged.values());
}

export function DemoStoreProvider({ children }: { children: React.ReactNode }) {
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [categories, setCategories] = useState<CategoryInfo[]>([]);
  const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
  const [reviews, setReviews] = useState<ReviewRecord[]>([]);
  // Cart starts completely empty (0 items) on first visit
  const [cart, setCart] = useState<Record<string, number>>({});
  const [cartHydrated, setCartHydrated] = useState<boolean>(false);

  const [assignedTableId, setAssignedTableId] = useState<string>("table-01");
  const [assignedTableNumber, setAssignedTableNumber] = useState<string>("Table 01");
  const [isTableVerifiedByQr, setIsTableVerifiedByQr] = useState<boolean>(false);

  const [tables, setTables] = useState<TableRecord[]>([]);
  const [selectedTableId, setSelectedTableId] = useState<string>("table-01");
  const [orderHistory, setOrderHistory] = useState<OrderHistoryRecord[]>([]);
  const [lastConfirmedOrder, setLastConfirmedOrder] =
    useState<OrderHistoryRecord | null>(null);

  const tablesRef = useRef<TableRecord[]>(tables);
  const menuItemsRef = useRef<MenuItem[]>(menuItems);
  const refreshTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    tablesRef.current = tables;
  }, [tables]);

  useEffect(() => {
    menuItemsRef.current = menuItems;
  }, [menuItems]);

  // Restore session cart if the customer already added items during this browser session
  useEffect(() => {
    try {
      const saved = sessionStorage.getItem(CART_STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved) as Record<string, number>;
        if (parsed && typeof parsed === "object") {
          setCart(parsed);
        }
      }
    } catch {
      // ignore storage errors
    } finally {
      setCartHydrated(true);
    }
  }, []);

  useEffect(() => {
    if (!cartHydrated) return;
    try {
      if (Object.keys(cart).length === 0) {
        sessionStorage.removeItem(CART_STORAGE_KEY);
      } else {
        sessionStorage.setItem(CART_STORAGE_KEY, JSON.stringify(cart));
      }
    } catch {
      // ignore storage errors
    }
  }, [cart, cartHydrated]);

  // Verify QR table session on mount
  useEffect(() => {
    async function initTableSession() {
      try {
        const params = new URLSearchParams(window.location.search);
        const tokenFromUrl = params.get("t");

        if (tokenFromUrl) {
          const res = await fetch("/api/table-session", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ token: tokenFromUrl }),
          });
          if (res.ok) {
            const data = (await res.json()) as {
              tableId?: string | null;
              tableNumber?: string | null;
              verified?: boolean;
            };
            if (data.verified && data.tableId && data.tableNumber) {
              setAssignedTableId(data.tableId);
              setAssignedTableNumber(data.tableNumber);
              setIsTableVerifiedByQr(true);
              const url = new URL(window.location.href);
              url.searchParams.delete("t");
              window.history.replaceState({}, "", url.toString());
              return;
            }
          }
        }

        const res = await fetch("/api/table-session", { cache: "no-store" });
        if (res.ok) {
          const data = (await res.json()) as {
            tableId?: string | null;
            tableNumber?: string | null;
            verified?: boolean;
          };
          if (data.verified && data.tableId && data.tableNumber) {
            setAssignedTableId(data.tableId);
            setAssignedTableNumber(data.tableNumber);
            setIsTableVerifiedByQr(true);
          }
        }
      } catch {
        // Keep default table assignment if offline
      }
    }

    void initTableSession();
  }, []);

  const fetchAllFromSupabase = useCallback(async () => {
    try {
      const [categoriesRes, menuRes, tablesRes, ordersRes, reviewsRes] =
        await Promise.all([
          supabase
            .from("categories")
            .select("id, slug, label, image, display_order")
            .order("display_order", { ascending: true })
            .order("created_at", { ascending: true }),
          supabase
            .from("menu_items")
            .select("id, name, price, category, image, sold")
            .order("created_at", { ascending: true }),
          supabase
            .from("restaurant_tables")
            .select("id, table_number, status, display_order, updated_at")
            .order("display_order", { ascending: true })
            .order("id", { ascending: true }),
          supabase
            .from("orders")
            .select(
              "id, table_id, table_number, total, status, created_at, order_items(id, order_id, menu_item_id, name, unit_price, quantity, image, line_total_override)"
            )
            .order("created_at", { ascending: false }),
          supabase
            .from("reviews")
            .select("id, author_name, initials, rating, comment, created_at")
            .order("created_at", { ascending: false }),
        ]);

      const dbOrders = ((ordersRes.data ?? []) as DbOrderRow[]) || [];
      const dbMenu = ((menuRes.data ?? []) as DbMenuItemRow[]) || [];
      const dbTables = ((tablesRes.data ?? []) as DbRestaurantTableRow[]) || [];
      const dbCategories =
        ((categoriesRes.data ?? []) as DbCategoryRow[]) || [];
      const dbReviews = ((reviewsRes.data ?? []) as DbReviewRow[]) || [];

      // Compute actual quantities sold per dish from real order_items in Supabase
      const soldByMenuId = new Map<string, number>();
      const soldByName = new Map<string, number>();
      for (const ord of dbOrders) {
        for (const oi of ord.order_items ?? []) {
          if (oi.menu_item_id) {
            soldByMenuId.set(
              oi.menu_item_id,
              (soldByMenuId.get(oi.menu_item_id) ?? 0) + oi.quantity
            );
          }
          const keyName = oi.name.trim().toLowerCase();
          soldByName.set(keyName, (soldByName.get(keyName) ?? 0) + oi.quantity);
        }
      }

      const mappedMenu: MenuItem[] = dbMenu.map((row) => {
        const computedSold =
          soldByMenuId.get(row.id) ??
          soldByName.get(row.name.trim().toLowerCase()) ??
          0;
        return {
          id: row.id,
          name: row.name,
          price: row.price,
          category: row.category,
          image: row.image,
          sold: dbOrders.length > 0 ? computedSold : row.sold,
        };
      });
      setMenuItems(mappedMenu);

      if (!categoriesRes.error && dbCategories.length > 0) {
        setCategories(
          dbCategories.map((c) => ({
            id: c.id,
            slug: c.slug,
            label: c.label,
            image: c.image,
            displayOrder: c.display_order,
          }))
        );
      } else {
        // Derive categories from live menu_items in Supabase if categories table is empty
        const derivedMap = new Map<string, CategoryInfo>();
        for (const m of mappedMenu) {
          if (!derivedMap.has(m.category)) {
            derivedMap.set(m.category, {
              id: `cat-${m.category}`,
              slug: m.category,
              label: m.category.charAt(0).toUpperCase() + m.category.slice(1),
              image: m.image,
            });
          }
        }
        setCategories(Array.from(derivedMap.values()));
      }

      if (!reviewsRes.error) {
        setReviews(
          dbReviews.map((r) => ({
            id: r.id,
            authorName: r.author_name,
            initials: r.initials || getInitials(r.author_name),
            rating: r.rating,
            comment: r.comment,
            createdAt: formatOrderTime(r.created_at),
          }))
        );
      }

      const mappedHistory: OrderHistoryRecord[] = dbOrders.map((ord) => ({
        id: ord.id,
        tableId: ord.table_id,
        tableNumber: ord.table_number,
        items: mapDbOrderItems(ord.order_items),
        total: ord.total,
        status: ord.status,
        createdAt: formatOrderTime(ord.created_at),
        createdAtIso: ord.created_at,
      }));
      setOrderHistory(mappedHistory);

      const mappedTables: TableRecord[] = dbTables.map((tbl) => {
        const activeOrdersForTable = dbOrders.filter(
          (ord) =>
            ord.status !== "Completed" &&
            (ord.table_id === tbl.id || ord.table_number === tbl.table_number)
        );
        const combinedItems =
          tbl.status === "Available"
            ? []
            : mergeLineItems(
                activeOrdersForTable.flatMap((ord) =>
                  mapDbOrderItems(ord.order_items)
                )
              );

        return {
          id: tbl.id,
          number: tbl.table_number,
          status: tbl.status,
          updatedAt: tbl.updated_at ? formatOrderTime(tbl.updated_at) : undefined,
          items: combinedItems,
        };
      });
      setTables(mappedTables);
    } catch (err) {
      console.warn("Error fetching production data from Supabase:", err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const scheduleRefresh = useCallback(() => {
    if (refreshTimerRef.current) {
      clearTimeout(refreshTimerRef.current);
    }
    refreshTimerRef.current = setTimeout(() => {
      void fetchAllFromSupabase();
    }, 120);
  }, [fetchAllFromSupabase]);

  useEffect(() => {
    void fetchAllFromSupabase();

    const channel = supabase
      .channel("saborea-production-realtime")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "orders" },
        () => scheduleRefresh()
      )
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "restaurant_tables" },
        () => scheduleRefresh()
      )
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "order_items" },
        () => scheduleRefresh()
      )
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "menu_items" },
        () => scheduleRefresh()
      )
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "categories" },
        () => scheduleRefresh()
      )
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "reviews" },
        () => scheduleRefresh()
      )
      .subscribe();

    return () => {
      if (refreshTimerRef.current) {
        clearTimeout(refreshTimerRef.current);
      }
      void supabase.removeChannel(channel);
    };
  }, [fetchAllFromSupabase, scheduleRefresh]);

  const getLineTotal = useCallback((line: OrderLineItem) => {
    if (typeof line.lineTotalOverride === "number") return line.lineTotalOverride;
    return line.unitPrice * line.quantity;
  }, []);

  const getTableTotal = useCallback(
    (table: TableRecord | null) => {
      if (!table) return 0;
      return table.items.reduce((sum, line) => sum + getLineTotal(line), 0);
    },
    [getLineTotal]
  );

  const cartItems = useMemo<OrderLineItem[]>(() => {
    return Object.entries(cart)
      .filter(([, qty]) => qty > 0)
      .map(([itemId, quantity]) => {
        const item = menuItems.find((m) => m.id === itemId);
        if (!item) return null;
        return {
          menuItemId: item.id,
          name: item.name,
          unitPrice: item.price,
          quantity,
          image: item.image,
        };
      })
      .filter((v): v is OrderLineItem => v !== null);
  }, [cart, menuItems]);

  const cartCount = useMemo(
    () => cartItems.reduce((sum, item) => sum + item.quantity, 0),
    [cartItems]
  );

  const cartTotal = useMemo(
    () => cartItems.reduce((sum, item) => sum + item.unitPrice * item.quantity, 0),
    [cartItems]
  );

  const incrementCart = useCallback((itemId: string) => {
    setCart((prev) => ({
      ...prev,
      [itemId]: (prev[itemId] ?? 0) + 1,
    }));
  }, []);

  const decrementCart = useCallback((itemId: string) => {
    setCart((prev) => {
      const nextQty = Math.max(0, (prev[itemId] ?? 0) - 1);
      if (nextQty === 0) {
        const copy = { ...prev };
        delete copy[itemId];
        return copy;
      }
      return { ...prev, [itemId]: nextQty };
    });
  }, []);

  const setCartQuantity = useCallback((itemId: string, qty: number) => {
    const clean = Math.max(0, Math.floor(qty));
    setCart((prev) => {
      if (clean === 0) {
        const copy = { ...prev };
        delete copy[itemId];
        return copy;
      }
      return { ...prev, [itemId]: clean };
    });
  }, []);

  const clearCart = useCallback(() => {
    setCart({});
    try {
      sessionStorage.removeItem(CART_STORAGE_KEY);
    } catch {
      // ignore
    }
  }, []);

  const persistOrderAndTable = useCallback(
    async (params: {
      orderId: string;
      tableId: string;
      tableNumber: string;
      lines: OrderLineItem[];
      total: number;
      currentMenu: MenuItem[];
    }) => {
      try {
        const nowIso = new Date().toISOString();

        // Ensure target table row exists in restaurant_tables first
        await supabase.from("restaurant_tables").upsert(
          {
            id: params.tableId,
            table_number: params.tableNumber,
            status: "Preparing",
            is_demo: false,
            display_order: Number(params.tableId.replace(/\D+/g, "")) || 1,
            updated_at: nowIso,
          },
          { onConflict: "id" }
        );

        const { error: orderErr } = await supabase.from("orders").insert({
          id: params.orderId,
          table_id: params.tableId,
          table_number: params.tableNumber,
          total: params.total,
          status: "Preparing",
          is_demo: false,
          created_at: nowIso,
        });
        if (orderErr) throw orderErr;

        const { error: itemsErr } = await supabase.from("order_items").insert(
          params.lines.map((line) => ({
            order_id: params.orderId,
            menu_item_id: line.menuItemId,
            name: line.name,
            unit_price: line.unitPrice,
            quantity: line.quantity,
            image: line.image,
            line_total_override: line.lineTotalOverride ?? null,
          }))
        );
        if (itemsErr) throw itemsErr;

        // Touch restaurant_tables after order_items are committed so Realtime listeners see all items
        await supabase
          .from("restaurant_tables")
          .update({
            status: "Preparing",
            is_demo: false,
            updated_at: new Date().toISOString(),
          })
          .eq("id", params.tableId);

        await Promise.all(
          params.lines.map(async (line) => {
            const menuRow = params.currentMenu.find(
              (m) => m.id === line.menuItemId
            );
            if (!menuRow) return;
            await supabase
              .from("menu_items")
              .update({ sold: menuRow.sold + line.quantity })
              .eq("id", line.menuItemId);
          })
        );

        await fetchAllFromSupabase();
      } catch (err) {
        console.warn("Failed to persist order to Supabase:", err);
      }
    },
    [fetchAllFromSupabase]
  );

  const confirmCustomerOrder = useCallback((): OrderHistoryRecord | null => {
    if (cartItems.length === 0) return null;

    const total = cartItems.reduce(
      (sum, item) => sum + item.unitPrice * item.quantity,
      0
    );
    const nowIso = new Date().toISOString();
    const nowLabel = formatOrderTime(nowIso);
    const orderId = `ord-${Date.now().toString().slice(-6)}`;
    const snapshotMenu = menuItemsRef.current;

    const newRecord: OrderHistoryRecord = {
      id: orderId,
      tableId: assignedTableId,
      tableNumber: assignedTableNumber,
      items: cartItems,
      total,
      status: "Preparing",
      createdAt: nowLabel,
      createdAtIso: nowIso,
    };

    setTables((prev) => {
      const existing = prev.find((t) => t.id === assignedTableId);
      if (existing) {
        return prev.map((t) =>
          t.id === assignedTableId
            ? {
                ...t,
                status: "Preparing",
                items: mergeLineItems([...t.items, ...cartItems]),
                updatedAt: nowLabel,
              }
            : t
        );
      }
      return [
        ...prev,
        {
          id: assignedTableId,
          number: assignedTableNumber,
          status: "Preparing",
          items: cartItems,
          updatedAt: nowLabel,
        },
      ];
    });

    setMenuItems((prev) =>
      prev.map((m) => {
        const match = cartItems.find((ci) => ci.menuItemId === m.id);
        return match ? { ...m, sold: m.sold + match.quantity } : m;
      })
    );

    setOrderHistory((prev) => [newRecord, ...prev]);
    setLastConfirmedOrder(newRecord);
    setCart({});
    try {
      sessionStorage.removeItem(CART_STORAGE_KEY);
    } catch {
      // ignore
    }

    void persistOrderAndTable({
      orderId,
      tableId: assignedTableId,
      tableNumber: assignedTableNumber,
      lines: cartItems,
      total,
      currentMenu: snapshotMenu,
    });

    return newRecord;
  }, [assignedTableId, assignedTableNumber, cartItems, persistOrderAndTable]);

  const resetConfirmationBanner = useCallback(() => {
    setLastConfirmedOrder(null);
  }, []);

  const selectTable = useCallback((tableId: string) => {
    setSelectedTableId(tableId);
  }, []);

  const assignOrderToTable = useCallback(
    (tableId: string, lines: OrderLineItem[]) => {
      if (lines.length === 0) return;
      const total = lines.reduce((sum, l) => sum + l.unitPrice * l.quantity, 0);
      const nowIso = new Date().toISOString();
      const nowLabel = formatOrderTime(nowIso);
      const orderId = `ord-${Date.now().toString().slice(-6)}`;
      const targetTable = tablesRef.current.find((t) => t.id === tableId);
      const targetTableNumber = targetTable?.number ?? "Table 01";
      const snapshotMenu = menuItemsRef.current;

      setTables((prev) =>
        prev.map((t) =>
          t.id === tableId
            ? {
                ...t,
                status: "Preparing",
                items: lines,
                updatedAt: nowLabel,
              }
            : t
        )
      );

      setMenuItems((prev) =>
        prev.map((m) => {
          const match = lines.find((l) => l.menuItemId === m.id);
          return match ? { ...m, sold: m.sold + match.quantity } : m;
        })
      );

      setOrderHistory((prev) => [
        {
          id: orderId,
          tableId,
          tableNumber: targetTableNumber,
          items: lines,
          total,
          status: "Preparing",
          createdAt: nowLabel,
          createdAtIso: nowIso,
        },
        ...prev,
      ]);
      setSelectedTableId(tableId);

      void persistOrderAndTable({
        orderId,
        tableId,
        tableNumber: targetTableNumber,
        lines,
        total,
        currentMenu: snapshotMenu,
      });
    },
    [persistOrderAndTable]
  );

  const markTableComplete = useCallback(
    (tableId: string) => {
      const targetTable = tablesRef.current.find((t) => t.id === tableId);
      const targetNumber = targetTable?.number;

      setTables((prev) =>
        prev.map((t) => {
          if (t.id !== tableId) return t;
          return {
            ...t,
            status: "Available",
            items: [],
            updatedAt: undefined,
          };
        })
      );
      setOrderHistory((prev) =>
        prev.map((ord) => {
          if (
            (ord.tableId === tableId ||
              (targetNumber && ord.tableNumber === targetNumber)) &&
            ord.status !== "Completed"
          ) {
            return { ...ord, status: "Completed" };
          }
          return ord;
        })
      );

      void (async () => {
        try {
          await supabase
            .from("orders")
            .update({ status: "Completed" })
            .eq("table_id", tableId)
            .neq("status", "Completed");

          if (targetNumber) {
            await supabase
              .from("orders")
              .update({ status: "Completed" })
              .eq("table_number", targetNumber)
              .neq("status", "Completed");
          }

          await supabase
            .from("restaurant_tables")
            .update({
              status: "Available",
              is_demo: false,
              updated_at: new Date().toISOString(),
            })
            .eq("id", tableId);

          await fetchAllFromSupabase();
        } catch (err) {
          console.warn("Failed to mark table complete in Supabase:", err);
        }
      })();
    },
    [fetchAllFromSupabase]
  );

  const updateTableStatus = useCallback(
    (tableId: string, status: TableStatus) => {
      const targetTable = tablesRef.current.find((t) => t.id === tableId);
      const targetNumber = targetTable?.number;

      setTables((prev) =>
        prev.map((t) => (t.id === tableId ? { ...t, status } : t))
      );

      if (status === "Preparing" || status === "Ready") {
        setOrderHistory((prev) =>
          prev.map((ord) =>
            (ord.tableId === tableId ||
              (targetNumber && ord.tableNumber === targetNumber)) &&
            ord.status !== "Completed"
              ? { ...ord, status }
              : ord
          )
        );
      }

      void (async () => {
        try {
          await supabase
            .from("restaurant_tables")
            .update({ status, updated_at: new Date().toISOString() })
            .eq("id", tableId);

          if (status === "Preparing" || status === "Ready") {
            await supabase
              .from("orders")
              .update({ status })
              .eq("table_id", tableId)
              .neq("status", "Completed");
          }
          await fetchAllFromSupabase();
        } catch (err) {
          console.warn("Failed to update table status in Supabase:", err);
        }
      })();
    },
    [fetchAllFromSupabase]
  );

  const addTable = useCallback(
    async (customTableNumber?: string) => {
      const nextNum = tablesRef.current.length + 1;
      const padded = String(nextNum).padStart(2, "0");
      const numberLabel = customTableNumber?.trim() || `Table ${padded}`;
      const id = `table-${padded}-${Date.now().toString(36).slice(-3)}`;

      const newTable: TableRecord = {
        id,
        number: numberLabel,
        status: "Available",
        items: [],
      };
      setTables((prev) => [...prev, newTable]);

      try {
        await supabase.from("restaurant_tables").insert({
          id,
          table_number: numberLabel,
          status: "Available",
          is_demo: false,
          display_order: nextNum,
          updated_at: new Date().toISOString(),
        });
        await fetchAllFromSupabase();
      } catch (err) {
        console.warn("Failed to add table in Supabase:", err);
      }
    },
    [fetchAllFromSupabase]
  );

  const addCategory = useCallback(
    async (input: { label: string; image: string; slug?: string }) => {
      const cleanLabel = input.label.trim();
      if (!cleanLabel) return;
      const slug = slugifyCategory(input.slug || cleanLabel);
      const id = `cat-${slug}-${Date.now().toString(36).slice(-3)}`;
      const image = input.image.trim() || "/images/food/margherita.jpg";
      const displayOrder = categories.length + 1;

      const newCat: CategoryInfo = {
        id,
        slug,
        label: cleanLabel,
        image,
        displayOrder,
      };
      setCategories((prev) => [...prev, newCat]);

      try {
        const { error } = await supabase.from("categories").insert({
          id,
          slug,
          label: cleanLabel,
          image,
          display_order: displayOrder,
        });
        if (error) throw error;
        await fetchAllFromSupabase();
      } catch (err) {
        console.warn("Failed to add category in Supabase:", err);
      }
    },
    [categories.length, fetchAllFromSupabase]
  );

  const updateCategory = useCallback(
    async (
      id: string,
      patch: { label?: string; image?: string; slug?: string }
    ) => {
      const target = categories.find((c) => c.id === id);
      const oldSlug = target?.slug;
      const nextSlug = patch.slug ? slugifyCategory(patch.slug) : oldSlug;

      setCategories((prev) =>
        prev.map((c) =>
          c.id === id
            ? {
                ...c,
                label: patch.label !== undefined ? patch.label.trim() : c.label,
                image: patch.image !== undefined ? patch.image.trim() : c.image,
                slug: nextSlug ?? c.slug,
              }
            : c
        )
      );

      try {
        const dbPatch: Partial<DbCategoryRow> = {};
        if (patch.label !== undefined) dbPatch.label = patch.label.trim();
        if (patch.image !== undefined) dbPatch.image = patch.image.trim();
        if (nextSlug !== undefined) dbPatch.slug = nextSlug;

        await supabase.from("categories").update(dbPatch).eq("id", id);

        if (oldSlug && nextSlug && oldSlug !== nextSlug) {
          await supabase
            .from("menu_items")
            .update({ category: nextSlug })
            .eq("category", oldSlug);
        }
        await fetchAllFromSupabase();
      } catch (err) {
        console.warn("Failed to update category in Supabase:", err);
      }
    },
    [categories, fetchAllFromSupabase]
  );

  const deleteCategory = useCallback(
    async (id: string) => {
      const target = categories.find((c) => c.id === id);
      setCategories((prev) => prev.filter((c) => c.id !== id));
      if (target) {
        setMenuItems((prev) =>
          prev.filter((m) => m.category !== target.slug)
        );
      }

      try {
        if (target) {
          await supabase
            .from("menu_items")
            .delete()
            .eq("category", target.slug);
        }
        await supabase.from("categories").delete().eq("id", id);
        await fetchAllFromSupabase();
      } catch (err) {
        console.warn("Failed to delete category in Supabase:", err);
      }
    },
    [categories, fetchAllFromSupabase]
  );

  const addMenuItem = useCallback(
    async (input: {
      name: string;
      price: number;
      category: CategorySlug;
      image?: string;
    }) => {
      const catObj = categories.find((c) => c.slug === input.category);
      const fallbackImage = catObj?.image || "/images/food/margherita.jpg";

      const newItem: MenuItem = {
        id: `dish-${Date.now().toString(36)}`,
        name: input.name.trim(),
        price: Math.max(1, Math.round(input.price)),
        category: input.category,
        image: input.image?.trim() || fallbackImage,
        sold: 0,
      };
      setMenuItems((prev) => [...prev, newItem]);

      try {
        const { error } = await supabase.from("menu_items").insert({
          id: newItem.id,
          name: newItem.name,
          price: newItem.price,
          category: newItem.category,
          image: newItem.image,
          sold: 0,
        });
        if (error) throw error;
        await fetchAllFromSupabase();
      } catch (err) {
        console.warn("Failed to add menu item in Supabase:", err);
      }
    },
    [categories, fetchAllFromSupabase]
  );

  const updateMenuItem = useCallback(
    async (
      id: string,
      patch: {
        name?: string;
        price?: number;
        category?: CategorySlug;
        image?: string;
      }
    ) => {
      const cleanName =
        patch.name !== undefined ? patch.name.trim() : undefined;
      const cleanPrice =
        patch.price !== undefined
          ? Math.max(1, Math.round(patch.price))
          : undefined;
      const cleanImage =
        patch.image !== undefined ? patch.image.trim() : undefined;

      setMenuItems((prev) =>
        prev.map((item) =>
          item.id === id
            ? {
                ...item,
                name: cleanName ?? item.name,
                price: cleanPrice ?? item.price,
                category: patch.category ?? item.category,
                image: cleanImage ?? item.image,
              }
            : item
        )
      );

      try {
        const dbPatch: Partial<DbMenuItemRow> = {};
        if (cleanName !== undefined) dbPatch.name = cleanName;
        if (cleanPrice !== undefined) dbPatch.price = cleanPrice;
        if (patch.category !== undefined) dbPatch.category = patch.category;
        if (cleanImage !== undefined) dbPatch.image = cleanImage;

        const { error } = await supabase
          .from("menu_items")
          .update(dbPatch)
          .eq("id", id);
        if (error) throw error;
        await fetchAllFromSupabase();
      } catch (err) {
        console.warn("Failed to update menu item in Supabase:", err);
      }
    },
    [fetchAllFromSupabase]
  );

  const deleteMenuItem = useCallback(
    async (id: string) => {
      setMenuItems((prev) => prev.filter((item) => item.id !== id));
      try {
        const { error } = await supabase
          .from("menu_items")
          .delete()
          .eq("id", id);
        if (error) throw error;
        await fetchAllFromSupabase();
      } catch (err) {
        console.warn("Failed to delete menu item in Supabase:", err);
      }
    },
    [fetchAllFromSupabase]
  );

  const addReview = useCallback(
    async (input: {
      authorName: string;
      rating: number;
      comment: string;
    }): Promise<boolean> => {
      const cleanName = input.authorName.trim();
      const cleanComment = input.comment.trim();
      const cleanRating = Math.min(5, Math.max(1, Math.round(input.rating)));
      if (!cleanName || !cleanComment) return false;

      const initials = getInitials(cleanName);
      const optimistic: ReviewRecord = {
        id: `rev-${Date.now()}`,
        authorName: cleanName,
        initials,
        rating: cleanRating,
        comment: cleanComment,
        createdAt: "Just now",
      };
      setReviews((prev) => [optimistic, ...prev]);

      try {
        const { error } = await supabase.from("reviews").insert({
          author_name: cleanName,
          initials,
          rating: cleanRating,
          comment: cleanComment,
        });
        if (error) throw error;
        await fetchAllFromSupabase();
        return true;
      } catch (err) {
        console.warn("Failed to save review in Supabase:", err);
        return false;
      }
    },
    [fetchAllFromSupabase]
  );

  const selectedTable = useMemo<TableRecord | null>(() => {
    if (tables.length === 0) return null;
    return tables.find((t) => t.id === selectedTableId) ?? tables[0];
  }, [tables, selectedTableId]);

  const value: DemoStoreContextValue = {
    isLoading,
    categories,
    menuItems,
    reviews,
    cart,
    cartItems,
    cartCount,
    cartTotal,
    assignedTableId,
    assignedTableNumber,
    isTableVerifiedByQr,
    tables,
    selectedTableId,
    selectedTable,
    orderHistory,
    lastConfirmedOrder,
    incrementCart,
    decrementCart,
    setCartQuantity,
    clearCart,
    confirmCustomerOrder,
    resetConfirmationBanner,
    selectTable,
    assignOrderToTable,
    markTableComplete,
    updateTableStatus,
    addTable,
    addCategory,
    updateCategory,
    deleteCategory,
    addMenuItem,
    updateMenuItem,
    deleteMenuItem,
    addReview,
    getLineTotal,
    getTableTotal,
  };

  return (
    <DemoStoreContext.Provider value={value}>
      {children}
    </DemoStoreContext.Provider>
  );
}

export function useDemoStore() {
  const ctx = useContext(DemoStoreContext);
  if (!ctx) {
    throw new Error("useDemoStore must be used inside DemoStoreProvider");
  }
  return ctx;
}
