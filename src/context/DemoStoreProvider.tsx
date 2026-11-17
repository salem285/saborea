"use client";

import React, { createContext, useContext, useState, useMemo, useCallback } from "react";

export type CategorySlug = "pizza" | "savory" | "sweets" | "drinks";

export interface CategoryInfo {
  slug: CategorySlug;
  label: string;
  image: string;
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
  number: string; // e.g. "Table 01"
  status: TableStatus;
  items: OrderLineItem[];
  isDemo?: boolean;
  updatedAt?: string;
}

export interface OrderHistoryRecord {
  id: string;
  tableNumber: string;
  items: OrderLineItem[];
  total: number;
  status: "Preparing" | "Ready" | "Completed";
  createdAt: string;
  isDemo?: boolean;
}

export type TimeRange = "Today" | "Month" | "Year";

export const CATEGORIES: CategoryInfo[] = [
  { slug: "pizza", label: "Pizza", image: "/images/food/margherita.jpg" },
  { slug: "savory", label: "Savory", image: "/images/food/savory-salmon.jpg" },
  { slug: "sweets", label: "Sweets", image: "/images/food/lava-cake.jpg" },
  { slug: "drinks", label: "Drinks", image: "/images/food/cola.jpg" },
];

const INITIAL_MENU_ITEMS: MenuItem[] = [
  {
    id: "classic-margherita",
    name: "Classic Margherita",
    price: 250,
    category: "pizza",
    image: "/images/food/margherita.jpg",
    sold: 32,
  },
  {
    id: "pepperoni-supreme",
    name: "Pepperoni Supreme",
    price: 320,
    category: "pizza",
    image: "/images/food/pepperoni.jpg",
    sold: 18,
  },
  {
    id: "herb-salmon",
    name: "Herb-Seared Salmon",
    price: 420,
    category: "savory",
    image: "/images/food/savory-salmon.jpg",
    sold: 14,
  },
  {
    id: "truffle-tagliatelle",
    name: "Black Truffle Tagliatelle",
    price: 310,
    category: "savory",
    image: "/images/food/truffle-pasta.jpg",
    sold: 11,
  },
  {
    id: "molten-lava-cake",
    name: "Molten Lava Cake",
    price: 145,
    category: "sweets",
    image: "/images/food/lava-cake.jpg",
    sold: 16,
  },
  {
    id: "classic-tiramisu",
    name: "Classic Tiramisu",
    price: 135,
    category: "sweets",
    image: "/images/food/tiramisu.jpg",
    sold: 12,
  },
  {
    id: "cola",
    name: "Cola",
    price: 35,
    category: "drinks",
    image: "/images/food/cola.jpg",
    sold: 25,
  },
  {
    id: "lemon-mint",
    name: "Fresh Lemon Mint",
    price: 65,
    category: "drinks",
    image: "/images/food/lemon-mint.jpg",
    sold: 15,
  },
];

const INITIAL_TABLES: TableRecord[] = [
  {
    id: "table-01",
    number: "Table 01",
    status: "Available",
    items: [],
  },
  {
    id: "table-02",
    number: "Table 02",
    status: "Preparing",
    isDemo: true,
    updatedAt: "3 mins ago",
    items: [
      {
        menuItemId: "classic-margherita",
        name: "Classic Margherita",
        unitPrice: 250,
        quantity: 1,
        image: "/images/food/margherita.jpg",
      },
      {
        menuItemId: "cola",
        name: "Cola",
        unitPrice: 35,
        quantity: 1,
        image: "/images/food/cola.jpg",
      },
    ],
  },
  {
    id: "table-03",
    number: "Table 03",
    status: "Ready",
    isDemo: true,
    updatedAt: "Just now",
    items: [
      {
        menuItemId: "pepperoni-supreme",
        name: "Pepperoni Supreme",
        unitPrice: 280,
        quantity: 1,
        image: "/images/food/pepperoni.jpg",
        lineTotalOverride: 280,
      },
      {
        menuItemId: "cola",
        name: "Cola",
        unitPrice: 35,
        quantity: 2,
        image: "/images/food/cola.jpg",
      },
    ],
  },
  {
    id: "table-04",
    number: "Table 04",
    status: "Available",
    items: [],
  },
  {
    id: "table-05",
    number: "Table 05",
    status: "Preparing",
    isDemo: true,
    updatedAt: "5 mins ago",
    items: [
      {
        menuItemId: "classic-margherita",
        name: "Classic Margherita",
        unitPrice: 250,
        quantity: 2,
        image: "/images/food/margherita.jpg",
      },
      {
        menuItemId: "cola",
        name: "Cola",
        unitPrice: 35,
        quantity: 1,
        image: "/images/food/cola.jpg",
      },
    ],
  },
  {
    id: "table-06",
    number: "Table 06",
    status: "Available",
    items: [],
  },
];

