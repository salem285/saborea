"use client";

import React from "react";
import type { TableStatus } from "@/context/DemoStoreProvider";

/**
 * Exact Cloche + Serving Hand line-art logo matching /public/images/logo.png & all 5 screenshots,
 * rendered cleanly on transparent cream canvas without a dark background box.
 */
export function SaboreaClocheMark({ className = "w-20 h-14" }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 120 76"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      aria-hidden="true"
    >
      <defs>
        <linearGradient id="saboreaGold" x1="12" y1="6" x2="108" y2="70" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#D8B66D" />
          <stop offset="48%" stopColor="#B88D3B" />
          <stop offset="100%" stopColor="#946D24" />
        </linearGradient>
      </defs>
      {/* Top knob */}
      <circle cx="60" cy="11" r="3.6" stroke="url(#saboreaGold)" strokeWidth="2.1" />
      <circle cx="60" cy="11" r="1.1" fill="url(#saboreaGold)" />
      {/* Cloche dome */}
      <path
        d="M27 42 C27 23.5, 41.5 14.5, 60 14.5 C78.5 14.5, 93 23.5, 93 42"
        stroke="url(#saboreaGold)"
        strokeWidth="2.3"
        strokeLinecap="round"
      />
      {/* Inner reflection arcs */}
      <path
        d="M34 39 C35.5 27.5, 44.5 20.5, 55 19"
        stroke="url(#saboreaGold)"
        strokeWidth="1.5"
        strokeLinecap="round"
      />
      <path
        d="M39 39 C40.5 31.5, 46.5 25.5, 53 23.5"
        stroke="url(#saboreaGold)"
        strokeWidth="1.2"
        strokeLinecap="round"
      />
      {/* Dome base rim */}
      <line x1="23" y1="42.5" x2="97" y2="42.5" stroke="url(#saboreaGold)" strokeWidth="2.2" strokeLinecap="round" />
      {/* Platter / tray */}
      <path
        d="M11 46.5 L109 46.5 L104.5 49.5 L15.5 49.5 Z"
        stroke="url(#saboreaGold)"
        strokeWidth="2"
        strokeLinejoin="round"
      />
      {/* Serving hand & cuff */}
      <path
        d="M37 49.5 C41 53.5, 44 60, 52 63 L52 68.5"
        stroke="url(#saboreaGold)"
        strokeWidth="2.1"
        strokeLinecap="round"
      />
      <path
        d="M81 49.5 C76 53, 72 56.5, 70.5 63.5 L70.5 68.5"
        stroke="url(#saboreaGold)"
        strokeWidth="2.1"
        strokeLinecap="round"
      />
      {/* Inner palm cut-out */}
      <path
        d="M46 50.5 C51 55.5, 56 58.5, 63 58.5 C68.5 58.5, 71 54.5, 72 50.5 Z"
        stroke="url(#saboreaGold)"
        strokeWidth="1.8"
        strokeLinejoin="round"
      />
      {/* Shirt cuff */}
      <rect x="49.5" y="68.5" width="24" height="5.5" rx="1.2" stroke="url(#saboreaGold)" strokeWidth="1.8" />
      <circle cx="69" cy="71.2" r="1.2" fill="url(#saboreaGold)" />
    </svg>
  );
}

export function SaboreaLogo({
  variant = "stacked",
  size = "md",
}: {
  variant?: "stacked" | "horizontal";
  size?: "sm" | "md" | "lg";
}) {
  if (variant === "horizontal") {
    const iconSize = size === "sm" ? "w-11 h-8" : "w-14 h-10";
    const textSize = size === "sm" ? "text-[22px]" : "text-[28px]";
    return (
      <div className="inline-flex items-center gap-2 select-none">
        <SaboreaClocheMark className={iconSize} />
        <span
          className={`font-serif font-medium tracking-[0.06em] saborea-gold-text-gradient leading-none ${textSize}`}
        >
          SABOREA
        </span>
      </div>
    );
  }

  const iconSize = size === "lg" ? "w-28 h-[72px]" : size === "sm" ? "w-16 h-11" : "w-20 h-14";
  const textSize = size === "lg" ? "text-[42px]" : size === "sm" ? "text-[24px]" : "text-[31px]";

  return (
    <div className="inline-flex flex-col items-center select-none">
      <SaboreaClocheMark className={iconSize} />
      <span
        className={`font-serif font-medium tracking-[0.07em] saborea-gold-text-gradient leading-none -mt-0.5 ${textSize}`}
      >
        SABOREA
      </span>
    </div>
  );
}

