import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { motion } from 'framer-motion';
import { listPrescriptions } from '../services/prescriptionService';

function formatDateTime(iso) {
  if (!iso) return '-';
  return new Date(iso).toLocaleString('en-IN', {
    day: '2-digit', month: 'short', year: 'numeric',
    hour: '2-digit', minute: '2-digit', hour12: true,
  });
}

function initialsFromName(name) {
  return String(name || '').trim().split(/\s+/).filter(Boolean).slice(0, 2).map((w) => w[0]?.toUpperCase()).join('') || '?';
}

function ExpandableDetail({ open, children, onExpandEnd }) {
  const innerRef = useRef(null);
  const [measuredHeight, setMeasuredHeight] = useState(0);
  useEffect(() => { if (innerRef.current) setMeasuredHeight(innerRef.current.scrollHeight); });
  return (
    <motion.div
      initial={false}
      animate={{ height: open ? measuredHeight : 0, opacity: open ? 1 : 0 }}
      transition={{ height: { duration: 0.35, ease: [0.25, 0.1, 0.25, 1] }, opacity: { duration: 0.2 } }}
      style={{ overflow: 'hidden' }}
      onAnimationComplete={() => { if (open) onExpandEnd?.(); }}
    >
      <div ref={innerRef}>{children}</div>
    </motion.div>
  );
}

function InlineDetail({ p }) {
  if (!p) return null;
  return (
    <div className="px-6 py-5 space-y-4">
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div>
          <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">Patient</span>
          <p className="text-sm font-medium text-slate-800 mt-0.5">{p.patientName || '-'}</p>
        </div>
        <div>
          <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">Phone</span>
          <p className="text-sm font-medium text-slate-800 mt-0.5">{p.patientPhone || '-'}</p>
        </div>
        <div>
          <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">Age / Gender</span>
          <p className="text-sm font-medium text-slate-800 mt-0.5">{[p.patientAge, p.patientGender].filter(Boolean).join(' / ') || '-'}</p>
        </div>
        <div>
          <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">Blood Group</span>
          <p className="text-sm font-medium text-slate-800 mt-0.5">{p.patientBloodGroup || '-'}</p>
        </div>
      </div>
      {p.diagnosis ? (
        <div>
          <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">Diagnosis</span>
          <p className="text-sm text-slate-700 mt-0.5">{p.diagnosis}</p>
        </div>
      ) : null}
      {p.medications?.length ? (
        <div>
          <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">Medications</span>
          <div className="mt-1.5 rounded-lg border border-slate-200 overflow-hidden">
            <div className="grid grid-cols-[1fr_100px_100px_1fr] bg-slate-50 text-[11px] font-semibold text-slate-400 uppercase tracking-wider px-4 py-2">
              <div>Medicine</div>
              <div>Frequency</div>
              <div>Duration</div>
              <div>Instructions</div>
            </div>
            {p.medications.map((med, i) => (
              <div key={i} className={`grid grid-cols-[1fr_100px_100px_1fr] px-4 py-2.5 text-sm ${i > 0 ? 'border-t border-slate-100' : ''}`}>
                <div>
                  <span className="font-medium text-slate-800">{med.name}</span>
                  {med.dosage ? <span className="text-slate-400 ml-1 text-xs">{med.dosage}</span> : null}
                </div>
                <div className="text-slate-600">{med.frequency || '-'}</div>
                <div className="text-slate-600">{med.duration || '-'}</div>
                <div className="text-slate-500 text-xs">{med.instructions || '-'}</div>
              </div>
            ))}
          </div>
        </div>
      ) : null}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {p.nutrientsAdvice ? (
          <div>
            <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">Nutrition Advice</span>
            <p className="text-sm text-slate-600 mt-0.5">{p.nutrientsAdvice}</p>
          </div>
        ) : null}
        {p.exerciseAdvice ? (
          <div>
            <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">Exercise Advice</span>
            <p className="text-sm text-slate-600 mt-0.5">{p.exerciseAdvice}</p>
          </div>
        ) : null}
      </div>
      <div className="flex items-center gap-4 pt-2 border-t border-slate-100 text-xs text-slate-400">
        <span>Created: {formatDateTime(p.createdAt)}</span>
        {p.sentAt ? <span>Sent: {formatDateTime(p.sentAt)}</span> : null}
      </div>
    </div>
  );
}

const PAGE_SIZE = 15;

