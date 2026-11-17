"use client";

import React, { useMemo, useState } from "react";
import {
  ClipboardList,
  Home,
  Pencil,
  Plus,
  Sparkles,
  TrendingUp,
  User,
  Utensils,
  X,
} from "lucide-react";
import {
  CATEGORIES,
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

type AdminTab = "Overview" | "Menu" | "Orders";

const RANGE_BASE: Record<TimeRange, { revenue: number; orders: number; label: string }> = {
  Today: { revenue: 8450, orders: 64, label: "Revenue today" },
  Month: { revenue: 214800, orders: 1620, label: "Revenue month" },
  Year: { revenue: 2480500, orders: 18940, label: "Revenue year" },
};

export default function AdminDashboardPage() {
  const {
    menuItems,
    orderHistory,
    extraRevenue,
    extraOrdersCount,
    addMenuItem,
    updateMenuItem,
  } = useDemoStore();

  const [timeRange, setTimeRange] = useState<TimeRange>("Today");
  const [activeTab, setActiveTab] = useState<AdminTab>("Overview");
  const [menuCategoryFilter, setMenuCategoryFilter] = useState<CategorySlug | "all">("all");

  // Modal state for Add / Edit Dish
  const [dishModalOpen, setDishModalOpen] = useState(false);
  const [editingDish, setEditingDish] = useState<MenuItem | null>(null);
  const [dishName, setDishName] = useState("");
  const [dishPrice, setDishPrice] = useState("");
  const [dishCategory, setDishCategory] = useState<CategorySlug>("pizza");
  const [aiPrompt, setAiPrompt] = useState("");
  const [aiGenerating, setAiGenerating] = useState(false);
  const [aiChefNote, setAiChefNote] = useState<string | null>(null);

  const stats = RANGE_BASE[timeRange];
  const displayRevenue = stats.revenue + extraRevenue;
  const displayOrders = stats.orders + extraOrdersCount;

  const topSellers = useMemo(() => {
    return [...menuItems]
      .sort((a, b) => b.sold - a.sold)
      .slice(0, 3);
  }, [menuItems]);

  const maxSold = Math.max(1, topSellers[0]?.sold ?? 32);

  // Featured rows on Overview matching Screenshot 3 (Classic Margherita, Cola + newly added dishes)
  const overviewMenuRows = useMemo(() => {
    const margherita = menuItems.find((i) => i.id === "classic-margherita");
    const cola = menuItems.find((i) => i.id === "cola");
    const custom = menuItems.filter(
      (i) => i.id.startsWith("dish-")
    );
    return [margherita, cola, ...custom].filter((x): x is MenuItem => Boolean(x));
  }, [menuItems]);

  const filteredMenu = useMemo(() => {
    if (menuCategoryFilter === "all") return menuItems;
    return menuItems.filter((i) => i.category === menuCategoryFilter);
  }, [menuItems, menuCategoryFilter]);

  const openAddDish = () => {
    setEditingDish(null);
    setDishName("");
    setDishPrice("");
    setDishCategory("pizza");
    setAiPrompt("");
    setAiChefNote(null);
    setDishModalOpen(true);
  };

  const handleGenerateWithGemini = async () => {
    if (!aiPrompt.trim() || aiGenerating) return;
    setAiGenerating(true);
    setAiChefNote(null);
    try {
      const savedKey =
        typeof window !== "undefined"
          ? localStorage.getItem("saborea_gemini_key")
          : null;
      const headers: Record<string, string> = {
        "Content-Type": "application/json",
      };
      if (savedKey) headers["x-gemini-api-key"] = savedKey;

      const res = await fetch("/api/gemini/dish-creator", {
        method: "POST",
        headers,
        body: JSON.stringify({ prompt: aiPrompt.trim() }),
      });
      if (!res.ok) throw new Error("Failed to generate dish");
      const data = await res.json();
      if (data.name) setDishName(data.name);
      if (data.price) setDishPrice(String(data.price));
      if (data.category) setDishCategory(data.category);
      if (data.description || data.pairingTip) {
        setAiChefNote(`${data.description} • Pairing: ${data.pairingTip}`);
      }
    } catch (err: unknown) {
      console.error(err);
      setAiChefNote("Could not connect to Gemini API. Please check configuration.");
    } finally {
      setAiGenerating(false);
    }
  };

  const openEditDish = (dish: MenuItem) => {
    setEditingDish(dish);
    setDishName(dish.name);
    setDishPrice(String(dish.price));
    setDishCategory(dish.category);
    setDishModalOpen(true);
  };

  const handleSaveDish = (e: React.FormEvent) => {
    e.preventDefault();
    const numericPrice = Number(dishPrice);
    if (!dishName.trim() || Number.isNaN(numericPrice) || numericPrice <= 0) return;

    if (editingDish) {
      updateMenuItem(editingDish.id, {
        name: dishName,
        price: numericPrice,
        category: dishCategory,
      });
    } else {
      addMenuItem({
        name: dishName,
        price: numericPrice,
        category: dishCategory,
      });
    }
    setDishModalOpen(false);
  };

  return (
    <div className="relative min-h-screen w-full overflow-x-hidden pb-24">
      <SaboreaCanvasBackground showTopLeaves />

      <main className="relative z-10 mx-auto w-full max-w-[430px] px-4 pt-4">
        {/* Top Bar: Centered Horizontal Logo + Profile Icon */}
        <header className="relative flex items-center justify-center pt-1 pb-3">
          <SaboreaLogo variant="horizontal" size="sm" />
          <div
            className="absolute right-0 top-1 w-10 h-10 rounded-full border border-[#BFA36F] bg-[#FDFBF7] flex items-center justify-center text-[#9E7A38]"
            title="Admin Profile"
          >
            <User className="w-5 h-5 stroke-[1.6]" />
          </div>
        </header>

        {/* Title + Demo data badge */}
        <section className="mt-1">
          <h1 className="font-serif font-bold text-[31px] leading-tight text-[#231F1E]">
            Admin dashboard
          </h1>
          <div className="mt-1.5">
            <span className="inline-flex items-center gap-1.5 rounded-full bg-[#EFE5D2] px-3 py-0.5 text-[12px] font-medium text-[#5A524C]">
              <span className="w-2 h-2 rounded-full bg-[#C49A45]" />
              Demo data
            </span>
          </div>
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
                    {stats.label}
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
                  <p className="text-[13.5px] font-serif text-[#231F1E]">Orders</p>
                  <p className="mt-1 font-serif font-bold text-[25px] leading-tight text-[#231F1E]">
                    {displayOrders.toLocaleString()}
                  </p>
                </div>
                <div className="w-10 h-10 rounded-full bg-[#F2E8D5] flex items-center justify-center text-[#A98237] shrink-0">
                  <ClipboardList className="w-5 h-5 stroke-[1.8]" />
                </div>
              </div>
            </div>

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
                  // Scaled smoothly so top seller sits around ~75% width just like Screenshot 3
                  const pct = Math.min(92, Math.max(18, Math.round((item.sold / (maxSold * 1.3)) * 100)));

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
                              background: "linear-gradient(90deg, #C0943E 0%, #D6B469 100%)",
                            }}
                          />
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </section>

            {/* Menu Management Card */}
            <section className="saborea-card rounded-[18px] p-4 relative overflow-hidden">
              <div className="flex items-center justify-between gap-2 relative">
                <h2 className="font-serif font-semibold text-[20px] text-[#231F1E]">
                  Menu management
                </h2>

                <BotanicalSprig
                  className="pointer-events-none absolute right-24 -top-2 w-16 h-12 opacity-60"
                />

                <button
                  type="button"
                  onClick={openAddDish}
                  className="saborea-gold-btn rounded-[8px] px-3 py-1.5 text-[13px] font-medium text-white inline-flex items-center gap-1 shrink-0 cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Add dish</span>
                </button>
              </div>

              <div className="mt-3 space-y-2.5">
                {overviewMenuRows.map((dish) => (
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

                    <div className="flex items-center gap-3 shrink-0">
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
            </section>
          </div>
        )}

        {/* MENU TAB */}
        {activeTab === "Menu" && (
          <section className="mt-4 saborea-card rounded-[18px] p-4 space-y-3.5">
            <div className="flex items-center justify-between gap-2">
              <h2 className="font-serif font-semibold text-[21px] text-[#231F1E]">
                Full Menu ({filteredMenu.length})
              </h2>
              <button
                type="button"
                onClick={openAddDish}
                className="saborea-gold-btn rounded-[8px] px-3 py-1.5 text-[13px] font-medium text-white inline-flex items-center gap-1 cursor-pointer"
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
                className={`px-3 py-1 rounded-full text-[12px] font-medium border transition cursor-pointer ${
                  menuCategoryFilter === "all"
                    ? "bg-[#EFE5D2] border-[#C49A45] text-[#8B6A2B]"
                    : "border-[#E5D7BE] text-[#6E655F] hover:bg-[#F7EFE0]"
                }`}
              >
                All
              </button>
              {CATEGORIES.map((cat) => (
                <button
                  key={cat.slug}
                  type="button"
                  onClick={() => setMenuCategoryFilter(cat.slug)}
                  className={`px-3 py-1 rounded-full text-[12px] font-medium border transition cursor-pointer ${
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

                  <div className="flex items-center gap-2.5 shrink-0">
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
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* ORDERS TAB */}
        {activeTab === "Orders" && (
          <section className="mt-4 space-y-3">
            <div className="flex items-center justify-between px-1">
              <h2 className="font-serif font-semibold text-[21px] text-[#231F1E]">
                Live &amp; Recent Orders
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
                        <span>EGP {(line.unitPrice * line.quantity).toLocaleString()}</span>
                      </div>
                    ))}
                  </div>

                  <div className="border-t border-[#EFE5D2] pt-2 flex items-center justify-between">
                    <span className="text-[12.5px] text-[#6E655F]">Order total</span>
                    <span className="font-serif font-semibold text-[16px] text-[#9E7A38]">
                      EGP {ord.total.toLocaleString()}
                    </span>
                  </div>
                </article>
              );
            })}
          </section>
        )}
      </main>

      {/* Fixed Bottom Navigation Bar */}
      <nav
        aria-label="Admin Navigation"
        className="fixed bottom-3 left-0 right-0 z-40 px-4 pointer-events-none"
      >
        <div className="mx-auto max-w-[400px] pointer-events-auto rounded-[16px] bg-[#FDFBF7]/95 backdrop-blur-md border border-[#DECBA4] shadow-[0_6px_20px_rgba(88,65,24,0.12)] p-1.5 grid grid-cols-3 gap-1">
          {(
            [
              { id: "Overview", icon: Home },
              { id: "Menu", icon: Utensils },
              { id: "Orders", icon: ClipboardList },
            ] as const
          ).map(({ id, icon: Icon }) => {
            const active = activeTab === id;
            return (
              <button
                key={id}
                type="button"
                onClick={() => setActiveTab(id)}
                className={`rounded-[11px] py-2 px-3 flex items-center justify-center gap-2 text-[14px] transition cursor-pointer ${
                  active
                    ? "bg-[#F3E7D0] text-[#7D5E24] font-medium"
                    : "text-[#3E3733] hover:bg-[#FAF6EE]"
                }`}
              >
                <Icon className={`w-4 h-4 ${active ? "text-[#9E7A38]" : "text-[#4E4640]"}`} />
                <span>{id}</span>
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
            className="saborea-card w-full max-w-[380px] rounded-[20px] p-5 sm:p-6 relative"
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

            {/* AI Culinary Creator section */}
            {!editingDish && (
              <div className="mt-3.5 p-3 rounded-[12px] bg-[#FAF5EB] border border-[#D1B886]/70">
                <div className="flex items-center justify-between text-[11px] font-semibold text-[#8B6A2B] mb-1.5">
                  <span className="flex items-center gap-1.5">
                    <Sparkles className="w-3.5 h-3.5 text-[#C49A45]" />
                    <span>Gemini AI Culinary Creator</span>
                  </span>
                  <span className="text-[10px] text-[#A0958C] font-normal">
                    Type an ingredient / concept
                  </span>
                </div>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={aiPrompt}
                    onChange={(e) => setAiPrompt(e.target.value)}
                    placeholder="e.g. Truffle Burrata Calzone"
                    className="flex-1 rounded-[8px] bg-white border border-[#D1B886] px-2.5 py-1.5 text-[12.5px] text-[#231F1E] focus:outline-none focus:border-[#8B6A2B]"
                  />
                  <button
                    type="button"
                    disabled={!aiPrompt.trim() || aiGenerating}
                    onClick={handleGenerateWithGemini}
                    className="px-3 py-1.5 rounded-[8px] bg-[#231F1E] text-[#FAF6EE] text-[12px] font-medium hover:bg-[#3D3533] disabled:opacity-50 transition cursor-pointer flex items-center gap-1 shrink-0"
                  >
                    {aiGenerating ? (
                      <Sparkles className="w-3.5 h-3.5 animate-spin" />
                    ) : (
                      <span>Generate</span>
                    )}
                  </button>
                </div>
                {aiChefNote && (
                  <p className="mt-2 text-[11.5px] text-[#6E655F] italic bg-white/80 p-2 rounded-[6px] border border-[#E9DFCE] leading-relaxed">
                    {aiChefNote}
                  </p>
                )}
              </div>
            )}

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
                    onChange={(e) => setDishCategory(e.target.value as CategorySlug)}
                    className="w-full rounded-[10px] border border-[#DECBA4] bg-white px-3 py-2 text-[14px] text-[#231F1E] focus:outline-none focus:border-[#B58938]"
                  >
                    {CATEGORIES.map((cat) => (
                      <option key={cat.slug} value={cat.slug}>
                        {cat.label}
                      </option>
                    ))}
                  </select>
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
    </div>
  );
}
