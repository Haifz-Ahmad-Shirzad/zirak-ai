import { Menu, Moon, Sun, X } from "lucide-react";
import { supportedLocales, t } from "../i18n.js";

const DEFAULT_MODELS = [
  { id: "openrouter", name: "OpenRouter" },
  { id: "gemini", name: "Gemini" },
  { id: "openai", name: "OpenAI" },
];

export default function ChatHeader({
  models = DEFAULT_MODELS,
  selectedModel,
  setSelectedModel,
  mobileSidebarOpen,
  setMobileSidebarOpen,
  theme,
  locale = "en",
  setLocale,
  onToggleTheme,
}) {
  const nextTheme = theme === "dark" ? "light" : "dark";

  return (
    <header className="flex items-center justify-between gap-3 p-4 border-b border-gray-700">
      <div className="flex min-w-0 items-center gap-2">
        <button
          type="button"
          onClick={() => setMobileSidebarOpen(!mobileSidebarOpen)}
          className="inline-flex min-h-10 min-w-10 items-center justify-center rounded-lg hover:bg-gray-700 md:hidden"
          aria-label={t(locale, mobileSidebarOpen ? "closeSidebar" : "openSidebar")}
          aria-expanded={mobileSidebarOpen}
        >
          {mobileSidebarOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </button>
        <h1 className="min-w-0 max-w-20 truncate text-lg font-semibold sm:max-w-none">Zirak AI</h1>
      </div>

      <div className="flex shrink-0 items-center gap-2">
        <label htmlFor="model-selector" className="sr-only">
          {t(locale, "selectProvider")}
        </label>
        <select
          id="model-selector"
          value={selectedModel}
          onChange={(e) => setSelectedModel(e.target.value)}
          className="w-24 rounded-md border border-gray-700 bg-gray-800 px-2 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 sm:max-w-none sm:px-3"
        >
          {models.map((model) => (
            <option key={model.id} value={model.id}>
              {model.name}
            </option>
          ))}
        </select>

        <label className="sr-only" htmlFor="language-selector">{t(locale, "language")}</label>
        <select
          title={t(locale, "language")}
          id="language-selector"
          value={locale}
          onChange={(event) => setLocale(event.target.value)}
          className="w-16 rounded-md border border-gray-700 bg-gray-800 px-2 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 sm:max-w-none"
        >
          {supportedLocales.map((item) => (
            <option key={item.code} value={item.code}>{item.label}</option>
          ))}
        </select>
        <button
          type="button"
          onClick={onToggleTheme}
          className="inline-flex min-h-10 min-w-10 items-center justify-center rounded-lg border border-gray-700 hover:bg-gray-700"
          aria-label={t(locale, nextTheme === "light" ? "switchLight" : "switchDark")}
          title={t(locale, nextTheme === "light" ? "switchLight" : "switchDark")}
        >
          {theme === "dark" ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
        </button>
      </div>
    </header>
  );
}