export function PrescriptionHistoryPanel({ userSession }) {
  const [prescriptions, setPrescriptions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [expandedUid, setExpandedUid] = useState(null);
  const [nameFilter, setNameFilter] = useState('');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [page, setPage] = useState(1);
  const expandedRowRef = useRef(null);

  useEffect(() => {
    async function load() {
      if (!userSession?.userUid) return;
      setLoading(true);
      try {
        const data = await listPrescriptions(userSession.userUid);
        const sorted = (data || []).sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0));
        setPrescriptions(sorted);
      } catch {
        setPrescriptions([]);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [userSession?.userUid]);

  // Group prescriptions by consultation: same patient + created within 1 hour = one consultation.
  // If patient X visits on Monday and again on Friday, those are separate rows.
  // If the doctor sends a corrected prescription 20 min later, it's the same row.
  const CONSULTATION_GAP_MS = 60 * 60 * 1000; // 1 hour

  const patientGroups = useMemo(() => {
    const groups = [];
    for (const p of prescriptions) {
      const patientKey = p.patientPhone || p.patientName || '';
      const ts = p.createdAt ? new Date(p.createdAt).getTime() : 0;

      // Try to find an existing group for this patient where the time is within 1 hour
      const match = groups.find((g) =>
        g.patientKey === patientKey &&
        g.prescriptions.some((existing) => {
          const existingTs = existing.createdAt ? new Date(existing.createdAt).getTime() : 0;
          return Math.abs(ts - existingTs) <= CONSULTATION_GAP_MS;
        })
      );

      if (match) {
        match.prescriptions.push(p);
        if (ts > (match.latestDate?.getTime() || 0)) {
          match.latestDate = new Date(ts);
          match.patientName = p.patientName || match.patientName;
          match.patientAge = p.patientAge || match.patientAge;
          match.patientGender = p.patientGender || match.patientGender;
          match.patientBloodGroup = p.patientBloodGroup || match.patientBloodGroup;
        }
      } else {
        groups.push({
          key: `${patientKey}_${ts}`,
          patientKey,
          patientName: p.patientName,
          patientPhone: p.patientPhone,
          patientAge: p.patientAge,
          patientGender: p.patientGender,
          patientBloodGroup: p.patientBloodGroup,
          prescriptions: [p],
          latestDate: ts ? new Date(ts) : null,
        });
      }
    }
    // Sort by latest prescription date (newest first)
    return groups.sort((a, b) => (b.latestDate || 0) - (a.latestDate || 0));
  }, [prescriptions]);

  const filtered = useMemo(() => {
    if (!nameFilter && !dateFrom && !dateTo) return patientGroups;
    const q = nameFilter.trim().toLowerCase();
    return patientGroups.filter((g) => {
      if (q && !(g.patientName || '').toLowerCase().includes(q)) return false;
      if (dateFrom || dateTo) {
        // Keep group if ANY prescription falls in range
        return g.prescriptions.some((p) => {
          const ts = p.createdAt ? new Date(p.createdAt) : null;
          if (!ts) return false;
          if (dateFrom && ts < new Date(dateFrom)) return false;
          if (dateTo) { const end = new Date(dateTo); end.setHours(23, 59, 59, 999); if (ts > end) return false; }
          return true;
        });
      }
      return true;
    });
  }, [patientGroups, nameFilter, dateFrom, dateTo]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const paged = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  useEffect(() => { setPage(1); }, [nameFilter, dateFrom, dateTo]);

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

  const handleRowClick = (key) => {
    setExpandedUid((prev) => (prev === key ? null : key));
  };

  return (
    <section className="flex-grow overflow-y-auto bg-slate-50/50">
      <div className="px-8 pt-8 pb-6">
        <div className="flex items-center gap-3">
          <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-[#1f7a5c] to-[#0ea4a4] flex items-center justify-center shadow-sm">
            <span className="material-symbols-outlined text-white text-[22px]">history</span>
          </div>
          <div>
            <h2 className="text-2xl font-extrabold text-slate-900 tracking-tight">Prescription History</h2>
            <p className="text-sm text-slate-500 mt-0.5">
              {loading ? 'Loading...' : `${patientGroups.length} patient${patientGroups.length !== 1 ? 's' : ''} · ${prescriptions.length} prescription${prescriptions.length !== 1 ? 's' : ''}`}
            </p>
          </div>
        </div>
      </div>

      <div className="px-8 pb-8">
        <div className="mb-5 rounded-2xl border border-slate-200/80 bg-gradient-to-r from-white via-white to-slate-50/80 shadow-[0_1px_3px_rgba(0,0,0,0.04),0_6px_24px_rgba(0,0,0,0.02)] overflow-hidden">
          <div className="px-5 py-4 flex flex-wrap items-center gap-4">
            <div className="relative w-full sm:w-auto sm:flex-1 sm:min-w-[240px] sm:max-w-[300px]">
              <span className="material-symbols-outlined text-[18px] text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none">person_search</span>
              <input
                type="text"
                placeholder="Search patient name..."
                value={nameFilter}
                onChange={(e) => setNameFilter(e.target.value)}
                className="w-full pl-10 pr-3 py-2.5 text-[13px] text-slate-800 rounded-xl border border-slate-300 bg-white placeholder:text-slate-400 focus:border-[#1f7a5c] focus:ring-2 focus:ring-[#1f7a5c]/10 transition-all duration-200"
              />
            </div>
            <div className="hidden sm:block h-8 w-px bg-slate-200/80" />
            <div className="flex flex-wrap items-center gap-3">
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
            {hasActiveFilters ? (
              <>
                <div className="h-8 w-px bg-slate-200/80" />
                <button onClick={clearFilters} className="flex items-center gap-1 text-[11px] font-semibold text-slate-400 hover:text-red-500 transition-all px-2.5 py-1.5 rounded-lg hover:bg-red-50/80" type="button">
                  <span className="material-symbols-outlined text-[14px]">close</span>
                  Clear
                </button>
                <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-[#1f7a5c] bg-[#1f7a5c]/8 px-2.5 py-0.5 rounded-full">
                  <span className="h-1.5 w-1.5 rounded-full bg-[#1f7a5c] animate-pulse" />
                  {filtered.length} result{filtered.length !== 1 ? 's' : ''}
                </span>
              </>
            ) : null}
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-slate-200/80 shadow-[0_1px_3px_rgba(0,0,0,0.04),0_6px_24px_rgba(0,0,0,0.03)] overflow-hidden">
          <table className="w-full table-fixed text-left text-sm">
            <thead className="bg-slate-50/80 border-b border-slate-200/80">
              <tr>
                <th className="w-[28%] px-6 py-3.5 text-xs font-bold text-slate-500 uppercase tracking-wider">Patient</th>
                <th className="w-[18%] px-6 py-3.5 text-xs font-bold text-slate-500 uppercase tracking-wider">Diagnosis</th>
                <th className="w-[22%] px-6 py-3.5 text-xs font-bold text-slate-500 uppercase tracking-wider">Last Visit</th>
                <th className="w-[22%] px-6 py-3.5 text-xs font-bold text-slate-500 uppercase tracking-wider">Details</th>
                <th className="w-[10%] px-6 py-3.5" />
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr>
                  <td colSpan={5} className="px-6 py-12 text-center">
                    <div className="flex items-center justify-center gap-2 text-slate-400">
                      <span className="material-symbols-outlined animate-spin text-[20px]">progress_activity</span>
                      <span className="text-sm">Loading prescriptions...</span>
                    </div>
                  </td>
                </tr>
              ) : !paged.length ? (
                <tr>
                  <td colSpan={5} className="px-6 py-12 text-center">
                    <div className="flex flex-col items-center gap-2">
                      <span className="material-symbols-outlined text-slate-300 text-4xl">search_off</span>
                      <p className="text-slate-500 text-sm">{hasActiveFilters ? 'No patients match your filters.' : 'No prescriptions yet.'}</p>
                    </div>
                  </td>
                </tr>
              ) : paged.map((group, index) => {
                const isExpanded = expandedUid === group.key;
                const rxCount = group.prescriptions.length;
                const latestRx = group.prescriptions[0];
                const allSent = group.prescriptions.every((p) => p.sentAt);
                const anySent = group.prescriptions.some((p) => p.sentAt);
                return (
                  <tr key={group.key || index} ref={isExpanded ? expandedRowRef : undefined}>
                    <td colSpan={5} className="p-0">
                      <div
                        className={`flex items-center cursor-pointer transition-colors duration-200 ${isExpanded ? 'bg-[#1f7a5c]/[0.07] shadow-[-3px_0_0_0_#1f7a5c_inset]' : 'hover:bg-slate-50'}`}
                        onClick={() => handleRowClick(group.key)}
                      >
                        <div className="px-6 py-4 flex items-center gap-3 w-[28%]">
                          <div className="h-9 w-9 rounded-full bg-slate-200 flex items-center justify-center text-xs font-bold text-slate-600 shrink-0">
                            {initialsFromName(group.patientName)}
                          </div>
                          <div className="min-w-0">
                            <span className="font-medium text-slate-900 truncate block">{group.patientName || '-'}</span>
                            <span className="text-[11px] text-slate-400">
                              {group.patientPhone || ''}{group.patientAge ? ` · ${group.patientAge}` : ''}{group.patientGender ? ` · ${group.patientGender}` : ''}
                            </span>
                          </div>
                        </div>
                        <div className="px-6 py-4 w-[18%] text-slate-600 truncate">{latestRx?.diagnosis || '-'}</div>
                        <div className="px-6 py-4 text-slate-600 w-[22%]">{formatDateTime(latestRx?.createdAt)}</div>
                        <div className="px-6 py-4 w-[22%]">
                          {allSent ? (
                            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-emerald-50 text-emerald-700 border border-emerald-200/60">
                              <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />All Sent
                            </span>
                          ) : anySent ? (
                            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-50 text-blue-700 border border-blue-200/60">
                              <span className="h-1.5 w-1.5 rounded-full bg-blue-500" />Partial
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-amber-50 text-amber-700 border border-amber-200/60">
                              <span className="h-1.5 w-1.5 rounded-full bg-amber-500" />Pending
                            </span>
                          )}
                        </div>
                        <div className="px-6 py-4 w-[10%] text-right">
                          <span className={`material-symbols-outlined text-[20px] text-slate-400 transition-transform duration-300 ease-in-out ${isExpanded ? 'rotate-180 text-[#1f7a5c]' : ''}`}>
                            expand_more
                          </span>
                        </div>
                      </div>
                      <ExpandableDetail open={isExpanded} onExpandEnd={scrollToExpanded}>
                        <div className="bg-slate-50 border-t border-slate-200">
                          {group.prescriptions.map((p, pi) => (
                            <div key={p.prescriptionUid || pi}>
                              {pi > 0 && <div className="mx-6 border-t border-dashed border-slate-200" />}
                              <div className="px-6 pt-4 pb-1 flex items-center gap-2">
                                <span className="inline-flex items-center justify-center w-5 h-5 rounded-full bg-[#1f7a5c]/10 text-[10px] font-bold text-[#1f7a5c]">{pi + 1}</span>
                                <span className="text-xs font-semibold text-slate-500">{formatDateTime(p.createdAt)}</span>
                                {statusBadge(p.sentAt)}
                              </div>
                              <InlineDetail p={p} />
                            </div>
                          ))}
                        </div>
                      </ExpandableDetail>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>

          {totalPages > 1 ? (
            <div className="flex items-center justify-between px-6 py-3 border-t border-slate-200 bg-slate-50/50">
              <span className="text-xs text-slate-400">
                Showing {(page - 1) * PAGE_SIZE + 1}–{Math.min(page * PAGE_SIZE, filtered.length)} of {filtered.length}
              </span>
              <div className="flex items-center gap-1">
                <button
                  type="button"
                  disabled={page <= 1}
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  className="px-3 py-1.5 text-xs font-medium rounded-lg border border-slate-200 text-slate-600 hover:bg-white disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                >
                  Previous
                </button>
                {Array.from({ length: totalPages }, (_, i) => i + 1).slice(
                  Math.max(0, page - 3), Math.min(totalPages, page + 2)
                ).map((p) => (
                  <button
                    key={p}
                    type="button"
                    onClick={() => setPage(p)}
                    className={`w-8 h-8 text-xs font-medium rounded-lg transition-colors ${p === page ? 'bg-[#1f7a5c] text-white shadow-sm' : 'text-slate-600 hover:bg-slate-100'}`}
                  >
                    {p}
                  </button>
                ))}
                <button
                  type="button"
                  disabled={page >= totalPages}
                  onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                  className="px-3 py-1.5 text-xs font-medium rounded-lg border border-slate-200 text-slate-600 hover:bg-white disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                >
                  Next
                </button>
              </div>
            </div>
          ) : null}
        </div>
      </div>
    </section>
  );
}

function statusBadge(sentAt) {
  if (sentAt) {
    return (
      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-emerald-50 text-emerald-700 border border-emerald-200/60">
        <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
        Sent
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-amber-50 text-amber-700 border border-amber-200/60">
      <span className="h-1.5 w-1.5 rounded-full bg-amber-500" />
      Pending
    </span>
  );
}
