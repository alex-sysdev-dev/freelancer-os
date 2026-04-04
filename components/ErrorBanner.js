export default function ErrorBanner({ message }) {
  if (!message) return null;

  return (
    <div className="rounded-2xl border border-[#7b2b2b] bg-[#2a1015] p-4 text-sm text-[#f1c6c6] shadow-sm shadow-[#00000033]">
      <p className="font-semibold text-[#ffd6d6]">Data loading issue</p>
      <p className="mt-1 leading-relaxed text-[#d8b0b0]">{message}</p>
    </div>
  );
}
