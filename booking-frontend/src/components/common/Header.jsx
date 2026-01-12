import React from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { Home, Shield, Calendar, LogOut } from "lucide-react";
import { useAuth } from "../../contexts/AuthContext.jsx";
import { useI18n } from "../../contexts/I18nContext.jsx";

const APP_TARGET = import.meta.env.VITE_APP_TARGET || "customer"; // customer | admin
const CUSTOMER_APP_ORIGIN =
  import.meta.env.VITE_CUSTOMER_APP_ORIGIN ||
  (() => {
    // Dev default: admin runs on :8082, customer runs on :8081
    try {
      const { protocol, hostname, port } = window.location;
      if (hostname === "localhost" || hostname === "127.0.0.1") {
        if (port === "8082") return `${protocol}//${hostname}:8081`;
      }
      // If using admin.<domain>, you should set VITE_CUSTOMER_APP_ORIGIN explicitly.
      return `${protocol}//${hostname}`;
    } catch {
      return "";
    }
  })();

const Header = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { isAuthenticated, user, logout } = useAuth();
  const { lang, setLang, t } = useI18n();

  const handleLogout = () => {
    logout();
    if (location.pathname.startsWith("/admin")) {
      navigate("/admin/login");
    }
  };

  return (
    <header className="sticky top-0 z-50 bg-white/80 backdrop-blur-md border-b border-gray-100 shadow-sm transition-all duration-300">
      <div className="container mx-auto px-4 py-3">
        <div className="flex justify-between items-center gap-4">
          <Link
            to="/"
            className="text-xl font-bold text-gray-900 flex items-center gap-2 hover:opacity-80 transition-opacity"
          >
            <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center text-white">
              <span className="font-bold">B</span>
            </div>
            {t("app.title")}
          </Link>

          <div className="flex items-center gap-3">
            <nav className="flex space-x-1 lg:space-x-2">
              {APP_TARGET === "customer" ? (
                <>
                  <Link
                    to="/"
                    className={`flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium transition-all duration-200 ${
                      location.pathname === "/"
                        ? "bg-blue-50 text-blue-600 shadow-sm"
                        : "text-gray-500 hover:text-gray-900 hover:bg-gray-50"
                    }`}
                  >
                    <Home size={16} />
                    <span className="hidden sm:inline">{t("nav.home")}</span>
                  </Link>

                  <Link
                    to="/customer"
                    className={`flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium transition-all duration-200 ${
                      location.pathname.startsWith("/customer")
                        ? "bg-blue-600 text-white shadow-md hover:bg-blue-700"
                        : "text-gray-500 hover:text-gray-900 hover:bg-gray-50"
                    }`}
                  >
                    <Calendar size={16} />
                    <span className="hidden sm:inline">{t("nav.book_now")}</span>
                  </Link>
                </>
              ) : (
                <>
                  <a
                    href={`${CUSTOMER_APP_ORIGIN}/`}
                    className="flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium transition-all duration-200 text-gray-500 hover:text-gray-900 hover:bg-gray-50"
                  >
                    <Home size={16} />
                    <span className="hidden sm:inline">{t("nav.home")}</span>
                  </a>

                  <a
                    href={`${CUSTOMER_APP_ORIGIN}/customer`}
                    className="flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium transition-all duration-200 text-gray-500 hover:text-gray-900 hover:bg-gray-50"
                  >
                    <Calendar size={16} />
                    <span className="hidden sm:inline">{t("nav.book_now")}</span>
                  </a>

                  <Link
                    to="/admin"
                    className={`flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium transition-all duration-200 ${
                      location.pathname.startsWith("/admin")
                        ? "bg-blue-50 text-blue-600 shadow-sm"
                        : "text-gray-500 hover:text-gray-900 hover:bg-gray-50"
                    }`}
                  >
                    <Shield size={16} />
                    <span className="hidden sm:inline">{t("nav.admin")}</span>
                  </Link>
                </>
              )}
            </nav>

            <div className="flex items-center gap-1 bg-gray-50 border border-gray-100 rounded-full p-1">
              <button
                type="button"
                onClick={() => setLang("en")}
                className={`px-2.5 py-1 rounded-full text-xs font-semibold ${
                  lang === "en" ? "bg-white shadow-sm" : "text-gray-500"
                }`}
                aria-label="English"
              >
                EN
              </button>
              <button
                type="button"
                onClick={() => setLang("ru")}
                className={`px-2.5 py-1 rounded-full text-xs font-semibold ${
                  lang === "ru" ? "bg-white shadow-sm" : "text-gray-500"
                }`}
                aria-label="Russian"
              >
                RU
              </button>
            </div>

            {isAuthenticated && (
              <div className="hidden md:flex items-center gap-3">
                <div className="text-xs text-gray-600 bg-gray-50 border border-gray-100 px-3 py-1.5 rounded-full">
                  {user?.email} <span className="text-gray-400">•</span> {user?.role || "user"}
                </div>
                <button
                  type="button"
                  onClick={handleLogout}
                  className="flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium text-gray-500 hover:text-gray-900 hover:bg-gray-50 transition-all"
                  title={t("nav.logout")}
                >
                  <LogOut size={16} />
                  <span className="hidden lg:inline">{t("nav.logout")}</span>
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;
