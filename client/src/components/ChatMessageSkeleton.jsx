export default function ChatMessageSkeleton() {
  return (
    <div className="py-6 px-6 flex gap-4 bg-gray-800/50 animate-pulse">
      <div className="w-8 h-8 rounded-full bg-gray-700 shrink-0"></div>
      <div className="flex-1 space-y-3">
        <div className="h-4 bg-gray-700 rounded w-3/4"></div>
        <div className="h-4 bg-gray-700 rounded w-1/2"></div>
        <div className="h-4 bg-gray-700 rounded w-5/6"></div>
      </div>
    </div>
  );
}
