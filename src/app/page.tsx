"use client";

import React, { useRef, useState } from "react";
import Link from "next/link";
import { ChevronRight, MapPin, Sparkles, Star, X } from "lucide-react";
import { CATEGORIES } from "@/context/DemoStoreProvider";
import { openSaboreaConcierge } from "@/components/SaboreaCulinaryConcierge";
import {
  BotanicalSprig,
  FindUsMapIllustration,
  SaboreaCanvasBackground,
  SaboreaLogo,
} from "@/components/SaboreaGraphics";

const GUEST_STORIES = [
  {
    id: "emma",
    quote: "“Warm, comforting, and full of flavor.”",
    initials: "EJ",
    name: "Emma J.",
  },
  {
    id: "daniel",
    quote: "“My new favorite spot for a sweet treat.”",
    initials: "DL",
    name: "Daniel L.",
  },
  {
    id: "sara",
    quote: "“Artisan crust, fresh basil, and unforgettable service.”",
    initials: "SM",
    name: "Sara M.",
  },
];

export default function CustomerHomePage() {
  const carouselRef = useRef<HTMLDivElement | null>(null);
  const [activeDot, setActiveDot] = useState(0);
  const [showDirectionsModal, setShowDirectionsModal] = useState(false);

  const handleScroll = () => {
    const el = carouselRef.current;
    if (!el) return;
    const cardStep = 182;
    const idx = Math.min(
      CATEGORIES.length - 1,
      Math.max(0, Math.round(el.scrollLeft / cardStep))
    );
    setActiveDot(idx);
  };

  const scrollToCard = (index: number) => {
    const el = carouselRef.current;
    if (!el) return;
    el.scrollTo({ left: index * 182, behavior: "smooth" });
    setActiveDot(index);
  };

  return (
    <div className="relative min-h-screen w-full overflow-x-hidden pb-16">
      <SaboreaCanvasBackground showTopLeaves />

      <main className="relative z-10 mx-auto w-full max-w-[430px] px-4 pt-5 pb-10">
        {/* Top Brand Header */}
        <header className="relative flex flex-col items-center text-center pt-1 pb-5">
          <SaboreaLogo variant="stacked" size="lg" />

          {/* Slogan with flanking fine gold hairlines */}
          <div className="mt-2.5 flex items-center justify-center gap-3 w-full max-w-[360px]">
            <span className="h-[1px] flex-1 bg-gradient-to-r from-transparent to-[#D1B886]" />
            <p className="text-[14.5px] font-normal tracking-[0.01em] text-[#231F1E] whitespace-nowrap">
              A little joy in every bite.
            </p>
            <span className="h-[1px] flex-1 bg-gradient-to-l from-transparent to-[#D1B886]" />
          </div>
        </header>

        {/* Explore the menu */}
        <section className="mt-1">
          <h2 className="font-serif font-bold text-[26px] leading-tight text-[#231F1E] tracking-[-0.01em]">
            Explore the menu
          </h2>

          <div
            ref={carouselRef}
            onScroll={handleScroll}
            className="mt-3.5 -mr-4 pr-4 flex gap-3.5 overflow-x-auto no-scrollbar scroll-smooth"
          >
            {CATEGORIES.map((cat) => (
              <Link
                key={cat.slug}
                href={`/menu/${cat.slug}`}
                className="group saborea-card shrink-0 w-[168px] rounded-[16px] p-3 flex flex-col justify-between transition hover:border-[#C49A45]"
              >
                {/* Circular/Oval Food Photo */}
                <div className="w-full h-[112px] flex items-center justify-center overflow-hidden rounded-[12px] bg-[#FAF6EE]">
                  <img
                    src={cat.image}
                    alt={cat.label}
                    className="w-[136px] h-[104px] object-cover rounded-[999px] shadow-[0_6px_14px_rgba(35,31,30,0.16)] group-hover:scale-[1.03] transition-transform duration-300"
                  />
                </div>

                {/* Bottom Row: Category Name + Gold Circle Arrow */}
                <div className="mt-3 flex items-center justify-between">
                  <span className="font-serif font-medium text-[20px] leading-none text-[#231F1E]">
                    {cat.label}
                  </span>
                  <span className="w-7 h-7 rounded-full saborea-gold-btn flex items-center justify-center text-[#231F1E] shrink-0">
                    <ChevronRight className="w-4 h-4 stroke-[2.2]" />
                  </span>
                </div>
              </Link>
            ))}
          </div>

          {/* 4 Pagination Dots */}
          <div className="mt-4 flex items-center justify-center gap-2">
            {CATEGORIES.map((cat, idx) => (
              <button
                key={cat.slug}
                type="button"
                onClick={() => scrollToCard(idx)}
                aria-label={`Show ${cat.label}`}
                className={`w-2 h-2 rounded-full transition cursor-pointer ${
                  activeDot === idx ? "bg-[#B58938] scale-110" : "bg-[#D9CEB8]"
                }`}
              />
            ))}
          </div>
        </section>

        {/* Gemini AI Sommelier Spotlight */}
        <section className="mt-7">
          <div className="saborea-card rounded-[18px] p-4.5 bg-gradient-to-br from-[#FFFDF9] via-[#FAF5EC] to-[#F3E7D3] border border-[#D1B886]/70 shadow-[0_6px_20px_rgba(88,65,24,0.08)] relative overflow-hidden">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="flex items-center justify-center w-7 h-7 rounded-full bg-gradient-to-tr from-[#9E7A38] to-[#C49A45] text-white shadow-xs">
                  <Sparkles className="w-3.5 h-3.5 fill-current" />
                </span>
                <span className="text-[11px] font-bold uppercase tracking-wider text-[#8B6A2B]">
                  Gemini Sommelier
                </span>
              </div>
              <span className="text-[11px] px-2.5 py-0.5 rounded-full bg-[#EFE4D2] text-[#8B6A2B] font-semibold border border-[#DECBA4]">
                Taste Pairing
              </span>
            </div>

            <h3 className="mt-2.5 font-serif font-bold text-[21px] leading-snug text-[#231F1E]">
              What should you savor today?
            </h3>
            <p className="mt-1 text-[13px] text-[#6E655F] leading-relaxed">
              Ask our AI Sommelier for custom beverage pairings, romantic dinner sets, or dishes matching your cravings.
            </p>

            <div className="mt-3.5 flex flex-wrap items-center gap-2">
              <button
                type="button"
                onClick={() => openSaboreaConcierge()}
                className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-full bg-[#231F1E] text-[#FAF6EE] text-[12.5px] font-medium hover:bg-[#3D3533] transition cursor-pointer shadow-xs"
              >
                <span>Ask Chef Sommelier</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </button>

              <button
                type="button"
                onClick={() =>
                  openSaboreaConcierge(
                    "What drink pairs best with Black Truffle Tagliatelle and Herb Salmon?"
                  )
                }
                className="inline-flex items-center gap-1 px-3 py-1.5 rounded-full bg-white/80 border border-[#D1B886]/60 text-[12px] text-[#8B6A2B] hover:bg-white transition cursor-pointer"
              >
                <span>🍷 Wine &amp; Drink Pairings</span>
              </button>
            </div>
          </div>
        </section>

        {/* Guest stories */}
        <section className="mt-7">
          <div className="flex items-baseline justify-between">
            <h2 className="font-serif font-bold text-[26px] leading-tight text-[#231F1E] tracking-[-0.01em]">
              Guest stories
            </h2>
            <span className="text-[12.5px] text-[#6E655F]">Sample reviews</span>
          </div>

          <div className="mt-3.5 -mr-4 pr-4 flex gap-3 overflow-x-auto no-scrollbar">
            {GUEST_STORIES.map((review) => (
              <article
                key={review.id}
                className="relative saborea-card shrink-0 w-[196px] rounded-[16px] p-4 overflow-hidden flex flex-col justify-between min-h-[156px]"
              >
                {/* Soft top-right curved accent & quotation icon */}
                <div
                  className="pointer-events-none absolute -top-1 -right-1 w-20 h-12 rounded-bl-[28px] bg-[#ECE2D0]/85 flex items-center justify-end pr-3 pt-1"
                  aria-hidden="true"
                >
                  <span className="font-serif text-[38px] leading-none text-[#C49A45] select-none translate-y-1">
                    ”
                  </span>
                </div>

                <div>
                  {/* 5 Gold Stars */}
                  <div className="flex items-center gap-0.5 text-[#C49A45]">
                    {[0, 1, 2, 3, 4].map((i) => (
                      <Star key={i} className="w-3.5 h-3.5 fill-[#C49A45] text-[#C49A45]" />
                    ))}
                  </div>

                  {/* Quote */}
                  <p className="mt-3 font-serif text-[14.5px] leading-[1.35] text-[#231F1E]">
                    {review.quote}
                  </p>
                </div>

                {/* Reviewer */}
                <div className="mt-4 flex items-center gap-2.5">
                  <span className="w-8 h-8 rounded-full bg-[#ECE2D0] border border-[#C6AF82] flex items-center justify-center font-serif text-[13px] font-medium text-[#231F1E]">
                    {review.initials}
                  </span>
                  <span className="font-serif text-[14.5px] text-[#231F1E]">{review.name}</span>
                </div>
              </article>
            ))}
          </div>
        </section>

        {/* Find us */}
        <section className="mt-8 relative">
          <h2 className="font-serif font-bold text-[26px] leading-tight text-[#231F1E] tracking-[-0.01em]">
            Find us
          </h2>

          <div className="mt-3.5 flex items-center gap-4">
            <FindUsMapIllustration />

            <div className="flex-1 min-w-0">
              <div className="flex items-start gap-2">
                <MapPin className="w-5 h-5 text-[#3B2E26] fill-[#3B2E26] shrink-0 mt-0.5" />
                <p className="text-[14px] leading-[1.35] text-[#231F1E]">
                  Location details coming soon
                </p>
              </div>

              <button
                type="button"
                onClick={() => setShowDirectionsModal(true)}
                className="mt-3.5 w-full rounded-full border border-[#BFA36F] bg-[#FDFBF7] px-4 py-2 text-[14px] font-medium text-[#231F1E] shadow-[0_2px_6px_rgba(164,122,43,0.08)] hover:bg-[#F5EBD6] transition cursor-pointer"
              >
                Get directions
              </button>
            </div>
          </div>

          <BotanicalSprig
            className="pointer-events-none absolute -bottom-10 -right-5 w-24 h-20 opacity-65"
            flip
          />
        </section>
      </main>

      {/* Directions Preview Modal */}
      {showDirectionsModal && (
        <div className="fixed inset-0 z-50 bg-[#231F1E]/35 backdrop-blur-[2px] flex items-center justify-center p-4">
          <div className="saborea-card w-full max-w-[360px] rounded-[20px] p-6 relative">
            <button
              type="button"
              onClick={() => setShowDirectionsModal(false)}
              className="absolute top-4 right-4 p-1.5 rounded-full text-[#6E655F] hover:bg-[#F3ECE0] cursor-pointer"
              aria-label="Close"
            >
              <X className="w-4 h-4" />
            </button>
            <div className="flex items-center gap-2 text-[#9E7A38]">
              <MapPin className="w-5 h-5" />
              <span className="text-[12px] font-medium uppercase tracking-wider">SABOREA</span>
            </div>
            <h3 className="mt-2 font-serif font-semibold text-[22px] text-[#231F1E]">
              Location details coming soon
            </h3>
            <p className="mt-2 text-[14px] leading-relaxed text-[#6E655F]">
              Our flagship dining room address and live turn-by-turn directions will appear here prior
              to launch.
            </p>
            <div className="mt-5 flex gap-2.5">
              <Link
                href="/menu/pizza"
                onClick={() => setShowDirectionsModal(false)}
                className="flex-1 text-center rounded-full saborea-gold-btn py-2.5 text-[14px] font-medium text-white"
              >
                Browse Menu
              </Link>
              <button
                type="button"
                onClick={() => setShowDirectionsModal(false)}
                className="px-4 rounded-full border border-[#DECBA4] text-[14px] text-[#6E655F] hover:bg-[#F3ECE0] cursor-pointer"
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
