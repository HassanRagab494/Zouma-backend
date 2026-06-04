import React, { useState, useEffect } from "react";
import { DollarSign, Users, ShoppingBag, CreditCard, ChevronLeft, Gift, ShieldAlert, Award } from "lucide-react";

interface DashboardStats {
  totalRevenue: number;
  totalCollected: number;
  totalDebts: number;
  totalClients: number;
  totalOrders: number;
  salesPerMonth: number[];
  topClients: Array<{ id: string; name: string; code: string; spendings: number; ordersCount: number }>;
}

interface DashboardViewProps {
  token: string;
  onNavigateToView: (view: string) => void;
}

export default function DashboardView({ token, onNavigateToView }: DashboardViewProps) {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const fetchStats = async () => {
    try {
      const response = await fetch("/api/dashboard/stats", {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (!response.ok) {
        throw new Error("فشل تحميل إحصائيات لوحة التحكم.");
      }
      const data = await response.json();
      setStats(data);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStats();
  }, [token]);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center p-12 text-slate-500 gap-2">
        <div className="w-10 h-10 border-4 border-rose-500 border-t-transparent rounded-full animate-spin"></div>
        <span>جاري تحميل الإحصائيات والبيانات المالية لـ زوما...</span>
      </div>
    );
  }

  if (error || !stats) {
    return (
      <div className="p-6 bg-rose-50 border border-rose-100 rounded-2xl text-center text-rose-800">
        <ShieldAlert className="w-10 h-10 mx-auto text-rose-500 mb-2" />
        <h3 className="font-bold text-lg">حدث خطأ أثناء تحميل بيانات لوحة البيانات</h3>
        <p className="text-sm mt-1">{error || "تأكد من إعدادات الاتصال وحالة الخادم"}</p>
        <button 
          onClick={fetchStats}
          className="mt-3 px-4 py-2 bg-rose-600 text-white rounded-xl text-sm font-medium hover:bg-rose-700 transition"
        >
          إعادة المحاولة
        </button>
      </div>
    );
  }

  // Month labels in Arabic
  const arMonths = [
    "يناير", "فبراير", "مارس", "أبريل", "مايو", "يونيو", 
    "يوليو", "أغسطس", "سبتمبر", "أكتوبر", "نوفمبر", "ديسمبر"
  ];

  // Maximum value for scaling the sales charts
  const maxSale = Math.max(...stats.salesPerMonth, 1000);

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-800">الرئيسية والإحصائيات العامة</h2>
          <p className="text-sm text-slate-500 mt-1">مرحباً بك في لوحة تحكّم هدايا Zouma. إليك ملخص الأداء المالي والمبيعات لعام {new Date().getFullYear()}:</p>
        </div>
        <button
          onClick={() => onNavigateToView("orders")}
          className="inline-flex items-center gap-1.5 px-4 py-2.5 bg-rose-600 text-white font-medium text-sm rounded-xl hover:bg-rose-700 transition-all cursor-pointer shadow-md shadow-rose-100"
        >
          <Gift className="w-4 h-4" />
          إنشاء أوردر مبيعات جديد
        </button>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        {/* Total Revenue */}
        <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-slate-500 text-xs font-semibold">إجمالي المبيعات</span>
            <div className="w-9 h-9 rounded-xl bg-orange-50 text-orange-600 flex items-center justify-center">
              <DollarSign className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-4">
            <div className="text-2xl font-extrabold text-slate-900 font-mono">{stats.totalRevenue} <span className="text-xs font-bold font-sans">ج.م</span></div>
            <p className="text-[10px] text-emerald-600 mt-1 font-semibold">إيرادات الأوردرات النشطة</p>
          </div>
        </div>

        {/* Collected */}
        <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-slate-500 text-xs font-semibold">المبالغ المحصلة</span>
            <div className="w-9 h-9 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <CreditCard className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-4">
            <div className="text-2xl font-extrabold text-slate-900 font-mono">{stats.totalCollected} <span className="text-xs font-bold font-sans">ج.م</span></div>
            <p className="text-[10px] text-slate-500 mt-1 font-medium">المدفوعات المستلمة من الزبائن</p>
          </div>
        </div>

        {/* Debts */}
        <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-slate-500 text-xs font-semibold">الديون المتبقية</span>
            <div className="w-9 h-9 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center">
              <ShieldAlert className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-4">
            <div className="text-2xl font-extrabold text-rose-700 font-mono">{stats.totalDebts} <span className="text-xs font-bold font-sans text-rose-600">ج.م</span></div>
            <p className="text-[10px] text-rose-500 mt-1 font-semibold">مستحقات آجلة معلقة بالذمة</p>
          </div>
        </div>

        {/* Total Clients */}
        <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-slate-500 text-xs font-semibold">عملاء المحل</span>
            <div className="w-9 h-9 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
              <Users className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-4">
            <div className="text-2xl font-extrabold text-slate-900 font-mono">{stats.totalClients}</div>
            <p className="text-[10px] text-blue-500 mt-1 font-semibold hover:underline cursor-pointer" onClick={() => onNavigateToView("clients")}>عرض كل المشتركين</p>
          </div>
        </div>

        {/* Total Orders */}
        <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-slate-500 text-xs font-semibold">إجمالي الأوردرات</span>
            <div className="w-9 h-9 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center">
              <ShoppingBag className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-4">
            <div className="text-2xl font-extrabold text-slate-900 font-mono">{stats.totalOrders}</div>
            <p className="text-[10px] text-purple-500 mt-1 font-semibold hover:underline cursor-pointer" onClick={() => onNavigateToView("orders")}>تصفح المبيعات والأوردرات</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Sales Graph */}
        <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-xs lg:col-span-2 space-y-4">
          <div className="flex items-center justify-between border-b border-slate-50 pb-4">
            <h3 className="text-base font-bold text-slate-800">حركة المبيعات الشهرية لـ {new Date().getFullYear()}</h3>
            <span className="text-xs text-rose-600 bg-rose-50 px-2 py-1 rounded-full font-bold">بموجب الأوردرات النشطة بالجنيه المصري</span>
          </div>

          {/* Simple Highly Polish Responsive Vector-like Chart Bars */}
          <div className="h-64 flex items-end justify-between gap-2 pt-6 px-2">
            {stats.salesPerMonth.map((sale, i) => {
              const barHeightPct = stats.salesPerMonth[i] > 0 ? (stats.salesPerMonth[i] / maxSale) * 80 + 10 : 3;
              return (
                <div key={i} className="flex-1 flex flex-col items-center h-full justify-end group">
                  <div className="relative w-full flex items-end justify-center">
                    {/* Tooltip on hover */}
                    <div className="absolute bottom-full mb-2 bg-slate-900 text-white text-[10px] px-2 py-1 rounded-md opacity-0 group-hover:opacity-100 transition duration-150 pointer-events-none z-10 font-mono whitespace-nowrap whitespace-normal">
                      {sale} ج.م
                    </div>
                    {/* Bar */}
                    <div 
                      className={`w-full max-w-[24px] rounded-t-md transition-all duration-500 ${
                        sale > 0 
                        ? 'bg-rose-500 group-hover:bg-rose-650' 
                        : 'bg-slate-100 group-hover:bg-slate-200'
                      }`}
                      style={{ height: `${barHeightPct}%` }}
                    />
                  </div>
                  <span className="text-[10px] text-slate-400 mt-2 font-medium truncate w-full text-center">{arMonths[i]}</span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Top Spendings Clients */}
        <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-xs">
          <div className="flex items-center justify-between pb-3 border-b border-slate-50">
            <div className="flex items-center gap-1.5 text-slate-800 font-bold">
              <Award className="w-5 h-5 text-rose-500" />
              <h3>العملاء الأكثر شراءً</h3>
            </div>
            <button 
              onClick={() => onNavigateToView("clients")}
              className="text-xs text-rose-600 hover:underline inline-flex items-center font-semibold"
            >
              الكل
              <ChevronLeft className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="mt-4 space-y-4">
            {stats.topClients.filter(c => c.spendings > 0).length === 0 ? (
              <div className="text-center py-12 text-slate-400 text-sm">
                <Gift className="w-8 h-8 text-slate-300 mx-auto mb-2" />
                لم تسجل أي مبيعات للعملاء بعد
              </div>
            ) : (
              stats.topClients
                .filter(c => c.spendings > 0)
                .map((client, index) => (
                  <div key={client.id} className="flex items-center justify-between py-2 border-b border-dashed border-slate-100 last:border-0">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-rose-50 text-rose-600 flex items-center justify-center font-bold text-xs">
                        {index + 1}
                      </div>
                      <div>
                        <h4 className="text-xs font-bold text-slate-800">{client.name}</h4>
                        <p className="text-[10px] text-slate-400 font-mono">الكود: {client.code}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-xs font-bold text-slate-900 font-mono">{client.spendings} ج.م</div>
                      <p className="text-[9px] text-slate-400 font-normal">{client.ordersCount} أوردرات</p>
                    </div>
                  </div>
                ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
