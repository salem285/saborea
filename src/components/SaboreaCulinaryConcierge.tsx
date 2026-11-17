"use client";

import React, { useState, useRef, useEffect } from "react";
import { usePathname } from "next/navigation";
import {
  Sparkles,
  X,
  Send,
  Plus,
  Minus,
  Check,
  ChevronDown,
  ChevronUp,
  KeyRound,
  UtensilsCrossed,
  Wine,
  Flame,
  Heart,
  HelpCircle,
} from "lucide-react";
import { useDemoStore, type MenuItem } from "@/context/DemoStoreProvider";
import { BotanicalSprig } from "@/components/SaboreaGraphics";

interface ChatMessage {
  id: string;
  sender: "user" | "assistant";
  text: string;
  thought?: string;
  recommendedDishes?: MenuItem[];
  followUps?: string[];
  isFallback?: boolean;
}

const PRESET_PROMPTS = [
  {
    icon: Wine,
    label: "Drink Pairings",
    prompt: "What drink pairs best with the Black Truffle Tagliatelle and Herb Salmon?",
  },
  {
    icon: Heart,
    label: "Dinner for Two",
    prompt: "Curate a romantic dinner for two under 800 EGP balancing savory and sweet.",
  },
  {
    icon: Flame,
    label: "Warm Comfort Food",
    prompt: "I'm craving something rich, warm, and comforting tonight. What should I order?",
  },
  {
    icon: UtensilsCrossed,
    label: "Chef's First-Timer Set",
    prompt: "This is my first time at Saborea. What are your absolute signature must-try items?",
  },
];

export function openSaboreaConcierge(prompt?: string) {
  if (typeof window !== "undefined") {
    window.dispatchEvent(
      new CustomEvent("open-saborea-concierge", { detail: { prompt } })
    );
  }
}

