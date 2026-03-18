import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { motion } from 'framer-motion';
import { DashboardSidebar } from '../features/dashboard/components/DashboardSidebar';
import { DoctorProfileSection } from '../features/dashboard/components/DoctorProfileSection';
import { NewPrescriptionScreen } from '../features/dashboard/components/NewPrescriptionScreen';
import { SmartTagsPanel } from '../features/dashboard/components/SmartTagsPanel';
import { PrescriptionPreviewScreen } from '../features/dashboard/components/PrescriptionPreviewScreen';
import { PrescriptionHistoryPanel } from '../features/dashboard/components/PrescriptionHistoryPanel';
import { MyPatientsPanel } from '../features/dashboard/components/MyPatientsPanel';
import { getDashboardOverview } from '../features/dashboard/services/dashboardService';
import { getPrescription } from '../features/dashboard/services/prescriptionService';

function formatDisplayDate(isoDate) {
  if (!isoDate) {
    return '-';
  }
  return new Date(isoDate).toLocaleString();
}

function statusClass(status) {
  const normalized = String(status || '').toLowerCase();
  if (normalized.includes('prescribed') || normalized.includes('completed')) {
    return 'bg-emerald-100 text-emerald-800';
  }
  if (normalized.includes('pending')) {
    return 'bg-amber-100 text-amber-800';
  }
  return 'bg-blue-100 text-blue-800';
}

function initialsFromName(name) {
  const parts = String(name || '').trim().split(/\s+/).filter(Boolean);
  if (!parts.length) {
    return 'NA';
  }
  return parts.slice(0, 2).map((p) => p[0].toUpperCase()).join('');
}

function titleCase(str) {
  return String(str || '')
    .trim()
    .split(/\s+/)
    .filter(Boolean)
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase())
    .join(' ');
}

function PortalHeader({ doctorName, specialty, onEditProfile }) {
  const displayName = doctorName ? `Dr. ${titleCase(doctorName)}` : 'Doctor';

  return (
    <header className="flex h-16 shrink-0 items-center justify-between gap-4 border-b border-slate-200 bg-white px-6">
      <div className="flex items-center gap-4">
        <button className="text-slate-500 hover:text-slate-700 md:hidden" type="button">
          <span className="material-symbols-outlined">menu</span>
        </button>
        <div className="relative hidden md:block">
          <span className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3 text-slate-400">
            <span className="material-symbols-outlined text-[20px]">search</span>
          </span>
          <input
            className="h-10 w-64 rounded-lg border-0 bg-slate-100 pl-10 pr-4 text-sm text-slate-900 placeholder:text-slate-500 focus:ring-2 focus:ring-[#1f7a5c]"
            placeholder="Search..."
            type="text"
          />
        </div>
      </div>
      <div className="flex items-center gap-4">
        <button className="relative rounded-full p-2 text-slate-500 hover:bg-slate-100 hover:text-slate-700" type="button">
          <span className="material-symbols-outlined">notifications</span>
          <span className="absolute right-2 top-2 h-2 w-2 rounded-full bg-red-500 ring-2 ring-white" />
        </button>
        <button
          type="button"
          className="flex items-center gap-3 pl-4 border-l border-slate-200 cursor-pointer group"
          onClick={() => onEditProfile?.()}
        >
          <div className="text-right hidden sm:block">
            <p className="text-sm font-semibold text-slate-900 group-hover:text-[#1f7a5c] transition-colors">{displayName}</p>
            <p className="text-xs text-slate-500">View Profile</p>
          </div>
          <div className="h-10 w-10 shrink-0 overflow-hidden rounded-full bg-gradient-to-br from-[#1f7a5c] to-[#0ea4a4] ring-2 ring-transparent group-hover:ring-[#1f7a5c]/30 transition-all flex items-center justify-center text-white font-bold text-sm shadow-sm">
            {(doctorName || 'D').charAt(0).toUpperCase()}
          </div>
        </button>
      </div>
    </header>
  );
}

