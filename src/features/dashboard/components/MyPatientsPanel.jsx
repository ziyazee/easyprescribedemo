import { useCallback, useEffect, useMemo, useState } from 'react';
import { getPatientsByDoctor } from '../services/patientService';
import { onPatientUpdate } from '../../../lib/patientChannel';

function initialsFromName(name) {
  const parts = String(name || '').trim().split(/\s+/).filter(Boolean);
  if (!parts.length) return 'NA';
  return parts.slice(0, 2).map((p) => p[0].toUpperCase()).join('');
}

function titleCase(str) {
  return String(str || '').trim().split(/\s+/).filter(Boolean)
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase()).join(' ');
}

export function MyPatientsPanel({ userSession, onNavigate }) {
  const [patients, setPatients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');
  const [sortBy, setSortBy] = useState('recent'); // recent | name | visits

  const loadPatients = useCallback(async () => {
    if (!userSession?.userUid) return;
    setLoading(true);
    setError('');
    try {
      const data = await getPatientsByDoctor(userSession.userUid);
      setPatients(Array.isArray(data) ? data : []);
    } catch (e) {
      setError(e.message || 'Failed to load patients');
      setPatients([]);
    } finally {
      setLoading(false);
    }
  }, [userSession?.userUid]);

  useEffect(() => { loadPatients(); }, [loadPatients]);

  // Listen for real-time patient updates from reception board (cross-tab)
  useEffect(() => {
    const unsubscribe = onPatientUpdate((msg) => {
      if (msg.event === 'patient_queued' || msg.event === 'patient_sent_to_doctor') {
        const p = msg.patient;
        if (!p) return;
        const newEntry = {
          uid: `local-${p.id}`,
          id: p.id,
          fullName: p.name,
          name: p.name,
          phone: p.phone || '',
          gender: p.gender || '',
          age: p.age || '',
          complaint: p.complaint || '',
          status: msg.event === 'patient_sent_to_doctor' ? 'with-doctor' : 'waiting',
          createdAt: new Date().toISOString(),
          totalVisits: 1,
        };
        setPatients((prev) => {
          // Avoid duplicates by id
          if (prev.some((x) => x.id === p.id || x.uid === newEntry.uid)) return prev;
          return [newEntry, ...prev];
        });
      }
    });
    return unsubscribe;
  }, []);

  const filtered = useMemo(() => {
    let list = [...patients];
    if (search.trim()) {
      const q = search.trim().toLowerCase();
      list = list.filter((p) =>
        (p.fullName || p.name || '').toLowerCase().includes(q) ||
        (p.phone || '').includes(q)
      );
    }
    if (sortBy === 'name') {
      list.sort((a, b) => (a.fullName || a.name || '').localeCompare(b.fullName || b.name || ''));
    } else if (sortBy === 'visits') {
      list.sort((a, b) => (b.totalVisits || b.prescriptionCount || 0) - (a.totalVisits || a.prescriptionCount || 0));
    }
    // 'recent' keeps API order (most recent first)
    return list;
  }, [patients, search, sortBy]);

  return (
    <section className="flex-grow overflow-y-auto bg-slate-50/50">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 pt-6 sm:pt-8 pb-8">
      <div className="mb-4">
        <div className="flex items-center justify-between gap-4 mb-1">
          <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">My Patients</h2>
          <span className="text-sm font-semibold text-slate-400">{loading ? '...' : `${patients.length} total`}</span>
        </div>
        <p className="text-slate-500 text-sm">All patients you have treated.</p>
      </div>

      {/* Search + Sort bar */}
      <div className="pb-4 flex flex-col sm:flex-row items-stretch sm:items-center gap-2 sm:gap-3">
        <div className="relative flex-1">
          <span className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3 text-slate-400">
            <span className="material-symbols-outlined text-[18px]">search</span>
          </span>
          <input
            className="h-10 w-full rounded-lg border border-slate-200 bg-white pl-9 pr-4 text-sm text-slate-900 placeholder:text-slate-400 focus:ring-2 focus:ring-[#1f7a5c] focus:border-[#1f7a5c] outline-none transition-all"
            placeholder="Search by name or phone..."
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <div className="flex items-center gap-1.5 bg-white border border-slate-200 rounded-lg p-0.5">
          {[
            { key: 'recent', label: 'Recent' },
            { key: 'name', label: 'A–Z' },
            { key: 'visits', label: 'Visits' },
          ].map((opt) => (
            <button
              key={opt.key}
              type="button"
              className={`px-3 py-1.5 rounded-md text-xs font-semibold transition-all ${sortBy === opt.key ? 'bg-[#1f7a5c] text-white shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
              onClick={() => setSortBy(opt.key)}
            >{opt.label}</button>
          ))}
        </div>
      </div>

      {/* Content */}
      <div>
        {loading ? (
          <div className="flex flex-col items-center justify-center py-20 text-slate-400">
            <span className="material-symbols-outlined text-4xl animate-spin mb-3">progress_activity</span>
            <p className="text-sm font-medium">Loading patients...</p>
          </div>
        ) : error ? (
          <div className="flex flex-col items-center justify-center py-20 text-slate-400">
            <span className="material-symbols-outlined text-4xl mb-3 text-red-400">error</span>
            <p className="text-sm font-medium text-red-500">{error}</p>
            <button type="button" className="mt-3 text-xs font-semibold text-[#1f7a5c] hover:underline" onClick={loadPatients}>Retry</button>
          </div>
        ) : filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-slate-400">
            <span className="material-symbols-outlined text-5xl mb-3">group_off</span>
            <p className="text-sm font-medium">{search ? 'No patients match your search' : 'No patients yet'}</p>
            {!search && <p className="text-xs text-slate-400 mt-1">Patients will appear here after you create prescriptions.</p>}
          </div>
        ) : (
          <div className="bg-white rounded-xl border border-slate-200/80 shadow-sm overflow-hidden">
            {/* Table header */}
            <div className="hidden sm:grid grid-cols-[1fr_140px_100px_100px_80px] gap-3 px-5 py-3 bg-slate-50 border-b border-slate-100 text-[10px] font-bold text-slate-400 uppercase tracking-widest">
              <span>Patient</span>
              <span>Phone</span>
              <span>Last Visit</span>
              <span>Visits</span>
              <span className="text-right">Action</span>
            </div>

            {/* Rows */}
            {filtered.map((patient, idx) => {
              const name = patient.fullName || patient.name || 'Unknown';
              const phone = patient.phone || patient.patientPhone || '—';
              const lastVisit = patient.lastVisitDate || patient.updatedAt || patient.createdAt;
              const visits = patient.totalVisits || patient.prescriptionCount || 0;
              const gender = patient.gender || '';
              const age = patient.age || patient.patientAge || '';

              return (
                <div
                  key={patient.uid || patient.id || idx}
                  className={`px-4 sm:px-5 py-3 sm:py-3.5 flex items-center gap-3 sm:grid sm:grid-cols-[1fr_140px_100px_100px_80px] sm:gap-3 hover:bg-slate-50/80 transition-colors cursor-default border-b border-slate-50 last:border-b-0`}
                >
                  {/* Patient info */}
                  <div className="flex items-center gap-3 min-w-0 flex-1">
                    <div className="w-9 h-9 rounded-full bg-gradient-to-br from-[#1f7a5c] to-[#0ea4a4] flex items-center justify-center text-white text-xs font-bold shrink-0 shadow-sm">
                      {initialsFromName(name)}
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-semibold text-slate-800 truncate">{titleCase(name)}</p>
                      <p className="text-[11px] text-slate-500 truncate">
                        {[gender, age ? `${age}y` : ''].filter(Boolean).join(' · ') || 'No details'}
                      </p>
                    </div>
                  </div>

                  {/* Phone */}
                  <span className="hidden sm:block text-xs text-slate-600 font-medium tabular-nums">{phone}</span>

                  {/* Last visit */}
                  <span className="hidden sm:block text-xs text-slate-500">
                    {lastVisit ? new Date(lastVisit).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: '2-digit' }) : '—'}
                  </span>

                  {/* Visits count */}
                  <span className="hidden sm:block text-xs font-semibold text-slate-700 tabular-nums">{visits}</span>

                  {/* Action */}
                  <div className="flex items-center justify-end shrink-0">
                    <button
                      type="button"
                      className="h-7 px-2.5 rounded-md text-[11px] font-semibold text-[#1f7a5c] bg-[#1f7a5c]/8 border border-[#1f7a5c]/15 hover:bg-[#1f7a5c] hover:text-white hover:border-[#1f7a5c] transition-all flex items-center gap-1"
                      onClick={() => onNavigate?.('/new-prescription/details', { patient: { fullName: name, phone, gender, age } })}
                    >
                      <span className="material-symbols-outlined" style={{ fontSize: '14px' }}>add</span>
                      <span className="hidden sm:inline">Prescribe</span>
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
      </div>
    </section>
  );
}