export function BotanicalSprig({
  className = "w-20 h-16",
  flip = false,
}: {
  className?: string;
  flip?: boolean;
}) {
  return (
    <svg
      viewBox="0 0 110 90"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={`${className} ${flip ? "-scale-x-100" : ""}`}
      aria-hidden="true"
    >
      {/* Main curved stem */}
      <path
        d="M12 82 C26 58, 48 34, 88 14"
        stroke="#C7A667"
        strokeWidth="1.2"
        strokeLinecap="round"
      />
      {/* Leaves along stem */}
      <path
        d="M27 62 C18 48, 20 34, 33 27 C37 40, 35 53, 27 62 Z"
        stroke="#C7A667"
        strokeWidth="1.1"
        fill="#EFE6D3"
        fillOpacity="0.35"
      />
      <path
        d="M44 45 C36 30, 41 18, 55 12 C57 25, 53 38, 44 45 Z"
        stroke="#C7A667"
        strokeWidth="1.1"
        fill="#EFE6D3"
        fillOpacity="0.35"
      />
      <path
        d="M64 29 C60 17, 67 8, 80 5 C79 16, 73 24, 64 29 Z"
        stroke="#C7A667"
        strokeWidth="1.1"
        fill="#EFE6D3"
        fillOpacity="0.35"
      />
      <path
        d="M34 59 C47 54, 62 56, 72 64 C58 68, 44 66, 34 59 Z"
        stroke="#C7A667"
        strokeWidth="1.1"
        fill="#EFE6D3"
        fillOpacity="0.35"
      />
      <path
        d="M52 42 C66 38, 81 40, 92 48 C77 52, 63 50, 52 42 Z"
        stroke="#C7A667"
        strokeWidth="1.1"
        fill="#EFE6D3"
        fillOpacity="0.35"
      />
      <path
        d="M72 26 C84 23, 95 25, 104 31 C93 34, 81 33, 72 26 Z"
        stroke="#C7A667"
        strokeWidth="1.1"
        fill="#EFE6D3"
        fillOpacity="0.35"
      />
      {/* Leaf veins */}
      <path d="M27 62 L32 32" stroke="#C7A667" strokeWidth="0.7" opacity="0.7" />
      <path d="M44 45 L53 16" stroke="#C7A667" strokeWidth="0.7" opacity="0.7" />
      <path d="M34 59 L67 63" stroke="#C7A667" strokeWidth="0.7" opacity="0.7" />
      <path d="M52 42 L87 47" stroke="#C7A667" strokeWidth="0.7" opacity="0.7" />
    </svg>
  );
}

/**
 * Full-bleed Warm Cream background (#FAF6EE) with organic wavy sand shapes (#F3ECE0),
 * delicate gold line-art arcs, and botanical corner sprigs matching all 5 screenshots.
 */
