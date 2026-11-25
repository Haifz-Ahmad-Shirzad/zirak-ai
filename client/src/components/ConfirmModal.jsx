import React, { useEffect } from "react";
import { t } from "../i18n.js";

export default function ConfirmModal({
  isOpen,
  onClose,
  onConfirm,
  title,
  children,
  locale = "en",
}) {
  useEffect(() => {
    if (!isOpen) return undefined;
    const handleKeyDown = (event) => {
      if (event.key === "Escape") {
        onClose();
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 bg-black bg-opacity-60 z-50 flex justify-center items-center"
      onClick={onClose} // Close modal on backdrop click
      role="dialog"
      aria-modal="true"
      aria-labelledby="confirm-modal-title"
    >
      <div
        className="bg-gray-800 rounded-lg shadow-xl p-6 w-full max-w-md mx-4"
        onClick={(e) => e.stopPropagation()} // Prevent closing when clicking inside the modal
      >
        <h2 id="confirm-modal-title" className="text-xl font-bold mb-4">
          {title}
        </h2>
        <div className="text-gray-300 mb-6">{children}</div>
        <div className="flex justify-end gap-4">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-md bg-gray-600 hover:bg-gray-700 transition-colors"
          >
            {t(locale, "cancel")}
          </button>
          <button
            onClick={onConfirm}
            className="px-4 py-2 rounded-md bg-red-600 hover:bg-red-700 transition-colors"
          >
            {t(locale, "delete")}
          </button>
        </div>
      </div>
    </div>
  );
}
