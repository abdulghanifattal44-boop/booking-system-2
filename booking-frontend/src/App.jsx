// src/App.jsx
import React from "react";
import { BrowserRouter as Router, Routes, Route, Navigate, useLocation } from "react-router-dom";

import { useAuth } from "./contexts/AuthContext.jsx";
import { useI18n } from "./contexts/I18nContext.jsx";

import Header from "./components/common/Header";
import Home from "./pages/Home";
import Admin from "./pages/Admin";
import AdminLogin from "./pages/AdminLogin.jsx";
import Customer from "./pages/Customer";

// Admin sub-pages
import Organizations from "./components/admin/Organizations";
import Branches from "./components/admin/Branches";
import Resources from "./components/admin/Resources";
import Bookings from "./components/admin/Bookings";
import AdminResourceTime from "./pages/AdminResourceTime";

// صفحة 404
import NotFound from "./pages/NotFound";

const APP_TARGET = import.meta.env.VITE_APP_TARGET || "customer"; // customer | admin

function RequireAdmin({ children }) {
  const { ready, isAuthenticated, isAdmin } = useAuth();
  const { t } = useI18n();
  const location = useLocation();

  if (!ready) {
    return (
      <div className="flex items-center justify-center h-40 text-gray-600">{t("common.loading")}</div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/admin/login" state={{ from: location }} replace />;
  }

  if (!isAdmin) {
    return <Navigate to="/admin/login" state={{ from: location, reason: "not_admin" }} replace />;
  }

  return children;
}

function App() {
  return (
    <Router>
      <div className="min-h-screen bg-gray-50">
        <Header />
        <main className="container mx-auto px-4 py-8">
          <Routes>
            {APP_TARGET === "customer" ? (
              <>
                {/* Customer site (no admin UI/routes at all) */}
                <Route path="/" element={<Home />} />
                <Route path="/customer/*" element={<Customer />} />

                {/* Block any /admin access on customer site */}
                <Route path="/admin/*" element={<NotFound />} />
              </>
            ) : (
              <>
                {/* Admin site */}
                <Route path="/" element={<Navigate to="/admin" replace />} />
                <Route path="/admin/login" element={<AdminLogin />} />
                <Route
                  path="/admin"
                  element={
                    <RequireAdmin>
                      <Admin />
                    </RequireAdmin>
                  }
                />

                {/* Admin management pages */}
                <Route
                  path="/admin/organizations"
                  element={
                    <RequireAdmin>
                      <Organizations />
                    </RequireAdmin>
                  }
                />
                <Route
                  path="/admin/branches"
                  element={
                    <RequireAdmin>
                      <Branches />
                    </RequireAdmin>
                  }
                />
                <Route
                  path="/admin/resources"
                  element={
                    <RequireAdmin>
                      <Resources />
                    </RequireAdmin>
                  }
                />
                <Route
                  path="/admin/bookings"
                  element={
                    <RequireAdmin>
                      <Bookings />
                    </RequireAdmin>
                  }
                />
                <Route
                  path="/admin/resource-time"
                  element={
                    <RequireAdmin>
                      <AdminResourceTime />
                    </RequireAdmin>
                  }
                />
              </>
            )}

            {/* 404 (أي لينك غلط) */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </main>
      </div>
    </Router>
  );
}

export default App;