function ExpandableDetail({ open, children, onExpandEnd }) {
  const innerRef = useRef(null);
  const [measuredHeight, setMeasuredHeight] = useState(0);

  useEffect(() => {
    if (innerRef.current) {
      setMeasuredHeight(innerRef.current.scrollHeight);
    }
  });

  return (
    <motion.div
      animate={{ height: open ? measuredHeight : 0, opacity: open ? 1 : 0 }}
      initial={false}
      transition={{ height: { duration: 0.4, ease: [0.25, 0.1, 0.25, 1] }, opacity: { duration: 0.3, ease: 'easeInOut' } }}
      style={{ overflow: 'hidden' }}
      onAnimationComplete={() => { if (open) onExpandEnd?.(); }}
    >
      <div ref={innerRef}>{children}</div>
    </motion.div>
  );
}

function InlineDetail({ p }) {
  return (
    <div className="px-6 py-5 space-y-4">
      <div className="flex flex-wrap items-center gap-4 text-sm">
        {p.patientPhone ? (
          <span className="flex items-center gap-1.5 text-slate-500">
            <span className="material-symbols-outlined text-[16px]">call</span>
            {p.patientPhone}
          </span>
        ) : null}
        {p.patientAge ? (
          <span className="flex items-center gap-1.5 text-slate-500">
            <span className="material-symbols-outlined text-[16px]">cake</span>
            {p.patientAge} yrs
          </span>
        ) : null}
        {p.patientGender ? (
          <span className="text-slate-500">{p.patientGender}</span>
        ) : null}
        {p.patientBloodGroup ? (
          <span className="text-slate-500">Blood: {p.patientBloodGroup}</span>
        ) : null}
      </div>

      {p.symptoms?.length ? (
        <div>
          <h4 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1.5">Symptoms</h4>
          <div className="flex flex-wrap gap-1.5">
            {p.symptoms.map((s) => (
              <span key={s} className="inline-flex items-center px-2 py-0.5 rounded-md bg-slate-100 text-xs font-medium text-slate-600">{s}</span>
            ))}
          </div>
        </div>
      ) : null}

      {p.medications?.length ? (
        <div>
          <h4 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Medications</h4>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {p.medications.map((med, i) => (
              <div key={i} className="p-2.5 rounded-lg bg-white border border-slate-200 flex items-start gap-2">
                <span className="material-symbols-outlined text-[16px] text-[#1f7a5c] mt-0.5 shrink-0">medication</span>
                <div className="min-w-0">
                  <p className="text-sm font-semibold text-slate-800 truncate">{med.name || '-'}</p>
                  <p className="text-xs text-slate-500 truncate">
                    {[med.dosage, med.frequency, med.duration].filter(Boolean).join(' · ') || 'No details'}
                  </p>
                  {med.instructions ? <p className="text-xs text-slate-400 mt-0.5 truncate">{med.instructions}</p> : null}
                </div>
              </div>
            ))}
          </div>
        </div>
      ) : null}

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        {p.nutrientsAdvice ? (
          <div className="p-3 rounded-lg bg-emerald-50 border border-emerald-100">
            <h4 className="text-xs font-semibold text-emerald-600 uppercase tracking-wider mb-1 flex items-center gap-1">
              <span className="material-symbols-outlined text-[14px]">nutrition</span> Diet
            </h4>
            <p className="text-xs text-slate-700 line-clamp-3">{p.nutrientsAdvice}</p>
          </div>
        ) : null}
        {p.exerciseAdvice ? (
          <div className="p-3 rounded-lg bg-blue-50 border border-blue-100">
            <h4 className="text-xs font-semibold text-blue-600 uppercase tracking-wider mb-1 flex items-center gap-1">
              <span className="material-symbols-outlined text-[14px]">directions_run</span> Exercise
            </h4>
            <p className="text-xs text-slate-700 line-clamp-3">{p.exerciseAdvice}</p>
          </div>
        ) : null}
        {p.otherAdvice ? (
          <div className="p-3 rounded-lg bg-amber-50 border border-amber-100">
            <h4 className="text-xs font-semibold text-amber-600 uppercase tracking-wider mb-1 flex items-center gap-1">
              <span className="material-symbols-outlined text-[14px]">info</span> Other
            </h4>
            <p className="text-xs text-slate-700 line-clamp-3">{p.otherAdvice}</p>
          </div>
        ) : null}
      </div>
    </div>
  );
}