export function SaboreaCulinaryConcierge() {
  const pathname = usePathname();
  const { menuItems, cart, incrementCart, decrementCart, cartItems } =
    useDemoStore();

  const isCustomerPage =
    !pathname?.startsWith("/cashier") && !pathname?.startsWith("/admin");

  const [isOpen, setIsOpen] = useState(false);
  const [inputMessage, setInputMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [customApiKey, setCustomApiKey] = useState("");
  const [expandedThoughts, setExpandedThoughts] = useState<Record<string, boolean>>({});

  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: "welcome-msg",
      sender: "assistant",
      text: "Buon appetito! I am your Saborea Chef Sommelier, powered by Gemini. Whether you're seeking the ideal beverage pairing, planning a curated feast, or balancing dietary cravings, ask away.",
      followUps: [
        "What pairs with Black Truffle Tagliatelle?",
        "Romantic dinner for two under 800 EGP",
        "Best dessert after pizza",
      ],
    },
  ]);

  const messagesEndRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    // Load local stored key if any
    try {
      const savedKey = localStorage.getItem("saborea_gemini_key");
      if (savedKey) setCustomApiKey(savedKey);
    } catch {}

    const handleOpenEvent = (e: Event) => {
      const customEvent = e as CustomEvent<{ prompt?: string }>;
      setIsOpen(true);
      if (customEvent.detail?.prompt) {
        handleSend(customEvent.detail.prompt);
      }
    };

    window.addEventListener("open-saborea-concierge", handleOpenEvent);
    return () => {
      window.removeEventListener("open-saborea-concierge", handleOpenEvent);
    };
  }, []);

  const saveCustomKey = (key: string) => {
    setCustomApiKey(key);
    try {
      if (key.trim()) {
        localStorage.setItem("saborea_gemini_key", key.trim());
      } else {
        localStorage.removeItem("saborea_gemini_key");
      }
    } catch {}
  };

  useEffect(() => {
    if (isOpen) {
      messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages, isOpen]);

  const handleSend = async (messageText?: string) => {
    const textToSend = (messageText ?? inputMessage).trim();
    if (!textToSend || loading) return;

    const userMsg: ChatMessage = {
      id: `user-${Date.now()}`,
      sender: "user",
      text: textToSend,
    };

    setMessages((prev) => [...prev, userMsg]);
    setInputMessage("");
    setLoading(true);

    try {
      const currentCartSummary = cartItems.map((ci) => ci.name);
      const headers: Record<string, string> = {
        "Content-Type": "application/json",
      };
      if (customApiKey.trim()) {
        headers["x-gemini-api-key"] = customApiKey.trim();
      }

      const res = await fetch("/api/gemini/concierge", {
        method: "POST",
        headers,
        body: JSON.stringify({
          message: textToSend,
          menu: menuItems.map((m) => ({
            id: m.id,
            name: m.name,
            price: m.price,
            category: m.category,
            sold: m.sold,
          })),
          cartItemNames: currentCartSummary,
        }),
      });

      if (!res.ok) {
        throw new Error(`Server responded with ${res.status}`);
      }

      const data = await res.json();

      // Find the full MenuItem objects for recommended IDs
      const matchedDishes: MenuItem[] = (data.recommendedDishIds || [])
        .map((id: string) => menuItems.find((m) => m.id === id))
        .filter(Boolean) as MenuItem[];

      const assistantMsg: ChatMessage = {
        id: `assistant-${Date.now()}`,
        sender: "assistant",
        text: data.reply || "Here are our finest selections for you.",
        thought: data.thought,
        recommendedDishes: matchedDishes,
        followUps: data.quickFollowUps || [],
        isFallback: data.isFallback,
      };

      setMessages((prev) => [...prev, assistantMsg]);
    } catch (err: unknown) {
      console.error("Concierge fetch error:", err);
      setMessages((prev) => [
        ...prev,
        {
          id: `err-${Date.now()}`,
          sender: "assistant",
          text: "I encountered a slight hiccup in our wine cellar. Let me suggest our signature Herb-Seared Salmon and Classic Tiramisu!",
          recommendedDishes: menuItems.filter(
            (m) => m.id === "herb-salmon" || m.id === "classic-tiramisu"
          ),
          followUps: ["What drinks do you have?"],
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  const toggleThought = (msgId: string) => {
    setExpandedThoughts((prev) => ({
      ...prev,
      [msgId]: !prev[msgId],
    }));
  };

  if (!isCustomerPage && !isOpen) {
    return null;
  }

  const isMenuPage = pathname?.startsWith("/menu");
  const buttonBottomClass = isMenuPage
    ? "bottom-24 left-4 sm:bottom-6 sm:left-6"
    : "bottom-5 left-4 sm:bottom-6 sm:left-6";

  return (
    <>
      {/* Floating Trigger Button */}
      <div className={`fixed ${buttonBottomClass} z-40`}>
        <button
          type="button"
          onClick={() => setIsOpen(true)}
          className="group relative flex items-center gap-2.5 rounded-full bg-[#231F1E] text-[#FBF8F1] pl-3.5 pr-4 py-2.5 shadow-[0_8px_24px_rgba(35,31,30,0.32)] border border-[#C49A45]/50 hover:border-[#D1B886] hover:scale-[1.03] transition-all duration-200 cursor-pointer"
          aria-label="Ask Saborea Chef Sommelier"
        >
          <span className="flex items-center justify-center w-8 h-8 rounded-full bg-gradient-to-tr from-[#9E7A38] to-[#D1B886] text-[#231F1E] shadow-sm group-hover:rotate-12 transition-transform">
            <Sparkles className="w-4 h-4 fill-current" />
          </span>
          <div className="text-left">
            <div className="text-[10px] tracking-wider uppercase font-semibold text-[#D1B886] flex items-center gap-1">
              <span>Gemini AI</span>
              <span className="w-1.5 h-1.5 rounded-full bg-[#6B8E6B] animate-pulse" />
            </div>
            <div className="text-[13px] font-medium leading-tight text-[#FAF6EE]">
              Chef Sommelier
            </div>
          </div>
        </button>
      </div>

      {/* Drawer / Modal */}
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/50 backdrop-blur-xs p-0 sm:p-4">
          <div className="relative w-full max-w-[460px] h-[85vh] sm:h-[680px] bg-[#FAF6EE] rounded-t-[28px] sm:rounded-[24px] shadow-2xl flex flex-col overflow-hidden border border-[#D1B886]/40">
            {/* Header */}
            <div className="shrink-0 px-5 pt-4 pb-3.5 bg-gradient-to-b from-[#F2EADA] to-[#FAF6EE] border-b border-[#E5DAC6] relative">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[#9E7A38] to-[#C49A45] flex items-center justify-center text-[#FAF6EE] shadow-sm">
                    <Sparkles className="w-5 h-5 fill-current" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="font-serif font-bold text-[19px] text-[#231F1E]">
                        Chef Sommelier
                      </h3>
                      <span className="text-[10.5px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full bg-[#E5DAC6] text-[#8B6A2B]">
                        Gemini 4
                      </span>
                    </div>
                    <p className="text-[12px] text-[#6E655F]">
                      Artisan culinary pairings &amp; flavor recommendations
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-1.5">
                  <button
                    type="button"
                    onClick={() => setShowSettings((v) => !v)}
                    title="Gemini API Key Settings"
                    className="p-2 rounded-full text-[#8B6A2B] hover:bg-[#EAE0CD] transition cursor-pointer"
                  >
                    <KeyRound className="w-4 h-4" />
                  </button>
                  <button
                    type="button"
                    onClick={() => setIsOpen(false)}
                    className="p-2 rounded-full text-[#6E655F] hover:bg-[#EAE0CD] transition cursor-pointer"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>
              </div>

              {/* Optional API Key banner settings dropdown */}
              {showSettings && (
                <div className="mt-3 p-3 bg-[#FAF6EE] rounded-[12px] border border-[#D1B886]/60 text-[12px]">
                  <div className="flex items-center justify-between font-semibold text-[#231F1E] mb-1">
                    <span>Gemini API Key (Optional)</span>
                    <span className="text-[10px] text-[#8B6A2B]">Client Override</span>
                  </div>
                  <p className="text-[#6E655F] mb-2 leading-relaxed">
                    By default, the server uses <code>GEMINI_API_KEY</code> from <code>.env.local</code>. You can also paste a key directly here for rapid testing.
                  </p>
                  <div className="flex gap-2">
                    <input
                      type="password"
                      placeholder="AIzaSy..."
                      value={customApiKey}
                      onChange={(e) => saveCustomKey(e.target.value)}
                      className="flex-1 px-3 py-1.5 rounded-[8px] bg-white border border-[#D1B886] text-[#231F1E] text-[12px] focus:outline-none focus:ring-1 focus:ring-[#9E7A38]"
                    />
                    {customApiKey && (
                      <button
                        type="button"
                        onClick={() => saveCustomKey("")}
                        className="px-2.5 py-1.5 rounded-[8px] bg-[#EAE0CD] text-[#231F1E] text-[11px] font-medium"
                      >
                        Clear
                      </button>
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Chat Messages Body */}
            <div className="flex-1 overflow-y-auto px-4 py-4 space-y-4 no-scrollbar">
              {messages.map((msg) => {
                const isUser = msg.sender === "user";
                return (
                  <div
                    key={msg.id}
                    className={`flex flex-col ${isUser ? "items-end" : "items-start"}`}
                  >
                    <div
                      className={`max-w-[88%] rounded-[18px] px-4 py-3 text-[14px] leading-relaxed shadow-xs ${
                        isUser
                          ? "bg-[#231F1E] text-[#FAF6EE] rounded-br-[4px]"
                          : "bg-white text-[#231F1E] border border-[#E9DFCE] rounded-bl-[4px]"
                      }`}
                    >
                      {/* Thought Accordion if present */}
                      {!isUser && msg.thought && (
                        <div className="mb-2.5 pb-2 border-b border-[#F0E6D4]">
                          <button
                            type="button"
                            onClick={() => toggleThought(msg.id)}
                            className="flex items-center gap-1.5 text-[11px] font-semibold text-[#8B6A2B] hover:text-[#6E521E] transition cursor-pointer"
                          >
                            <Sparkles className="w-3 h-3" />
                            <span>Sommelier Pairing Rationale</span>
                            {expandedThoughts[msg.id] ? (
                              <ChevronUp className="w-3 h-3" />
                            ) : (
                              <ChevronDown className="w-3 h-3" />
                            )}
                          </button>
                          {expandedThoughts[msg.id] && (
                            <p className="mt-1 text-[11.5px] italic text-[#6E655F] bg-[#FAF6EE] p-2 rounded-[8px]">
                              {msg.thought}
                            </p>
                          )}
                        </div>
                      )}

                      <p className="whitespace-pre-wrap">{msg.text}</p>

                      {/* Recommended Dish Cards */}
                      {!isUser && msg.recommendedDishes && msg.recommendedDishes.length > 0 && (
                        <div className="mt-3.5 space-y-2 pt-2 border-t border-[#F0E6D4]">
                          <div className="text-[11.5px] uppercase tracking-wider font-semibold text-[#8B6A2B]">
                            Recommended Pairings:
                          </div>

                          <div className="space-y-2">
                            {msg.recommendedDishes.map((dish) => {
                              const qty = cart[dish.id] ?? 0;
                              return (
                                <div
                                  key={dish.id}
                                  className="flex items-center justify-between gap-3 p-2.5 rounded-[12px] bg-[#FAF6EE] border border-[#E5DAC6] hover:border-[#C49A45] transition"
                                >
                                  <div className="flex items-center gap-2.5 min-w-0">
                                    <img
                                      src={dish.image}
                                      alt={dish.name}
                                      className="w-12 h-12 rounded-[8px] object-cover shrink-0 border border-[#D1B886]/40"
                                    />
                                    <div className="min-w-0">
                                      <h4 className="font-serif font-semibold text-[14px] text-[#231F1E] truncate">
                                        {dish.name}
                                      </h4>
                                      <div className="flex items-center gap-2 mt-0.5">
                                        <span className="text-[12px] font-semibold text-[#9E7A38]">
                                          EGP {dish.price}
                                        </span>
                                        <span className="text-[10px] uppercase px-1.5 py-0.5 rounded bg-[#EFE8DC] text-[#6E655F]">
                                          {dish.category}
                                        </span>
                                      </div>
                                    </div>
                                  </div>

                                  {/* Add to Cart Actions */}
                                  <div className="shrink-0 flex items-center">
                                    {qty === 0 ? (
                                      <button
                                        type="button"
                                        onClick={() => incrementCart(dish.id)}
                                        className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-[8px] bg-[#231F1E] text-[#FAF6EE] text-[12px] font-medium hover:bg-[#3D3533] transition cursor-pointer"
                                      >
                                        <Plus className="w-3.5 h-3.5" />
                                        <span>Add</span>
                                      </button>
                                    ) : (
                                      <div className="flex items-center gap-1.5 bg-white border border-[#D1B886] rounded-[8px] px-1.5 py-0.5 shadow-2xs">
                                        <button
                                          type="button"
                                          onClick={() => decrementCart(dish.id)}
                                          className="p-1 text-[#6E655F] hover:text-[#231F1E] cursor-pointer"
                                        >
                                          <Minus className="w-3 h-3" />
                                        </button>
                                        <span className="font-medium text-[12px] text-[#231F1E] min-w-[14px] text-center">
                                          {qty}
                                        </span>
                                        <button
                                          type="button"
                                          onClick={() => incrementCart(dish.id)}
                                          className="p-1 text-[#6E655F] hover:text-[#231F1E] cursor-pointer"
                                        >
                                          <Plus className="w-3 h-3" />
                                        </button>
                                      </div>
                                    )}
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Follow-up suggestions */}
                    {!isUser && msg.followUps && msg.followUps.length > 0 && (
                      <div className="mt-2 flex flex-wrap gap-1.5 max-w-[90%]">
                        {msg.followUps.map((prompt, i) => (
                          <button
                            key={i}
                            type="button"
                            onClick={() => handleSend(prompt)}
                            className="text-[11.5px] px-2.5 py-1 rounded-full bg-[#F2E9DA] hover:bg-[#E8DCC8] text-[#8B6A2B] border border-[#D1B886]/50 transition cursor-pointer text-left"
                          >
                            {prompt}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                );
              })}

              {loading && (
                <div className="flex items-start gap-2">
                  <div className="rounded-[18px] bg-white border border-[#E9DFCE] px-4 py-3 text-[13px] text-[#6E655F] shadow-xs flex items-center gap-2">
                    <Sparkles className="w-4 h-4 text-[#C49A45] animate-spin" />
                    <span>Chef Sommelier is tasting &amp; harmonizing pairings...</span>
                  </div>
                </div>
              )}

              <div ref={messagesEndRef} />
            </div>

            {/* Quick Starters Carousel (when only welcome message) */}
            {messages.length <= 1 && (
              <div className="shrink-0 px-4 py-2 border-t border-[#EAE0CD] bg-[#F7F1E6]">
                <div className="text-[11px] uppercase tracking-wider font-semibold text-[#8B6A2B] mb-1.5">
                  Popular Sommelier Questions
                </div>
                <div className="flex gap-2 overflow-x-auto no-scrollbar pb-1">
                  {PRESET_PROMPTS.map((preset, idx) => {
                    const Icon = preset.icon;
                    return (
                      <button
                        key={idx}
                        type="button"
                        onClick={() => handleSend(preset.prompt)}
                        className="shrink-0 flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white border border-[#D1B886]/60 text-[12px] text-[#231F1E] hover:border-[#9E7A38] hover:bg-[#FAF6EE] transition cursor-pointer"
                      >
                        <Icon className="w-3.5 h-3.5 text-[#9E7A38]" />
                        <span>{preset.label}</span>
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Bottom Input Area */}
            <form
              onSubmit={(e) => {
                e.preventDefault();
                handleSend();
              }}
              className="shrink-0 p-3 bg-white border-t border-[#E5DAC6] flex items-center gap-2"
            >
              <input
                type="text"
                value={inputMessage}
                onChange={(e) => setInputMessage(e.target.value)}
                placeholder="Ask about pairings, dinner sets, cravings..."
                disabled={loading}
                className="flex-1 px-4 py-2.5 rounded-full bg-[#FAF6EE] border border-[#D1B886]/70 text-[#231F1E] text-[13.5px] placeholder:text-[#A0958C] focus:outline-none focus:ring-1 focus:ring-[#9E7A38]"
              />
              <button
                type="submit"
                disabled={!inputMessage.trim() || loading}
                className="w-10 h-10 rounded-full bg-[#231F1E] text-[#FAF6EE] flex items-center justify-center hover:bg-[#3D3533] disabled:opacity-40 disabled:cursor-not-allowed transition cursor-pointer shrink-0 shadow-sm"
              >
                <Send className="w-4 h-4 ml-0.5" />
              </button>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
