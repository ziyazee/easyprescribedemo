export function DashboardSidebar({ activeView, onNavigate, onSignOut }) {
  const itemClass = (key) =>
    activeView === key || (key === 'newPrescription' && activeView === 'preview')
      ? 'flex items-center gap-3 px-3 py-2.5 rounded-lg border border-[#1f7a5c]/20 bg-[#1f7a5c]/12 text-[#145539] shadow-sm shadow-[#1f7a5c]/10 transition-all duration-200'
      : 'flex items-center gap-3 px-3 py-2.5 rounded-lg text-slate-600 hover:bg-slate-50 hover:text-[#1f7a5c] hover:border hover:border-slate-200/80 transition-all duration-200';

  return (
    <aside className="w-64 flex-shrink-0 flex flex-col bg-[#fdfefe] border-r border-slate-200/90 h-full">
      <div className="px-4 py-4 flex items-center gap-3 border-b border-slate-100">
        <div className="h-11 w-11 rounded-full overflow-hidden border-2 border-slate-200 shadow-sm flex-shrink-0">
          <img src="/img.png" alt="EasyPrescribe Logo" className="h-full w-full object-cover" />
        </div>
        <div className="flex flex-col min-w-0">
          <span className="text-base font-bold text-slate-800 leading-tight">Easy Prescribe</span>
          <span className="text-[10px] text-slate-500 leading-tight">simplifying clinical workflows</span>
        </div>
      </div>

      <nav className="flex-1 overflow-y-auto px-3 py-2 space-y-1">
        <button
          className="w-full flex items-center justify-center gap-2 px-3 py-2.5 rounded-lg bg-[#1f7a5c] text-white text-sm font-semibold shadow-md shadow-[#1f7a5c]/25 hover:bg-[#186349] hover:shadow-lg hover:shadow-[#1f7a5c]/30 active:bg-[#145539] transition-all duration-200 mb-2"
          type="button"
          onClick={() => onNavigate?.('/new-prescription/details')}
        >
          <span className="material-symbols-outlined text-[20px]">add</span>
          New Prescription
        </button>

        <button className={`${itemClass('home')} w-full text-left`} type="button" onClick={() => onNavigate?.('/dashboard')}>
          <span className="material-symbols-outlined text-[20px]">dashboard</span>
          <span className="text-sm font-medium">Dashboard</span>
        </button>
        <button className={`${itemClass('history')} w-full text-left`} type="button" onClick={() => onNavigate?.('/history')}>
          <span className="material-symbols-outlined text-[20px]">history</span>
          <span className="text-sm font-medium">History</span>
        </button>
        <button className={`${itemClass('smartTags')} w-full text-left`} type="button" onClick={() => onNavigate?.('/smart-tags')}>
          <span className="material-symbols-outlined text-[20px]">label</span>
          <span className="text-sm font-medium">Smart Tags</span>
        </button>
        <button className={`${itemClass('myPatients')} w-full text-left`} type="button" onClick={() => onNavigate?.('/my-patients')}>
          <span className="material-symbols-outlined text-[20px]">groups</span>
          <span className="text-sm font-medium">My Patients</span>
        </button>
        <button className={`${itemClass('appointments')} w-full text-left`} type="button" onClick={() => onNavigate?.('/appointments')}>
          <span className="material-symbols-outlined text-[20px]">calendar_month</span>
          <span className="text-sm font-medium">Appointments</span>
        </button>

        <div className="my-2 border-t border-slate-200" />

        <button className={`${itemClass('profile')} w-full text-left`} type="button" onClick={() => onNavigate?.('/profile')}>
          <span className="material-symbols-outlined text-[20px]">person</span>
          <span className="text-sm font-medium">My Profile</span>
        </button>
        <a className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-slate-600 hover:bg-slate-50 hover:text-[#1f7a5c] hover:border hover:border-slate-200/80 transition-all duration-200" href="#">
          <span className="material-symbols-outlined text-[20px]">settings</span>
          <span className="text-sm font-medium">Settings</span>
        </a>

        <button
          className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-slate-600 hover:bg-red-50 hover:text-red-600 transition-all duration-200 text-left"
          type="button"
          onClick={() => onSignOut?.()}
        >
          <span className="material-symbols-outlined text-[20px]">logout</span>
          <span className="text-sm font-medium">Sign Out</span>
        </button>
      </nav>
    </aside>
  );
}
