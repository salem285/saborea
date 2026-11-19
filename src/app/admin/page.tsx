"use client";

import React, { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import QRCode from "qrcode";
import {
  BarChart3,
  Check,
  ClipboardList,
  Copy,
  FolderPlus,
  Home,
  LogOut,
  Pencil,
  Plus,
  Printer,
  QrCode,
  Trash2,
  TrendingUp,
  Utensils,
  X,
} from "lucide-react";
import {
  type CategoryInfo,
  type CategorySlug,
  type MenuItem,
  type TimeRange,
  useDemoStore,
} from "@/context/DemoStoreProvider";
import {
  BotanicalSprig,
  SaboreaCanvasBackground,
  SaboreaLogo,
} from "@/components/SaboreaGraphics";

type AdminTab = "Overview" | "Menu" | "QR" | "Orders";

const PRESET_IMAGES = [
  { label: "Margherita Pizza", url: "/images/food/margherita.jpg" },
  { label: "Pepperoni Pizza", url: "/images/food/pepperoni.jpg" },
  { label: "Herb Salmon", url: "/images/food/savory-salmon.jpg" },
  { label: "Truffle Pasta", url: "/images/food/truffle-pasta.jpg" },
  { label: "Molten Lava Cake", url: "/images/food/lava-cake.jpg" },
  { label: "Classic Tiramisu", url: "/images/food/tiramisu.jpg" },
  { label: "Iced Cola", url: "/images/food/cola.jpg" },
  { label: "Lemon Mint", url: "/images/food/lemon-mint.jpg" },
];

export default function AdminDashboardPage() {
  const router = useRouter();
  const {
    categories,
    menuItems,
    tables,
    orderHistory,
    addTable,
    addCategory,
    updateCategory,
    deleteCategory,
    addMenuItem,
    updateMenuItem,
    deleteMenuItem,
  } = useDemoStore();

  const [timeRange, setTimeRange] = useState<TimeRange>("Today");
  const [activeTab, setActiveTab] = useState<AdminTab>("Overview");
  const [menuCategoryFilter, setMenuCategoryFilter] = useState<
    CategorySlug | "all"
  >("all");

  // Dish Add / Edit Modal state
  const [dishModalOpen, setDishModalOpen] = useState(false);
  const [editingDish, setEditingDish] = useState<MenuItem | null>(null);
  const [dishName, setDishName] = useState("");
  const [dishPrice, setDishPrice] = useState("");
  const [dishCategory, setDishCategory] = useState<CategorySlug>("pizza");
  const [dishImage, setDishImage] = useState("/images/food/margherita.jpg");

  // Category Add / Edit Modal state
  const [categoryModalOpen, setCategoryModalOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<CategoryInfo | null>(
    null
  );
  const [catLabel, setCatLabel] = useState("");
  const [catImage, setCatImage] = useState("/images/food/margherita.jpg");

  // Encrypted Table QR state
  const [tableTokens, setTableTokens] = useState<Record<string, string>>({});
  const [qrDataUrls, setQrDataUrls] = useState<Record<string, string>>({});
  const [copiedTableId, setCopiedTableId] = useState<string | null>(null);
  const [printQrTable, setPrintQrTable] = useState<{
    number: string;
    url: string;
    qrDataUrl: string;
  } | null>(null);
  const [addingTable, setAddingTable] = useState(false);

  const handleLogout = async () => {
    await fetch("/api/auth/logout", { method: "POST" });
    router.replace("/login?role=admin");
    router.refresh();
  };

  // Real Revenue & Orders filtered by Today / Month / Year from Supabase orders
  const filteredOrdersByRange = useMemo(() => {
    const now = new Date();
    return orderHistory.filter((ord) => {
      const d = new Date(ord.createdAtIso);
      if (Number.isNaN(d.getTime())) return true;
      if (timeRange === "Today") {
        return (
          d.getFullYear() === now.getFullYear() &&
          d.getMonth() === now.getMonth() &&
          d.getDate() === now.getDate()
        );
      }
      if (timeRange === "Month") {
        return (
          d.getFullYear() === now.getFullYear() &&
          d.getMonth() === now.getMonth()
        );
      }
      return d.getFullYear() === now.getFullYear();
    });
  }, [orderHistory, timeRange]);

  const displayRevenue = useMemo(
    () => filteredOrdersByRange.reduce((sum, ord) => sum + ord.total, 0),
    [filteredOrdersByRange]
  );

  const displayOrders = filteredOrdersByRange.length;

  const revenueLabel =
    timeRange === "Today"
      ? "Revenue today"
      : timeRange === "Month"
        ? "Revenue month"
        : "Revenue year";

  // Sales Chart buckets computed from real orders in Supabase
  const salesChartData = useMemo(() => {
    const now = new Date();

    if (timeRange === "Year") {
      const monthNames = [
        "Jan",
        "Feb",
        "Mar",
        "Apr",
        "May",
        "Jun",
        "Jul",
        "Aug",
        "Sep",
        "Oct",
        "Nov",
        "Dec",
      ];
      const currentMonth = now.getMonth();
      const startMonth = Math.max(0, currentMonth - 5);
      const buckets: Array<{ label: string; value: number }> = [];

      for (let m = startMonth; m <= currentMonth; m++) {
        const val = orderHistory
          .filter((o) => {
            const d = new Date(o.createdAtIso);
            return (
              !Number.isNaN(d.getTime()) &&
              d.getFullYear() === now.getFullYear() &&
              d.getMonth() === m
            );
          })
          .reduce((s, o) => s + o.total, 0);
        buckets.push({ label: monthNames[m], value: val });
      }
      return buckets;
    }

    // For Today & Month: show last 7 days ending today
    const buckets: Array<{ label: string; value: number }> = [];
    for (let i = 6; i >= 0; i--) {
      const day = new Date(
        now.getFullYear(),
        now.getMonth(),
        now.getDate() - i
      );
      const label = day.toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
      });
      const val = orderHistory
        .filter((o) => {
          const d = new Date(o.createdAtIso);
          return (
            !Number.isNaN(d.getTime()) &&
            d.getFullYear() === day.getFullYear() &&
            d.getMonth() === day.getMonth() &&
            d.getDate() === day.getDate()
          );
        })
        .reduce((s, o) => s + o.total, 0);
      buckets.push({ label, value: val });
    }
    return buckets;
  }, [orderHistory, timeRange]);

  const maxChartValue = Math.max(
    1,
    ...salesChartData.map((b) => b.value)
  );

  // Top sellers sorted strictly by actual sold quantities
  const topSellers = useMemo(() => {
    return [...menuItems]
      .sort((a, b) => b.sold - a.sold)
      .slice(0, 5);
  }, [menuItems]);

  const maxSold = Math.max(1, topSellers[0]?.sold ?? 1);

  const filteredMenu = useMemo(() => {
    if (menuCategoryFilter === "all") return menuItems;
    return menuItems.filter((i) => i.category === menuCategoryFilter);
  }, [menuItems, menuCategoryFilter]);

  // Generate signed QR tokens & QR images whenever tables change
  useEffect(() => {
    if (tables.length === 0) return;

    let cancelled = false;
    async function loadTokensAndQr() {
      try {
        const res = await fetch("/api/admin/qr-tokens", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            tables: tables.map((t) => ({ id: t.id, number: t.number })),
          }),
        });
        if (!res.ok) return;
        const data = (await res.json()) as { tokens?: Record<string, string> };
        const tokens = data.tokens ?? {};
        if (cancelled) return;
        setTableTokens(tokens);

        const origin = window.location.origin;
        const qrEntries = await Promise.all(
          Object.entries(tokens).map(async ([tableId, token]) => {
            const fullUrl = `${origin}/?t=${encodeURIComponent(token)}`;
            const dataUrl = await QRCode.toDataURL(fullUrl, {
              width: 240,
              margin: 1,
              color: {
                dark: "#231F1E",
                light: "#FDFBF7",
              },
            });
            return [tableId, dataUrl] as const;
          })
        );

        if (!cancelled) {
          setQrDataUrls(Object.fromEntries(qrEntries));
        }
      } catch (err) {
        console.warn("Failed to generate QR codes:", err);
      }
    }

    void loadTokensAndQr();
    return () => {
      cancelled = true;
    };
  }, [tables]);

  // Dish handlers
  const openAddDish = () => {
    setEditingDish(null);
    setDishName("");
    setDishPrice("");
    const defaultCat =
      menuCategoryFilter !== "all"
        ? menuCategoryFilter
        : categories[0]?.slug ?? "pizza";
    setDishCategory(defaultCat);
    const catObj = categories.find((c) => c.slug === defaultCat);
    setDishImage(catObj?.image || "/images/food/margherita.jpg");
    setDishModalOpen(true);
  };

  const openEditDish = (dish: MenuItem) => {
    setEditingDish(dish);
    setDishName(dish.name);
    setDishPrice(String(dish.price));
    setDishCategory(dish.category);
    setDishImage(dish.image);
    setDishModalOpen(true);
  };

  const handleSaveDish = async (e: React.FormEvent) => {
    e.preventDefault();
    const numericPrice = Number(dishPrice);
    if (!dishName.trim() || Number.isNaN(numericPrice) || numericPrice <= 0)
      return;

    if (editingDish) {
      await updateMenuItem(editingDish.id, {
        name: dishName,
        price: numericPrice,
        category: dishCategory,
        image: dishImage,
      });
    } else {
      await addMenuItem({
        name: dishName,
        price: numericPrice,
        category: dishCategory,
        image: dishImage,
      });
    }
    setDishModalOpen(false);
  };

  // Category handlers
  const openAddCategory = () => {
    setEditingCategory(null);
    setCatLabel("");
    setCatImage("/images/food/margherita.jpg");
    setCategoryModalOpen(true);
  };

  const openEditCategory = (cat: CategoryInfo) => {
    setEditingCategory(cat);
    setCatLabel(cat.label);
    setCatImage(cat.image);
    setCategoryModalOpen(true);
  };

  const handleSaveCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!catLabel.trim()) return;

    if (editingCategory) {
      await updateCategory(editingCategory.id, {
        label: catLabel,
        image: catImage,
      });
    } else {
      await addCategory({
        label: catLabel,
        image: catImage,
      });
    }
    setCategoryModalOpen(false);
  };

  const handleCopyQrLink = async (tableId: string) => {
    const token = tableTokens[tableId];
    if (!token) return;
    const url = `${window.location.origin}/?t=${encodeURIComponent(token)}`;
    await navigator.clipboard.writeText(url);
    setCopiedTableId(tableId);
    setTimeout(() => {
      setCopiedTableId((cur) => (cur === tableId ? null : cur));
    }, 2000);
  };

  const handleAddTable = async () => {
    if (addingTable) return;
    setAddingTable(true);
    await addTable();
    setAddingTable(false);
  };

  return (
    <div className="relative min-h-screen w-full overflow-x-hidden pb-28">
      <SaboreaCanvasBackground showTopLeaves />

      <main className="relative z-10 mx-auto w-full max-w-[460px] px-4 pt-4">
        {/* Top Bar: Centered Horizontal Logo + Logout Button */}
        <header className="relative flex items-center justify-between pt-1 pb-3">
          <SaboreaLogo variant="horizontal" size="sm" />
          <button
            type="button"
            onClick={handleLogout}
            title="تسجيل الخروج / Logout"
            className="rounded-full border border-[#DECBA4] bg-[#FDFBF7] px-3 py-1.5 inline-flex items-center gap-1.5 text-[12px] font-medium text-[#8B6A2B] hover:bg-[#F5EBD6] transition cursor-pointer"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span>Logout</span>
          </button>
        </header>

        {/* Title + Live Status Badge */}
        <section className="mt-1 flex items-end justify-between gap-2">
          <div>
            <h1 className="font-serif font-bold text-[30px] leading-tight text-[#231F1E]">
              Admin dashboard
            </h1>
            <div className="mt-1.5">
              <span className="inline-flex items-center gap-1.5 rounded-full bg-[#EFE5D2] px-3 py-0.5 text-[12px] font-medium text-[#5A524C]">
                <span className="w-2 h-2 rounded-full bg-[#6B8E6B]" />
                Live Supabase data
              </span>
            </div>
          </div>

          <button
            type="button"
            onClick={() => setActiveTab("QR")}
            className="rounded-full border border-[#BFA36F] bg-[#FDFBF7] px-3 py-1.5 text-[12px] font-medium text-[#8B6A2B] hover:bg-[#F5EBD6] inline-flex items-center gap-1.5 cursor-pointer"
          >
            <QrCode className="w-3.5 h-3.5" />
            <span>QR الطاولات</span>
          </button>
        </section>

        {/* Segmented Switcher: Today | Month | Year */}
        <div className="mt-4 rounded-full border border-[#DECBA4] bg-[#FDFBF7] p-1 grid grid-cols-3 shadow-[0_1px_4px_rgba(145,117,65,0.06)]">
          {(["Today", "Month", "Year"] as TimeRange[]).map((range) => {
            const active = timeRange === range;
            return (
              <button
                key={range}
                type="button"
                onClick={() => setTimeRange(range)}
                className={`rounded-full py-1.5 text-[14px] font-medium transition cursor-pointer ${
                  active
                    ? "saborea-gold-btn text-white"
                    : "text-[#231F1E] hover:bg-[#F5EBD6]/60"
                }`}
              >
                {range}
              </button>
            );
          })}
        </div>

        {/* OVERVIEW TAB */}
        {activeTab === "Overview" && (
          <div className="mt-4 space-y-4">
            {/* Two Stat Cards */}
            <div className="grid grid-cols-2 gap-3.5">
              {/* Revenue */}
              <div className="saborea-card rounded-[16px] p-4 flex items-center justify-between gap-2">
                <div>
                  <p className="text-[13.5px] font-serif text-[#231F1E]">
                    {revenueLabel}
                  </p>
                  <p className="mt-1 font-serif font-bold text-[22px] leading-tight text-[#231F1E]">
                    EGP {displayRevenue.toLocaleString()}
                  </p>
                </div>
                <div className="w-10 h-10 rounded-full bg-[#F2E8D5] flex items-center justify-center text-[#A98237] shrink-0">
                  <TrendingUp className="w-5 h-5 stroke-[1.9]" />
                </div>
              </div>

              {/* Orders */}
              <div className="saborea-card rounded-[16px] p-4 flex items-center justify-between gap-2">
                <div>
                  <p className="text-[13.5px] font-serif text-[#231F1E]">
                    Orders
                  </p>
                  <p className="mt-1 font-serif font-bold text-[25px] leading-tight text-[#231F1E]">
                    {displayOrders.toLocaleString()}
                  </p>
                </div>
                <div className="w-10 h-10 rounded-full bg-[#F2E8D5] flex items-center justify-center text-[#A98237] shrink-0">
                  <ClipboardList className="w-5 h-5 stroke-[1.8]" />
                </div>
              </div>
            </div>

            {/* Sales Chart Card */}
            <section className="saborea-card rounded-[18px] p-4 relative overflow-hidden">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <BarChart3 className="w-4 h-4 text-[#9E7A38]" />
                  <h2 className="font-serif font-semibold text-[19px] text-[#231F1E]">
                    Sales report ({timeRange})
                  </h2>
                </div>
                <span className="text-[12px] font-medium text-[#9E7A38]">
                  EGP {displayRevenue.toLocaleString()}
                </span>
              </div>

              <div className="mt-4 h-[132px] flex items-end justify-between gap-2 pt-5 px-1 border-b border-[#E6D8BE]">
                {salesChartData.map((bucket) => {
                  const heightPct =
                    bucket.value > 0
                      ? Math.max(
                          12,
                          Math.round((bucket.value / maxChartValue) * 100)
                        )
                      : 4;
                  return (
                    <div
                      key={bucket.label}
                      className="flex-1 flex flex-col items-center justify-end h-full group"
                    >
                      <span className="text-[10px] font-medium text-[#8B6A2B] mb-1 opacity-85">
                        {bucket.value > 0 ? bucket.value.toLocaleString() : "0"}
                      </span>
                      <div
                        className="w-full max-w-[30px] rounded-t-[6px] transition-all duration-300"
                        style={{
                          height: `${heightPct}%`,
                          background:
                            bucket.value > 0
                              ? "linear-gradient(180deg, #D5B163 0%, #AD802E 100%)"
                              : "#EAE0CE",
                        }}
                      />
                    </div>
                  );
                })}
              </div>
              <div className="mt-2 flex items-center justify-between gap-2 px-1">
                {salesChartData.map((bucket) => (
                  <span
                    key={`lbl-${bucket.label}`}
                    className="flex-1 text-center text-[10.5px] text-[#6E655F] truncate"
                  >
                    {bucket.label}
                  </span>
                ))}
              </div>
            </section>

            {/* Top Sellers Card */}
            <section className="saborea-card rounded-[18px] p-4 relative overflow-hidden">
              <BotanicalSprig
                className="pointer-events-none absolute -top-2 -right-2 w-20 h-14 opacity-70"
                flip
              />

              <h2 className="font-serif font-semibold text-[20px] text-[#231F1E]">
                Top sellers
              </h2>

              <div className="mt-3 space-y-3.5">
                {topSellers.map((item) => {
                  const pct =
                    item.sold > 0
                      ? Math.min(
                          95,
                          Math.max(
                            14,
                            Math.round((item.sold / (maxSold * 1.15)) * 100)
                          )
                        )
                      : 6;

                  return (
                    <div key={item.id} className="flex items-center gap-3">
                      <div className="w-12 h-12 rounded-full border border-[#DECBA4] overflow-hidden bg-[#F3ECE0] shrink-0">
                        <img
                          src={item.image}
                          alt={item.name}
                          className="w-full h-full object-cover"
                        />
                      </div>

                      <div className="flex-1 min-w-0">
                        <div className="flex items-baseline justify-between gap-2">
                          <span className="font-serif text-[16px] text-[#231F1E] truncate">
                            {item.name}
                          </span>
                          <span className="text-[13px] font-medium text-[#231F1E] shrink-0">
                            {item.sold} sold
                          </span>
                        </div>
                        <div className="mt-1.5 h-[6px] w-full rounded-full bg-[#EFE6D5] overflow-hidden">
                          <div
                            className="h-full rounded-full"
                            style={{
                              width: `${pct}%`,
                              background:
                                "linear-gradient(90deg, #C0943E 0%, #D6B469 100%)",
                            }}
                          />
                        </div>
                      </div>
                    </div>
                  );
                })}

                {topSellers.length === 0 && (
                  <p className="text-[13.5px] text-[#6E655F] text-center py-4">
                    No dishes recorded yet.
                  </p>
                )}
              </div>
            </section>

            {/* Quick Menu & Categories Management Card */}
            <section className="saborea-card rounded-[18px] p-4 relative overflow-hidden">
              <div className="flex items-center justify-between gap-2 relative">
                <div>
                  <h2 className="font-serif font-semibold text-[20px] text-[#231F1E]">
                    Menu management
                  </h2>
                  <p className="text-[12px] text-[#6E655F]">
                    {categories.length} categories · {menuItems.length} dishes
                  </p>
                </div>

                <div className="flex items-center gap-1.5">
                  <button
                    type="button"
                    onClick={openAddCategory}
                    className="rounded-[8px] border border-[#BFA36F] bg-[#FDFBF7] px-2.5 py-1.5 text-[12px] font-medium text-[#8B6A2B] hover:bg-[#F5EBD6] inline-flex items-center gap-1 cursor-pointer"
                  >
                    <FolderPlus className="w-3.5 h-3.5" />
                    <span>+ Category</span>
                  </button>
                  <button
                    type="button"
                    onClick={openAddDish}
                    className="saborea-gold-btn rounded-[8px] px-3 py-1.5 text-[12.5px] font-medium text-white inline-flex items-center gap-1 shrink-0 cursor-pointer"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Add dish</span>
                  </button>
                </div>
              </div>

              <div className="mt-3 space-y-2.5">
                {menuItems.slice(0, 4).map((dish) => (
                  <div
                    key={dish.id}
                    className="rounded-[12px] border border-[#E5D7BE] bg-[#FDFBF7] px-3 py-2 flex items-center justify-between gap-2.5"
                  >
                    <div className="flex items-center gap-2.5 min-w-0 flex-1">
                      <img
                        src={dish.image}
                        alt={dish.name}
                        className="w-9 h-9 rounded-full object-cover border border-[#DECBA4] shrink-0"
                      />
                      <span className="font-serif text-[15px] text-[#231F1E] truncate">
                        {dish.name}
                      </span>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      <span className="text-[13.5px] font-medium text-[#231F1E]">
                        EGP {dish.price}
                      </span>
                      <button
                        type="button"
                        onClick={() => openEditDish(dish)}
                        className="rounded-[8px] border border-[#DECBA4] bg-[#FDFBF7] px-2.5 py-1 text-[12px] font-medium text-[#6E655F] hover:bg-[#F5EBD6] inline-flex items-center gap-1 transition cursor-pointer"
                      >
                        <Pencil className="w-3 h-3 text-[#9E7A38]" />
                        <span>Edit</span>
                      </button>
                    </div>
                  </div>
                ))}
              </div>

              <button
                type="button"
                onClick={() => setActiveTab("Menu")}
                className="mt-3 w-full text-center text-[13px] font-medium text-[#9E7A38] hover:underline cursor-pointer"
              >
                Manage all {categories.length} categories &amp;{" "}
                {menuItems.length} dishes →
              </button>
            </section>
          </div>
        )}

        {/* MENU & CATEGORIES TAB */}
        {activeTab === "Menu" && (
          <div className="mt-4 space-y-4">
            {/* Categories CRUD Section */}
            <section className="saborea-card rounded-[18px] p-4 space-y-3">
              <div className="flex items-center justify-between gap-2">
                <div>
                  <h2 className="font-serif font-semibold text-[20px] text-[#231F1E]">
                    Menu Categories ({categories.length})
                  </h2>
                  <p className="text-[12px] text-[#6E655F]">
                    Add, edit, or delete main carousel categories
                  </p>
                </div>
                <button
                  type="button"
                  onClick={openAddCategory}
                  className="saborea-gold-btn rounded-[8px] px-3 py-1.5 text-[12.5px] font-medium text-white inline-flex items-center gap-1 cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Add category</span>
                </button>
              </div>

              <div className="space-y-2 max-h-[240px] overflow-y-auto pr-1">
                {categories.map((cat) => (
                  <div
                    key={cat.id || cat.slug}
                    className="rounded-[12px] border border-[#E5D7BE] bg-[#FDFBF7] px-3 py-2 flex items-center justify-between gap-2"
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <img
                        src={cat.image}
                        alt={cat.label}
                        className="w-9 h-9 rounded-full object-cover border border-[#DECBA4] shrink-0"
                      />
                      <div className="min-w-0">
                        <p className="font-serif text-[15px] text-[#231F1E] truncate">
                          {cat.label}
                        </p>
                        <p className="text-[11px] text-[#6E655F]">
                          /menu/{cat.slug}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-1.5 shrink-0">
                      <button
                        type="button"
                        onClick={() => openEditCategory(cat)}
                        className="rounded-[8px] border border-[#DECBA4] bg-[#FDFBF7] px-2.5 py-1 text-[12px] font-medium text-[#6E655F] hover:bg-[#F5EBD6] inline-flex items-center gap-1 cursor-pointer"
                      >
                        <Pencil className="w-3 h-3 text-[#9E7A38]" />
                        <span>Edit</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => deleteCategory(cat.id)}
                        title="Delete category"
                        className="rounded-[8px] border border-[#E6C5C5] bg-[#FDF7F7] p-1.5 text-[#A63A3A] hover:bg-[#F9E6E6] cursor-pointer"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </section>

            {/* Dishes CRUD Section */}
            <section className="saborea-card rounded-[18px] p-4 space-y-3.5">
              <div className="flex items-center justify-between gap-2">
                <h2 className="font-serif font-semibold text-[20px] text-[#231F1E]">
                  Dishes ({filteredMenu.length})
                </h2>
                <button
                  type="button"
                  onClick={openAddDish}
                  className="saborea-gold-btn rounded-[8px] px-3 py-1.5 text-[12.5px] font-medium text-white inline-flex items-center gap-1 cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Add dish</span>
                </button>
              </div>

              {/* Category filter pills */}
              <div className="flex gap-1.5 overflow-x-auto no-scrollbar pb-1">
                <button
                  type="button"
                  onClick={() => setMenuCategoryFilter("all")}
                  className={`px-3 py-1 rounded-full text-[12px] font-medium border transition cursor-pointer shrink-0 ${
                    menuCategoryFilter === "all"
                      ? "bg-[#EFE5D2] border-[#C49A45] text-[#8B6A2B]"
                      : "border-[#E5D7BE] text-[#6E655F] hover:bg-[#F7EFE0]"
                  }`}
                >
                  All
                </button>
                {categories.map((cat) => (
                  <button
                    key={cat.id || cat.slug}
                    type="button"
                    onClick={() => setMenuCategoryFilter(cat.slug)}
                    className={`px-3 py-1 rounded-full text-[12px] font-medium border transition cursor-pointer shrink-0 ${
                      menuCategoryFilter === cat.slug
                        ? "bg-[#EFE5D2] border-[#C49A45] text-[#8B6A2B]"
                        : "border-[#E5D7BE] text-[#6E655F] hover:bg-[#F7EFE0]"
                    }`}
                  >
                    {cat.label}
                  </button>
                ))}
              </div>

              <div className="space-y-2.5">
                {filteredMenu.map((dish) => (
                  <div
                    key={dish.id}
                    className="rounded-[12px] border border-[#E5D7BE] bg-[#FDFBF7] px-3 py-2 flex items-center justify-between gap-2.5"
                  >
                    <div className="flex items-center gap-2.5 min-w-0 flex-1">
                      <img
                        src={dish.image}
                        alt={dish.name}
                        className="w-10 h-10 rounded-full object-cover border border-[#DECBA4] shrink-0"
                      />
                      <div className="min-w-0">
                        <p className="font-serif text-[15px] text-[#231F1E] truncate">
                          {dish.name}
                        </p>
                        <p className="text-[11px] capitalize text-[#6E655F]">
                          {dish.category} · {dish.sold} sold
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      <span className="text-[13.5px] font-medium text-[#231F1E]">
                        EGP {dish.price}
                      </span>
                      <button
                        type="button"
                        onClick={() => openEditDish(dish)}
                        className="rounded-[8px] border border-[#DECBA4] bg-[#FDFBF7] px-2.5 py-1 text-[12px] font-medium text-[#6E655F] hover:bg-[#F5EBD6] inline-flex items-center gap-1 cursor-pointer"
                      >
                        <Pencil className="w-3 h-3 text-[#9E7A38]" />
                        <span>Edit</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => deleteMenuItem(dish.id)}
                        title="Delete dish"
                        className="rounded-[8px] border border-[#E6C5C5] bg-[#FDF7F7] p-1.5 text-[#A63A3A] hover:bg-[#F9E6E6] cursor-pointer"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                ))}

                {filteredMenu.length === 0 && (
                  <p className="text-center text-[13.5px] text-[#6E655F] py-6">
                    No dishes in this category yet.
                  </p>
                )}
              </div>
            </section>
          </div>
        )}

        {/* QR CODES GENERATOR TAB */}
        {activeTab === "QR" && (
          <section className="mt-4 space-y-3.5">
            <div className="saborea-card rounded-[18px] p-4 flex items-center justify-between gap-2">
              <div>
                <h2 className="font-serif font-semibold text-[20px] text-[#231F1E]">
                  Table QR Generator ({tables.length})
                </h2>
                <p className="text-[12px] text-[#6E655F]">
                  Signed encrypted QR links lock each guest to their table
                </p>
              </div>
              <button
                type="button"
                disabled={addingTable}
                onClick={handleAddTable}
                className="saborea-gold-btn rounded-[8px] px-3 py-1.5 text-[12.5px] font-medium text-white inline-flex items-center gap-1 shrink-0 cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>{addingTable ? "Adding..." : "Add Table"}</span>
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
              {tables.map((tbl) => {
                const token = tableTokens[tbl.id];
                const qrUrl = qrDataUrls[tbl.id];
                const fullLink =
                  typeof window !== "undefined" && token
                    ? `${window.location.origin}/?t=${encodeURIComponent(token)}`
                    : "";

                return (
                  <div
                    key={tbl.id}
                    className="saborea-card rounded-[16px] p-4 flex flex-col items-center text-center"
                  >
                    <h3 className="font-serif font-semibold text-[20px] text-[#231F1E]">
                      {tbl.number}
                    </h3>
                    <span className="text-[11px] text-[#6E655F]">
                      Encrypted QR Token
                    </span>

                    <div className="mt-3 w-36 h-36 rounded-[12px] border border-[#DECBA4] bg-[#FDFBF7] p-2 flex items-center justify-center">
                      {qrUrl ? (
                        <img
                          src={qrUrl}
                          alt={`QR for ${tbl.number}`}
                          className="w-full h-full object-contain"
                        />
                      ) : (
                        <span className="text-[12px] text-[#6E655F]">
                          Generating...
                        </span>
                      )}
                    </div>

                    <div className="mt-3 w-full flex gap-2">
                      <button
                        type="button"
                        onClick={() => handleCopyQrLink(tbl.id)}
                        className="flex-1 rounded-[8px] border border-[#DECBA4] bg-[#FDFBF7] py-1.5 px-2 text-[12px] font-medium text-[#7D5E24] hover:bg-[#F5EBD6] inline-flex items-center justify-center gap-1 cursor-pointer"
                      >
                        {copiedTableId === tbl.id ? (
                          <>
                            <Check className="w-3.5 h-3.5 text-[#6B8E6B]" />
                            <span>Copied</span>
                          </>
                        ) : (
                          <>
                            <Copy className="w-3.5 h-3.5" />
                            <span>Copy Link</span>
                          </>
                        )}
                      </button>

                      <button
                        type="button"
                        disabled={!qrUrl}
                        onClick={() =>
                          setPrintQrTable({
                            number: tbl.number,
                            url: fullLink,
                            qrDataUrl: qrUrl,
                          })
                        }
                        className="rounded-[8px] saborea-gold-btn py-1.5 px-3 text-[12px] font-medium text-white inline-flex items-center justify-center gap-1 cursor-pointer"
                      >
                        <Printer className="w-3.5 h-3.5" />
                        <span>Print</span>
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </section>
        )}

        {/* ORDERS TAB */}
        {activeTab === "Orders" && (
          <section className="mt-4 space-y-3">
            <div className="flex items-center justify-between px-1">
              <h2 className="font-serif font-semibold text-[21px] text-[#231F1E]">
                Live &amp; Completed Orders
              </h2>
              <span className="text-[12px] text-[#6E655F]">
                {orderHistory.length} total
              </span>
            </div>

            {orderHistory.map((ord) => {
              const badgeStyle =
                ord.status === "Preparing"
                  ? "bg-[#F7EEDB] text-[#9E7A38] border-[#DFC793]"
                  : ord.status === "Ready"
                    ? "bg-[#EBF1F6] text-[#4A779D] border-[#BDD0DF]"
                    : "bg-[#EEF2EA] text-[#5B7B5B] border-[#C9D6BF]";

              return (
                <article
                  key={ord.id}
                  className="saborea-card rounded-[16px] p-4 space-y-2.5"
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <span className="font-serif font-semibold text-[18px] text-[#231F1E]">
                        {ord.tableNumber}
                      </span>
                      <span className="ml-2 text-[12px] text-[#6E655F]">
                        {ord.createdAt}
                      </span>
                    </div>
                    <span
                      className={`rounded-full border px-2.5 py-0.5 text-[11.5px] font-medium ${badgeStyle}`}
                    >
                      {ord.status}
                    </span>
                  </div>

                  <div className="border-t border-[#EFE5D2] pt-2 space-y-1 text-[13px]">
                    {ord.items.map((line) => (
                      <div
                        key={`${ord.id}-${line.menuItemId}`}
                        className="flex items-center justify-between text-[#4E4640]"
                      >
                        <span>
                          {line.name} × {line.quantity}
                        </span>
                        <span>
                          EGP {(line.unitPrice * line.quantity).toLocaleString()}
                        </span>
                      </div>
                    ))}
                  </div>

                  <div className="border-t border-[#EFE5D2] pt-2 flex items-center justify-between">
                    <span className="text-[12.5px] text-[#6E655F]">
                      Order total
                    </span>
                    <span className="font-serif font-semibold text-[16px] text-[#9E7A38]">
                      EGP {ord.total.toLocaleString()}
                    </span>
                  </div>
                </article>
              );
            })}

            {orderHistory.length === 0 && (
              <div className="saborea-card rounded-[16px] p-8 text-center text-[14px] text-[#6E655F]">
                No orders recorded in database yet.
              </div>
            )}
          </section>
        )}
      </main>

      {/* Fixed Bottom Navigation Bar */}
      <nav
        aria-label="Admin Navigation"
        className="fixed bottom-3 left-0 right-0 z-40 px-4 pointer-events-none no-print"
      >
        <div className="mx-auto max-w-[430px] pointer-events-auto rounded-[16px] bg-[#FDFBF7]/95 backdrop-blur-md border border-[#DECBA4] shadow-[0_6px_20px_rgba(88,65,24,0.12)] p-1.5 grid grid-cols-4 gap-1">
          {(
            [
              { id: "Overview", label: "Overview", icon: Home },
              { id: "Menu", label: "Menu", icon: Utensils },
              { id: "QR", label: "QR Codes", icon: QrCode },
              { id: "Orders", label: "Orders", icon: ClipboardList },
            ] as const
          ).map(({ id, label, icon: Icon }) => {
            const active = activeTab === id;
            return (
              <button
                key={id}
                type="button"
                onClick={() => setActiveTab(id)}
                className={`rounded-[11px] py-2 px-2 flex items-center justify-center gap-1.5 text-[13px] transition cursor-pointer ${
                  active
                    ? "bg-[#F3E7D0] text-[#7D5E24] font-medium"
                    : "text-[#3E3733] hover:bg-[#FAF6EE]"
                }`}
              >
                <Icon
                  className={`w-4 h-4 shrink-0 ${
                    active ? "text-[#9E7A38]" : "text-[#4E4640]"
                  }`}
                />
                <span className="truncate">{label}</span>
              </button>
            );
          })}
        </div>
      </nav>

      {/* Add / Edit Dish Modal */}
      {dishModalOpen && (
        <div className="fixed inset-0 z-50 bg-[#231F1E]/35 backdrop-blur-[2px] flex items-center justify-center p-4">
          <form
            onSubmit={handleSaveDish}
            className="saborea-card w-full max-w-[390px] rounded-[20px] p-5 sm:p-6 relative"
          >
            <button
              type="button"
              onClick={() => setDishModalOpen(false)}
              className="absolute top-4 right-4 p-1.5 rounded-full text-[#6E655F] hover:bg-[#F3ECE0] cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>

            <p className="text-[11px] uppercase tracking-wider text-[#9E7A38] font-medium">
              Menu management
            </p>
            <h3 className="mt-1 font-serif font-semibold text-[23px] text-[#231F1E]">
              {editingDish ? "Edit dish" : "Add new dish"}
            </h3>

            <div className="mt-4 space-y-3.5">
              <div>
                <label className="block text-[12.5px] font-medium text-[#4E4640] mb-1">
                  Dish name
                </label>
                <input
                  type="text"
                  required
                  value={dishName}
                  onChange={(e) => setDishName(e.target.value)}
                  placeholder="e.g. Quattro Formaggi"
                  className="w-full rounded-[10px] border border-[#DECBA4] bg-white px-3.5 py-2 text-[14px] text-[#231F1E] focus:outline-none focus:border-[#B58938]"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[12.5px] font-medium text-[#4E4640] mb-1">
                    Price (EGP)
                  </label>
                  <input
                    type="number"
                    min={1}
                    required
                    value={dishPrice}
                    onChange={(e) => setDishPrice(e.target.value)}
                    placeholder="280"
                    className="w-full rounded-[10px] border border-[#DECBA4] bg-white px-3.5 py-2 text-[14px] text-[#231F1E] focus:outline-none focus:border-[#B58938]"
                  />
                </div>

                <div>
                  <label className="block text-[12.5px] font-medium text-[#4E4640] mb-1">
                    Category
                  </label>
                  <select
                    value={dishCategory}
                    onChange={(e) => setDishCategory(e.target.value)}
                    className="w-full rounded-[10px] border border-[#DECBA4] bg-white px-3 py-2 text-[14px] text-[#231F1E] focus:outline-none focus:border-[#B58938]"
                  >
                    {categories.map((cat) => (
                      <option key={cat.id || cat.slug} value={cat.slug}>
                        {cat.label}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-[12.5px] font-medium text-[#4E4640] mb-1">
                  Dish image URL
                </label>
                <input
                  type="text"
                  required
                  value={dishImage}
                  onChange={(e) => setDishImage(e.target.value)}
                  placeholder="/images/food/margherita.jpg"
                  className="w-full rounded-[10px] border border-[#DECBA4] bg-white px-3.5 py-2 text-[13px] text-[#231F1E] focus:outline-none focus:border-[#B58938]"
                />
                <div className="mt-2 flex gap-1.5 overflow-x-auto no-scrollbar pb-1">
                  {PRESET_IMAGES.map((preset) => (
                    <button
                      key={preset.url}
                      type="button"
                      onClick={() => setDishImage(preset.url)}
                      className={`w-9 h-9 rounded-full overflow-hidden border-2 shrink-0 cursor-pointer ${
                        dishImage === preset.url
                          ? "border-[#B58938]"
                          : "border-transparent opacity-70 hover:opacity-100"
                      }`}
                      title={preset.label}
                    >
                      <img
                        src={preset.url}
                        alt={preset.label}
                        className="w-full h-full object-cover"
                      />
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <div className="mt-6 flex gap-2.5">
              <button
                type="submit"
                className="saborea-gold-btn flex-1 rounded-[10px] py-2.5 font-serif text-[16px] font-medium text-white cursor-pointer"
              >
                {editingDish ? "Save changes" : "Add dish"}
              </button>
              <button
                type="button"
                onClick={() => setDishModalOpen(false)}
                className="px-4 rounded-[10px] border border-[#DECBA4] text-[13.5px] text-[#6E655F] hover:bg-[#F3ECE0] cursor-pointer"
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Add / Edit Category Modal */}
      {categoryModalOpen && (
        <div className="fixed inset-0 z-50 bg-[#231F1E]/35 backdrop-blur-[2px] flex items-center justify-center p-4">
          <form
            onSubmit={handleSaveCategory}
            className="saborea-card w-full max-w-[390px] rounded-[20px] p-5 sm:p-6 relative"
          >
            <button
              type="button"
              onClick={() => setCategoryModalOpen(false)}
              className="absolute top-4 right-4 p-1.5 rounded-full text-[#6E655F] hover:bg-[#F3ECE0] cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>

            <p className="text-[11px] uppercase tracking-wider text-[#9E7A38] font-medium">
              Category management
            </p>
            <h3 className="mt-1 font-serif font-semibold text-[23px] text-[#231F1E]">
              {editingCategory ? "Edit category" : "Add new category"}
            </h3>

            <div className="mt-4 space-y-3.5">
              <div>
                <label className="block text-[12.5px] font-medium text-[#4E4640] mb-1">
                  Category name
                </label>
                <input
                  type="text"
                  required
                  value={catLabel}
                  onChange={(e) => setCatLabel(e.target.value)}
                  placeholder="e.g. Appetizers, Pasta, Grills, Desserts..."
                  className="w-full rounded-[10px] border border-[#DECBA4] bg-white px-3.5 py-2 text-[14px] text-[#231F1E] focus:outline-none focus:border-[#B58938]"
                />
              </div>

              <div>
                <label className="block text-[12.5px] font-medium text-[#4E4640] mb-1">
                  Category image URL
                </label>
                <input
                  type="text"
                  required
                  value={catImage}
                  onChange={(e) => setCatImage(e.target.value)}
                  placeholder="/images/food/margherita.jpg"
                  className="w-full rounded-[10px] border border-[#DECBA4] bg-white px-3.5 py-2 text-[13px] text-[#231F1E] focus:outline-none focus:border-[#B58938]"
                />
                <div className="mt-2 flex gap-1.5 overflow-x-auto no-scrollbar pb-1">
                  {PRESET_IMAGES.map((preset) => (
                    <button
                      key={preset.url}
                      type="button"
                      onClick={() => setCatImage(preset.url)}
                      className={`w-9 h-9 rounded-full overflow-hidden border-2 shrink-0 cursor-pointer ${
                        catImage === preset.url
                          ? "border-[#B58938]"
                          : "border-transparent opacity-70 hover:opacity-100"
                      }`}
                      title={preset.label}
                    >
                      <img
                        src={preset.url}
                        alt={preset.label}
                        className="w-full h-full object-cover"
                      />
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <div className="mt-6 flex gap-2.5">
              <button
                type="submit"
                className="saborea-gold-btn flex-1 rounded-[10px] py-2.5 font-serif text-[16px] font-medium text-white cursor-pointer"
              >
                {editingCategory ? "Save category" : "Add category"}
              </button>
              <button
                type="button"
                onClick={() => setCategoryModalOpen(false)}
                className="px-4 rounded-[10px] border border-[#DECBA4] text-[13.5px] text-[#6E655F] hover:bg-[#F3ECE0] cursor-pointer"
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Printable Table QR Modal */}
      {printQrTable && (
        <div className="fixed inset-0 z-50 bg-[#231F1E]/35 backdrop-blur-[2px] flex items-center justify-center p-4">
          <div className="saborea-card w-full max-w-[340px] rounded-[20px] p-6 text-center relative">
            <button
              type="button"
              onClick={() => setPrintQrTable(null)}
              className="absolute top-4 right-4 p-1.5 rounded-full text-[#6E655F] hover:bg-[#F3ECE0] cursor-pointer no-print"
            >
              <X className="w-4 h-4" />
            </button>

            <SaboreaLogo variant="stacked" size="sm" />
            <p className="mt-1 text-[12px] text-[#6E655F]">
              Scan to explore our menu &amp; order from your table
            </p>

            <div className="mt-4 mx-auto w-48 h-48 rounded-[16px] border border-[#DECBA4] bg-[#FDFBF7] p-3 flex items-center justify-center">
              <img
                src={printQrTable.qrDataUrl}
                alt={printQrTable.number}
                className="w-full h-full object-contain"
              />
            </div>

            <h3 className="mt-3 font-serif font-bold text-[26px] text-[#9E7A38]">
              {printQrTable.number}
            </h3>

            <div className="mt-5 flex gap-2.5 no-print">
              <button
                type="button"
                onClick={() => window.print()}
                className="saborea-gold-btn flex-1 rounded-[10px] py-2.5 text-[14px] font-medium text-white inline-flex items-center justify-center gap-1.5 cursor-pointer"
              >
                <Printer className="w-4 h-4" />
                <span>Print QR Card</span>
              </button>
              <button
                type="button"
                onClick={() => setPrintQrTable(null)}
                className="px-4 rounded-[10px] border border-[#DECBA4] text-[13.5px] text-[#6E655F] hover:bg-[#F3ECE0] cursor-pointer"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
