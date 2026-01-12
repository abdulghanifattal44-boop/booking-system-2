import React, { createContext, useContext, useEffect, useMemo, useState } from "react";
import api from "../services/api";

const AuthContext = createContext(null);

// We ship two separate frontends (customer + admin). In some deployments they
// can share the same origin, so we MUST use different localStorage keys.
const APP_TARGET = import.meta.env.VITE_APP_TARGET || "customer";
const STORAGE_KEY = APP_TARGET === "admin" ? "booking_auth_admin" : "booking_auth_customer";

function safeParse(json) {
  try {
    return JSON.parse(json);
  } catch {
    return null;
  }
}

export const AuthProvider = ({ children }) => {
  const [token, setToken] = useState(null);
  const [user, setUser] = useState(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const raw = localStorage.getItem(STORAGE_KEY);
    const data = raw ? safeParse(raw) : null;

    // If someone used an admin account inside the customer portal (or the
    // same origin scenario leaked a token), do NOT hydrate it.
    if (APP_TARGET === "customer" && data?.user?.role === "admin") {
      localStorage.removeItem(STORAGE_KEY);
      setReady(true);
      return;
    }

    if (data && data.token && data.user) {
      setToken(data.token);
      setUser(data.user);
    }
    setReady(true);
  }, []);

  const persist = (nextToken, nextUser) => {
    // Prevent admin sessions inside the customer portal.
    if (APP_TARGET === "customer" && nextUser?.role === "admin") {
      clear();
      throw new Error("This is an admin account. Use the admin portal to sign in.");
    }
    setToken(nextToken);
    setUser(nextUser);
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ token: nextToken, user: nextUser }));
  };

  const clear = () => {
    setToken(null);
    setUser(null);
    localStorage.removeItem(STORAGE_KEY);
  };

  const register = async ({ name, email, phone, password }) => {
    const res = await api.post("/auth/register", { name, email, phone, password });
    persist(res.data.token, res.data.user);
    return res.data;
  };

  const login = async ({ email, password }) => {
    const res = await api.post("/auth/login", { email, password });
    persist(res.data.token, res.data.user);
    return res.data;
  };

  const setPassword = async ({ email, password }) => {
    const res = await api.post("/auth/set-password", { email, password });
    persist(res.data.token, res.data.user);
    return res.data;
  };

  const logout = () => {
    clear();
  };

  const value = useMemo(
    () => ({
      token,
      user,
      ready,
      isAuthenticated: !!token && !!user,
      isAdmin: user?.role === "admin",
      register,
      login,
      setPassword,
      logout,
    }),
    [token, user, ready]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within an AuthProvider");
  return ctx;
};
