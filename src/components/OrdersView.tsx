import React, { useState, useEffect } from "react";
import { Search, ShoppingBag, Plus, Minus, Trash, PlusCircle, CheckCircle, Eye, Printer, Gift, Trash2, X } from "lucide-react";
import { Order, Client, Product } from "../types.js";

interface OrdersViewProps {
  token: string;
}

export default function OrdersView({ token }: OrdersViewProps) {
  const [orders, setOrders] = useState<Order[]>([]);
  const [clients, setClients] = useState<Client[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // Create Mode states
  const [isCreating, setIsCreating] = useState(false);
  const [selectedClientId, setSelectedClientId] = useState("");
  const [orderDate, setOrderDate] = useState(() => new Date().toISOString().split("T")[0]);
  const [discountPercent, setDiscountPercent] = useState(0);
  const [paidAmt, setPaidAmt] = useState(0);
  const [orderNotes, setOrderNotes] = useState("");
  const [cartItems, setCartItems] = useState<Array<{ product_id: string; name: string; price: number; qty: number; wholesale_price: number }>>([]);

  // Selected item inputs
  const [selectedProductToAddId, setSelectedProductToAddId] = useState("");
  const [addQty, setAddQty] = useState(1);

  // View / Dialog inspect state
  const [activeOrderDetails, setActiveOrderDetails] = useState<any | null>(null);

  const loadInitialData = async () => {
    try {
      setLoading(true);
      // Fetch orders
      const ordersRes = await fetch("/api/orders", { headers: { Authorization: `Bearer ${token}` } });
      const ordersData = await ordersRes.json();
      setOrders(ordersData);

      // Fetch clients
      const clientsRes = await fetch("/api/clients", { headers: { Authorization: `Bearer ${token}` } });
      const clientsData = await clientsRes.json();
      setClients(clientsData);

      // Fetch products
      const productsRes = await fetch("/api/products", { headers: { Authorization: `Bearer ${token}` } });
      const productsData = await productsRes.json();
      setProducts(productsData);

    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadInitialData();
  }, [token]);

  // Cart operations
  const handleAddItemToCart = () => {
    if (!selectedProductToAddId) return;
    const prod = products.find(p => p.id === selectedProductToAddId);
    if (!prod) return;

    // Check if stock is 0
    if (prod.stock === 0) {
      alert("⚠️ هذا المنتج نفذت كميته تماماً من المخزن حالياً.");
      return;
    }

    // Check if already in cart
    const existingIdx = cartItems.findIndex(i => i.product_id === prod.id);
    if (existingIdx !== -1) {
      const updated = [...cartItems];
      updated[existingIdx].qty += addQty;
      setCartItems(updated);
    } else {
      setCartItems([...cartItems, {
        product_id: prod.id,
        name: prod.name,
        price: prod.selling_price,
        qty: addQty,
        wholesale_price: prod.wholesale_price
      }]);
    }

    setSelectedProductToAddId("");
    setAddQty(1);
  };

  const handleRemoveFromCart = (index: number) => {
    setCartItems(cartItems.filter((_, i) => i !== index));
  };

  const handleUpdateItemQty = (index: number, change: number) => {
    const updated = [...cartItems];
    updated[index].qty = Math.max(1, updated[index].qty + change);
    setCartItems(updated);
  };

  // Real-time calculations inside UI
  const subTotal = cartItems.reduce((acc, item) => acc + (item.price * item.qty), 0);
  const calculatedDiscount = (subTotal * discountPercent) / 100;
  const calculatedTotal = Math.max(0, subTotal - calculatedDiscount);
  const costTotal = cartItems.reduce((acc, item) => acc + (item.wholesale_price * item.qty), 0);
  const estimatedProfit = calculatedTotal - costTotal;

  // Submit order mapi call
  const handleSubmitOrder = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedClientId) {
      alert("الرجاء اختيار العميل أولاً");
      return;
    }
    if (cartItems.length === 0) {
      alert("الرجاء إضافة منتج واحد على الأقل لكارت الأوردر");
      return;
    }

    try {
      const response = await fetch("/api/orders", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          client_id: selectedClientId,
          status: "NEW", // Starts as NEW
          date: orderDate,
          discount_percentage: discountPercent,
          paid_amount: paidAmt,
          notes: orderNotes,
          items: cartItems
        })
      });

      if (!response.ok) {
        throw new Error("حدث فشل أثناء حفظ الأوردر بالخادم");
      }

      // Reset
      setIsCreating(false);
      setSelectedClientId("");
      setDiscountPercent(0);
      setPaidAmt(0);
      setOrderNotes("");
      setCartItems([]);
      
      await loadInitialData();
    } catch (err: any) {
      alert(err.message);
    }
  };

  // Delete Order
  const handleDeleteOrder = async (id: string) => {
    if (!confirm("هل تريد بالتأكيد حذف هذا الأوردر؟ سيتم إرجاع كميات المخزون المستهلكة آلياً إذا لم يكن الأوردر مسلماً.")) {
      return;
    }

    try {
      const response = await fetch(`/api/orders/${id}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` }
      });

      if (!response.ok) {
        throw new Error("فشل إتمام عملية حذف الأوردر.");
      }

      await loadInitialData();
    } catch (err: any) {
      alert(err.message);
    }
  };

  // Quick Change Status
  const handleUpdateStatus = async (orderId: string, newStatus: string) => {
    try {
      const response = await fetch(`/api/orders/${orderId}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ status: newStatus })
      });

      if (!response.ok) {
        throw new Error("فشل تعديل حالة الأوردر المحدد.");
      }

      if (activeOrderDetails && activeOrderDetails.id === orderId) {
        // Refresh detail view
        handleInspectOrder(orderId);
      }

      await loadInitialData();
    } catch (err: any) {
      alert(err.message);
    }
  };

  // Quick Change Paid Amount
  const handleUpdatePaid = async (orderId: string, amt: number) => {
    try {
      const response = await fetch(`/api/orders/${orderId}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ paid_amount: amt })
      });

      if (!response.ok) {
        throw new Error("فشل تعديل المبلغ المدفوع.");
      }

      if (activeOrderDetails && activeOrderDetails.id === orderId) {
         handleInspectOrder(orderId);
      }

      await loadInitialData();
    } catch (err: any) {
      alert(err.message);
    }
  };

  // Inspect detailed invoice
  const handleInspectOrder = async (id: string) => {
    try {
      const response = await fetch(`/api/orders/${id}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (!response.ok) {
        throw new Error("تعذر جلب تفاصيل الفاتورة المطلوبة");
      }
      const data = await response.json();
      setActiveOrderDetails(data);
    } catch (err: any) {
      alert(err.message);
    }
  };

  // Filter orders by searching client name or code
  const filteredOrders = orders.filter(o => {
    const s = search.toLowerCase();
    return (
      (o.client_name && o.client_name.toLowerCase().includes(s)) ||
      (o.client_code && o.client_code.includes(s)) ||
      o.id.includes(s)
    );
  });

  return (
    <div className="space-y-6">
      {/* HEADER SECTION */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
            <ShoppingBag className="w-6 h-6 text-rose-500" />
            مركز إدارة المبيعات والأوردرات
          </h2>
          <p className="text-sm text-slate-500 mt-0.5">سجل المبيعات، عدل الحالة، حدد المبالغ المدفوعة، واحسب الهوامش الربحية فورياً.</p>
        </div>

        {!isCreating && !activeOrderDetails && (
          <button
            onClick={() => {
              setIsCreating(true);
              setCartItems([]);
              setSelectedClientId("");
              setDiscountPercent(0);
              setPaidAmt(0);
              setOrderNotes("");
            }}
            className="inline-flex items-center gap-1.5 px-4 py-2.5 bg-rose-600 text-white font-medium text-sm rounded-xl hover:bg-rose-700 transition shadow-md shadow-rose-100"
          >
            <PlusCircle className="w-4 h-4" />
            إنشاء أوردر مبيعات جديد
          </button>
        )}
      </div>

      {loading ? (
        <div className="text-center py-12 text-slate-500">جاري مسح بيانات مركز المبيعات والأوردرات...</div>
      ) : error ? (
        <div className="p-4 bg-orange-50 text-orange-850 rounded-xl text-sm border border-orange-100">{error}</div>
      ) : isCreating ? (
        /* INTERACTIVE BULLETPROOF ORDER BUILDER */
        <div className="bg-white rounded-2xl border border-slate-100 shadow-xs p-6 space-y-6">
          <div className="flex items-center justify-between border-b border-slate-150 pb-4">
            <h3 className="text-lg font-bold text-slate-800">فاتورة أوردر مبيعات جديدة</h3>
            <button
              onClick={() => setIsCreating(false)}
              className="text-slate-400 hover:text-slate-600 text-sm flex items-center gap-1 font-bold"
            >
              <X className="w-4 h-4" />
              إلغاء وخروج
            </button>
          </div>

          <form onSubmit={handleSubmitOrder} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Select Client dropdown */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">اختر العميل المشتري *</label>
                <select
                  value={selectedClientId}
                  onChange={(e) => {
                    setSelectedClientId(e.target.value);
                  }}
                  required
                  className="w-full pr-3 pl-3 py-2.5 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-rose-500 bg-slate-50 text-sm font-semibold select-none"
                >
                  <option value="">-- اضغط للاختيار --</option>
                  {clients.map(c => (
                    <option key={c.id} value={c.id}>
                      {c.name} ( كود: {c.client_code} )
                    </option>
                  ))}
                </select>
              </div>

              {/* Order input date */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">تاريخ تحرير الفاتورة *</label>
                <input
                  type="date"
                  value={orderDate}
                  onChange={(e) => setOrderDate(e.target.value)}
                  required
                  className="w-full pr-3 pl-3 py-2.5 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-rose-500 bg-slate-50 text-sm font-semibold font-mono"
                />
              </div>
            </div>

            {/* Shopping cart component builder */}
            <div className="border border-slate-100 rounded-xl p-4 bg-slate-50/50 space-y-4">
              <h4 className="text-sm font-bold text-slate-850">إضافة الهدايا والمنتجات لسلة الأوردر</h4>
              
              <div className="flex flex-col md:flex-row gap-3 items-end">
                <div className="flex-1">
                  <label className="block text-xs text-slate-500 mb-1">صنف الهدية</label>
                  <select
                    value={selectedProductToAddId}
                    onChange={(e) => setSelectedProductToAddId(e.target.value)}
                    className="w-full pr-3 pl-3 py-2 border border-slate-200 rounded-xl bg-white text-xs text-slate-800"
                  >
                    <option value="">-- اختر الهدية للضم --</option>
                    {products.map(p => (
                      <option key={p.id} value={p.id} disabled={p.stock <= 0}>
                        {p.name} - سعر: {p.selling_price} ج.م (المخزون الحالي: {p.stock} قطعة) {p.stock === 0 ? '[نفذت]' : ''}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="w-24">
                  <label className="block text-xs text-slate-500 mb-1">الكمية المطلوبة</label>
                  <input
                    type="number"
                    min="1"
                    value={addQty}
                    onChange={(e) => setAddQty(Math.max(1, Number(e.target.value)))}
                    className="w-full pr-3 pl-3 py-2 border border-slate-200 rounded-xl bg-white text-xs text-center font-mono font-bold"
                  />
                </div>

                <button
                  type="button"
                  onClick={handleAddItemToCart}
                  className="px-4 py-2 bg-slate-800 text-white rounded-xl text-xs font-semibold hover:bg-slate-900 transition gap-1.5 flex items-center h-9 justify-center cursor-pointer"
                >
                  <Plus className="w-4 h-4" />
                  إضافة
                </button>
              </div>

              {/* Cart List table */}
              {cartItems.length === 0 ? (
                <div className="text-center py-8 text-slate-400 text-xs font-medium">سلة الأوردر فارغة تماماً. اختر هدايا المحل لإثراء الطلب.</div>
              ) : (
                <div className="overflow-x-auto rounded-lg border border-slate-150 bg-white">
                  <table className="w-full text-right text-xs">
                    <thead className="bg-[#fcfcfc] text-slate-500 font-bold border-b border-slate-150">
                      <tr>
                        <th className="p-2.5">اسم الصنف المعالج</th>
                        <th className="p-2.5 text-center">السعر الفردي</th>
                        <th className="p-2.5 text-center">الكمية المطلوبة</th>
                        <th className="p-2.5">المجموع الجزئي</th>
                        <th className="p-2.5 text-center">حذف القطعة</th>
                      </tr>
                    </thead>
                    <tbody>
                      {cartItems.map((item, index) => (
                        <tr key={index} className="border-b border-slate-100 last:border-0 hover:bg-slate-50/50">
                          <td className="p-2.5 font-bold text-slate-800">{item.name}</td>
                          <td className="p-2.5 text-center font-mono">{item.price} ج.م</td>
                          <td className="p-2.5 text-center">
                            <div className="flex items-center justify-center gap-1.5">
                              <button
                                type="button"
                                onClick={() => handleUpdateItemQty(index, -1)}
                                className="w-5 h-5 rounded-md bg-slate-100 hover:bg-slate-200 text-slate-600 flex items-center justify-center font-bold"
                              >
                                <Minus className="w-2.5 h-2.5" />
                              </button>
                              <span className="font-mono font-bold text-slate-800 text-xs w-6 text-center">{item.qty}</span>
                              <button
                                type="button"
                                onClick={() => handleUpdateItemQty(index, 1)}
                                className="w-5 h-5 rounded-md bg-slate-100 hover:bg-slate-200 text-slate-600 flex items-center justify-center font-bold"
                              >
                                <Plus className="w-2.5 h-2.5" />
                              </button>
                            </div>
                          </td>
                          <td className="p-2.5 font-bold text-rose-600 font-mono">{(item.price * item.qty)} ج.م</td>
                          <td className="p-2.5 text-center">
                            <button
                              type="button"
                              onClick={() => handleRemoveFromCart(index)}
                              className="text-slate-400 hover:text-red-500 rounded-md p-1"
                            >
                              <Trash className="w-3.5 h-3.5" />
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>

            {/* Calculations Blocks */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 bg-slate-50/50 p-6 rounded-2xl border border-slate-100">
              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">الخصم المقدم على الفاتورة (%)</label>
                  <input
                    type="number"
                    min="0"
                    max="100"
                    value={discountPercent}
                    onChange={(e) => setDiscountPercent(Math.min(100, Math.max(0, Number(e.target.value))))}
                    className="w-full pr-3 pl-3 py-2 border border-slate-200 rounded-xl bg-white text-xs font-mono font-semibold"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">المبلغ المحصل نقداً الآن (ج.م)</label>
                  <input
                    type="number"
                    min="0"
                    value={paidAmt}
                    onChange={(e) => setPaidAmt(Math.max(0, Number(e.target.value)))}
                    className="w-full pr-3 pl-3 py-2 border border-slate-200 rounded-xl bg-white text-xs font-mono font-bold text-emerald-700"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">ملاحظات الأوردر والطلبات الخاصة</label>
                  <textarea
                    rows={2}
                    value={orderNotes}
                    onChange={(e) => setOrderNotes(e.target.value)}
                    placeholder="كتابة تغليف ذهبي، بطاقة تهنئة عيد ميلاد..."
                    className="w-full pr-3 pl-3 py-2 border border-slate-200 rounded-xl bg-white text-xs"
                  />
                </div>
              </div>

              {/* Realtime summary financial calculations visual module */}
              <div className="bg-white p-5 rounded-xl border border-slate-150 flex flex-col justify-between space-y-3 font-semibold text-xs text-slate-600">
                <h4 className="text-sm font-bold text-slate-800 border-b border-slate-50 pb-2 mb-1 flex items-center justify-between">
                  <span>ملخص الفاتورة</span>
                  <span className="text-[10px] bg-indigo-50 text-indigo-700 px-2 py-0.5 rounded-md font-bold">حسابات تلقائية</span>
                </h4>
                <div className="flex justify-between items-center text-slate-500">
                  <span>المجموع الإجمالي الأساسي:</span>
                  <span className="font-mono text-sm">{subTotal} ج.م</span>
                </div>
                <div className="flex justify-between items-center text-rose-600">
                  <span>قيمة الخصم ({discountPercent}%):</span>
                  <span className="font-mono text-sm">-{calculatedDiscount.toFixed(1)} ج.م</span>
                </div>
                <div className="flex justify-between items-center text-slate-800 font-bold border-t border-slate-50 pt-2 text-sm">
                  <span>السعر النهائي الصافي:</span>
                  <span className="font-mono text-slate-900 text-base">{calculatedTotal.toFixed(1)} ج.م</span>
                </div>
                <div className="flex justify-between items-center text-slate-400 text-[11px] font-normal">
                  <span>تكلفة الجملة الكلية للمخزن:</span>
                  <span className="font-mono">{costTotal} ج.م</span>
                </div>
                <div className="flex justify-between items-center text-emerald-700 font-bold border-t border-dashed border-emerald-100 pt-2 bg-emerald-50/30 p-2.5 rounded-lg">
                  <span>الأرباح الكلية المقدرة:</span>
                  <span className="font-mono text-sm">{estimatedProfit.toFixed(1)} ج.م</span>
                </div>

                <div className="flex justify-between items-center text-indigo-800 bg-indigo-50/20 p-2.5 rounded-lg text-[11px]">
                  <span>المبلغ المتبقي مديونية:</span>
                  <span className="font-mono text-indigo-900 text-xs font-bold">
                    {Math.max(0, calculatedTotal - paidAmt).toFixed(1)} ج.م
                  </span>
                </div>
              </div>
            </div>

            <div className="pt-4 flex items-center justify-end gap-2 border-t border-slate-50">
              <button
                type="button"
                onClick={() => setIsCreating(false)}
                className="px-4 py-2 border border-slate-200 text-slate-600 rounded-xl text-sm font-medium hover:bg-slate-50 transition"
              >
                إلغاء وخروج
              </button>
              <button
                type="submit"
                className="px-6 py-2.5 bg-rose-600 text-white rounded-xl text-sm font-semibold hover:bg-rose-700 transition shadow-md shadow-rose-100 cursor-pointer"
              >
                حفظ وإيداع الأوردر لقاعدة البيانات
              </button>
            </div>
          </form>
        </div>
      ) : activeOrderDetails ? (
        /* PREMIUM DETAILED INVOICE DIALOG WITH STATUS ADJUST & PAID ADJUST */
        <div className="bg-white rounded-2xl border border-slate-100 shadow-xs p-6 space-y-6">
          <div className="flex items-center justify-between pb-4 border-b border-slate-100">
            <div className="flex items-center gap-3">
              <button
                onClick={() => setActiveOrderDetails(null)}
                className="p-1.5 border border-slate-150 rounded-lg hover:bg-slate-50 text-slate-600 transition"
              >
                <ArrowRight className="w-5 h-5" />
              </button>
              <div>
                <h3 className="text-base font-bold text-slate-800">تفاصيل الفاتورة # {activeOrderDetails.id.slice(0,8)}</h3>
                <p className="text-[10px] text-slate-400 font-mono">تاريخ التحرير: {new Date(activeOrderDetails.date).toLocaleDateString("ar-EG")}</p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => window.print()}
                className="inline-flex items-center gap-1 px-3 py-1.5 border border-slate-150 text-slate-700 font-bold text-xs rounded-xl hover:bg-slate-50 transition"
              >
                <Printer className="w-3.5 h-3.5" />
                طابعة الفاتورة
              </button>
              <button
                onClick={() => setActiveOrderDetails(null)}
                className="px-3 py-1.5 bg-slate-800 text-white font-bold text-xs rounded-xl hover:bg-slate-900 transition"
              >
                رجوع
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Invoice Meta details */}
            <div className="space-y-4">
              <div className="bg-slate-50 p-4 rounded-xl border border-slate-100 space-y-2">
                <h4 className="text-xs font-bold text-slate-400 uppercase">بيانات العميل المشتري</h4>
                <div className="text-sm font-bold text-slate-800">{activeOrderDetails.client?.name || "عميل محذوف"}</div>
                <div className="text-xs font-medium text-slate-500 font-mono">الكود الفريد: {activeOrderDetails.client?.client_code || "—"}</div>
                {activeOrderDetails.client?.phone && (
                  <div className="text-xs font-semibold text-slate-500 font-mono">الهاتف: {activeOrderDetails.client?.phone}</div>
                )}
              </div>

              {/* Status Update Control boxes */}
              <div className="bg-white p-4 rounded-xl border border-slate-150 space-y-3">
                <h4 className="text-xs font-bold text-slate-400 uppercase">التحكم في حالة الأوردر</h4>
                <div className="flex flex-wrap gap-1.5">
                  {(["NEW", "CONFIRMED", "PROCESSING", "DELIVERED", "CANCELLED"] as const).map(st => (
                    <button
                      key={st}
                      onClick={() => handleUpdateStatus(activeOrderDetails.id, st)}
                      className={`px-3 py-1.5 rounded-lg text-[10px] font-bold cursor-pointer transition-all ${
                        activeOrderDetails.status === st 
                        ? 'bg-rose-600 text-white shadow-xs' 
                        : 'bg-slate-50 hover:bg-slate-100 text-slate-700'
                      }`}
                    >
                      {st === "NEW" ? "جديد" :
                       st === "CONFIRMED" ? "طلب مؤكد" :
                       st === "PROCESSING" ? "قيد التجهيز" :
                       st === "DELIVERED" ? "تم التسليم" : "ملغي"}
                    </button>
                  ))}
                </div>
              </div>

              {/* Adjust Payments box */}
              <div className="bg-white p-4 rounded-xl border border-slate-150 space-y-3">
                <h4 className="text-xs font-bold text-slate-400 uppercase">المبلغ المحصل نقداً (ج.م)</h4>
                <div className="flex gap-2 items-center">
                  <input
                    type="number"
                    defaultValue={activeOrderDetails.paid_amount}
                    onBlur={(e) => handleUpdatePaid(activeOrderDetails.id, Number(e.target.value))}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        handleUpdatePaid(activeOrderDetails.id, Number((e.target as any).value));
                        (e.target as any).blur();
                      }
                    }}
                    className="w-32 pr-3 pl-3 py-1.5 border border-slate-200 rounded-lg text-xs font-mono font-bold text-emerald-700"
                  />
                  <span className="text-[10px] text-slate-400">انقر خارج الإدخال أو اضغط زر Enter للتحرير والحفظ النقدي الفوري.</span>
                </div>
              </div>
            </div>

            {/* Invoice Products list details */}
            <div className="border border-slate-100 rounded-xl p-4 bg-slate-50/30 space-y-4">
              <h4 className="text-xs font-bold text-slate-400 uppercase">الأصناف المحتواة داخل الفاتورة</h4>
              
              <div className="space-y-2">
                {activeOrderDetails.items?.map((item: any) => (
                  <div key={item.id} className="flex justify-between items-center py-2 border-b border-dashed border-slate-150 last:border-0 text-xs">
                    <div>
                      <div className="font-bold text-slate-800">{item.name}</div>
                      <div className="text-[10px] text-slate-400 font-mono">الكمية: {item.qty} × {item.price} ج.م</div>
                    </div>
                    <div className="font-mono font-bold text-slate-900">{item.price * item.qty} ج.م</div>
                  </div>
                ))}
              </div>

              {/* Billing statistics blocks */}
              <div className="pt-4 border-t border-slate-100 space-y-2 text-xs font-semibold text-slate-500">
                <div className="flex justify-between">
                  <span>الخصم المطبق ({activeOrderDetails.discount_percentage}%):</span>
                  <span className="font-mono text-rose-600">-{activeOrderDetails.discount} ج.م</span>
                </div>
                <div className="flex justify-between text-slate-900 font-bold text-sm">
                  <span>السعر الصافي الكلي:</span>
                  <span className="font-mono text-base">{activeOrderDetails.total} ج.م</span>
                </div>
                <div className="flex justify-between text-emerald-700 bg-emerald-50/40 p-2 rounded-lg font-bold">
                  <span>الربح الإجمالي من الطلب:</span>
                  <span className="font-mono">{activeOrderDetails.profit} ج.م</span>
                </div>
                {activeOrderDetails.notes && (
                  <div className="mt-3 p-2.5 bg-yellow-50/50 border border-yellow-100 rounded-lg text-[11px] font-normal text-slate-700">
                    <span className="font-bold text-slate-850 block mb-0.5">ملاحظات الأوردر:</span>
                    {activeOrderDetails.notes}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      ) : (
        /* STANDARD ALL ACTIVE AND INACTIVE ORDERS CENTER TAB */
        <div className="bg-white rounded-2xl border border-slate-100 shadow-xs p-6 space-y-4">
          <div className="relative">
            <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none text-slate-400">
              <Search className="h-5 w-5" />
            </div>
            <input
              type="text"
              placeholder="ابحث باسم الزبون أو كود العميل (مثال: أميرة)..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pr-10 pl-3 py-2.5 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-rose-500 bg-slate-50/50 hover:bg-white text-sm transition-all"
            />
          </div>

          {filteredOrders.length === 0 ? (
            <div className="text-center py-16 text-slate-400 text-sm">
              <Gift className="w-12 h-12 text-slate-200 mx-auto mb-2" />
              لم يتم تدوين أوردرات تطابق شروط الفلتر الحالية.
            </div>
          ) : (
            <div className="overflow-x-auto rounded-xl border border-slate-100">
              <table className="w-full text-right text-xs">
                <thead className="bg-slate-50 text-slate-600 font-bold border-b border-slate-100">
                  <tr>
                    <th className="p-3">رقم الهاتف</th>
                    <th className="p-3">اسم الزبون</th>
                    <th className="p-3 text-center">أكواد العميل</th>
                    <th className="p-3">تاريخ الفاتورة</th>
                    <th className="p-3">حالة الأوردر</th>
                    <th className="p-3">قيمة الفاتورة</th>
                    <th className="p-3 font-bold">المدفوع نقداً</th>
                    <th className="p-3 text-center">الإجراءات</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredOrders.map((o) => {
                    const clientDebt = Math.max(0, o.total - o.paid_amount);

                    return (
                      <tr key={o.id} className="border-b border-slate-50 last:border-0 hover:bg-slate-50/60 font-semibold text-slate-700">
                        <td className="p-3 font-mono text-slate-500">{o.id.slice(0, 8)}</td>
                        <td className="p-3 font-bold text-slate-900 text-sm">{o.client_name || "عميل محذوف"}</td>
                        <td className="p-3 text-center font-mono text-rose-600 bg-rose-50/10 font-bold">{o.client_code || "—"}</td>
                        <td className="p-3 font-mono">{new Date(o.date).toLocaleDateString("ar-EG")}</td>
                        <td className="p-3 font-bold text-[10px]">
                          <span className={`inline-block px-2.5 py-0.5 rounded-full uppercase ${
                            o.status === "DELIVERED" ? "bg-emerald-50 text-emerald-700 border border-emerald-100" :
                            o.status === "CONFIRMED" ? "bg-blue-50 text-blue-700 border border-blue-10 border-blue-104" :
                            o.status === "PROCESSING" ? "bg-yellow-50 text-yellow-700 border border-yellow-100" :
                            o.status === "CANCELLED" ? "bg-red-50 text-red-700 border border-red-100" : "bg-purple-50 text-purple-700 border border-purple-100"
                          }`}>
                            {o.status === "DELIVERED" ? "تم التسليم" :
                             o.status === "CONFIRMED" ? "طلب مؤكد" :
                             o.status === "PROCESSING" ? "قيد التجهيز" :
                             o.status === "CANCELLED" ? "ملغي" : "جديد"}
                          </span>
                        </td>
                        <td className="p-3 font-mono font-bold text-slate-900 text-xs">{o.total} ج.م</td>
                        <td className="p-3">
                          <span className="font-mono text-emerald-700 font-bold whitespace-nowrap">{o.paid_amount} ج.م</span>
                          {clientDebt > 0 && (
                            <span className="text-[10px] text-rose-500 block font-normal whitespace-nowrap">متبقي: {clientDebt} ج.م</span>
                          )}
                        </td>
                        <td className="p-3 text-center">
                          <div className="flex items-center justify-center gap-1.5">
                            <button
                              onClick={() => handleInspectOrder(o.id)}
                              className="p-1.5 bg-slate-100 text-slate-700 rounded-lg hover:bg-rose-500 hover:text-white transition"
                              title="عرض الفاتورة"
                            >
                              <Eye className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={() => handleDeleteOrder(o.id)}
                              className="p-1.5 bg-slate-100 text-rose-700 rounded-lg hover:bg-rose-700 hover:text-white transition"
                              title="حذف الأوردر"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
