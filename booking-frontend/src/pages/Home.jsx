import React from "react";
import { Link } from "react-router-dom";
import { useI18n } from "../contexts/I18nContext.jsx";
import { ShieldCheck, CalendarRange, ArrowRight, LayoutDashboard, Database } from "lucide-react";

const APP_TARGET = import.meta.env.VITE_APP_TARGET || "customer"; // customer | admin
// Used by the admin build to link out to the customer app (separate frontend)
const CUSTOMER_APP_URL = import.meta.env.VITE_CUSTOMER_APP_URL || "http://localhost:8081";

const Home = () => {
  const { t } = useI18n();
  return (
    <div className="flex flex-col min-h-[calc(100vh-80px)]">
      {/* Hero Section */}
      <div className="flex-1 flex flex-col justify-center items-center text-center px-4 animate-fade-in">
        <div className="bg-blue-50 text-blue-600 px-4 py-1.5 rounded-full text-sm font-semibold mb-6 inline-flex items-center gap-2 border border-blue-100 shadow-sm animate-slide-up" style={{ animationDelay: '0.1s' }}>
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-blue-500"></span>
          </span>
          {t("home.system_online")}
        </div>

        <h1 className="text-5xl md:text-7xl font-bold text-gray-900 mb-6 tracking-tight animate-slide-up" style={{ animationDelay: '0.2s' }}>
          {t("home.title_a")} <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-indigo-600">{t("home.title_b")}</span>
        </h1>

        <p className="text-xl text-gray-600 mb-12 max-w-2xl mx-auto leading-relaxed animate-slide-up" style={{ animationDelay: '0.3s' }}>
          Streamline your resource management and booking process with our powerful, intuitive platform.
        </p>

        <div className="grid md:grid-cols-2 gap-6 max-w-4xl mx-auto w-full px-4 animate-slide-up" style={{ animationDelay: '0.4s' }}>
          {APP_TARGET === "admin" && (
            <Link
              to="/admin"
              className="group relative bg-white p-8 rounded-2xl shadow-sm hover:shadow-xl transition-all duration-300 border border-gray-100 text-left overflow-hidden"
            >
              <div className="absolute top-0 right-0 w-32 h-32 bg-blue-50 rounded-bl-full -mr-16 -mt-16 transition-all group-hover:scale-110"></div>
              <div className="relative z-10">
                <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center text-blue-600 mb-6 group-hover:scale-110 transition-transform">
                  <ShieldCheck size={28} />
                </div>
                <h2 className="text-2xl font-bold mb-2 text-gray-900 group-hover:text-blue-600 transition-colors">{t("home.admin_portal")}</h2>
                <p className="text-gray-500 mb-6">
                  Manage organizations, configure resources, and oversee all booking operations.
                </p>
                <div className="flex items-center text-blue-600 font-semibold group-hover:translate-x-2 transition-transform">
                  {t("home.access_dashboard")} <ArrowRight size={18} className="ml-2" />
                </div>
              </div>
            </Link>
          )}

          {APP_TARGET === "admin" ? (
            <a
              href={`${CUSTOMER_APP_URL}/customer`}
              className="group relative bg-white p-8 rounded-2xl shadow-sm hover:shadow-xl transition-all duration-300 border border-gray-100 text-left overflow-hidden"
            >
              <div className="absolute top-0 right-0 w-32 h-32 bg-green-50 rounded-bl-full -mr-16 -mt-16 transition-all group-hover:scale-110"></div>
              <div className="relative z-10">
                <div className="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center text-green-600 mb-6 group-hover:scale-110 transition-transform">
                  <CalendarRange size={28} />
                </div>
                <h2 className="text-2xl font-bold mb-2 text-gray-900 group-hover:text-green-600 transition-colors">{t("home.customer_booking")}</h2>
                <p className="text-gray-500 mb-6">
                  Find available timeslots, view resource details, and make reservations instanty.
                </p>
                <div className="flex items-center text-green-600 font-semibold group-hover:translate-x-2 transition-transform">
                  {t("home.go_customer_app")} <ArrowRight size={18} className="ml-2" />
                </div>
              </div>
            </a>
          ) : (
            <Link
              to="/customer"
              className="group relative bg-white p-8 rounded-2xl shadow-sm hover:shadow-xl transition-all duration-300 border border-gray-100 text-left overflow-hidden"
            >
              <div className="absolute top-0 right-0 w-32 h-32 bg-green-50 rounded-bl-full -mr-16 -mt-16 transition-all group-hover:scale-110"></div>
              <div className="relative z-10">
                <div className="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center text-green-600 mb-6 group-hover:scale-110 transition-transform">
                  <CalendarRange size={28} />
                </div>
                <h2 className="text-2xl font-bold mb-2 text-gray-900 group-hover:text-green-600 transition-colors">{t("home.customer_booking")}</h2>
                <p className="text-gray-500 mb-6">
                  Find available timeslots, view resource details, and make reservations instanty.
                </p>
                <div className="flex items-center text-green-600 font-semibold group-hover:translate-x-2 transition-transform">
                  {t("home.book_resource")} <ArrowRight size={18} className="ml-2" />
                </div>
              </div>
            </Link>
          )}
        </div>

        {/* Documentation Hub */}
        <div className="mt-12 w-full max-w-4xl mx-auto px-4 pb-12 animate-slide-up" style={{ animationDelay: '0.5s' }}>
          <h3 className="text-xl font-bold text-gray-900 mb-6 flex items-center gap-2">
            <Database className="text-blue-600" size={24} />
            Project Documentation
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Database Docs */}
            <div
              className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm hover:shadow-md hover:border-blue-300 cursor-pointer transition-all group"
              onClick={() => window.open('/db-docs.html', '_blank')}
            >
              <div className="flex justify-between items-center mb-2">
                <span className="font-bold text-gray-800 group-hover:text-blue-600 transition-colors">Database Docs</span>
                <ArrowRight size={18} className="text-gray-400 group-hover:translate-x-1 transition-transform" />
              </div>
              <p className="text-sm text-gray-500">Schema, Relations, PL/pgSQL.</p>
            </div>

            {/* Backend Docs */}
            <div
              className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm hover:shadow-md hover:border-teal-300 cursor-pointer transition-all group"
              onClick={() => window.open('/be-docs.html', '_blank')}
            >
              <div className="flex justify-between items-center mb-2">
                <span className="font-bold text-gray-800 group-hover:text-teal-600 transition-colors">Backend Docs</span>
                <ArrowRight size={18} className="text-gray-400 group-hover:translate-x-1 transition-transform" />
              </div>
              <p className="text-sm text-gray-500">Node.js, Express, Modules.</p>
            </div>

            {/* Frontend Docs */}
            <div
              className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm hover:shadow-md hover:border-indigo-300 cursor-pointer transition-all group"
              onClick={() => window.open('/fe-docs.html', '_blank')}
            >
              <div className="flex justify-between items-center mb-2">
                <span className="font-bold text-gray-800 group-hover:text-indigo-600 transition-colors">Frontend Docs</span>
                <ArrowRight size={18} className="text-gray-400 group-hover:translate-x-1 transition-transform" />
              </div>
              <p className="text-sm text-gray-500">React, Tailwind, Components.</p>
            </div>

            {/* DevOps Docs */}
            <div
              className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm hover:shadow-md hover:border-orange-300 cursor-pointer transition-all group"
              onClick={() => window.open('/devops-docs.html', '_blank')}
            >
              <div className="flex justify-between items-center mb-2">
                <span className="font-bold text-gray-800 group-hover:text-orange-600 transition-colors">DevOps Docs</span>
                <ArrowRight size={18} className="text-gray-400 group-hover:translate-x-1 transition-transform" />
              </div>
              <p className="text-sm text-gray-500">Docker, Nginx, Deployment.</p>
            </div>
          </div>
        </div>
      </div>

      {/* Footer */}
      <footer className="py-6 text-center text-gray-400 text-sm">
        © 2025 Booking System. All rights reserved.
      </footer>
    </div>
  );
};

export default Home;
