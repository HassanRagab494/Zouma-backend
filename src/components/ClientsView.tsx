import React, { useState, useEffect } from "react";
import { Users, Search, UserPlus, Phone, MapPin, Calendar, Clock, Edit3, Trash2, ChevronLeft, ArrowRight, ShieldAlert, Gift } from "lucide-react";
import { Client } from "../types.js";

interface ClientsViewProps {
  token: string;
}

export default function ClientsView({ token }: ClientsViewProps) {
  const [clients, setClients] = useState<Client[]>([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // UI state management
  const [selectedClient, setSelectedClient] = useState<any | null>(null);
  const [showAddForm, setShowAddForm] = useState(false);
  const [showEditForm, setShowEditForm] = useState<Client | null>(null);

  // Form states
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [phone2, setPhone2] = useState("");
  const [address, setAddress] = useState("");
  const [dob, setDob] = useState("");

  const fetchClients = async () => {
    try {
      const response = await fetch("/api/clients", {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (!response.ok) {
        throw new Error("فشل فحص قائمة العملاء");
      }
      const data = await response.json();
      setClients(data);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchClients();
  }, [token]);

  const handleSelectClient = async (id: string) => {
    try {
      const response = await fetch(`/api/clients/${id}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (!response.ok) {
        throw new Error("تعذر تحميل أوردرات العميل المحدد.");
      }
      const data = await response.json();
      setSelectedClient(data);
    } catch (err: any) {
      alert("خطأ: " + err.message);
    }
  };

  const handleCreateClient = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    try {
      const response = await fetch("/api/clients", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ name, phone, phone2, address, dob })
      });

      if (!response.ok) {
        throw new Error("خطأ أثناء إنشاء العميل الجديد");
      }

      await fetchClients();

      // Reset forms
      setName("");
      setPhone("");
      setPhone2("");
      setAddress("");
      setDob("");
      setShowAddForm(false);
    } catch (err: any) {
      alert(err.message);
    }
  };

  const handleEditClient = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!showEditForm || !name.trim()) return;

    try {
      const response = await fetch(`/api/clients/${showEditForm.id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ name, phone, phone2, address, dob })
      });

      if (!response.ok) {
        throw new Error("خطأ أثناء تحديث بيانات العميل");
      }

      await fetchClients();
      
      // Close
      setName("");
      setPhone("");
      setPhone2("");
      setAddress("");
      setDob("");
      setShowEditForm(null);
    } catch (err: any) {
      alert(err.message);
    }
  };

  const handleDeleteClient = async (id: string, clientName: string) => {
    if (!confirm(`هل أنت متأكد تماماً من حذف العميل "${clientName}" مع جميع أوردراته وسجله؟ لا يمكن التراجع عن هذا الإجراء!`)) {
      return;
    }

    try {
      const response = await fetch(`/api/clients/${id}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` }
      });

      if (!response.ok) {
        throw new Error("عذراً، فشل حذف العميل.");
      }

      setSelectedClient(null);
      await fetchClients();
    } catch (err: any) {
      alert(err.message);
    }
  };

  // Filter clients based on search input (by name or code or phone)
  const filteredClients = clients.filter(c => {
    const s = search.toLowerCase();
    return (
      c.name.toLowerCase().includes(s) ||
      c.client_code.includes(s) ||
      (c.phone && c.phone.includes(s)) ||
      (c.phone2 && c.phone2.includes(s))
    );
  });

  return (
    <div className="space-y-6">
      {/* HEADER SECTION */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
            <Users className="w-6 h-6 text-rose-500" />
            إدارة حسابات العملاء
          </h2>
          <p className="text-sm text-slate-500 mt-0.5">تتبع قاعدة البيانات، أكواد العملاء، أرقام التواصل والتاريخ الشرائي الكلي لكل عميل.</p>
        </div>

        {!showAddForm && !showEditForm && !selectedClient && (
          <button
            onClick={() => {
              setName("");
              setPhone("");
              setPhone2("");
              setAddress("");
              setDob("");
              setShowAddForm(true);
            }}
            className="inline-flex items-center gap-1.5 px-4 py-2.5 bg-rose-600 text-white font-medium text-sm rounded-xl hover:bg-rose-700 transition"
          >
            <UserPlus className="w-4 h-4" />
            إضافة عميل جديد
          </button>
        )}
      </div>

      {loading ? (
        <div className="text-center py-12 text-slate-500">جاري تحميل قائمة الزبائن والعملاء...</div>
      ) : error ? (
        <div className="p-4 bg-orange-50 text-orange-850 rounded-xl text-sm justify-center border border-orange-100">{error}</div>
      ) : showAddForm || showEditForm ? (
        /* CREATE / EDIT CLIENT FORM MODAL SKELETON */
        <div className="bg-white rounded-2xl border border-slate-100 p-6 max-w-2xl mx-auto shadow-xs">
          <div className="flex items-center justify-between border-b border-slate-50 pb-4 mb-6">
            <h3 className="text-lg font-bold text-slate-800">
              {showAddForm ? "تسجيل عميل جديد" : `تعديل بيانات العميل: ${showEditForm?.name}`}
            </h3>
            <button
              onClick={() => {
                setShowAddForm(false);
                setShowEditForm(null);
              }}
              className="text-slate-400 hover:text-slate-600 text-sm"
            >
              إلغاء وتراجع
            </button>
          </div>

          <form onSubmit={showAddForm ? handleCreateClient : handleEditClient} className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">اسم العميل بالكامل *</label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
                placeholder="مثال: حسن رجب"
                className="w-full pr-3 pl-3 py-2 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-rose-500 bg-slate-50 hover:bg-white text-sm"
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">رقم الهاتف الأساسي</label>
                <input
                  type="text"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="01012345678"
                  className="w-full pr-3 pl-3 py-2 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-rose-500 bg-slate-50 hover:bg-white text-sm font-mono"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">رقم الهاتف البديل/الواتس</label>
                <input
                  type="text"
                  value={phone2}
                  onChange={(e) => setPhone2(e.target.value)}
                  placeholder="01123456789"
                  className="w-full pr-3 pl-3 py-2 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-rose-500 bg-slate-50 hover:bg-white text-sm font-mono"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">عنوان التوصيل السكني</label>
              <input
                type="text"
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                placeholder="مثال: الجيزة، شارع التحرير، عمارة 5"
                className="w-full pr-3 pl-3 py-2 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-rose-500 bg-slate-50 hover:bg-white text-sm"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">تاريخ ميلاد العميل (لحملات التهاني والهدايا)</label>
              <input
                type="date"
                value={dob}
                onChange={(e) => setDob(e.target.value)}
                className="w-full pr-3 pl-3 py-2 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-rose-500 bg-slate-50 hover:bg-white text-sm font-mono"
              />
            </div>

            <div className="pt-4 flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={() => {
                  setShowAddForm(false);
                  setShowEditForm(null);
                }}
                className="px-4 py-2 border border-slate-200 text-slate-600 rounded-xl text-sm font-medium hover:bg-slate-50 transition"
              >
                رجوع
              </button>
              <button
                type="submit"
                className="px-6 py-2 bg-rose-600 text-white rounded-xl text-sm font-medium hover:bg-rose-700 transition"
              >
                {showAddForm ? "حفظ كعميل جديد" : "تعديل وحفظ البيانات"}
              </button>
            </div>
          </form>
        </div>
      ) : selectedClient ? (
        /* DETAILED CUSTOMER PROFILE & TRANSACTION LOGS VIEW Only */
        <div className="bg-white rounded-2xl border border-slate-100 shadow-xs p-6 space-y-6">
          <div className="flex flex-col md:flex-row md:items-center justify-between pb-4 border-b border-slate-100 gap-4">
            <div className="flex items-center gap-3">
              <button
                onClick={() => setSelectedClient(null)}
                className="p-1.5 border border-slate-100 rounded-lg hover:bg-slate-50 text-slate-600 transition"
              >
                <ArrowRight className="w-5 h-5" />
              </button>
              <div>
                <h3 className="text-xl font-bold text-slate-900">{selectedClient.name}</h3>
                <span className="text-xs bg-rose-50 text-rose-600 px-2.5 py-0.5 rounded-full font-bold font-mono">
                  كود العميل: {selectedClient.client_code}
                </span>
              </div>
            </div>

            <div className="flex items-center gap-1.5">
              <button
                onClick={() => {
                  setName(selectedClient.name);
                  setPhone(selectedClient.phone || "");
                  setPhone2(selectedClient.phone2 || "");
                  setAddress(selectedClient.address || "");
                  setDob(selectedClient.dob ? selectedClient.dob.split("T")[0] : "");
                  setShowEditForm(selectedClient);
                }}
                className="inline-flex items-center gap-1 px-3 py-1.5 border border-slate-100 bg-slate-50 text-slate-700 hover:bg-slate-100 font-bold text-xs rounded-xl transition"
              >
                <Edit3 className="w-3.5 h-3.5" />
                تعديل العميل
              </button>
              <button
                onClick={() => handleDeleteClient(selectedClient.id, selectedClient.name)}
                className="inline-flex items-center gap-1 px-3 py-1.5 border border-rose-100 bg-rose-50 text-rose-700 hover:bg-rose-100 font-bold text-xs rounded-xl transition"
              >
                <Trash2 className="w-3.5 h-3.5 text-rose-600" />
                حذف العميل نهائياً
              </button>
            </div>
          </div>

          {/* Quick Info Grid */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 bg-slate-50 p-4 rounded-xl">
            <div className="space-y-1">
              <span className="text-[10px] text-slate-400 font-semibold uppercase block">رقم الهاتف الأساسي</span>
              <div className="text-sm font-bold text-slate-800 font-mono flex items-center gap-1">
                <Phone className="w-4 h-4 text-slate-400" />
                {selectedClient.phone || "غير متوفر"}
              </div>
            </div>
            <div className="space-y-1">
              <span className="text-[10px] text-slate-400 font-semibold uppercase block">رقم الهاتف البديل/الواتس</span>
              <div className="text-sm font-bold text-slate-800 font-mono">
                {selectedClient.phone2 || "غير متوفر"}
              </div>
            </div>
            <div className="space-y-1">
              <span className="text-[10px] text-slate-400 font-semibold uppercase block">عنوان الإقامة والتوصيل</span>
              <div className="text-sm font-bold text-slate-800 flex items-center gap-1 truncate max-w-xs">
                <MapPin className="w-4 h-4 text-slate-400" />
                {selectedClient.address || "غير محدد"}
              </div>
            </div>
            <div className="space-y-1">
              <span className="text-[10px] text-slate-400 font-semibold uppercase block">تاريخ الميلاد</span>
              <div className="text-sm font-bold text-slate-800 font-mono flex items-center gap-1">
                <Calendar className="w-4 h-4 text-slate-400" />
                {selectedClient.dob ? new Date(selectedClient.dob).toLocaleDateString("ar-EG") : "غير مسجل"}
              </div>
            </div>
          </div>

          {/* Customer History Orders */}
          <div>
            <h4 className="text-base font-bold text-slate-850 mb-3 flex items-center gap-1 text-slate-800">
              <Clock className="w-5 h-5 text-slate-400" />
              سجل الطلبات والأوردرات ({selectedClient.orders?.length || 0})
            </h4>

            {(!selectedClient.orders || selectedClient.orders.length === 0) ? (
              <div className="text-center p-8 border border-dashed border-slate-100 rounded-xl text-slate-400 text-sm">
                لم يقم هذا العميل بأي عمليات مبيعات مسجلة حتى الآن.
              </div>
            ) : (
              <div className="overflow-x-auto rounded-xl border border-slate-100">
                <table className="w-full text-right text-xs">
                  <thead className="bg-slate-50 text-slate-600 font-bold border-b border-slate-100">
                    <tr>
                      <th className="p-3">تاريخ الأوردر</th>
                      <th className="p-3">الحالة المبيعات</th>
                      <th className="p-3 text-center">الخصومات</th>
                      <th className="p-3">المبلغ الكلي</th>
                      <th className="p-3">المدفوع الكاش</th>
                      <th className="p-3">الديون المتبقية</th>
                      <th className="p-3 text-center">أرباح الأوردر</th>
                    </tr>
                  </thead>
                  <tbody>
                    {selectedClient.orders.map((o: any) => {
                      const debt = Math.max(0, o.total - o.paid_amount);
                      return (
                        <tr key={o.id} className="border-b border-slate-50 hover:bg-slate-50/50">
                          <td className="p-3 font-mono">{new Date(o.date).toLocaleDateString("ar-EG")}</td>
                          <td className="p-3 font-bold">
                            <span className={`inline-block px-2.5 py-0.5 rounded-full text-[10px] uppercase font-semibold ${
                              o.status === "DELIVERED" ? "bg-emerald-50 text-emerald-700" :
                              o.status === "CONFIRMED" ? "bg-blue-50 text-blue-700" :
                              o.status === "PROCESSING" ? "bg-yellow-50 text-yellow-700" :
                              o.status === "CANCELLED" ? "bg-red-50 text-red-700" : "bg-slate-100 text-slate-700"
                            }`}>
                              {o.status === "DELIVERED" ? "تم التسليم" :
                               o.status === "CONFIRMED" ? "مؤكد" :
                               o.status === "PROCESSING" ? "قيد التجهيز" :
                               o.status === "CANCELLED" ? "ملغي" : "جديد"}
                            </span>
                          </td>
                          <td className="p-3 text-center font-mono text-rose-600">%{o.discount_percentage}</td>
                          <td className="p-3 font-bold text-slate-900 font-mono">{o.total} ج.م</td>
                          <td className="p-3 font-mono text-emerald-700 font-medium">{o.paid_amount} ج.م</td>
                          <td className="p-3 font-mono">
                            {debt > 0 ? (
                              <span className="text-rose-600 font-bold">{debt} ج.م</span>
                            ) : (
                              <span className="text-emerald-600 font-medium">سدد بالكامل</span>
                            )}
                          </td>
                          <td className="p-3 text-center font-mono font-bold text-blue-700 bg-blue-50/20">{o.profit} ج.م</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      ) : (
        /* STANDARD ALL CUSTOMERS LIST VIEW WITH ADVANCED REAL-TIME FILTER */
        <div className="bg-white rounded-2xl border border-slate-100 shadow-xs p-6 space-y-4">
          <div className="relative">
            <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none text-slate-400">
              <Search className="h-5 w-5" />
            </div>
            <input
              type="text"
              placeholder="ابحث سريعا بالاسم، رقم الموبايل، أو كود العميل (مثال: حسن)..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pr-10 pl-3 py-2.5 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-rose-500 bg-slate-50/50 hover:bg-white text-sm transition-all"
            />
          </div>

          {filteredClients.length === 0 ? (
            <div className="text-center py-16 text-slate-400 text-sm">
              <Users className="w-12 h-12 text-slate-200 mx-auto mb-2" />
              لا يوجد أي عملاء يطابقون شروط البحث الحالية.
            </div>
          ) : (
            <div className="overflow-x-auto rounded-xl border border-slate-100">
              <table className="w-full text-right text-xs">
                <thead className="bg-slate-50 text-slate-600 font-bold border-b border-slate-100">
                  <tr>
                    <th className="p-3 text-center">كود العميل</th>
                    <th className="p-3">الاسم بالكامل</th>
                    <th className="p-3">رقم الهاتف</th>
                    <th className="p-3">عنوان الإقامة</th>
                    <th className="p-3">تاريخ الميلاد</th>
                    <th className="p-3 text-center">أكشن</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredClients.map((client) => (
                    <tr key={client.id} className="border-b border-slate-50 last:border-0 hover:bg-slate-50/70 font-semibold">
                      <td className="p-3 text-center font-bold text-rose-600 font-mono bg-rose-50/20">{client.client_code}</td>
                      <td className="p-3 font-bold text-slate-800 text-sm">
                        <button 
                          onClick={() => handleSelectClient(client.id)}
                          className="hover:text-rose-600 focus:outline-none transition cursor-pointer text-right"
                        >
                          {client.name}
                        </button>
                      </td>
                      <td className="p-3 font-mono">{client.phone || "—"}</td>
                      <td className="p-3 truncate max-w-xs">{client.address || "—"}</td>
                      <td className="p-3 font-mono hover:text-slate-900">{client.dob ? new Date(client.dob).toLocaleDateString("ar-EG") : "—"}</td>
                      <td className="p-3 text-center">
                        <button 
                          onClick={() => handleSelectClient(client.id)}
                          className="px-2.5 py-1.5 bg-slate-100 text-slate-700 hover:bg-rose-500 hover:text-white rounded-lg transition-all text-[11px] font-bold cursor-pointer"
                        >
                          عرض الملف والسجل
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
