import { Menu, Moon, Sun, X } from "lucide-react";

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
          aria-label={mobileSidebarOpen ? "Close sidebar" : "Open sidebar"}
          aria-expanded={mobileSidebarOpen}
        >
          {mobileSidebarOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </button>
        <h1 className="truncate text-lg font-semibold">Zirak AI</h1>
      </div>

      <div className="flex shrink-0 items-center gap-2">
        <label htmlFor="model-selector" className="sr-only">
          Select AI Provider
        </label>
        <select
          id="model-selector"
          value={selectedModel}
          onChange={(e) => setSelectedModel(e.target.value)}
          className="max-w-36 rounded-md border border-gray-700 bg-gray-800 px-2 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 sm:max-w-none sm:px-3"
        >
          {models.map((model) => (
            <option key={model.id} value={model.id}>
              {model.name}
            </option>
          ))}
        </select>

        <button
          type="button"
          onClick={onToggleTheme}
          className="inline-flex min-h-10 min-w-10 items-center justify-center rounded-lg border border-gray-700 hover:bg-gray-700"
          aria-label={`Switch to ${nextTheme} mode`}
          title={`Switch to ${nextTheme} mode`}
        >
          {theme === "dark" ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
        </button>
      </div>
    </header>
  );
}