const INITIAL_ORDER_HISTORY: OrderHistoryRecord[] = [
  {
    id: "ord-105",
    tableNumber: "Table 05",
    items: INITIAL_TABLES[4].items,
    total: 535,
    status: "Preparing",
    createdAt: "3:49 PM",
    isDemo: true,
  },
  {
    id: "ord-103",
    tableNumber: "Table 03",
    items: INITIAL_TABLES[2].items,
    total: 350,
    status: "Ready",
    createdAt: "3:44 PM",
    isDemo: true,
  },
  {
    id: "ord-102",
    tableNumber: "Table 02",
    items: INITIAL_TABLES[1].items,
    total: 285,
    status: "Preparing",
    createdAt: "3:41 PM",
    isDemo: true,
  },
  {
    id: "ord-099",
    tableNumber: "Table 04",
    items: [
      {
        menuItemId: "herb-salmon",
        name: "Herb-Seared Salmon",
        unitPrice: 420,
        quantity: 1,
        image: "/images/food/savory-salmon.jpg",
      },
      {
        menuItemId: "molten-lava-cake",
        name: "Molten Lava Cake",
        unitPrice: 145,
        quantity: 1,
        image: "/images/food/lava-cake.jpg",
      },
    ],
    total: 565,
    status: "Completed",
    createdAt: "2:58 PM",
    isDemo: true,
  },
];

interface DemoStoreContextValue {
  menuItems: MenuItem[];
  cart: Record<string, number>;
  cartItems: OrderLineItem[];
  cartCount: number;
  cartTotal: number;
  assignedTableNumber: string;
  tables: TableRecord[];
  selectedTableId: string;
  selectedTable: TableRecord;
  orderHistory: OrderHistoryRecord[];
  extraRevenue: number;
  extraOrdersCount: number;
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
  addMenuItem: (input: { name: string; price: number; category: CategorySlug; image?: string }) => void;
  updateMenuItem: (id: string, patch: { name?: string; price?: number; category?: CategorySlug; image?: string }) => void;
  getLineTotal: (line: OrderLineItem) => number;
  getTableTotal: (table: TableRecord) => number;
}

const DemoStoreContext = createContext<DemoStoreContextValue | null>(null);

