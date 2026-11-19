"use client";

import React, { Suspense, useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Lock, ShieldCheck, Store } from "lucide-react";
import {
  BotanicalSprig,
  SaboreaCanvasBackground,
  SaboreaLogo,
} from "@/components/SaboreaGraphics";
import type { StaffRole } from "@/lib/auth";

function LoginFormContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const initialRoleParam = searchParams.get("role");

  const [role, setRole] = useState<StaffRole>(
    initialRoleParam === "admin" ? "admin" : "cashier"
  );
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (initialRoleParam === "admin" || initialRoleParam === "cashier") {
      setRole(initialRoleParam);
    }
  }, [initialRoleParam]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!password.trim() || loading) return;

    setLoading(true);
    setError(null);

    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ role, password }),
      });

      const data = (await res.json()) as {
        ok?: boolean;
        redirectTo?: string;
        error?: string;
      };

      if (!res.ok || !data.ok) {
        setError(data.error || "كلمة المرور غير صحيحة");
        setLoading(false);
        return;
      }

      router.replace(data.redirectTo || (role === "admin" ? "/admin" : "/cashier"));
      router.refresh();
    } catch {
      setError("تعذر الاتصال بالخادم، حاول مرة أخرى.");
      setLoading(false);
    }
  };

  return (
    <div className="saborea-card w-full max-w-[390px] rounded-[20px] p-6 sm:p-7 relative overflow-hidden">
      <BotanicalSprig
        className="pointer-events-none absolute -top-2 -right-2 w-24 h-16 opacity-65"
        flip
      />

      <div className="text-center">
        <span className="inline-flex items-center gap-1.5 rounded-full bg-[#EFE5D2] px-3 py-1 text-[11.5px] font-medium text-[#7D5E24]">
          <Lock className="w-3.5 h-3.5 text-[#C49A45]" />
          بوابة الموظفين المحمية
        </span>
        <h1 className="mt-2.5 font-serif font-bold text-[28px] leading-tight text-[#231F1E]">
          تسجيل الدخول
        </h1>
        <p className="mt-1 text-[13.5px] text-[#6E655F]">
          اختر الصلاحية وأدخل الرقم السري للمتابعة
        </p>
      </div>

      {/* Role Segmented Switcher */}
      <div className="mt-5 rounded-full border border-[#DECBA4] bg-[#FAF6EE] p-1 grid grid-cols-2">
        <button
          type="button"
          onClick={() => {
            setRole("cashier");
            setError(null);
          }}
          className={`rounded-full py-2 text-[13.5px] font-medium inline-flex items-center justify-center gap-1.5 transition cursor-pointer ${
            role === "cashier"
              ? "saborea-gold-btn text-white"
              : "text-[#4E4640] hover:bg-[#F3ECE0]"
          }`}
        >
          <Store className="w-4 h-4" />
          <span>الكاشير (Cashier)</span>
        </button>

        <button
          type="button"
          onClick={() => {
            setRole("admin");
            setError(null);
          }}
          className={`rounded-full py-2 text-[13.5px] font-medium inline-flex items-center justify-center gap-1.5 transition cursor-pointer ${
            role === "admin"
              ? "saborea-gold-btn text-white"
              : "text-[#4E4640] hover:bg-[#F3ECE0]"
          }`}
        >
          <ShieldCheck className="w-4 h-4" />
          <span>الإدارة (Admin)</span>
        </button>
      </div>

      <form onSubmit={handleSubmit} className="mt-5 space-y-4">
        <div>
          <label className="block text-[13px] font-medium text-[#231F1E] mb-1.5">
            {role === "admin"
              ? "كلمة مرور مدير النظام (Admin Password)"
              : "كلمة مرور الكاشير (Cashier Password)"}
          </label>
          <input
            type="password"
            required
            autoFocus
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="••••••••••"
            className="w-full rounded-[12px] border border-[#DECBA4] bg-white px-4 py-2.5 text-[15px] text-[#231F1E] focus:outline-none focus:border-[#B58938]"
          />
        </div>

        {error && (
          <div className="rounded-[10px] border border-[#D98282] bg-[#FDF2F2] px-3.5 py-2.5 text-[13px] text-[#9E2A2A] text-center">
            {error}
          </div>
        )}

        <button
          type="submit"
          disabled={loading}
          className="saborea-gold-btn w-full rounded-[12px] py-3 font-serif text-[18px] font-medium text-white disabled:opacity-60 cursor-pointer"
        >
          {loading
            ? "جاري التحقق..."
            : role === "admin"
              ? "دخول لوحة الإدارة"
              : "دخول نقطة بيع الكاشير"}
        </button>
      </form>
    </div>
  );
}

export default function LoginPage() {
  return (
    <div className="relative min-h-screen w-full overflow-x-hidden flex flex-col items-center justify-center px-4 py-10">
      <SaboreaCanvasBackground showTopLeaves />

      <div className="relative z-10 flex flex-col items-center w-full max-w-[430px]">
        <div className="mb-6">
          <SaboreaLogo variant="stacked" size="md" />
        </div>

        <Suspense
          fallback={
            <div className="saborea-card w-full max-w-[390px] rounded-[20px] p-8 text-center font-serif text-[18px] text-[#6E655F]">
              Loading...
            </div>
          }
        >
          <LoginFormContent />
        </Suspense>
      </div>
    </div>
  );
}
