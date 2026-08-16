import AppShell from "../components/AppShell";

// A friendly placeholder for sidebar destinations that exist in the design
// but haven't been built out yet (Orders, Reports, AI Assistant, Customers,
// Staff). Swap this out page by page as you build the real thing.
export default function ComingSoon({ title, icon, description }) {
  return (
    <AppShell>
      <div className="px-8 py-8 max-w-[1400px] mx-auto">
        <div className="bg-white rounded-2xl shadow-sm border border-outline-variant/20 p-16 flex flex-col items-center text-center gap-4">
          <div className="w-14 h-14 rounded-full bg-brand-green-soft flex items-center justify-center">
            <span className="material-symbols-outlined text-brand-green text-[28px]">{icon}</span>
          </div>
          <h1 className="font-display-lg text-[24px] font-bold text-on-surface">{title}</h1>
          <p className="text-on-surface-variant text-body-md max-w-md">{description}</p>
        </div>
      </div>
    </AppShell>
  );
}
