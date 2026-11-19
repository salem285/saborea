"use client";

import React, { useRef, useState } from "react";
import Link from "next/link";
import { ChevronRight, MapPin, Plus, ShoppingBag, Star, X } from "lucide-react";
import { useDemoStore } from "@/context/DemoStoreProvider";
import {
  BotanicalSprig,
  FindUsMapIllustration,
  SaboreaCanvasBackground,
  SaboreaLogo,
} from "@/components/SaboreaGraphics";

export default function CustomerHomePage() {
  const {
    categories,
    reviews,
    addReview,
    cartCount,
    cartTotal,
    assignedTableNumber,
    isTableVerifiedByQr,
  } = useDemoStore();

  const carouselRef = useRef<HTMLDivElement | null>(null);
  const [activeDot, setActiveDot] = useState(0);
  const [showDirectionsModal, setShowDirectionsModal] = useState(false);

  // Add Review Modal state (3 fields only: Name, Stars 1-5, Comment)
  const [showReviewModal, setShowReviewModal] = useState(false);
  const [reviewerName, setReviewerName] = useState("");
  const [reviewRating, setReviewRating] = useState<number>(5);
  const [reviewComment, setReviewComment] = useState("");
  const [submittingReview, setSubmittingReview] = useState(false);

  const handleScroll = () => {
    const el = carouselRef.current;
    if (!el || categories.length === 0) return;
    const cardStep = 182;
    const idx = Math.min(
      categories.length - 1,
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

  const handleReviewSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!reviewerName.trim() || !reviewComment.trim() || submittingReview) return;
    setSubmittingReview(true);
    await addReview({
      authorName: reviewerName.trim(),
      rating: reviewRating,
      comment: reviewComment.trim(),
    });
    setSubmittingReview(false);
    setReviewerName("");
    setReviewRating(5);
    setReviewComment("");
    setShowReviewModal(false);
  };

  const firstCategorySlug = categories[0]?.slug ?? "pizza";

  return (
    <div className="relative min-h-screen w-full overflow-x-hidden pb-24">
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

          {isTableVerifiedByQr && (
            <div className="mt-2.5 inline-flex items-center gap-1.5 rounded-full bg-[#EFE5D2] border border-[#DECBA4] px-3 py-0.5 text-[12px] font-medium text-[#7D5E24]">
              <span className="w-2 h-2 rounded-full bg-[#6B8E6B]" />
              <span>{assignedTableNumber}</span>
            </div>
          )}
        </header>

        {/* Explore the menu */}
        <section className="mt-1">
          <h2 className="font-serif font-bold text-[26px] leading-tight text-[#231F1E] tracking-[-0.01em]">
            Explore the menu
          </h2>

          {categories.length > 0 ? (
            <>
              <div
                ref={carouselRef}
                onScroll={handleScroll}
                className="mt-3.5 -mr-4 pr-4 flex gap-3.5 overflow-x-auto no-scrollbar scroll-smooth"
              >
                {categories.map((cat) => (
                  <Link
                    key={cat.id || cat.slug}
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
                    <div className="mt-3 flex items-center justify-between gap-2">
                      <span className="font-serif font-medium text-[20px] leading-none text-[#231F1E] truncate">
                        {cat.label}
                      </span>
                      <span className="w-7 h-7 rounded-full saborea-gold-btn flex items-center justify-center text-[#231F1E] shrink-0">
                        <ChevronRight className="w-4 h-4 stroke-[2.2]" />
                      </span>
                    </div>
                  </Link>
                ))}
              </div>

              {/* Pagination Dots */}
              <div className="mt-4 flex items-center justify-center gap-2 flex-wrap">
                {categories.map((cat, idx) => (
                  <button
                    key={cat.id || cat.slug}
                    type="button"
                    onClick={() => scrollToCard(idx)}
                    aria-label={`Show ${cat.label}`}
                    className={`w-2 h-2 rounded-full transition cursor-pointer ${
                      activeDot === idx ? "bg-[#B58938] scale-110" : "bg-[#D9CEB8]"
                    }`}
                  />
                ))}
              </div>
            </>
          ) : (
            <div className="mt-3.5 saborea-card rounded-[16px] p-6 text-center text-[14px] text-[#6E655F]">
              Loading menu categories...
            </div>
          )}
        </section>

        {/* Guest stories (Live Reviews from Supabase) */}
        <section className="mt-7">
          <div className="flex items-center justify-between gap-2">
            <h2 className="font-serif font-bold text-[26px] leading-tight text-[#231F1E] tracking-[-0.01em]">
              Guest stories
            </h2>
            <button
              type="button"
              onClick={() => setShowReviewModal(true)}
              className="inline-flex items-center gap-1 rounded-full border border-[#BFA36F] bg-[#FDFBF7] px-3 py-1 text-[12.5px] font-medium text-[#8B6A2B] hover:bg-[#F5EBD6] transition cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>أضف تقييمك / Add a Review</span>
            </button>
          </div>

          {reviews.length > 0 ? (
            <div className="mt-3.5 -mr-4 pr-4 flex gap-3 overflow-x-auto no-scrollbar">
              {reviews.map((review) => (
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
                    {/* Gold Stars */}
                    <div className="flex items-center gap-0.5 text-[#C49A45]">
                      {[1, 2, 3, 4, 5].map((star) => (
                        <Star
                          key={star}
                          className={`w-3.5 h-3.5 ${
                            star <= review.rating
                              ? "fill-[#C49A45] text-[#C49A45]"
                              : "text-[#D9CEB8]"
                          }`}
                        />
                      ))}
                    </div>

                    {/* Quote */}
                    <p className="mt-3 font-serif text-[14.5px] leading-[1.35] text-[#231F1E] line-clamp-3">
                      “{review.comment.replace(/^[“"]+|[”"]+$/g, "")}”
                    </p>
                  </div>

                  {/* Reviewer */}
                  <div className="mt-4 flex items-center gap-2.5">
                    <span className="w-8 h-8 rounded-full bg-[#ECE2D0] border border-[#C6AF82] flex items-center justify-center font-serif text-[13px] font-medium text-[#231F1E] shrink-0">
                      {review.initials}
                    </span>
                    <span className="font-serif text-[14.5px] text-[#231F1E] truncate">
                      {review.authorName}
                    </span>
                  </div>
                </article>
              ))}
            </div>
          ) : (
            <div className="mt-3.5 saborea-card rounded-[16px] p-5 text-center">
              <p className="font-serif text-[16px] text-[#231F1E]">
                كن أول من يشارك تجربته في SABOREA
              </p>
              <button
                type="button"
                onClick={() => setShowReviewModal(true)}
                className="mt-3 saborea-gold-btn rounded-full px-5 py-2 text-[13px] font-medium text-white cursor-pointer"
              >
                أضف تقييمك الآن
              </button>
            </div>
          )}
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

      {/* Add Guest Review Modal (3 Fields Only: Name, Stars 1-5, Comment) */}
      {showReviewModal && (
        <div className="fixed inset-0 z-50 bg-[#231F1E]/35 backdrop-blur-[2px] flex items-center justify-center p-4">
          <form
            onSubmit={handleReviewSubmit}
            className="saborea-card w-full max-w-[380px] rounded-[20px] p-6 relative"
          >
            <button
              type="button"
              onClick={() => setShowReviewModal(false)}
              className="absolute top-4 right-4 p-1.5 rounded-full text-[#6E655F] hover:bg-[#F3ECE0] cursor-pointer"
              aria-label="Close"
            >
              <X className="w-4 h-4" />
            </button>

            <p className="text-[11px] uppercase tracking-wider text-[#9E7A38] font-medium">
              Guest stories
            </p>
            <h3 className="mt-1 font-serif font-semibold text-[23px] text-[#231F1E]">
              أضف تقييمك / Share your review
            </h3>

            <div className="mt-4 space-y-4">
              {/* Field 1: Name */}
              <div>
                <label className="block text-[13px] font-medium text-[#231F1E] mb-1">
                  الاسم (Name)
                </label>
                <input
                  type="text"
                  required
                  value={reviewerName}
                  onChange={(e) => setReviewerName(e.target.value)}
                  placeholder="مثال: أحمد م. / Emma J."
                  className="w-full rounded-[10px] border border-[#DECBA4] bg-white px-3.5 py-2 text-[14px] text-[#231F1E] focus:outline-none focus:border-[#B58938]"
                />
              </div>

              {/* Field 2: 1-5 Star Rating */}
              <div>
                <label className="block text-[13px] font-medium text-[#231F1E] mb-1.5">
                  التقييم بالنجوم (Rating 1–5)
                </label>
                <div className="flex items-center gap-2">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button
                      key={star}
                      type="button"
                      onClick={() => setReviewRating(star)}
                      className="p-1.5 rounded-full hover:bg-[#F3ECE0] transition cursor-pointer"
                      aria-label={`Rate ${star} stars`}
                    >
                      <Star
                        className={`w-6 h-6 ${
                          star <= reviewRating
                            ? "fill-[#C49A45] text-[#C49A45]"
                            : "text-[#D9CEB8]"
                        }`}
                      />
                    </button>
                  ))}
                  <span className="ml-1 text-[13px] font-medium text-[#8B6A2B]">
                    {reviewRating} / 5
                  </span>
                </div>
              </div>

              {/* Field 3: Review Comment */}
              <div>
                <label className="block text-[13px] font-medium text-[#231F1E] mb-1">
                  التعليق (Review)
                </label>
                <textarea
                  rows={3}
                  required
                  value={reviewComment}
                  onChange={(e) => setReviewComment(e.target.value)}
                  placeholder="شاركنا رأيك في الأجواء والطعم..."
                  className="w-full rounded-[10px] border border-[#DECBA4] bg-white px-3.5 py-2 text-[14px] text-[#231F1E] focus:outline-none focus:border-[#B58938] resize-none"
                />
              </div>
            </div>

            <div className="mt-5 flex gap-2.5">
              <button
                type="submit"
                disabled={submittingReview}
                className="saborea-gold-btn flex-1 rounded-full py-2.5 font-serif text-[16px] font-medium text-white disabled:opacity-60 cursor-pointer"
              >
                {submittingReview ? "جاري الحفظ..." : "إرسال التقييم"}
              </button>
              <button
                type="button"
                onClick={() => setShowReviewModal(false)}
                className="px-4 rounded-full border border-[#DECBA4] text-[13.5px] text-[#6E655F] hover:bg-[#F3ECE0] cursor-pointer"
              >
                إلغاء
              </button>
            </div>
          </form>
        </div>
      )}

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
                href={`/menu/${firstCategorySlug}`}
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
