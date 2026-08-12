import { Menu } from "lucide-react";

const DEFAULT_MODELS = [
  {
    id: "openrouter",
    name: "OpenRouter",
  },
  {
    id: "gemini",
    name: "Gemini",
  },
  {
    id: "openai",
    name: "OpenAI",
  },
];

export default function ChatHeader({
  models = DEFAULT_MODELS,
  selectedModel,
  setSelectedModel,
  collapsed,
  setCollapsed,
}) {
  return (
    <header className="flex items-center justify-between p-4 border-b border-gray-700">
      <div className="flex items-center gap-2">
        <button
          onClick={() => setCollapsed(!collapsed)}
          className="p-1 hover:bg-gray-700 rounded md:hidden"
          aria-label="Toggle sidebar"
          aria-expanded={!collapsed}
        >
          <Menu className="w-5 h-5" />
        </button>

        <h1 className="text-lg font-semibold">Zirak AI</h1>
      </div>

      <div className="flex items-center gap-2">
        <label htmlFor="model-selector" className="sr-only">
          Select AI Provider
        </label>

        <select
          id="model-selector"
          value={selectedModel}
          onChange={(e) => setSelectedModel(e.target.value)}
          className="bg-gray-800 border border-gray-700 rounded-md px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          {models.map((model) => (
            <option key={model.id} value={model.id}>
              {model.name}
            </option>
          ))}
        </select>
      </div>
    </header>
  );
}
