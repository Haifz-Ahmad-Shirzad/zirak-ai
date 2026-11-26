import { useEffect, useState } from "react";
import { X } from "lucide-react";
import { supportedLocales, t } from "../i18n.js";

export default function ProfileDialog({
  isOpen,
  onClose,
  profileName,
  onSaveProfile,
  theme,
  setTheme,
  locale,
  setLocale,
}) {
  const [draftName, setDraftName] = useState(profileName);

  useEffect(() => {
    if (isOpen) setDraftName(profileName);
  }, [isOpen, profileName]);

  useEffect(() => {
    if (!isOpen) return undefined;
    const closeOnEscape = (event) => {
      if (event.key === "Escape") onClose();
    };
    document.addEventListener("keydown", closeOnEscape);
    return () => document.removeEventListener("keydown", closeOnEscape);
  }, [isOpen, onClose]);

  if (!isOpen) return null;
  const initials = draftName.trim().split(/\s+/).filter(Boolean).slice(0, 2)
    .map((part) => part[0]?.toUpperCase()).join("") || "Z";

  const save = (event) => {
    event.preventDefault();
    const normalizedName = draftName.trim().replace(/\s+/g, " ");
    if (!normalizedName) return;
    onSaveProfile(normalizedName);
    onClose();
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/55 p-4"
      onMouseDown={(event) => { if (event.target === event.currentTarget) onClose(); }}
    >
      <section
        role="dialog"
        aria-modal="true"
        aria-labelledby="profile-title"
        className="w-full max-w-md rounded-2xl border border-gray-700 bg-gray-900 p-5 text-white shadow-2xl sm:p-6"
      >
        <div className="mb-5 flex items-start justify-between gap-4">
          <div>
            <h2 id="profile-title" className="text-xl font-semibold">{t(locale, "profile")}</h2>
            <p className="mt-1 text-sm text-gray-400">{t(locale, "profileDescription")}</p>
          </div>
          <button type="button" onClick={onClose}
            className="inline-flex min-h-10 min-w-10 items-center justify-center rounded-lg hover:bg-gray-800"
            aria-label={t(locale, "closeSidebar")}>
            <X className="h-5 w-5" />
          </button>
        </div>

        <form onSubmit={save} className="space-y-5">
          <div className="flex items-center gap-4">
            <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-full bg-blue-600 text-lg font-semibold">
              {initials}
            </div>
            <div className="min-w-0">
              <p className="truncate font-medium">{draftName || profileName}</p>
              <p className="text-xs text-gray-400">{t(locale, "savedOnDevice")}</p>
            </div>
          </div>

          <label className="block text-sm font-medium" htmlFor="profile-display-name">
            {t(locale, "displayName")}
            <input
              id="profile-display-name"
              value={draftName}
              onChange={(event) => setDraftName(event.target.value)}
              maxLength={60}
              autoFocus
              className="mt-2 min-h-11 w-full rounded-lg border border-gray-700 bg-gray-800 px-3 text-sm text-white outline-none focus:ring-2 focus:ring-blue-500"
            />
          </label>

          <div className="grid grid-cols-2 gap-3">
            <label className="block text-sm font-medium" htmlFor="profile-theme">
              {t(locale, "appearance")}
              <select id="profile-theme" value={theme}
                onChange={(event) => setTheme(event.target.value)}
                className="mt-2 min-h-11 w-full rounded-lg border border-gray-700 bg-gray-800 px-3 text-sm text-white">
                <option value="light">{t(locale, "lightMode")}</option>
                <option value="dark">{t(locale, "darkMode")}</option>
              </select>
            </label>
            <label className="block text-sm font-medium" htmlFor="profile-language">
              {t(locale, "language")}
              <select id="profile-language" value={locale}
                onChange={(event) => setLocale(event.target.value)}
                className="mt-2 min-h-11 w-full rounded-lg border border-gray-700 bg-gray-800 px-3 text-sm text-white">
                {supportedLocales.map((item) => (
                  <option key={item.code} value={item.code}>{item.label}</option>
                ))}
              </select>
            </label>
          </div>

          <div className="flex justify-end gap-2 pt-1">
            <button type="button" onClick={onClose}
              className="min-h-10 rounded-lg px-4 text-sm hover:bg-gray-800">{t(locale, "cancel")}</button>
            <button type="submit" disabled={!draftName.trim()}
              className="min-h-10 rounded-lg bg-blue-600 px-4 text-sm font-medium text-gray-950 hover:bg-blue-700 disabled:opacity-50">
              {t(locale, "save")}
            </button>
          </div>
        </form>
      </section>
    </div>
  );
}
