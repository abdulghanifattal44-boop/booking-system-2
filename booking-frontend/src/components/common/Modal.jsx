import React, { useEffect } from "react";

const Modal = ({ open, title, onClose, children, footer }) => {
  useEffect(() => {
    if (!open) return;
    const onKey = (e) => {
      if (e.key === "Escape") onClose?.();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      role="dialog"
      aria-modal="true"
    >
      <div
        className="absolute inset-0 bg-black/40"
        onClick={() => onClose?.()}
      />

      <div className="relative w-full max-w-lg rounded-2xl bg-white shadow-xl border border-gray-100 overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
          <h3 className="text-lg font-semibold text-gray-900">{title}</h3>
          <button
            onClick={() => onClose?.()}
            className="text-gray-400 hover:text-gray-700 text-2xl leading-none"
            aria-label="Close"
            type="button"
          >
            ×
          </button>
        </div>

        <div className="px-6 py-5">{children}</div>

        {footer ? (
          <div className="px-6 py-4 border-t border-gray-100 bg-gray-50">
            {footer}
          </div>
        ) : null}
      </div>
    </div>
  );
};

export default Modal;
