import React, { useState } from "react";
import { Gift, Lock, Mail, Terminal, Key } from "lucide-react";

interface LoginViewProps {
  onLoginSuccess: (token: string, user: { id: string; name: string; role: "super_admin" | "employee"; permissions: string[] }) => void;
}

export default function LoginView({ onLoginSuccess }: LoginViewProps) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleLogin = async (e: React.FormEvent, customEmail?: string, customPassword?: string) => {
    if (e) e.preventDefault();
    setError("");
    setIsLoading(true);

    const loginEmail = customEmail || email;
    const loginPassword = customPassword || password;

    if (!loginEmail || !loginPassword) {
      setError("الرجاء إدخال البريد الإلكتروني وكلمة المرور");
      setIsLoading(false);
      return;
    }

    try {
      const response = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: loginEmail, password: loginPassword }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "فشل تسجيل الدخول. تأكد من البيانات.");
      }

      onLoginSuccess(data.token, data.user);
    } catch (err: any) {
      setError(err.message || "حدث خطأ غير متوقع أثناء الاتصال بالخادم");
    } finally {
      setIsLoading(false);
    }
  };

  const handleQuickLogin = (role: "super_admin" | "employee") => {
    if (role === "super_admin") {
      handleLogin(null as any, "admin@zouma.com", "admin123");
    } else {
      handleLogin(null as any, "employee@zouma.com", "admin123");
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md text-center">
        <div className="inline-flex items-center justify-center h-16 w-16 rounded-2xl bg-rose-500 text-white shadow-lg shadow-rose-100 mb-4 animate-bounce">
          <Gift className="h-9 w-9" />
        </div>
        <h2 className="text-3xl font-extrabold text-slate-900 tracking-tight">زوما هدايا • Zouma</h2>
        <p className="mt-2 text-sm text-slate-500">
          نظام المبيعات والمخزون والإدارة المتكامل لمحل الهدايا
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white py-8 px-4 shadow-xl border border-slate-100 rounded-2xl sm:px-10">
          {error && (
            <div className="mb-4 bg-orange-50 border-r-4 border-orange-500 p-3 rounded-lg text-sm text-orange-800">
              {error}
            </div>
          )}

          <form onSubmit={handleLogin} className="space-y-6">
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-1">
                البريد الإلكتروني
              </label>
              <div className="relative rounded-md shadow-xs">
                <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none text-slate-400">
                  <Mail className="h-5 w-5" />
                </div>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="admin@zouma.com"
                  className="block w-full pr-10 pl-3 py-2.5 border border-slate-200 rounded-xl bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-rose-500 text-sm transition-all"
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-1">
                كلمة المرور
              </label>
              <div className="relative rounded-md shadow-xs">
                <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none text-slate-400">
                  <Lock className="h-5 w-5" />
                </div>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="block w-full pr-10 pl-3 py-2.5 border border-slate-200 rounded-xl bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-rose-500 text-sm transition-all"
                  required
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full flex justify-center py-2.5 px-4 border border-transparent rounded-xl shadow-md text-sm font-medium text-white bg-rose-600 hover:bg-rose-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-rose-500 transition-all disabled:opacity-50 cursor-pointer"
            >
              {isLoading ? "جاري تسجيل الدخول..." : "تسجيل الدخول"}
            </button>
          </form>

          <div className="mt-8">
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-slate-100" />
              </div>
              <div className="relative flex justify-center text-xs text-slate-400 uppercase">
                <span className="bg-white px-3 font-semibold">بوابات تجريبية سريعة</span>
              </div>
            </div>

            <div className="mt-4 grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => handleQuickLogin("super_admin")}
                className="inline-flex justify-center items-center py-2.5 px-3 border border-rose-100 rounded-xl shadow-xs bg-rose-50/50 hover:bg-rose-50 text-xs font-semibold text-rose-700 cursor-pointer transition-all gap-1.5"
              >
                <Key className="w-4 h-4 text-rose-500" />
                المدير العام (أدمن)
              </button>

              <button
                type="button"
                onClick={() => handleQuickLogin("employee")}
                className="inline-flex justify-center items-center py-2.5 px-3 border border-slate-100 rounded-xl shadow-xs bg-slate-100/50 hover:bg-slate-100 text-xs font-semibold text-slate-700 cursor-pointer transition-all gap-1.5"
              >
                <Terminal className="w-4 h-4 text-slate-500" />
                الموظف (أحمد)
              </button>
            </div>
            
            <div className="mt-6 text-center text-xs text-slate-400 max-w-sm mx-auto">
              تصفح لوحة التحكم، أضف هدايا ومخزون واربط العملاء وتابع الأرباح وإحصائيات المبيعات فورياً.
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
