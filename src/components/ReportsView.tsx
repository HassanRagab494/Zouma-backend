import React, { useState, useEffect } from "react";
import { BarChart, DollarSign, ArrowUpRight, Award, TrendingUp, Calendar, Download } from "lucide-react";
import { Order } from "../types.js";

interface ReportsViewProps {
  token: string;
}

export default function ReportsView({ token }: ReportsViewProps) {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const fetchOrders = async () => {
    try {
      const response = await fetch("/api/orders", {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (!response.ok) {
        throw new Error("فشل في تحميل السجل المالي لـ زوما.");
      }
      const data = await response.json();
      setOrders(data);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrders();
  }, [token]);

  // Compute stats of active transactions (ignore CANCELLED status)
  const activeOrders = orders.filter(o => o.status !== "CANCELLED");

  const totalWholesaleCost = activeOrders.reduce((acc, o) => acc + Number(o.cost), 0);
  const totalSellingPrice = activeOrders.reduce((acc, o) => acc + Number(o.total), 0);
  const totalGainedProfits = activeOrders.reduce((acc, o) => acc + Number(o.profit), 0);
  const totalDiscountsGiven = activeOrders.reduce((acc, o) => acc + Number(o.discount), 0);
  const totalCollectedCash = activeOrders.reduce((acc, o) => acc + Number(o.paid_amount), 0);
  const totalUncollectedDebt = Math.max(0, totalSellingPrice - totalCollectedCash);

  const averageProfitMargin = totalSellingPrice > 0 ? (totalGainedProfits / totalSellingPrice) * 100 : 0;

  if (loading) {
    return <div className="text-center py-12 text-slate-500">جاري عمل الحسابات والتدقيق المالي...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
            <TrendingUp className="w-6 h-6 text-emerald-600" />
            التقارير والأرباح التفصيلية
          </h2>
          <p className="text-sm text-slate-500 mt-0.5">التدقيق المالي الشامل، تكلفة المشتريات، المبيعات الفعلية، وهوامش صافي الأرباح.</p>
        </div>
      </div>

      {/* Grid boxes cards top */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Total Cost card */}
        <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-xs">
          <span className="text-xs text-slate-400 font-bold uppercase">إجمالي تكلفة المشتريات (الجملة)</span>
          <div className="text-2xl font-black text-rose-700 font-mono mt-2">{totalWholesaleCost.toFixed(1)} ج.م</div>
          <p className="text-[10px] text-slate-500 mt-1 font-semibold">بمثابة رأس المال المدفوع في الهدايا المباعة</p>
        </div>

        {/* Total Sales card */}
        <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-xs">
          <span className="text-xs text-slate-400 font-bold uppercase">إجمالي مبيعات المحل (القطاعي)</span>
          <div className="text-2xl font-black text-slate-800 font-mono mt-2">{totalSellingPrice.toFixed(1)} ج.m</div>
          <p className="text-[10px] text-rose-600 mt-1 font-semibold">بعد خصم التخفيضات الممنوحة بالفواتير</p>
        </div>

        {/* Total Net Profit card */}
        <div className="bg-emerald-550 p-5 rounded-2xl text-white shadow-lg shadow-emerald-50 bg-emerald-700">
          <span className="text-xs text-emerald-100 font-bold uppercase">صافي الأرباح المحققة الكلية</span>
          <div className="text-2xl font-black font-mono mt-2">{totalGainedProfits.toFixed(1)} ج.م</div>
          <p className="text-[10px] text-emerald-100 mt-1 font-semibold">
            متوسط هامش الربح الحالي: {averageProfitMargin.toFixed(1)}% من المبيعات
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Detailed Financial Balance sheet */}
        <div className="bg-white rounded-2xl border border-slate-100 p-6 space-y-4">
          <h3 className="text-base font-bold text-slate-800 border-b border-slate-100 pb-3">كشف ميزانية قائمة الأرباح والخسائر</h3>

          <div className="space-y-3 text-xs font-semibold">
            <div className="flex justify-between items-center py-2.5 border-b border-slate-50 text-slate-600">
              <span>إجمالي الأيرادات والمبيعات الجزئية (الأساسي):</span>
              <span className="font-mono text-slate-800">{(totalSellingPrice + totalDiscountsGiven).toFixed(1)} ج.م</span>
            </div>
            <div className="flex justify-between items-center py-2.5 border-b border-slate-50 text-rose-600">
              <span>إجمالي قيمة الخصومات الممنوحة للزبائن (-):</span>
              <span className="font-mono">-{totalDiscountsGiven.toFixed(1)} ج.م</span>
            </div>
            <div className="flex justify-between items-center py-2.5 border-b border-slate-50 text-slate-700">
              <span>تكلفة البضائع المبيوعة (جملة) (-):</span>
              <span className="font-mono">-{totalWholesaleCost.toFixed(1)} ج.م</span>
            </div>
            <div className="flex justify-between items-center py-3 border-b border-slate-100 text-slate-900 font-bold text-sm bg-slate-50 p-2.5 rounded-lg">
              <span>صافي الربح المالي المحقق (+):</span>
              <span className="font-mono text-emerald-700">+{totalGainedProfits.toFixed(1)} ج.م</span>
            </div>
          </div>
        </div>

        {/* Financial Flow Analysis */}
        <div className="bg-white rounded-2xl border border-slate-100 p-6 space-y-4">
          <h3 className="text-base font-bold text-slate-800 border-b border-slate-100 pb-3">تحليل التدفق النقدي والتحصيل الكاش</h3>

          <div className="space-y-4 text-xs font-semibold">
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-emerald-50 border border-emerald-100 rounded-xl p-4">
                <span className="text-[10px] text-emerald-700 font-bold block mb-1">المحّصل الفعلي (كاش)</span>
                <span className="text-base font-black text-emerald-800 font-mono">{totalCollectedCash.toFixed(1)} ج.م</span>
              </div>

              <div className="bg-rose-50 border border-rose-100 rounded-xl p-4">
                <span className="text-[10px] text-rose-700 font-bold block mb-1">الديون والذمم المعلقة</span>
                <span className="text-base font-black text-rose-800 font-mono">{totalUncollectedDebt.toFixed(1)} ج.م</span>
              </div>
            </div>

            <div className="p-3 bg-yellow-50 text-yellow-850 rounded-xl font-normal text-[11px] leading-relaxed">
              ⚠️ <strong>ملحوظة الذمم المالية:</strong> تمثل الديون المعلقة المبالغ المبيوعة بآجل للعملاء والتي لم تسدد حتى الآن. يرجى مراجعة صفحة الأوردرات للتحصيل النقدي وتعديل الدفوعات دورياً لضمان سلامة التدفق النقدي للمحل.
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
