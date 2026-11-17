"use client";

import React from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { ChevronLeft, Minus, Plus, ShoppingBag, Sparkles } from "lucide-react";
import { CATEGORIES, type CategorySlug, useDemoStore } from "@/context/DemoStoreProvider";
import { SaboreaCanvasBackground, SaboreaLogo } from "@/components/SaboreaGraphics";
import { openSaboreaConcierge } from "@/components/SaboreaCulinaryConcierge";

export default function CategoryMenuPage() {
  const params = useParams<{ category: string }>();
  const rawSlug = (params?.category ?? "pizza").toLowerCase();
  const categoryInfo =
    CATEGORIES.find((c) => c.slug === rawSlug) ?? CATEGORIES[0];
  const activeSlug = categoryInfo.slug as CategorySlug;

  const {
    menuItems,
    cart,
    cartCount,
    cartTotal,
    incrementCart,
    decrementCart,
  } = useDemoStore();

  const items = menuItems.filter((item) => item.category === activeSlug);

  return (
    <div className="relative min-h-screen w-full overflow-x-hidden pb-28">
      <SaboreaCanvasBackground showTopLeaves={false} />

      <main className="relative z-10 mx-auto w-full max-w-[430px] px-4 pt-4">
        {/* Top Bar: < Back + Centered Logo */}
        <header className="relative flex items-center justify-center pt-1 pb-2">
          <Link
            href="/"
            className="absolute left-0 top-2 inline-flex items-center gap-1 text-[14.5px] font-medium text-[#8B6A2B] hover:text-[#6E521E] transition"
          >
            <ChevronLeft className="w-4 h-4 stroke-[2.2]" />
            <span>Back</span>
          </Link>

          <SaboreaLogo variant="stacked" size="sm" />
        </header>

        {/* Category Title */}
        <div className="mt-1 text-center">
          <h1 className="font-serif font-bold text-[32px] leading-tight text-[#231F1E]">
            {categoryInfo.label}
          </h1>
          <button
            type="button"
            onClick={() =>
              openSaboreaConcierge(
                `What drinks and side pairings go best with our ${categoryInfo.label} selections?`
              )
            }
            className="mt-2 inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#FAF5EB] border border-[#D1B886]/70 text-[12px] text-[#8B6A2B] hover:bg-[#F2E8D7] transition cursor-pointer"
          >
            <Sparkles className="w-3.5 h-3.5 text-[#C49A45]" />
            <span>Ask Sommelier for Pairings</span>
          </button>
        </div>

        {/* Dish Cards */}
        <section className="mt-5 space-y-4">
          {items.map((item) => {
            const qty = cart[item.id] ?? 0;

            return (
              <article
                key={item.id}
                className="saborea-card rounded-[18px] p-3.5 transition"
              >
                <div className="w-full h-[186px] rounded-[12px] overflow-hidden bg-[#F3ECE0]">
                  <img
                    src={item.image}
                    alt={item.name}
                    className="w-full h-full object-cover"
                  />
                </div>

                <h2 className="mt-3 font-serif font-semibold text-[21px] leading-snug text-[#231F1E]">
                  {item.name}
                </h2>

                <p className="mt-0.5 font-serif font-semibold text-[18px] text-[#9E7A38]">
                  EGP {item.price}
                </p>

                {/* Bottom Actions: Outlined Add button + Stepper Box */}
                <div className="mt-2.5 flex items-center justify-between">
                  <button
                    type="button"
                    onClick={() => incrementCart(item.id)}
                    className="rounded-[8px] border border-[#BFA36F] bg-[#FDFBF7] px-7 py-1.5 text-[14px] font-medium text-[#231F1E] hover:bg-[#F5EBD6] active:scale-[0.98] transition cursor-pointer"
                  >
                    Add
                  </button>

                  <div className="inline-flex items-center rounded-[8px] border border-[#DECBA4] bg-[#FDFBF7] overflow-hidden">
                    <button
                      type="button"
                      onClick={() => decrementCart(item.id)}
                      disabled={qty === 0}
                      aria-label={`Decrease ${item.name} quantity`}
                      className="w-9 h-9 flex items-center justify-center text-[#5B524C] hover:bg-[#F5EBD6] disabled:opacity-40 disabled:hover:bg-transparent transition cursor-pointer"
                    >
                      <Minus className="w-3.5 h-3.5" />
                    </button>
                    <span className="w-px h-5 bg-[#E6D8BE]" />
                    <span className="w-10 text-center font-serif font-semibold text-[16px] text-[#231F1E]">
                      {qty}
                    </span>
                    <span className="w-px h-5 bg-[#E6D8BE]" />
                    <button
                      type="button"
                      onClick={() => incrementCart(item.id)}
                      aria-label={`Increase ${item.name} quantity`}
                      className="w-9 h-9 flex items-center justify-center text-[#5B524C] hover:bg-[#F5EBD6] transition cursor-pointer"
                    >
                      <Plus className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </article>
            );
          })}

          {items.length === 0 && (
            <div className="saborea-card rounded-[18px] p-8 text-center">
              <p className="font-serif text-[18px] text-[#6E655F]">
                No dishes in this category yet.
              </p>
            </div>
          )}
        </section>
      </main>

      {/* Floating Bottom "View Order" Bar when cart items > 0 */}
      {cartCount > 0 && (
        <div className="fixed bottom-4 left-0 right-0 z-40 px-4 pointer-events-none">
          <div className="mx-auto max-w-[400px] pointer-events-auto">
            <Link
              href="/order"
              className="saborea-gold-btn w-full rounded-[14px] px-4 py-3 flex items-center justify-between text-white shadow-[0_8px_24px_rgba(128,93,28,0.3)]"
            >
              <div className="flex items-center gap-2.5">
                <span className="w-7 h-7 rounded-full bg-white/20 flex items-center justify-center">
                  <ShoppingBag className="w-4 h-4" />
                </span>
                <span className="text-[14px] font-medium">
                  {cartCount} {cartCount === 1 ? "item" : "items"}
                </span>
              </div>

              <span className="font-serif text-[18px] font-semibold tracking-wide">
                View Order
              </span>

              <span className="font-serif text-[16px] font-semibold">
                EGP {cartTotal.toLocaleString()}
              </span>
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}