export function SaboreaCanvasBackground({
  showTopLeaves = true,
}: {
  showTopLeaves?: boolean;
}) {
  return (
    <div className="pointer-events-none fixed inset-0 overflow-hidden z-0" aria-hidden="true">
      {/* Top-left organic cream wave */}
      <svg
        viewBox="0 0 600 420"
        className="absolute -top-12 -left-20 w-[420px] md:w-[540px] opacity-90"
        fill="none"
      >
        <path
          d="M0 0 H420 C360 110, 260 95, 190 175 C120 255, 80 310, 0 360 Z"
          fill="#F3ECE0"
        />
        <path
          d="M0 190 C70 110, 155 100, 240 12 C280 -28, 340 -10, 380 0"
          stroke="#D7BF91"
          strokeWidth="1"
          opacity="0.7"
        />
      </svg>

      {/* Top-right organic cream wave & arcs */}
      <svg
        viewBox="0 0 560 460"
        className="absolute -top-10 -right-16 w-[380px] md:w-[500px] opacity-90"
        fill="none"
      >
        <path
          d="M210 0 H560 V370 C470 330, 415 240, 355 180 C295 120, 240 80, 210 0 Z"
          fill="#F3ECE0"
        />
        <path
          d="M280 0 C260 110, 310 195, 430 250 C485 275, 530 295, 560 325"
          stroke="#D7BF91"
          strokeWidth="1"
          opacity="0.7"
        />
        <circle cx="485" cy="290" r="145" stroke="#DECBA4" strokeWidth="1" opacity="0.55" />
      </svg>

      {/* Bottom-left subtle warm wave */}
      <svg
        viewBox="0 0 500 380"
        className="absolute -bottom-16 -left-16 w-[360px] md:w-[460px] opacity-85"
        fill="none"
      >
        <path
          d="M0 110 C95 85, 175 130, 250 215 C325 300, 385 330, 440 380 H0 Z"
          fill="#F3ECE0"
        />
        <path
          d="M0 80 C120 65, 225 140, 315 265"
          stroke="#DECBA4"
          strokeWidth="1"
          opacity="0.6"
        />
      </svg>

      {/* Bottom-right subtle warm wave */}
      <svg
        viewBox="0 0 500 360"
        className="absolute -bottom-12 -right-12 w-[340px] md:w-[440px] opacity-85"
        fill="none"
      >
        <path
          d="M110 360 C150 250, 225 180, 330 140 C405 112, 460 105, 500 100 V360 Z"
          fill="#F3ECE0"
        />
        <path
          d="M150 360 C190 240, 275 160, 465 118"
          stroke="#DECBA4"
          strokeWidth="1"
          opacity="0.6"
        />
      </svg>

      {showTopLeaves && (
        <>
          <BotanicalSprig className="absolute top-16 -left-3 w-28 h-24 opacity-80" />
          <BotanicalSprig className="absolute top-14 -right-3 w-28 h-24 opacity-80" flip />
        </>
      )}
    </div>
  );
}

/**
 * Custom line icons for Cashier table cards matching Screenshot 2:
 * - Available: Table & two chairs in sage green
 * - Preparing: Cloche on platter in warm gold
 * - Ready: Cloche + checkmark circle in steel blue
 */