export function DemoStoreProvider({ children }: { children: React.ReactNode }) {
  const [menuItems, setMenuItems] = useState<MenuItem[]>(INITIAL_MENU_ITEMS);
  // Pre-populated cart matching Screenshot 4 ("Your order": 2x Classic Margherita + 1x Cola = EGP 535)
  const [cart, setCart] = useState<Record<string, number>>({
    "classic-margherita": 2,
    cola: 1,
  });
  const [tables, setTables] = useState<TableRecord[]>(INITIAL_TABLES);
  const [selectedTableId, setSelectedTableId] = useState<string>("table-05");
  const [orderHistory, setOrderHistory] = useState<OrderHistoryRecord[]>(INITIAL_ORDER_HISTORY);
  const [extraRevenue, setExtraRevenue] = useState<number>(0);
  const [extraOrdersCount, setExtraOrdersCount] = useState<number>(0);
  const [lastConfirmedOrder, setLastConfirmedOrder] = useState<OrderHistoryRecord | null>(null);

  const assignedTableNumber = "Table 08";

  const getLineTotal = useCallback((line: OrderLineItem) => {
    if (typeof line.lineTotalOverride === "number") return line.lineTotalOverride;
    return line.unitPrice * line.quantity;
  }, []);

  const getTableTotal = useCallback(
    (table: TableRecord) => table.items.reduce((sum, line) => sum + getLineTotal(line), 0),
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
  }, []);

  const confirmCustomerOrder = useCallback((): OrderHistoryRecord | null => {
    if (cartItems.length === 0) return null;

    const total = cartItems.reduce((sum, item) => sum + item.unitPrice * item.quantity, 0);
    const nowLabel = new Date().toLocaleTimeString([], { hour: "numeric", minute: "2-digit" });

    const newRecord: OrderHistoryRecord = {
      id: `ord-${Date.now().toString().slice(-4)}`,
      tableNumber: assignedTableNumber,
      items: cartItems,
      total,
      status: "Preparing",
      createdAt: nowLabel,
      isDemo: false,
    };

    // Update or insert Table 08 in Cashier tables so Cashier immediately reflects it
    setTables((prev) => {
      const existing = prev.find((t) => t.id === "table-08");
      if (existing) {
        return prev.map((t) =>
          t.id === "table-08"
            ? {
                ...t,
                status: "Preparing",
                items: [...t.items, ...cartItems],
                isDemo: false,
                updatedAt: "Just now",
              }
            : t
        );
      }
      return [
        ...prev,
        {
          id: "table-08",
          number: assignedTableNumber,
          status: "Preparing",
          items: cartItems,
          isDemo: false,
          updatedAt: "Just now",
        },
      ];
    });

    // Update sold counts for top sellers
    setMenuItems((prev) =>
      prev.map((m) => {
        const match = cartItems.find((ci) => ci.menuItemId === m.id);
        return match ? { ...m, sold: m.sold + match.quantity } : m;
      })
    );

    setOrderHistory((prev) => [newRecord, ...prev]);
    setExtraRevenue((prev) => prev + total);
    setExtraOrdersCount((prev) => prev + 1);
    setLastConfirmedOrder(newRecord);
    setCart({});

    return newRecord;
  }, [cartItems]);

  const resetConfirmationBanner = useCallback(() => {
    setLastConfirmedOrder(null);
  }, []);

  const selectTable = useCallback((tableId: string) => {
    setSelectedTableId(tableId);
  }, []);

  const assignOrderToTable = useCallback((tableId: string, lines: OrderLineItem[]) => {
    if (lines.length === 0) return;
    const total = lines.reduce((sum, l) => sum + l.unitPrice * l.quantity, 0);
    const nowLabel = new Date().toLocaleTimeString([], { hour: "numeric", minute: "2-digit" });

    let targetTableNumber = "Table";
    setTables((prev) =>
      prev.map((t) => {
        if (t.id !== tableId) return t;
        targetTableNumber = t.number;
        return {
          ...t,
          status: "Preparing",
          items: lines,
          isDemo: false,
          updatedAt: "Just now",
        };
      })
    );

    setOrderHistory((prev) => [
      {
        id: `ord-${Date.now().toString().slice(-4)}`,
        tableNumber: targetTableNumber,
        items: lines,
        total,
        status: "Preparing",
        createdAt: nowLabel,
        isDemo: false,
      },
      ...prev,
    ]);
    setExtraRevenue((prev) => prev + total);
    setExtraOrdersCount((prev) => prev + 1);
    setSelectedTableId(tableId);
  }, []);

  const markTableComplete = useCallback((tableId: string) => {
    setTables((prev) =>
      prev.map((t) => {
        if (t.id !== tableId) return t;
        return {
          ...t,
          status: "Available",
          items: [],
          isDemo: false,
          updatedAt: undefined,
        };
      })
    );
    setOrderHistory((prev) =>
      prev.map((ord) => {
        const target = tables.find((t) => t.id === tableId);
        if (target && ord.tableNumber === target.number && ord.status !== "Completed") {
          return { ...ord, status: "Completed" };
        }
        return ord;
      })
    );
  }, [tables]);

  const updateTableStatus = useCallback((tableId: string, status: TableStatus) => {
    setTables((prev) =>
      prev.map((t) => (t.id === tableId ? { ...t, status } : t))
    );
  }, []);

  const addMenuItem = useCallback(
    (input: { name: string; price: number; category: CategorySlug; image?: string }) => {
      const defaultImageByCategory: Record<CategorySlug, string> = {
        pizza: "/images/food/margherita.jpg",
        savory: "/images/food/savory-salmon.jpg",
        sweets: "/images/food/lava-cake.jpg",
        drinks: "/images/food/cola.jpg",
      };
      const newItem: MenuItem = {
        id: `dish-${Date.now().toString(36)}`,
        name: input.name.trim(),
        price: Math.max(1, Math.round(input.price)),
        category: input.category,
        image: input.image || defaultImageByCategory[input.category],
        sold: 0,
      };
      setMenuItems((prev) => [...prev, newItem]);
    },
    []
  );

  const updateMenuItem = useCallback(
    (
      id: string,
      patch: { name?: string; price?: number; category?: CategorySlug; image?: string }
    ) => {
      setMenuItems((prev) =>
        prev.map((item) =>
          item.id === id
            ? {
                ...item,
                name: patch.name !== undefined ? patch.name.trim() : item.name,
                price: patch.price !== undefined ? Math.max(1, Math.round(patch.price)) : item.price,
                category: patch.category ?? item.category,
                image: patch.image ?? item.image,
              }
            : item
        )
      );
      // Sync updated price/name to active cart items cleanly
      setTables((prev) =>
        prev.map((table) => ({
          ...table,
          items: table.items.map((line) =>
            line.menuItemId === id
              ? {
                  ...line,
                  name: patch.name !== undefined ? patch.name.trim() : line.name,
                  unitPrice:
                    patch.price !== undefined ? Math.max(1, Math.round(patch.price)) : line.unitPrice,
                  lineTotalOverride: undefined,
                }
              : line
          ),
        }))
      );
    },
    []
  );

  const selectedTable = useMemo(() => {
    return tables.find((t) => t.id === selectedTableId) ?? tables[0];
  }, [tables, selectedTableId]);

  const value: DemoStoreContextValue = {
    menuItems,
    cart,
    cartItems,
    cartCount,
    cartTotal,
    assignedTableNumber,
    tables,
    selectedTableId,
    selectedTable,
    orderHistory,
    extraRevenue,
    extraOrdersCount,
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
    addMenuItem,
    updateMenuItem,
    getLineTotal,
    getTableTotal,
  };

  return <DemoStoreContext.Provider value={value}>{children}</DemoStoreContext.Provider>;
}

export function useDemoStore() {
  const ctx = useContext(DemoStoreContext);
  if (!ctx) {
    throw new Error("useDemoStore must be used inside DemoStoreProvider");
  }
  return ctx;
}
