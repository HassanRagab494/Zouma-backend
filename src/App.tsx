import React, { useState, useEffect } from "react";
import { 
  Gift, 
  Users, 
  ShoppingBag, 
  LayoutDashboard, 
  DollarSign, 
  ShieldAlert, 
  LogOut, 
  Menu, 
  X, 
  ChevronLeft, 
  FolderOpen 
} from "lucide-react";

import LoginView from "./components/LoginView.js";
import DashboardView from "./components/DashboardView.js";
import ClientsView from "./components/ClientsView.js";
import ProductsView from "./components/ProductsView.js";
import OrdersView from "./components/OrdersView.js";
import UsersView from "./components/UsersView.js";
import ReportsView from "./components/ReportsView.js";

export default function App() {
  const [token, setToken] = useState<string | null>(() => localStorage.getItem("zouma_token"));
  const [user, setUser] = useState<any | null>(() => {
    const saved = localStorage.getItem("zouma_user");
    return saved ? JSON.parse(saved) : null;
  });

  const [activeTab, setActiveTab] = useState<string>("dashboard");
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // Sync token to persistent state / memory
  const handleLoginSuccess = (newToken: string, newUser: any) => {
    localStorage.setItem("zouma_token", newToken);
    localStorage.setItem("zouma_user", JSON.stringify(newUser));
    setToken(newToken);
    setUser(newUser);
    
    // Choose starting tab based on their permissions
    if (newUser.role === "super_admin" || newUser.permissions.includes("dashboard")) {
      setActiveTab("dashboard");
    } else if (newUser.permissions.includes("orders")) {
      setActiveTab("orders");
    } else if (newUser.permissions.includes("clients")) {
      setActiveTab("clients");
    } else if (newUser.permissions.includes("products")) {
      setActiveTab("products");
    } else {
      setActiveTab("dashboard");
    }
  };

  const handleLogout = () => {
    localStorage.removeItem("zouma_token");
    localStorage.removeItem("zouma_user");
    setToken(null);
    setUser(null);
  };

  // Guard Helper to verify user permissions
  const hasPermission = (permission: string) => {
    if (!user) return false;
    if (user.role === "super_admin") return true;
    return user.permissions && user.permissions.includes(permission);
  };

  // Sidebar Menu Options
  const menuItems = [
    { id: "dashboard", label: "شاشة الإحصائيات (الرئيسية)", icon: LayoutDashboard, permission: "dashboard" },
    { id: "clients", label: "إدارة العملاء و الملفات", icon: Users, permission: "clients" },
    { id: "products", label: "كتالوج الهدايا والمخزن", icon: ShoppingBag, permission: "products" },
    { id: "orders", label: "مركز المبيعات والأوردرات", icon: Gift, permission: "orders" },
    { id: "profits", label: "التقارير وصافي الأرباح", icon: DollarSign, permission: "profits" },
    { id: "users", label: "صلاحيات الموظفين والمدراء", icon: ShieldAlert, permission: "users", adminOnly: true }
  ];

  if (!token || !user) {
    return <LoginView onLoginSuccess={handleLoginSuccess} />;
  }

  return (
    <div className="min-h-screen bg-slate-50 flex">
      {/* SIDEBAR FOR LARGE SCREENS - RTL Right Side */}
      <aside className="hidden lg:flex flex-col w-64 bg-slate-900 text-slate-300 border-l border-slate-800">
        <div className="h-16 flex items-center gap-2.5 px-6 border-b border-slate-800">
          <div className="w-8 h-8 rounded-lg bg-rose-600 flex items-center justify-center text-white font-bold">
            Z
          </div>
          <span className="font-extrabold text-base text-white tracking-widest">Zouma Gift Shop</span>
        </div>

        {/* Logged user badge */}
        <div className="p-4 border-b border-slate-800 bg-slate-950/40">
          <div className="text-xs font-bold text-white mb-0.5">{user.name}</div>
          <div className="text-[10px] text-slate-400 flex items-center justify-between">
            <span>{user.role === "super_admin" ? "المدير المسؤول" : "موظف مبيعات"}</span>
            <span className="bg-rose-500/10 text-rose-450 px-1.5 py-0.2 rounded-md text-[9px] font-bold">
              {user.role === "super_admin" ? "أدمن" : "موظف"}
            </span>
          </div>
        </div>

        {/* Sidebar Nav */}
        <nav className="flex-1 px-4 py-4 space-y-1">
          {menuItems.map((item) => {
            // Permission check
            if (item.adminOnly && user.role !== "super_admin") return null;
            if (!item.adminOnly && !hasPermission(item.permission)) return null;

            const Icon = item.icon;
            const isActive = activeTab === item.id;

            return (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id)}
                className={`w-full flex items-center gap-3 px-3 py-2.5 text-xs font-bold rounded-xl transition-all cursor-pointer ${
                  isActive 
                  ? 'bg-rose-600 text-white shadow-md shadow-rose-900/10' 
                  : 'hover:bg-slate-800 hover:text-slate-100 text-slate-400'
                }`}
              >
                <Icon className="w-4 h-4 flex-shrink-0" />
                <span>{item.label}</span>
                {isActive && <ChevronLeft className="w-3.5 h-3.5 mr-auto" />}
              </button>
            );
          })}
        </nav>

        {/* Sidebar logout */}
        <div className="p-4 border-t border-slate-800">
          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-3 px-3 py-2 text-xs font-extrabold rounded-xl hover:bg-slate-800 hover:text-red-400 text-slate-400 cursor-pointer transition"
          >
            <LogOut className="w-4 h-4" />
            <span>تسجيل خروج</span>
          </button>
        </div>
      </aside>

      {/* MOBILE HEADER & MOBILE DRAWERS */}
      <div className="flex-1 flex flex-col">
        {/* Top Navbar */}
        <header className="h-16 bg-white border-b border-slate-100 flex items-center justify-between px-6 z-10">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setMobileMenuOpen(true)}
              className="lg:hidden p-1.5 text-slate-600 border border-slate-100 rounded-lg focus:outline-none hover:bg-slate-50 cursor-pointer"
            >
              <Menu className="w-5 h-5" />
            </button>
            <h1 className="font-extrabold text-sm text-slate-800 mr-1 sm:mr-0">
              {activeTab === "dashboard" ? "لوحة الإحصائيات العامة" :
               activeTab === "clients" ? "حسابات وملفات الزبائن" :
               activeTab === "products" ? "كتالوج الهدايا المتوفرة" :
               activeTab === "orders" ? "صالة مبيعات الأوردرات" :
               activeTab === "profits" ? "تقارير الأرباح والميزانية" : "إدارة شؤون الموظفين"}
            </h1>
          </div>

          <div className="flex items-center gap-3 text-xs">
            <div className="hidden sm:flex flex-col items-end">
              <span className="font-bold text-slate-700">{user.name}</span>
              <span className="text-[10px] text-slate-400">{user.role === "super_admin" ? "المدير المسؤول" : "موظف مبيعات"}</span>
            </div>
            
            <button
              onClick={handleLogout}
              className="sm:hidden p-2 text-slate-400 hover:text-rose-600 rounded-lg border border-slate-50 hover:bg-rose-50"
              title="خروج"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </header>

        {/* MAIN VISUAL ROUTED CONTAINER SCREEN */}
        <main className="flex-1 p-6 md:p-8 max-w-7xl w-full mx-auto overflow-y-auto">
          {activeTab === "dashboard" && hasPermission("dashboard") && (
            <DashboardView token={token} onNavigateToView={(view) => setActiveTab(view)} />
          )}

          {activeTab === "clients" && hasPermission("clients") && (
            <ClientsView token={token} />
          )}

          {activeTab === "products" && hasPermission("products") && (
            <ProductsView token={token} />
          )}

          {activeTab === "orders" && hasPermission("orders") && (
            <OrdersView token={token} />
          )}

          {activeTab === "profits" && hasPermission("profits") && (
            <ReportsView token={token} />
          )}

          {activeTab === "users" && user.role === "super_admin" && (
            <UsersView token={token} currentUser={user} />
          )}
        </main>
      </div>

      {/* MOBILE MENU DRAWER OVERLAY */}
      {mobileMenuOpen && (
        <div className="fixed inset-0 bg-slate-900/40 z-30 flex">
          <div className="w-64 bg-slate-900 text-slate-300 h-full flex flex-col slide-in-right">
            <div className="h-16 flex items-center justify-between px-6 border-b border-slate-800">
              <span className="font-bold text-white tracking-widest">زوما هدايا</span>
              <button
                onClick={() => setMobileMenuOpen(false)}
                className="p-1.5 hover:bg-slate-800 text-slate-300 rounded-lg cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <nav className="flex-1 px-4 py-4 space-y-1">
              {menuItems.map((item) => {
                if (item.adminOnly && user.role !== "super_admin") return null;
                if (!item.adminOnly && !hasPermission(item.permission)) return null;

                const Icon = item.icon;
                const isActive = activeTab === item.id;

                return (
                  <button
                    key={item.id}
                    onClick={() => {
                      setActiveTab(item.id);
                      setMobileMenuOpen(false);
                    }}
                    className={`w-full flex items-center gap-3 px-3 py-2.5 text-xs font-bold rounded-xl transition ${
                      isActive 
                      ? 'bg-rose-600 text-white' 
                      : 'hover:bg-slate-800 hover:text-slate-100 text-slate-400'
                    }`}
                  >
                    <Icon className="w-4 h-4 flex-shrink-0" />
                    <span>{item.label}</span>
                  </button>
                );
              })}
            </nav>

            <div className="p-4 border-t border-slate-800">
              <button
                onClick={() => {
                  setMobileMenuOpen(false);
                  handleLogout();
                }}
                className="w-full flex items-center gap-3 px-3 py-2 text-xs font-semibold rounded-xl hover:bg-slate-800 hover:text-red-400 text-slate-400 cursor-pointer transition"
              >
                <LogOut className="w-4 h-4" />
                <span>تسجيل الخروج</span>
              </button>
            </div>
          </div>
          <div className="flex-1" onClick={() => setMobileMenuOpen(false)}></div>
        </div>
      )}
    </div>
  );
}
