import React, { useState, useEffect } from "react";
import { Search, ShoppingBag, PackagePlus, BarChart, Edit3, Trash2, ArrowUpRight, ShieldAlert } from "lucide-react";
import { Product } from "../types.js";

interface ProductsViewProps {
  token: string;
}

export default function ProductsView({ token }: ProductsViewProps) {
  const [products, setProducts] = useState<Product[]>([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // Setup form modals state
  const [showAddForm, setShowAddForm] = useState(false);
  const [showEditForm, setShowEditForm] = useState<Product | null>(null);

  // Form states attributes
  const [name, setName] = useState("");
  const [wholesalePrice, setWholesalePrice] = useState("");
  const [sellingPrice, setSellingPrice] = useState("");
  const [stock, setStock] = useState("");

  const fetchProducts = async () => {
    try {
      const response = await fetch("/api/products", {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (!response.ok) {
        throw new Error("فشل في تحميل كتالوج هدايا المحل.");
      }
      const data = await response.json();
      setProducts(data);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProducts();
  }, [token]);

  const handleCreateProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    try {
      const response = await fetch("/api/products", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          name,
          wholesale_price: Number(wholesalePrice) || 0,
          selling_price: Number(sellingPrice) || 0,
          stock: Number(stock) || 0
        })
      });

      if (!response.ok) {
        throw new Error("فشل إدراج منتج جديد بالكتالوج");
      }

      await fetchProducts();

      // Reset
      setName("");
      setWholesalePrice("");
      setSellingPrice("");
      setStock("");
      setShowAddForm(false);
    } catch (err: any) {
      alert(err.message);
    }
  };

  const handleEditProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!showEditForm || !name.trim()) return;

    try {
      const response = await fetch(`/api/products/${showEditForm.id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          name,
          wholesale_price: Number(wholesalePrice) || 0,
          selling_price: Number(sellingPrice) || 0,
          stock: Number(stock) || 0
        })
      });

      if (!response.ok) {
        throw new Error("حدث خطأ تزامني أثناء التحديث المطلوب");
      }

      await fetchProducts();

      // Reset
      setName("");
      setWholesalePrice("");
      setSellingPrice("");
      setStock("");
      setShowEditForm(null);
    } catch (err: any) {
      alert(err.message);
    }
  };

  const handleDeleteProduct = async (id: string, name: string) => {
    if (!confirm(`هل تريد بالتأكيد حذف الهدية/المنتج "${name}" من كتالوج المحل نهائياً؟`)) {
      return;
    }

    try {
      const response = await fetch(`/api/products/${id}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` }
      });

      if (!response.ok) {
        throw new Error("فشل حذف المنتج.");
      }

      await fetchProducts();
    } catch (err: any) {
      alert(err.message);
    }
  };

  // Filter products by searching name or serial
  const filteredProducts = products.filter(p => {
    const s = search.toLowerCase();
    return p.name.toLowerCase().includes(s) || p.serial.toString().includes(s);
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
            <ShoppingBag className="w-6 h-6 text-rose-500" />
            كتالوج المنتجات والهدايا
          </h2>
          <p className="text-sm text-slate-500 mt-0.5">صنف هدايا المحل، عدل السعر وسعر الجملة، وراقب مستوى المخزن بشكل آلي.</p>
        </div>

        {!showAddForm && !showEditForm && (
          <button
            onClick={() => {
              setName("");
              setWholesalePrice("");
              setSellingPrice("");
              setStock("");
              setShowAddForm(true);
            }}
            className="inline-flex items-center gap-1.5 px-4 py-2.5 bg-rose-600 text-white font-medium text-sm rounded-xl hover:bg-rose-700 transition shadow-md shadow-rose-100"
          >
            <PackagePlus className="w-4 h-4" />
            إضافة منتج/هدية جديدة
          </button>
        )}
      </div>

      {loading ? (
        <div className="text-center py-12 text-slate-500">جاري تحميل كتالوج الهدايا المتوفرة...</div>
      ) : error ? (
        <div className="p-4 bg-orange-50 text-orange-850 rounded-xl text-sm border border-orange-100">{error}</div>
      ) : showAddForm || showEditForm ? (
        /* SENSITIVE ADD / EDIT FORMS */
        <div className="bg-white rounded-2xl border border-slate-100 p-6 max-w-2xl mx-auto shadow-xs">
          <div className="flex items-center justify-between border-b border-slate-50 pb-4 mb-6">
            <h3 className="text-lg font-bold text-slate-800">
              {showAddForm ? "إضافة صنف مبيعات جديد" : `تعديل صنف: ${showEditForm?.name}`}
            </h3>
            <button
              onClick={() => {
                setShowAddForm(false);
                setShowEditForm(null);
              }}
              className="text-slate-400 hover:text-slate-600 text-sm"
            >
              إلغاء
            </button>
          </div>

          <form onSubmit={showAddForm ? handleCreateProduct : handleEditProduct} className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">اسم الهدية/المنتج بالتفصيل *</label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
                placeholder="مثال: دبدوب أحمر محفور مخملي كبير"
                className="w-full pr-3 pl-3 py-2.5 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-rose-500 bg-slate-50 hover:bg-white text-sm"
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">سعر الجملة (ج.م) *</label>
                <input
                  type="number"
                  value={wholesalePrice}
                  onChange={(e) => setWholesalePrice(e.target.value)}
                  required
                  placeholder="150"
                  className="w-full pr-3 pl-3 py-2.5 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-rose-500 bg-slate-50 hover:bg-white text-sm font-mono"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">سعر البيع المقترح (ج.م) *</label>
                <input
                  type="number"
                  value={sellingPrice}
                  onChange={(e) => setSellingPrice(e.target.value)}
                  required
                  placeholder="250"
                  className="w-full pr-3 pl-3 py-2.5 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-rose-500 bg-slate-50 hover:bg-white text-sm font-mono"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">الكمية المتوفرة بالمخزن *</label>
                <input
                  type="number"
                  value={stock}
                  onChange={(e) => setStock(e.target.value)}
                  required
                  placeholder="12"
                  className="w-full pr-3 pl-3 py-2.5 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-rose-500 bg-slate-50 hover:bg-white text-sm font-mono"
                />
              </div>
            </div>

            <div className="pt-4 flex items-center justify-end gap-2 border-t border-slate-50 mt-4">
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
                {showAddForm ? "حفظ المنتج بالكتالوج" : "تحديث وحفظ التعديلات"}
              </button>
            </div>
          </form>
        </div>
      ) : (
        /* STANDARD ALL ITEMS CATALOG TABLES */
        <div className="bg-white rounded-2xl border border-slate-100 shadow-xs p-6 space-y-4">
          <div className="relative">
            <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none text-slate-400">
              <Search className="h-5 w-5" />
            </div>
            <input
              type="text"
              placeholder="ابحث بالاسم أو السيريال التسلسلي للهدية..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pr-10 pl-3 py-2.5 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-rose-500 bg-slate-50/50 hover:bg-white text-sm transition-all"
            />
          </div>

          {filteredProducts.length === 0 ? (
            <div className="text-center py-16 text-slate-400 text-sm">
              <ShoppingBag className="w-12 h-12 text-slate-200 mx-auto mb-2" />
              لم يتم العثور على أي منتجات مطابقة في كتالوج المحل.
            </div>
          ) : (
            <div className="overflow-x-auto rounded-xl border border-slate-100">
              <table className="w-full text-right text-xs">
                <thead className="bg-slate-50 text-slate-600 font-bold border-b border-slate-100">
                  <tr>
                    <th className="p-3">السيريال</th>
                    <th className="p-3">اسم الصنف بالكامل</th>
                    <th className="p-3">سعر الجملة</th>
                    <th className="p-3">سعر البيع</th>
                    <th className="p-3">أرباح القطعة الكلية</th>
                    <th className="p-3">المخزون الحالي</th>
                    <th className="p-3">الحالة المخزنية</th>
                    <th className="p-3 text-center">الإجراءات</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredProducts.map((p) => {
                    const profitCell = Math.max(0, p.selling_price - p.wholesale_price);
                    
                    return (
                      <tr key={p.id} className="border-b border-slate-50 last:border-0 hover:bg-slate-50/60 font-semibold">
                        <td className="p-3 font-mono text-slate-500">#{p.serial}</td>
                        <td className="p-3 font-bold text-slate-800 text-sm">{p.name}</td>
                        <td className="p-3 font-mono text-slate-600">{p.wholesale_price} ج.م</td>
                        <td className="p-3 font-mono text-rose-600 font-bold">{p.selling_price} ج.م</td>
                        <td className="p-3 font-mono text-emerald-700 bg-emerald-50/30">{profitCell} ج.م</td>
                        <td className="p-3 font-mono font-bold text-slate-900">{p.stock} قطة</td>
                        <td className="p-3">
                          {p.stock === 0 ? (
                            <span className="inline-block px-2 py-0.5 rounded-full text-[9px] bg-red-100 text-red-700 font-bold">
                              نفذت الكمية 🚨
                            </span>
                          ) : p.stock <= 5 ? (
                            <span className="inline-block px-2 py-0.5 rounded-full text-[9px] bg-orange-100 text-orange-700 font-bold">
                              مخزون منخفض ⚠️
                            </span>
                          ) : (
                            <span className="inline-block px-2 py-0.5 rounded-full text-[9px] bg-emerald-100 text-emerald-800">
                              متوفر بالمخزن
                            </span>
                          )}
                        </td>
                        <td className="p-3 text-center">
                          <div className="flex items-center justify-center gap-1.5">
                            <button
                              onClick={() => {
                                setName(p.name);
                                setWholesalePrice(p.wholesale_price.toString());
                                setSellingPrice(p.selling_price.toString());
                                setStock(p.stock.toString());
                                setShowEditForm(p);
                              }}
                              className="p-1 text-slate-500 hover:text-rose-500 hover:bg-rose-50 rounded-lg transition"
                              title="تعديل تفاصيل"
                            >
                              <Edit3 className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => handleDeleteProduct(p.id, p.name)}
                              className="p-1 text-slate-500 hover:text-red-600 hover:bg-red-50 rounded-lg transition"
                              title="حذف منتج"
                            >
                              <Trash2 className="w-4 h-4" />
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
