export default function Loading() {
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950 flex items-center justify-center">
      <div className="flex flex-col items-center gap-4">
        <div className="w-10 h-10 rounded-full border-4 border-[#534AB7]/20 border-t-[#534AB7] animate-spin" />
        <p className="text-sm text-gray-400 dark:text-gray-500">Loading…</p>
      </div>
    </div>
  );
}