export function TableStatusIcon({ status }: { status: TableStatus }) {
  if (status === "Available") {
    return (
      <div className="w-12 h-12 rounded-full bg-[#EEF2EA] border border-[#CBD6C1] flex items-center justify-center mx-auto">
        <svg viewBox="0 0 36 36" fill="none" className="w-6 h-6 text-[#6B8E6B]">
          {/* Table */}
          <path d="M10 17 H26" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" />
          <path d="M18 17 V26" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" />
          <path d="M14 26 H22" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
          {/* Left chair */}
          <path d="M6.5 13 V25" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
          <path d="M6.5 20 H11.5 V25" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
          {/* Right chair */}
          <path d="M29.5 13 V25" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
          <path d="M29.5 20 H24.5 V25" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </div>
    );
  }

  if (status === "Preparing") {
    return (
      <div className="w-12 h-12 rounded-full bg-[#F7EEDB] border border-[#DFC793] flex items-center justify-center mx-auto">
        <svg viewBox="0 0 36 36" fill="none" className="w-6 h-6 text-[#B88D3B]">
          <circle cx="18" cy="11" r="1.4" stroke="currentColor" strokeWidth="1.5" />
          <path
            d="M9 21 C9 15.5, 13 12.5, 18 12.5 C23 12.5, 27 15.5, 27 21"
            stroke="currentColor"
            strokeWidth="1.7"
            strokeLinecap="round"
          />
          <path d="M6.5 22.5 H29.5" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" />
          <path d="M11 25.5 H25" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
        </svg>
      </div>
    );
  }

  // Ready
  return (
    <div className="w-12 h-12 rounded-full bg-[#EBF1F6] border border-[#BDD0DF] flex items-center justify-center mx-auto">
      <svg viewBox="0 0 36 36" fill="none" className="w-6 h-6 text-[#4A779D]">
        <circle cx="17" cy="10.5" r="1.3" stroke="currentColor" strokeWidth="1.5" />
        <path
          d="M8.5 20.5 C8.5 15.2, 12.3 12, 17 12 C21.7 12, 25.5 15.2, 25.5 20.5"
          stroke="currentColor"
          strokeWidth="1.65"
          strokeLinecap="round"
        />
        <path d="M6.5 22 H21" stroke="currentColor" strokeWidth="1.65" strokeLinecap="round" />
        <circle cx="25.5" cy="23.5" r="4.8" fill="#EBF1F6" stroke="currentColor" strokeWidth="1.5" />
        <path
          d="M23.5 23.5 L25 25 L27.8 22"
          stroke="currentColor"
          strokeWidth="1.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    </div>
  );
}

/**
 * Golden-framed map illustration matching "Find us" in Screenshot 1
 */
export function FindUsMapIllustration() {
  return (
    <div className="relative w-[176px] h-[126px] shrink-0 select-none">
      {/* Left & Right gold layered decorative arches behind */}
      <div
        className="absolute inset-x-0 bottom-0 top-3 rounded-t-[88px] border border-[#C7A667] shadow-sm"
        style={{
          background: "linear-gradient(135deg, #D5B36E 0%, #B38A3E 55%, #C7A45E 100%)",
        }}
      />
      {/* Inner cream/gold map arch */}
      <div className="absolute left-5 right-5 top-0 bottom-0 rounded-t-[76px] border-[2px] border-[#DFC99B] bg-[#F5F1E8] overflow-hidden shadow-inner">
        <svg viewBox="0 0 140 130" className="w-full h-full" fill="none">
          {/* Subtle map blocks */}
          <rect x="0" y="0" width="140" height="130" fill="#F3EFE6" />
          <path d="M12 18 L52 10 L62 42 L20 52 Z" fill="#E4EBDC" />
          <path d="M84 18 L128 24 L120 62 L78 52 Z" fill="#E8ECE0" />
          <path d="M14 78 L58 68 L66 112 L18 122 Z" fill="#E9ECE2" />
          <path d="M86 80 L132 72 L134 118 L92 124 Z" fill="#E2E9DA" />
          {/* Map roads */}
          <path d="M-5 60 L145 48" stroke="#FFFFFF" strokeWidth="7" />
          <path d="M68 -5 L74 135" stroke="#FFFFFF" strokeWidth="7" />
          <path d="M10 120 L135 12" stroke="#FCFBF7" strokeWidth="3.5" opacity="0.85" />
          {/* Center gold location pin */}
          <g transform="translate(53, 33)">
            <path
              d="M17 0 C7.6 0 0 7.6 0 17 C0 29.5 17 44 17 44 C17 44 34 29.5 34 17 C34 7.6 26.4 0 17 0 Z"
              fill="url(#pinGold)"
              stroke="#8F6924"
              strokeWidth="1.2"
            />
            <circle cx="17" cy="16.5" r="6" fill="#FAF6EE" />
          </g>
          <defs>
            <linearGradient id="pinGold" x1="0" y1="0" x2="34" y2="44" gradientUnits="userSpaceOnUse">
              <stop offset="0%" stopColor="#D8B66D" />
              <stop offset="100%" stopColor="#A67D30" />
            </linearGradient>
          </defs>
        </svg>
      </div>
    </div>
  );
}
