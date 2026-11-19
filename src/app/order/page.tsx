"use client";

import React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeft, Check, CheckCircle2 } from "lucide-react";
import { useDemoStore } from "@/context/DemoStoreProvider";
import {
  BotanicalSprig,
  SaboreaCanvasBackground,
  SaboreaLogo,
} from "@/components/SaboreaGraphics";

export default function OrderReviewPage() {
  const router = useRouter();
  const {
    categories,
    cartItems,
    cartTotal,
    assignedTableNumber,
    lastConfirmedOrder,
    confirmCustomerOrder,
    resetConfirmationBanner,
  } = useDemoStore();

  const firstCategorySlug = categories[0]?.slug ?? "pizza";

  const handleConfirm = () => {
    confirmCustomerOrder();
  };

  return (
    <div className="relative min-h-screen w-full overflow-x-hidden pb-16">
      <SaboreaCanvasBackground showTopLeaves />

      <main className="relative z-10 mx-auto w-full max-w-[430px] px-4 pt-4 pb-8">
        {/* Top Header */}
        <header className="relative flex items-center justify-center pt-1 pb-2">
          <button
            type="button"
            onClick={() => {
              resetConfirmationBanner();
              router.back();
            }}
            className="absolute left-0 top-3 inline-flex items-center gap-1.5 text-[14.5px] font-medium text-[#8B6A2B] hover:text-[#6E521E] transition cursor-pointer"
          >
            <ArrowLeft className="w-4 h-4 stroke-[2]" />
            <span>Back</span>
          </button>

          <SaboreaLogo variant="stacked" size="sm" />
        </header>

        {/* Page Title */}
        <div className="mt-2 text-center">
          <h1 className="font-serif font-bold text-[32px] leading-tight text-[#231F1E]">
            Your order
          </h1>
          <p className="mt-1 text-[14px] text-[#6E655F]">
            {lastConfirmedOrder && cartItems.length === 0
              ? "تم إرسال طلبك للمطبخ بنجاح"
              : "Review before confirming"}
          </p>
        </div>

        {/* Confirmed Order State — Strictly Customer-Facing (No Cashier link) */}
        {lastConfirmedOrder && cartItems.length === 0 ? (
          <section className="mt-5 space-y-4">
            <div className="saborea-card rounded-[18px] p-6 text-center relative overflow-hidden">
              <div className="w-14 h-14 mx-auto rounded-full bg-[#EEF2EA] border border-[#C5D4BC] flex items-center justify-center text-[#6B8E6B]">
                <CheckCircle2 className="w-7 h-7" />
              </div>

              <h2 className="mt-3.5 font-serif font-semibold text-[24px] text-[#231F1E]">
                تم إرسال طلبك للمطبخ بنجاح
              </h2>
              <p className="mt-1 text-[14px] text-[#6E655F]">
                Order{" "}
                <span className="font-mono font-semibold text-[#231F1E]">
                  #{lastConfirmedOrder.id}
                </span>{" "}
                ·{" "}
                <span className="font-medium text-[#9E7A38]">
                  {lastConfirmedOrder.tableNumber}
                </span>
              </p>

              <div className="mt-5 border-t border-[#E6D8BE] pt-4 space-y-2.5 text-left">
                {lastConfirmedOrder.items.map((line) => (
                  <div
                    key={line.menuItemId}
                    className="flex items-center justify-between text-[14px]"
                  >
                    <span className="text-[#231F1E]">
                      {line.name}{" "}
                      <span className="text-[#9E7A38]">× {line.quantity}</span>
                    </span>
                    <span className="font-serif font-medium text-[#231F1E]">
                      EGP {(line.unitPrice * line.quantity).toLocaleString()}
                    </span>
                  </div>
                ))}
                <div className="border-t border-[#E6D8BE] pt-2.5 flex items-center justify-between">
                  <span className="font-serif font-medium text-[18px] text-[#231F1E]">
                    Total
                  </span>
                  <span className="font-serif font-semibold text-[20px] text-[#9E7A38]">
                    EGP {lastConfirmedOrder.total.toLocaleString()}
                  </span>
                </div>
              </div>

              <div className="mt-6">
                <Link
                  href={`/menu/${firstCategorySlug}`}
                  onClick={resetConfirmationBanner}
                  className="saborea-gold-btn w-full rounded-[12px] py-3 font-serif text-[17px] font-medium text-white inline-flex items-center justify-center"
                >
                  + طلب إضافات جديدة / Order more items
                </Link>
              </div>
            </div>
          </section>
        ) : cartItems.length === 0 ? (
          /* Empty Cart State */
          <section className="mt-6 saborea-card rounded-[18px] p-8 text-center">
            <p className="font-serif text-[20px] text-[#231F1E]">Your order is empty</p>
            <p className="mt-1 text-[13.5px] text-[#6E655F]">
              Explore our menu to add dishes to your table.
            </p>
            <Link
              href={`/menu/${firstCategorySlug}`}
              className="mt-5 inline-block saborea-gold-btn rounded-full px-6 py-2.5 text-[14px] font-medium text-white"
            >
              Explore Menu
            </Link>
          </section>
        ) : (
          /* Active Review View — Exact Screenshot 4 Match */
          <div className="mt-5 space-y-3.5">
            {/* Itemized Order Card */}
            <section className="saborea-card rounded-[18px] p-4">
              <div>
                {cartItems.map((line, index) => (
                  <React.Fragment key={line.menuItemId}>
                    {index > 0 && <div className="border-t border-[#E6D8BE] my-3.5" />}
                    <div className="flex items-center gap-3.5">
                      <div className="w-[86px] h-[72px] rounded-[12px] border border-[#E5D7BE] overflow-hidden bg-[#F3ECE0] shrink-0">
                        <img
                          src={line.image}
                          alt={line.name}
                          className="w-full h-full object-cover"
                        />
                      </div>

                      <div className="flex-1 min-w-0">
                        <h2 className="font-serif font-medium text-[18px] leading-snug text-[#231F1E]">
                          {line.name}
                        </h2>
                        <p className="text-[14px] font-medium text-[#9E7A38] mt-0.5">
                          × {line.quantity}
                        </p>
                        <p className="text-[13px] text-[#6E655F] mt-0.5">
                          {line.quantity > 1
                            ? `EGP ${line.unitPrice} each`
                            : `EGP ${line.unitPrice}`}
                        </p>
                      </div>

                      <div className="font-serif font-medium text-[18px] text-[#231F1E] shrink-0">
                        EGP {(line.unitPrice * line.quantity).toLocaleString()}
                      </div>
                    </div>
                  </React.Fragment>
                ))}
              </div>

              <div className="border-t border-[#E6D8BE] mt-4 pt-3 text-center">
                <Link
                  href={`/menu/${firstCategorySlug}`}
                  className="text-[14.5px] font-medium text-[#9E7A38] hover:underline"
                >
                  + Add more items
                </Link>
              </div>
            </section>

            {/* Total Card */}
            <section className="saborea-card rounded-[16px] px-5 py-4 flex items-center justify-between">
              <span className="font-serif font-medium text-[20px] text-[#231F1E]">
                Total
              </span>
              <span className="font-serif font-semibold text-[22px] text-[#231F1E]">
                EGP {cartTotal.toLocaleString()}
              </span>
            </section>

            {/* Table Number Card (Locked automatically via QR) */}
            <section className="saborea-card rounded-[16px] px-5 py-4 relative overflow-hidden flex items-center gap-4">
              <div className="w-12 h-12 rounded-full border-[1.5px] border-[#C9B38A] bg-[#FAF6EE] flex items-center justify-center shrink-0">
                <Check className="w-6 h-6 text-[#6B7755] stroke-[2.5]" />
              </div>

              <div className="relative z-10">
                <p className="text-[13.5px] font-medium text-[#231F1E]">Table number</p>
                <p className="font-serif font-medium text-[24px] leading-tight text-[#9E7A38]">
                  {assignedTableNumber}
                </p>
                <p className="text-[12px] text-[#6E655F]">Selected automatically</p>
              </div>

              <BotanicalSprig
                className="pointer-events-none absolute -bottom-2 -right-2 w-24 h-20 opacity-75"
                flip
              />
            </section>

            {/* Confirm Order CTA */}
            <div className="pt-1">
              <button
                type="button"
                onClick={handleConfirm}
                className="saborea-gold-btn w-full rounded-[14px] py-3.5 font-serif text-[20px] font-medium text-white cursor-pointer"
              >
                Confirm order
              </button>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
