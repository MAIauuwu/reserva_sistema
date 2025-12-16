"use client";

import { useState } from "react";
import { Menu, X, Calendar, LogIn, LayoutDashboard, User, UserPlus } from "lucide-react";
import { User as FirebaseUser } from "firebase/auth";

type Props = {
  currentView: string;
  onViewChange: (view: string) => void;
  user: FirebaseUser | null;
  userRole?: string | null;
  onLogout?: () => void;
};

export function Sidebar({ currentView, onViewChange, user, userRole, onLogout }: Props) {
  const [isOpen, setIsOpen] = useState(false);

  const menuItems = [
    {
      id: "calendario",
      label: "Calendario",
      icon: Calendar,
      requiresAuth: false,
    },
    {
      id: "registro",
      label: "Registro",
      icon: UserPlus,
      requiresAuth: false,
      hideWhenLoggedIn: true,
    },
    {
      id: "login",
      label: user ? "Cerrar sesión" : "Iniciar sesión",
      icon: user ? X : LogIn,
      requiresAuth: false,
    },
    {
      id: "dashboard",
      label: "Dashboard",
      icon: LayoutDashboard,
      requiresAuth: true,
      role: "profesor",
    },
  ];

  const handleItemClick = (itemId: string) => {
    if (itemId === "login" && user && onLogout) {
      onLogout();
      return;
    }
    onViewChange(itemId);
    setIsOpen(false);
  };

  const visibleItems = menuItems.filter((item) => {
    // Ocultar registro si el usuario ya está logueado
    if (item.hideWhenLoggedIn && user) return false;
    // Mostrar items que no requieren auth
    if (!item.requiresAuth) return true;
    // Mostrar items que requieren auth solo si el usuario tiene el rol correcto
    return user && item.requiresAuth && item.role === userRole;
  });

  return (
    <>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="fixed left-6 top-6 z-50 rounded-full bg-pastel-primary p-3 text-pastel-dark shadow-xl transition hover:bg-pastel-highlight"
        aria-label="Abrir menú"
      >
        {isOpen ? (
          <X className="h-6 w-6" />
        ) : (
          <Menu className="h-6 w-6" />
        )}
      </button>

      {isOpen && (
        <>
          <div
            className="fixed inset-0 z-40 bg-black/20"
            onClick={() => setIsOpen(false)}
          />
          <aside className="fixed left-0 top-0 z-40 h-full w-72 bg-pastel-light shadow-2xl transition-transform">
            <div className="flex h-full flex-col p-6">
              <div className="mb-8 flex items-center justify-between border-b border-pastel-primary/30 pb-4">
                <h2 className="text-2xl font-bold text-pastel-dark">Menú</h2>
                <button
                  onClick={() => setIsOpen(false)}
                  className="rounded-full p-2 text-pastel-dark transition hover:bg-pastel-accent"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              {user && (
                <div className="mb-6 flex items-center gap-3 rounded-2xl bg-pastel-accent p-4">
                  {user.photoURL ? (
                    <img
                      src={user.photoURL}
                      alt={user.displayName || "Usuario"}
                      className="h-12 w-12 rounded-full border-2 border-pastel-primary object-cover"
                    />
                  ) : (
                    <div className="flex h-12 w-12 items-center justify-center rounded-full bg-pastel-primary text-pastel-dark">
                      <User className="h-6 w-6" />
                    </div>
                  )}
                  <div className="flex-1">
                    <p className="text-sm font-semibold text-pastel-dark">
                      {user.displayName || "Usuario"}
                    </p>
                    <p className="text-xs text-gray-600">{user.email}</p>
                  </div>
                </div>
              )}

              <nav className="flex-1 space-y-2">
                {visibleItems.map((item) => {
                  const Icon = item.icon;
                  const isActive = currentView === item.id;
                  return (
                    <button
                      key={item.id}
                      onClick={() => handleItemClick(item.id)}
                      className={`w-full flex items-center gap-4 rounded-2xl px-4 py-3 text-left transition ${
                        isActive
                          ? "bg-pastel-primary text-pastel-dark"
                          : "text-gray-700 hover:bg-pastel-accent"
                      }`}
                    >
                      <Icon className="h-5 w-5" />
                      <span className="font-semibold">{item.label}</span>
                    </button>
                  );
                })}
              </nav>
            </div>
          </aside>
        </>
      )}
    </>
  );
}

