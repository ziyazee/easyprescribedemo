export function FormSection({ icon, title, children }) {
  return (
    <section className="space-y-6">
      <div className="flex items-center gap-2 pb-2 border-b border-[#dde4e2]">
        <span className="material-symbols-outlined text-[#1f7a5c]">{icon}</span>
        <h2 className="text-lg font-semibold text-[#121715]">{title}</h2>
      </div>
      {children}
    </section>
  );
}
