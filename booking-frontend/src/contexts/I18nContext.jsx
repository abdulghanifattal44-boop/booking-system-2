import React, { createContext, useContext, useEffect, useMemo, useState } from "react";

const I18nContext = createContext(null);

const APP_TARGET = import.meta.env.VITE_APP_TARGET || "customer"; // customer | admin
const STORAGE_KEY = APP_TARGET === "admin" ? "booking_lang_admin" : "booking_lang_customer";

const DICT = {
  en: {
    "app.title": "Booking System",
    "nav.home": "Home",
    "nav.book_now": "Book Now",
    "nav.admin": "Admin",
    "nav.logout": "Logout",
    "nav.language": "Language",

    "common.loading": "Loading...",
    "common.processing": "Processing...",
    "common.back_home": "Back to Home",

    "home.system_online": "System Online v1.0",
    "home.title_a": "Booking",
    "home.title_b": "Simplified",
    "home.admin_portal": "Admin Portal",
    "home.access_dashboard": "Access Dashboard",
    "home.customer_booking": "Customer Booking",
    "home.book_resource": "Book a Resource",
    "home.go_customer_app": "Go to Customer App",

    "admin.login.title": "Admin Login",
    "admin.login.desc": "Sign in to access the admin dashboard.",
    "admin.login.setpwd_desc": "Admin account exists but no password is set. Set a password to continue.",
    "admin.login.email": "Email",
    "admin.login.password": "Password",
    "admin.login.signin": "Sign In",
    "admin.login.savepwd": "Save Password",
    "admin.login.goto_customer": "Go to Customer Portal",
    "admin.login.logout": "Logout",
    "admin.login.only_admin": "Admins only. Please sign in with an admin account.",
    "admin.login.not_admin": "This account is not admin. Use the customer portal or sign in with an admin account.",
    "admin.login.failed": "Login failed",

    "customer.tabs.new": "New Booking",
    "customer.tabs.my": "My Bookings",
    "customer.confirm": "Confirm Reservation",
    "customer.search_email": "Search by email",
    "customer.cancel": "Cancel",

    "customer.msg.select_time": "⚠️ Please select a time before confirming the booking.",
    "customer.msg.need_auth": "ℹ️ Please register/login to confirm the booking.",
    "customer.msg.success": "✅ Booking created successfully.",
    "customer.msg.slot_taken": "⚠️ This time is already booked. Please choose another slot.",
    "customer.msg.need_login": "⚠️ Please login to complete the booking.",
    "customer.msg.error_create": "❌ Error while creating booking.",

    "customer.cancel.confirm": "Are you sure you want to cancel this booking?",
    "customer.cancel.success": "Booking cancelled successfully",
    "customer.cancel.error": "Error cancelling booking",

    "admin.dashboard.title": "Admin Dashboard",

    "notfound.title": "Page not found",
    "notfound.desc": "The page you are looking for doesn't exist or has been moved.",
  },

  ru: {
    "app.title": "Система бронирования",
    "nav.home": "Главная",
    "nav.book_now": "Записаться",
    "nav.admin": "Админ",
    "nav.logout": "Выйти",
    "nav.language": "Язык",

    "common.loading": "Загрузка...",
    "common.processing": "Обработка...",
    "common.back_home": "На главную",

    "home.system_online": "Система онлайн v1.0",
    "home.title_a": "Бронирование",
    "home.title_b": "Просто",
    "home.admin_portal": "Портал администратора",
    "home.access_dashboard": "Открыть панель",
    "home.customer_booking": "Запись клиента",
    "home.book_resource": "Забронировать ресурс",
    "home.go_customer_app": "Перейти в приложение клиента",

    "admin.login.title": "Вход администратора",
    "admin.login.desc": "Войдите, чтобы открыть панель администратора.",
    "admin.login.setpwd_desc": "Учетная запись администратора есть, но пароль не задан. Задайте пароль, чтобы продолжить.",
    "admin.login.email": "Email",
    "admin.login.password": "Пароль",
    "admin.login.signin": "Войти",
    "admin.login.savepwd": "Сохранить пароль",
    "admin.login.goto_customer": "Перейти в кабинет клиента",
    "admin.login.logout": "Выйти",
    "admin.login.only_admin": "Только администратор. Войдите под админ-аккаунтом.",
    "admin.login.not_admin": "Это не админ-аккаунт. Используйте кабинет клиента или войдите как админ.",
    "admin.login.failed": "Ошибка входа",

    "customer.tabs.new": "Новая запись",
    "customer.tabs.my": "Мои бронирования",
    "customer.confirm": "Подтвердить",
    "customer.search_email": "Поиск по email",
    "customer.cancel": "Отмена",

    "customer.msg.select_time": "⚠️ Выберите время перед подтверждением.",
    "customer.msg.need_auth": "ℹ️ Зарегистрируйтесь/войдите, чтобы подтвердить бронирование.",
    "customer.msg.success": "✅ Бронирование успешно создано.",
    "customer.msg.slot_taken": "⚠️ Это время уже занято. Выберите другой слот.",
    "customer.msg.need_login": "⚠️ Войдите, чтобы завершить бронирование.",
    "customer.msg.error_create": "❌ Ошибка при создании бронирования.",

    "customer.cancel.confirm": "Вы уверены, что хотите отменить бронирование?",
    "customer.cancel.success": "Бронирование отменено",
    "customer.cancel.error": "Ошибка отмены бронирования",

    "admin.dashboard.title": "Панель администратора",

    "notfound.title": "Страница не найдена",
    "notfound.desc": "Страница не существует или была перемещена.",
  },
};

function detectBrowserLang() {
  try {
    const l = (navigator.language || "").toLowerCase();
    return l.startsWith("ru") ? "ru" : "en";
  } catch {
    return "en";
  }
}

export function I18nProvider({ children }) {
  const [lang, setLangState] = useState("en");

  useEffect(() => {
    const stored = localStorage.getItem(STORAGE_KEY);
    setLangState(stored || detectBrowserLang());
  }, []);

  const setLang = (next) => {
    const normalized = next === "ru" ? "ru" : "en";
    setLangState(normalized);
    localStorage.setItem(STORAGE_KEY, normalized);
  };

  const t = (key, fallback) => {
    const table = DICT[lang] || DICT.en;
    return table[key] || fallback || DICT.en[key] || key;
  };

  const locale = lang === "ru" ? "ru-RU" : "en-US";

  const value = useMemo(() => ({ lang, setLang, t, locale }), [lang]);

  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>;
}

export function useI18n() {
  const ctx = useContext(I18nContext);
  if (!ctx) throw new Error("useI18n must be used within an I18nProvider");
  return ctx;
}
