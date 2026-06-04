import React, { useState, useEffect } from "react";
import { Users, UserPlus, Shield, Key, Eye, Edit3, Trash2, CheckSquare, Square } from "lucide-react";
import { User } from "../types.js";

interface UsersViewProps {
  token: string;
  currentUser: any;
}

export default function UsersView({ token, currentUser }: UsersViewProps) {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // Form setups
  const [showAddForm, setShowAddForm] = useState(false);
  const [showEditForm, setShowEditForm] = useState<User | null>(null);

  // Form states attributes
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState<"super_admin" | "employee">("employee");
  const [selectedPermissions, setSelectedPermissions] = useState<string[]>(["dashboard", "clients", "orders", "products"]);

  const permissionsList = [
    { key: "dashboard", label: "شاشة الإحصائيات (الرئيسية)" },
    { key: "clients", label: "إدارة العملاء و الملفات" },
    { key: "products", label: "تعديل الكتالوج والمخزن" },
    { key: "orders", label: "إنشاء وحذف المبيعات والأوردرات" },
    { key: "profits", label: "الأرباح والمستندات المالية" },
    { key: "users", label: "الموظفون والإجراءات الإدارية" }
  ];

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const response = await fetch("/api/users", {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (!response.ok) {
        throw new Error("فشل فحص قائمة الموظفين والمصرح لهم.");
      }
      const data = await response.json();
      setUsers(data);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, [token]);

  const togglePermission = (key: string) => {
    if (selectedPermissions.includes(key)) {
      setSelectedPermissions(selectedPermissions.filter(p => p !== key));
    } else {
      setSelectedPermissions([...selectedPermissions, key]);
    }
  };

  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !email.trim() || !password) return;

    try {
      const response = await fetch("/api/users", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          name,
          email,
          password,
          role,
          permissions: selectedPermissions
        })
      });

      if (!response.ok) {
        const errData = await response.json();
        throw new Error(errData.error || "خطأ أثناء إضافة الموظف الجديد");
      }

      await fetchUsers();

      // Reset
      setName("");
      setEmail("");
      setPassword("");
      setRole("employee");
      setSelectedPermissions(["dashboard", "clients", "orders", "products"]);
      setShowAddForm(false);
    } catch (err: any) {
      alert(err.message);
    }
  };

  const handleEditUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!showEditForm || !name.trim() || !email.trim()) return;

    try {
      const response = await fetch(`/api/users/${showEditForm.id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          name,
          email,
          password: password || undefined, // send password only if updating it
          role,
          permissions: selectedPermissions
        })
      });

      if (!response.ok) {
        const errData = await response.json();
        throw new Error(errData.error || "خطأ أثناء التعديل");
      }

      await fetchUsers();

      // Reset
      setName("");
      setEmail("");
      setPassword("");
      setRole("employee");
      setSelectedPermissions(["dashboard", "clients", "orders", "products"]);
      setShowEditForm(null);
    } catch (err: any) {
      alert(err.message);
    }
  };

  const handleDeleteUser = async (id: string, name: string) => {
    if (id === currentUser.id) {
      alert("⚠️ لا يمكنك حذف حسابك العام الذي تستخدمه حالياً لتصفح النظام!");
      return;
    }
    if (!confirm(`هل تريد بالتأكيد فصل الموظف "${name}" وإبطال كود دخوله للنظام؟`)) {
      return;
    }

    try {
      const response = await fetch(`/api/users/${id}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` }
      });

      if (!response.ok) {
        throw new Error("عذراً، فشل حذف المستخدم.");
      }

      await fetchUsers();
    } catch (err: any) {
      alert(err.message);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
            <Shield className="w-6 h-6 text-rose-500" />
            إدارة صلاحيات الموظفين والمدراء
          </h2>
          <p className="text-sm text-slate-500 mt-0.5">سجل حسابات موظفي المبيعات، غير الأدوار، وحدد الصلاحيات الفردية لضمان أمان العمليات.</p>
        </div>

        {!showAddForm && !showEditForm && (
          <button
            onClick={() => {
              setName("");
              setEmail("");
              setPassword("");
              setRole("employee");
              setSelectedPermissions(["dashboard", "clients", "orders", "products"]);
              setShowAddForm(true);
            }}
            className="inline-flex items-center gap-1.5 px-4 py-2.5 bg-rose-600 text-white font-medium text-sm rounded-xl hover:bg-rose-700 transition"
          >
            <UserPlus className="w-4 h-4" />
            تسجيل موظف جديد
          </button>
        )}
      </div>

      {loading ? (
        <div className="text-center py-12 text-slate-500">جاري تحميل قائمة الموظفين والأكواد المصرحة...</div>
      ) : error ? (
        <div className="p-4 bg-orange-50 text-orange-850 rounded-xl text-sm border border-orange-100">{error}</div>
      ) : showAddForm || showEditForm ? (
        <div className="bg-white rounded-2xl border border-slate-100 p-6 max-w-2xl mx-auto shadow-xs">
          <div className="flex items-center justify-between border-b border-slate-50 pb-4 mb-6">
            <h3 className="text-lg font-bold text-slate-800">
              {showAddForm ? "تسجيل موظف مبيعات جديد" : `تعديل بيانات وحساب الموظف: ${showEditForm?.name}`}
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

          <form onSubmit={showAddForm ? handleCreateUser : handleEditUser} className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">الاسم بالكامل *</label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
                placeholder="مثال: أحمد مصطفى"
                className="w-full pr-3 pl-3 py-2 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-rose-500 bg-slate-50 hover:bg-white text-sm"
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">البريد الإلكتروني للدخول *</label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  placeholder="employee@zouma.com"
                  className="w-full pr-3 pl-3 py-2 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-rose-500 bg-slate-50 hover:bg-white text-sm font-mono"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  {showAddForm ? "كلمة المرور الحساب *" : "كلمة مرور جديدة (اتركه فارغاً للاحتفاظ بكلمة المرور الحالية)"}
                </label>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required={showAddForm}
                  placeholder="admin123"
                  className="w-full pr-3 pl-3 py-2 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-rose-500 bg-slate-50 hover:bg-white text-sm font-mono"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 bg-slate-50 p-4 rounded-xl">
              {/* Select role */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">الرتبة والوظيفة العسكرية</label>
                <div className="flex gap-4">
                  <label className="flex items-center gap-1.5 text-xs text-slate-700 font-semibold cursor-pointer">
                    <input
                      type="radio"
                      name="role"
                      value="employee"
                      checked={role === "employee"}
                      onChange={() => setRole("employee")}
                      className="accent-rose-600"
                    />
                    موظف مبيعات (employee)
                  </label>
                  <label className="flex items-center gap-1.5 text-xs text-slate-700 font-semibold cursor-pointer">
                    <input
                      type="radio"
                      name="role"
                      value="super_admin"
                      checked={role === "super_admin"}
                      onChange={() => setRole("super_admin")}
                      className="accent-rose-600"
                    />
                    مدير عام المسؤول (super_admin)
                  </label>
                </div>
              </div>
            </div>

            {/* Select permissions checkboxes */}
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-3">الصلاحيات المصرحة بالنظام (للموظفين فقط) *</label>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                {permissionsList.map(p => {
                  const hasPerm = selectedPermissions.includes(p.key);
                  return (
                    <button
                      key={p.key}
                      type="button"
                      onClick={() => togglePermission(p.key)}
                      className={`flex items-center gap-2 p-2.5 rounded-xl text-right border text-xs font-bold transition-all ${
                        hasPerm 
                        ? 'border-rose-200 bg-rose-50/40 text-rose-700' 
                        : 'border-slate-100 bg-white text-slate-500'
                      }`}
                    >
                      {hasPerm ? (
                        <CheckSquare className="w-4 h-4 text-rose-600 flex-shrink-0" />
                      ) : (
                        <Square className="w-4 h-4 text-slate-300 flex-shrink-0" />
                      )}
                      <span>{p.label}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="pt-4 flex items-center justify-end gap-2 border-t border-slate-50">
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
                {showAddForm ? "حفظ كحساب جديد" : "تعديل وحفظ التغييرات"}
              </button>
            </div>
          </form>
        </div>
      ) : (
        /* STANDARD ALL ACCOUNTS TABLE LIST */
        <div className="bg-white rounded-2xl border border-slate-100 shadow-xs p-6 space-y-4">
          <div className="overflow-x-auto rounded-xl border border-slate-100">
            <table className="w-full text-right text-xs">
              <thead className="bg-slate-50 text-slate-600 font-bold border-b border-slate-100">
                <tr>
                  <th className="p-3">الاسم بالكامل</th>
                  <th className="p-3">البريد الإلكتروني</th>
                  <th className="p-3">الرتبة</th>
                  <th className="p-3 text-center">الصلاحيات المفعلة</th>
                  <th className="p-3">تاريخ إنشاء الحساب</th>
                  <th className="p-3 text-center">إجراءات</th>
                </tr>
              </thead>
              <tbody>
                {users.map((u) => (
                  <tr key={u.id} className="border-b border-slate-50 last:border-0 hover:bg-slate-50/50 font-semibold">
                    <td className="p-3 font-bold text-slate-800 text-sm">{u.name} {u.id === currentUser.id ? "(أنت)" : ""}</td>
                    <td className="p-3 font-mono text-slate-500">{u.email}</td>
                    <td className="p-3">
                      <span className={`inline-block px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase ${
                        u.role === "super_admin" 
                        ? 'bg-rose-50 text-rose-700 border border-rose-100' 
                        : 'bg-slate-100 text-slate-700'
                      }`}>
                        {u.role === "super_admin" ? "مدير مسؤول" : "موظف مبيعات"}
                      </span>
                    </td>
                    <td className="p-3">
                      {u.role === "super_admin" ? (
                        <span className="text-[11px] text-rose-650 font-bold bg-rose-50/50 px-2.5 py-0.5 rounded-full block text-center max-w-[140px] mx-auto">
                          صلاحية كاملة ومطلقة
                        </span>
                      ) : (
                        <div className="flex flex-wrap gap-1 items-center justify-center max-w-sm mx-auto">
                          {u.permissions?.map(p => {
                            const lbl = permissionsList.find(pl => pl.key === p)?.label.split(" ")[0] || p;
                            return (
                              <span key={p} className="text-[9px] bg-slate-100 text-slate-500 px-1.5 py-0.5 rounded-md font-semibold">
                                {lbl}
                              </span>
                            );
                          })}
                        </div>
                      )}
                    </td>
                    <td className="p-3 font-mono text-slate-400">{new Date(u.created_at).toLocaleDateString("ar-EG")}</td>
                    <td className="p-3 text-center">
                      <div className="flex justify-center items-center gap-1">
                        <button
                          onClick={() => {
                            setName(u.name);
                            setEmail(u.email);
                            setPassword("");
                            setRole(u.role);
                            setSelectedPermissions(u.permissions || []);
                            setShowEditForm(u);
                          }}
                          className="p-1.5 text-slate-500 hover:text-rose-500 hover:bg-rose-50 rounded-lg transition"
                          title="تعديل حساب"
                        >
                          <Edit3 className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDeleteUser(u.id, u.name)}
                          className="p-1.5 text-slate-500 hover:text-red-600 hover:bg-red-50 rounded-lg transition"
                          disabled={u.id === currentUser.id}
                          title="حذف الموظف"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
