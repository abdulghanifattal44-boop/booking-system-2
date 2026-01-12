// src/pages/NotFound.jsx
import React from "react";
import { useI18n } from "../contexts/I18nContext.jsx";

const NotFound = () => {
  const { t } = useI18n();
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="text-center px-4">
        <h1 className="text-5xl font-bold text-gray-900 mb-3">404</h1>
        <p className="text-lg text-gray-700 mb-4">{t("notfound.title")}</p>
        <p className="text-sm text-gray-500 mb-6">
          {t("notfound.desc")}
        </p>
        <a
          href="/"
          className="inline-flex items-center px-4 py-2 rounded-lg bg-blue-600 text-white text-sm font-medium hover:bg-blue-700"
        >
          {t("common.back_home")}
        </a>
      </div>
    </div>
  );
};

export default NotFound;

