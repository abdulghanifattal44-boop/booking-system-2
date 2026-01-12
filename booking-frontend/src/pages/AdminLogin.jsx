import React, { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext.jsx";
import { useI18n } from "../contexts/I18nContext.jsx";

const CUSTOMER_APP_ORIGIN =
  import.meta.env.VITE_CUSTOMER_APP_ORIGIN || "http://localhost:8081";

const AdminLogin = () => {
  const { t } = useI18n();
  const { login, setPassword, logout, ready, isAuthenticated, isAdmin, user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const [email, setEmail] = useState("");
  const [password, setPasswordValue] = useState("");

  const [screen, setScreen] = useState("login"); // login | set_password
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!ready) return;
    if (isAuthenticated && isAdmin) {
      navigate("/admin", { replace: true });
    }
  }, [ready, isAuthenticated, isAdmin]);

  useEffect(() => {
    const state = location.state;
    if (state?.reason === "not_admin") {
      setError(t("admin.login.only_admin"));
    }
  }, [location.state]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      let ret;
      if (screen === "set_password") {
        ret = await setPassword({ email, password });
      } else {
        ret = await login({ email, password });
      }

      const role = ret?.user?.role;
      if (role !== "admin") {
        // Don't keep a non-admin token inside admin area.
        logout();
        setError(t("admin.login.not_admin"));
        return;
      }

      navigate("/admin", { replace: true });
    } catch (err) {
      const data = err?.response?.data;
      const msg = data?.error || err.message || t("admin.login.failed");
      setError(msg);
      if (data?.action === "set_password") {
        setScreen("set_password");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[70vh] flex items-center justify-center px-4">
      <div className="w-full max-w-md bg-white border border-gray-100 rounded-2xl shadow-sm p-6">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-900">{t("admin.login.title")}</h1>
          <p className="text-sm text-gray-500 mt-1">
            {screen === "set_password"
              ? t("admin.login.setpwd_desc")
              : t("admin.login.desc")}
          </p>
        </div>

        {error && (
          <div className="mb-4 bg-red-50 text-red-700 border border-red-100 px-3 py-2 rounded-lg text-sm">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-3">
          <input
            type="email"
            className="w-full border rounded-xl px-3 py-2"
            placeholder={t("admin.login.email")}
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
          <input
            type="password"
            className="w-full border rounded-xl px-3 py-2"
            placeholder={t("admin.login.password")}
            value={password}
            onChange={(e) => setPasswordValue(e.target.value)}
            required
          />

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white py-2.5 rounded-xl disabled:opacity-60"
          >
            {loading
              ? t("common.processing")
              : screen === "set_password"
              ? t("admin.login.savepwd")
              : t("admin.login.signin")}
          </button>
        </form>

        <div className="mt-4 flex items-center justify-between text-sm">
	          <a
	            href={`${CUSTOMER_APP_ORIGIN}/customer`}
	            className="text-gray-600 hover:text-gray-900 underline"
	          >
	            {t("admin.login.goto_customer")}
	          </a>
          {isAuthenticated && user && (
            <button
              type="button"
              onClick={() => {
                logout();
                setError(null);
                setEmail("");
                setPasswordValue("");
              }}
              className="text-gray-600 hover:text-gray-900 underline"
            >
              {t("admin.login.logout")}
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default AdminLogin;