function DashboardOverview({ overview, loading }) {
  const [expandedUid, setExpandedUid] = useState(null);
  const [detailCache, setDetailCache] = useState({});
  const [loadingUid, setLoadingUid] = useState(null);
  const [detailError, setDetailError] = useState('');
  const expandedRowRef = useRef(null);
  const [showFilters, setShowFilters] = useState(false);
  const [nameFilter, setNameFilter] = useState('');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');

  const filteredActivity = useMemo(() => {
    const rows = overview?.recentActivity || [];
    if (!nameFilter && !dateFrom && !dateTo) return rows;
    const q = nameFilter.trim().toLowerCase();
    return rows.filter((row) => {
      if (q && !(row.patientName || '').toLowerCase().includes(q)) return false;
      if (dateFrom || dateTo) {
        const ts = row.timestamp ? new Date(row.timestamp) : null;
        if (!ts) return false;
        if (dateFrom && ts < new Date(dateFrom)) return false;
        if (dateTo) { const end = new Date(dateTo); end.setHours(23, 59, 59, 999); if (ts > end) return false; }
      }
      return true;
    });
  }, [overview?.recentActivity, nameFilter, dateFrom, dateTo]);

  const hasActiveFilters = !!(nameFilter || dateFrom || dateTo);

  const clearFilters = () => { setNameFilter(''); setDateFrom(''); setDateTo(''); };

  const scrollToExpanded = useCallback(() => {
    if (!expandedRowRef.current) return;
    const row = expandedRowRef.current;
    const scrollParent = row.closest('.overflow-y-auto');
    if (!scrollParent) return;
    const rowRect = row.getBoundingClientRect();
    const parentRect = scrollParent.getBoundingClientRect();
    const overflow = rowRect.bottom - parentRect.bottom;
    if (overflow <= 0) return;
    const start = scrollParent.scrollTop;
    const diff = overflow + 16;
    const duration = 400;
    let startTime = null;
    const ease = (t) => t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
    const step = (ts) => {
      if (!startTime) startTime = ts;
      const progress = Math.min((ts - startTime) / duration, 1);
      scrollParent.scrollTop = start + diff * ease(progress);
      if (progress < 1) requestAnimationFrame(step);
    };
    requestAnimationFrame(step);
  }, []);

  const handleRowClick = async (prescriptionUid) => {
    if (!prescriptionUid) {
      setDetailError('Prescription details unavailable. Please restart the backend.');
      setTimeout(() => setDetailError(''), 3000);
      return;
    }
    if (expandedUid === prescriptionUid) {
      setExpandedUid(null);
      return;
    }
    if (detailCache[prescriptionUid]) {
      setExpandedUid(prescriptionUid);
      return;
    }
    setLoadingUid(prescriptionUid);
    setExpandedUid(prescriptionUid);
    setDetailError('');
    try {
      const data = await getPrescription(prescriptionUid);
      setDetailCache((prev) => ({ ...prev, [prescriptionUid]: data }));
    } catch {
      setDetailError('Failed to load prescription details.');
      setTimeout(() => setDetailError(''), 3000);
      setExpandedUid(null);
    } finally {
      setLoadingUid(null);
    }
  };

  return (
    <section className="flex-grow overflow-y-auto bg-slate-50/50">
      <div className="px-8 pt-8 pb-6">
        <h2 className="text-3xl font-extrabold tracking-tight">
          <span className="bg-gradient-to-r from-[#1f7a5c] to-[#0ea4a4] bg-clip-text text-transparent">{(() => { const h = new Date(new Date().toLocaleString('en-US', { timeZone: 'Asia/Kolkata' })).getHours(); return h >= 4 && h < 11 ? 'Good morning' : h < 16 ? 'Good afternoon' : 'Good evening'; })()}</span>
          <span className="text-slate-900">, Dr. {(() => { const n = (overview?.doctorDisplayName || 'Doctor').split(' ')[0]; return n.charAt(0).toUpperCase() + n.slice(1).toLowerCase(); })()}</span>
        </h2>
        <p className="text-slate-500 text-sm mt-1">
          Here is your daily summary for <span className="font-semibold text-slate-700">{new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</span>
        </p>
      </div>

      <section className="px-8 pb-8">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">

          <div className="relative bg-white rounded-2xl border border-slate-200/60 shadow-[0_0_0_1px_rgba(0,0,0,0.02),0_2px_8px_rgba(0,0,0,0.04),0_12px_40px_rgba(0,0,0,0.03)] overflow-hidden group hover:-translate-y-0.5 hover:shadow-[0_0_0_1px_rgba(0,0,0,0.02),0_4px_12px_rgba(0,0,0,0.06),0_16px_48px_rgba(0,0,0,0.05)] transition-all duration-300">
            <div className="absolute bottom-0 left-0 right-0 h-[2px] bg-gradient-to-r from-[#0ea4a4] to-[#1f7a5c]" />
            <div className="p-6 pb-5">
              <div className="flex items-center justify-between mb-6">
                <div className="h-10 w-10 rounded-full bg-[#0ea4a4]/8 ring-1 ring-[#0ea4a4]/15 flex items-center justify-center">
                  <span className="material-symbols-outlined text-[#0ea4a4] text-[20px]">description</span>
                </div>
                <span className="flex items-center gap-1 text-[11px] font-semibold text-emerald-600 bg-emerald-50 pl-2 pr-2.5 py-0.5 rounded-md">
                  <span className="material-symbols-outlined text-[13px]">arrow_upward</span>
                  {overview?.stats?.trendDelta ?? 0}
                </span>
              </div>
              <div>
                <h3 className="text-[2.25rem] font-extrabold text-slate-900 leading-none tracking-tight tabular-nums">{loading ? '–' : (overview?.stats?.todaysPrescriptions ?? 0)}</h3>
                <p className="text-slate-400 text-[13px] font-medium mt-2">Today's Prescriptions</p>
              </div>
            </div>
          </div>

          <div className="relative bg-white rounded-2xl border border-slate-200/60 shadow-[0_0_0_1px_rgba(0,0,0,0.02),0_2px_8px_rgba(0,0,0,0.04),0_12px_40px_rgba(0,0,0,0.03)] overflow-hidden group hover:-translate-y-0.5 hover:shadow-[0_0_0_1px_rgba(0,0,0,0.02),0_4px_12px_rgba(0,0,0,0.06),0_16px_48px_rgba(0,0,0,0.05)] transition-all duration-300">
            <div className="absolute bottom-0 left-0 right-0 h-[2px] bg-gradient-to-r from-blue-500 to-indigo-500" />
            <div className="p-6 pb-5">
              <div className="flex items-center justify-between mb-6">
                <div className="h-10 w-10 rounded-full bg-blue-500/8 ring-1 ring-blue-500/15 flex items-center justify-center">
                  <span className="material-symbols-outlined text-blue-500 text-[20px]">groups</span>
                </div>
              </div>
              <div>
                <h3 className="text-[2.25rem] font-extrabold text-slate-900 leading-none tracking-tight tabular-nums">{loading ? '–' : (overview?.stats?.totalPatients ?? 0)}</h3>
                <p className="text-slate-400 text-[13px] font-medium mt-2">Total Patients</p>
              </div>
            </div>
          </div>

          <div className="relative bg-white rounded-2xl border border-slate-200/60 shadow-[0_0_0_1px_rgba(0,0,0,0.02),0_2px_8px_rgba(0,0,0,0.04),0_12px_40px_rgba(0,0,0,0.03)] overflow-hidden group hover:-translate-y-0.5 hover:shadow-[0_0_0_1px_rgba(0,0,0,0.02),0_4px_12px_rgba(0,0,0,0.06),0_16px_48px_rgba(0,0,0,0.05)] transition-all duration-300">
            <div className="absolute bottom-0 left-0 right-0 h-[2px] bg-gradient-to-r from-amber-400 to-orange-500" />
            <div className="p-6 pb-5">
              <div className="flex items-center justify-between mb-6">
                <div className="h-10 w-10 rounded-full bg-amber-500/8 ring-1 ring-amber-500/15 flex items-center justify-center">
                  <span className="material-symbols-outlined text-amber-500 text-[20px]">label</span>
                </div>
              </div>
              <div>
                <div className="flex items-baseline gap-2">
                  <h3 className="text-[2.25rem] font-extrabold text-slate-900 leading-none tracking-tight tabular-nums">{loading ? '–' : (overview?.stats?.activeTags ?? 0)}</h3>
                  <span className="text-[13px] font-medium text-slate-400">tags</span>
                </div>
                <p className="text-slate-400 text-[13px] font-medium mt-2">Configured &amp; Active</p>
              </div>
            </div>
          </div>

        </div>
      </section>

      <section className="flex-1 px-8 pb-8 min-h-0 flex flex-col">
        <div className="mb-5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="h-7 w-1 rounded-full bg-gradient-to-b from-[#1f7a5c] to-[#0ea4a4]" />
              <h3 className="text-lg font-bold text-slate-900">Recent Activity</h3>
              {hasActiveFilters ? (
                <span className="inline-flex items-center gap-1 ml-2 text-[11px] font-semibold text-[#1f7a5c] bg-[#1f7a5c]/8 px-2.5 py-0.5 rounded-full">
                  <span className="h-1.5 w-1.5 rounded-full bg-[#1f7a5c] animate-pulse" />
                  {filteredActivity.length} result{filteredActivity.length !== 1 ? 's' : ''}
                </span>
              ) : null}
            </div>
            <div className="flex items-center gap-2.5">
              {hasActiveFilters ? (
                <button onClick={clearFilters} className="flex items-center gap-1 text-[11px] font-semibold text-slate-400 hover:text-red-500 transition-all px-2.5 py-1.5 rounded-lg hover:bg-red-50/80" type="button">
                  <span className="material-symbols-outlined text-[14px]">close</span>
                  Clear
                </button>
              ) : null}
              <button
                onClick={() => setShowFilters((p) => !p)}
                className={`flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-widest pl-3 pr-3.5 py-2 rounded-full transition-all duration-300 border ${
                  showFilters
                    ? 'bg-[#1f7a5c] text-white border-[#1f7a5c] shadow-md shadow-[#1f7a5c]/20'
                    : 'bg-white text-slate-500 border-slate-200 hover:border-[#1f7a5c]/30 hover:text-[#1f7a5c] hover:shadow-sm'
                }`}
                type="button"
              >
                <span className="material-symbols-outlined text-[15px]">{showFilters ? 'filter_list_off' : 'filter_list'}</span>
                Filters
              </button>
            </div>
          </div>

          {showFilters ? (
            <div className="mt-4 rounded-2xl border border-slate-200/80 bg-gradient-to-r from-white via-white to-slate-50/80 shadow-[0_1px_3px_rgba(0,0,0,0.04),0_6px_24px_rgba(0,0,0,0.02)] overflow-hidden animate-[fadeSlideIn_0.25s_ease_both]">
              <div className="px-5 py-4 flex items-center gap-5">
                <div className="relative flex-1 max-w-[280px]">
                  <span className="material-symbols-outlined text-[18px] text-slate-300 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none">person_search</span>
                  <input
                    type="text"
                    placeholder="Patient name..."
                    value={nameFilter}
                    onChange={(e) => setNameFilter(e.target.value)}
                    className="w-full pl-10 pr-3 py-2.5 text-[13px] rounded-xl border border-slate-200/80 bg-slate-50/50 placeholder:text-slate-300 focus:bg-white focus:border-[#1f7a5c] focus:ring-2 focus:ring-[#1f7a5c]/10 transition-all duration-200"
                  />
                </div>

                <div className="h-8 w-px bg-slate-200/80" />

                <div className="flex items-center gap-3">
                  <div className="flex items-center gap-2">
                    <span className="material-symbols-outlined text-[16px] text-slate-300">calendar_today</span>
                    <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">From</span>
                    <input
                      type="date"
                      value={dateFrom}
                      onChange={(e) => setDateFrom(e.target.value)}
                      className="py-2 px-3 text-[13px] rounded-xl border border-slate-200/80 bg-slate-50/50 focus:bg-white focus:border-[#1f7a5c] focus:ring-2 focus:ring-[#1f7a5c]/10 transition-all duration-200"
                    />
                  </div>
                  <span className="text-slate-300 text-xs">—</span>
                  <div className="flex items-center gap-2">
                    <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">To</span>
                    <input
                      type="date"
                      value={dateTo}
                      onChange={(e) => setDateTo(e.target.value)}
                      className="py-2 px-3 text-[13px] rounded-xl border border-slate-200/80 bg-slate-50/50 focus:bg-white focus:border-[#1f7a5c] focus:ring-2 focus:ring-[#1f7a5c]/10 transition-all duration-200"
                    />
                  </div>
                </div>
              </div>
            </div>
          ) : null}
        </div>

        <div className="bg-white rounded-2xl border border-slate-200/80 shadow-[0_1px_3px_rgba(0,0,0,0.04),0_6px_24px_rgba(0,0,0,0.03)] overflow-hidden flex-1 flex flex-col">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-slate-50/80 border-b border-slate-200/80">
                <tr>
                  <th className="px-6 py-3.5 text-xs font-bold text-slate-500 uppercase tracking-wider">Patient Name</th>
                  <th className="px-6 py-3.5 text-xs font-bold text-slate-500 uppercase tracking-wider">Diagnosis</th>
                  <th className="px-6 py-3.5 text-xs font-bold text-slate-500 uppercase tracking-wider">Date/Time</th>
                  <th className="px-6 py-3.5 text-xs font-bold text-slate-500 uppercase tracking-wider">Status</th>
                  <th className="px-6 py-3.5 text-xs font-bold text-slate-500 uppercase tracking-wider text-right" />
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {!filteredActivity.length ? (
                  <tr>
                    <td className="px-6 py-8 text-slate-500 text-center" colSpan={5}>No activity found.</td>
                  </tr>
                ) : filteredActivity.map((row, index) => {
                  const uid = row.prescriptionUid;
                  const isExpanded = expandedUid === uid;
                  const cached = detailCache[uid];
                  const isLoading = loadingUid === uid;
                  return (
                    <tr key={`${row.patientName || 'patient'}-${row.timestamp || index}`} className="group" ref={isExpanded ? expandedRowRef : undefined}>
                      <td colSpan={5} className="p-0">
                        <div
                          className={`flex items-center cursor-pointer transition-colors duration-200 ${isExpanded ? 'bg-[#1f7a5c]/5' : 'hover:bg-slate-50'}`}
                          onClick={() => handleRowClick(uid)}
                        >
                          <div className="px-6 py-4 flex items-center gap-3 w-[28%]">
                            <div className="h-8 w-8 rounded-full bg-slate-200 flex items-center justify-center text-xs font-bold text-slate-600 shrink-0">{initialsFromName(row.patientName)}</div>
                            <span className="font-medium text-slate-900 truncate">{row.patientName || '-'}</span>
                          </div>
                          <div className="px-6 py-4 text-slate-600 w-[22%] truncate">{row.diagnosis || '-'}</div>
                          <div className="px-6 py-4 text-slate-600 w-[22%]">{formatDisplayDate(row.timestamp)}</div>
                          <div className="px-6 py-4 w-[16%]">
                            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${statusClass(row.status)}`}>
                              {row.status || '-'}
                            </span>
                          </div>
                          <div className="px-6 py-4 w-[12%] text-right">
                            <span className={`material-symbols-outlined text-[20px] text-slate-400 transition-transform duration-300 ease-in-out ${isExpanded ? 'rotate-180 text-[#1f7a5c]' : ''}`}>
                              expand_more
                            </span>
                          </div>
                        </div>

                        <ExpandableDetail open={isExpanded} onExpandEnd={scrollToExpanded}>
                          <div className="bg-slate-50 border-t border-slate-200">
                            {isLoading ? (
                              <div className="px-6 py-6 flex items-center gap-2 text-slate-500">
                                <span className="material-symbols-outlined animate-spin text-[18px]">progress_activity</span>
                                <span className="text-sm">Loading details...</span>
                              </div>
                            ) : cached ? (
                              <InlineDetail p={cached} />
                            ) : null}
                          </div>
                        </ExpandableDetail>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      </section>

      {detailError ? (
        <div className="fixed bottom-6 right-6 z-50 flex items-center gap-2 rounded-xl bg-red-600 text-white text-sm font-medium px-5 py-3 shadow-xl">
          <span className="material-symbols-outlined text-[18px]">error</span>
          {detailError}
        </div>
      ) : null}
    </section>
  );
}

function NewPrescriptionLanding({ onNavigate, overview, loading }) {
  return (
    <section className="flex-grow overflow-y-auto flex items-center justify-center px-6 py-10 sm:px-8 lg:px-10 relative">
      <div
        className="absolute inset-0 opacity-25 pointer-events-none"
        style={{ backgroundImage: 'radial-gradient(#1f7a5c 0.5px, transparent 0.5px)', backgroundSize: '24px 24px' }}
      />

      <div className="w-full max-w-4xl mx-auto flex flex-col items-center gap-8 relative z-10">
        <div className="text-center space-y-2">
          <h2 className="text-3xl sm:text-4xl font-bold text-[#121715] tracking-tight">Good Morning, Doctor.</h2>
          <p className="text-[#67837a] text-lg">Ready to see your next patient?</p>
        </div>

        <div className="w-full bg-white rounded-2xl shadow-xl shadow-[#1f7a5c]/5 border border-[#1f7a5c]/10 p-8 sm:p-12 flex flex-col items-center gap-8 transition-transform hover:scale-[1.01] duration-300">
          <button
            className="group relative flex w-full max-w-md items-center justify-center gap-4 bg-[#1f7a5c] hover:bg-[#165942] text-white rounded-xl py-6 px-8 transition-all duration-200 shadow-lg shadow-[#1f7a5c]/20 hover:shadow-[#1f7a5c]/40 focus:outline-none focus:ring-4 focus:ring-[#1f7a5c]/30"
            onClick={() => onNavigate?.('/new-prescription/details')}
            type="button"
          >
            <span className="bg-white/20 rounded-full p-2 group-hover:bg-white/30 transition-colors">
              <span className="material-symbols-outlined !text-3xl font-bold">add</span>
            </span>
            <span className="text-xl sm:text-2xl font-bold tracking-wide uppercase">Create New Prescription</span>
          </button>

          <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 w-full max-w-lg opacity-80">
            <div className="bg-white/70 backdrop-blur-sm p-4 rounded-lg border border-slate-200 text-center">
              <div className="text-2xl font-bold text-[#121715]">{loading ? '-' : (overview?.landing?.patientsToday ?? 0)}</div>
              <div className="text-xs text-[#67837a] font-medium uppercase tracking-wider">Patients Today</div>
            </div>
            <div className="bg-white/70 backdrop-blur-sm p-4 rounded-lg border border-slate-200 text-center">
              <div className="text-2xl font-bold text-[#121715]">{loading ? '-' : `${overview?.landing?.averageConsultationMinutes ?? 0}m`}</div>
              <div className="text-xs text-[#67837a] font-medium uppercase tracking-wider">Avg. Time</div>
            </div>
            <div className="hidden sm:block bg-white/70 backdrop-blur-sm p-4 rounded-lg border border-slate-200 text-center">
              <div className="text-2xl font-bold text-[#121715]">{loading ? '-' : (overview?.landing?.syncStatus || 'Pending')}</div>
              <div className="text-xs text-[#67837a] font-medium uppercase tracking-wider">Sync Status</div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

export function DashboardPage({ view = 'home', onNavigate, userSession, onSignOut, navState }) {
  const [overview, setOverview] = useState(null);
  const [loadingOverview, setLoadingOverview] = useState(false);
  const isPreview = view === 'preview';
  const isPrescriptionLanding = view === 'newPrescriptionHome';
  const isNewPrescription = view === 'newPrescription';
  const activeView = isPreview || isPrescriptionLanding || isNewPrescription ? 'newPrescription' : view;

  useEffect(() => {
    async function loadOverview() {
      if (!userSession?.userUid) {
        setOverview(null);
        return;
      }
      setLoadingOverview(true);
      try {
        const data = await getDashboardOverview(userSession.userUid, 10);
        setOverview(data);
      } catch {
        setOverview(null);
      } finally {
        setLoadingOverview(false);
      }
    }

    loadOverview();
  }, [userSession?.userUid]);

  const doctorName = useMemo(
    () => overview?.doctorDisplayName || userSession?.username || 'Doctor',
    [overview?.doctorDisplayName, userSession?.username],
  );

  return (
    <div className="bg-[#eef2f5] text-[#121715] antialiased font-display overflow-hidden">
      <div className="flex h-screen w-full overflow-hidden">
        <div className="no-print"><DashboardSidebar activeView={activeView} onNavigate={onNavigate} onSignOut={onSignOut} /></div>

        <main className="flex-1 min-w-0 overflow-hidden flex flex-col relative">
          <div className="no-print"><PortalHeader doctorName={doctorName} specialty="" onEditProfile={() => onNavigate?.('/profile')} /></div>
          <div className="flex-1 min-h-0 overflow-y-auto flex flex-col">
          {isNewPrescription ? (
            <NewPrescriptionScreen onPreview={() => onNavigate?.('/new-prescription/preview')} userSession={userSession} initialPatient={navState?.patient} />
          ) : view === 'profile' ? (
            <DoctorProfileSection
              userSession={userSession}
              onProfileUpdated={() => {
                // Reload dashboard overview to reflect updated doctor name
                if (userSession?.userUid) {
                  getDashboardOverview(userSession.userUid, 10).then(setOverview).catch(() => {});
                }
              }}
            />
          ) : isPreview ? (
            <PrescriptionPreviewScreen onEdit={() => onNavigate?.('/new-prescription/details')} />
          ) : view === 'myPatients' ? (
            <MyPatientsPanel userSession={userSession} onNavigate={onNavigate} />
          ) : view === 'history' ? (
            <PrescriptionHistoryPanel userSession={userSession} />
          ) : view === 'smartTags' ? (
            <SmartTagsPanel userSession={userSession} />
          ) : view === 'appointments' ? (
            <section className="flex-grow flex items-center justify-center px-6">
              <div className="bg-white border border-slate-200 rounded-xl p-12 text-center shadow-sm max-w-md">
                <div className="mx-auto w-16 h-16 rounded-full bg-[#1f7a5c]/10 flex items-center justify-center mb-5">
                  <span className="material-symbols-outlined text-[#1f7a5c] text-3xl">calendar_month</span>
                </div>
                <h2 className="text-2xl font-bold text-slate-800">Appointments</h2>
                <span className="inline-block mt-3 px-3 py-1 rounded-full bg-amber-100 text-amber-700 text-xs font-semibold uppercase tracking-wider">Coming Soon</span>
                <p className="text-slate-500 mt-3 text-sm">We're working on appointment scheduling. This feature will be available in a future update.</p>
              </div>
            </section>
          ) : isPrescriptionLanding ? (
            <NewPrescriptionLanding onNavigate={onNavigate} overview={overview} loading={loadingOverview} />
          ) : (
            <DashboardOverview overview={overview} loading={loadingOverview} />
          )}
          </div>
        </main>
      </div>
    </div>
  );
}
