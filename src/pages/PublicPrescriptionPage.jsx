import { useEffect, useRef, useState } from 'react';
import { apiGet } from '../lib/apiClient';

function MedCard({ med, checked, fading, onToggle }) {
  return (
    <div
      className={`rounded-xl p-4 border cursor-pointer transition-all duration-300 ease-in-out ${
        checked ? 'bg-[#357f62]/5 border-[#357f62]/20' : 'bg-white border-slate-200'
      }`}
      style={{
        opacity: fading ? 0 : 1,
        maxHeight: fading ? 0 : 200,
        paddingTop: fading ? 0 : undefined,
        paddingBottom: fading ? 0 : undefined,
        marginBottom: fading ? 0 : undefined,
        overflow: 'hidden',
        transition: 'opacity 250ms ease, max-height 300ms ease 100ms, padding 300ms ease 100ms, margin 300ms ease 100ms',
      }}
      onClick={onToggle}
    >
      <div className="flex items-start gap-3">
        <div className="mt-0.5 flex-shrink-0">
          <div className={`w-5 h-5 rounded-md border-2 flex items-center justify-center transition-colors duration-200 ${
            checked ? 'bg-[#357f62] border-[#357f62]' : 'border-slate-300'
          }`}>
            {checked && <span className="material-symbols-outlined text-white text-sm">check</span>}
          </div>
        </div>
        <div className="flex-1 min-w-0">
          <p className="font-bold text-base text-slate-800">{med.name}</p>
          <div className="mt-1.5 flex flex-wrap gap-2">
            {med.dosage && (
              <span className="inline-flex items-center text-xs bg-[#357f62]/10 text-[#357f62] px-2 py-0.5 rounded-full font-medium">
                {med.dosage}
              </span>
            )}
            {med.frequency && (
              <span className="inline-flex items-center text-xs bg-blue-50 text-blue-600 px-2 py-0.5 rounded-full font-medium">
                {med.frequency}
              </span>
            )}
            {med.duration && (
              <span className="inline-flex items-center text-xs bg-amber-50 text-amber-600 px-2 py-0.5 rounded-full font-medium">
                {med.duration}
              </span>
            )}
          </div>
          {med.instructions && (
            <p className="mt-1.5 text-xs text-slate-500 italic">{med.instructions}</p>
          )}
        </div>
      </div>
    </div>
  );
}

export function PublicPrescriptionPage({ prescriptionId }) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [checkedIds, setCheckedIds] = useState(new Set());
  const [fadingId, setFadingId] = useState(null);
  const timerRef = useRef(null);

  useEffect(() => {
    if (!prescriptionId) return;
    setLoading(true);
    apiGet(`/api/prescriptions/${prescriptionId}/public`)
      .then((res) => {
        setData(res);
        setError(null);
      })
      .catch((err) => setError(err.message || 'Prescription not found'))
      .finally(() => setLoading(false));
  }, [prescriptionId]);

  const toggleMed = (index) => {
    const isChecked = checkedIds.has(index);
    if (isChecked) {
      // Unchecking — instant move back
      setCheckedIds((prev) => { const n = new Set(prev); n.delete(index); return n; });
      return;
    }
    // Checking — fade out first, then move
    setFadingId(index);
    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => {
      setCheckedIds((prev) => { const n = new Set(prev); n.add(index); return n; });
      setFadingId(null);
    }, 400);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="text-center">
          <span className="material-symbols-outlined text-[#357f62] text-5xl animate-spin">progress_activity</span>
          <p className="mt-4 text-slate-500 text-lg" style={{ fontFamily: 'Inter, sans-serif' }}>Loading prescription...</p>
        </div>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center px-4">
        <div className="text-center max-w-md">
          <span className="material-symbols-outlined text-red-400 text-5xl">error</span>
          <h1 className="mt-4 text-2xl font-bold text-slate-800" style={{ fontFamily: 'Inter, sans-serif' }}>Prescription Not Found</h1>
          <p className="mt-2 text-slate-500" style={{ fontFamily: 'Inter, sans-serif' }}>{error || 'The prescription you are looking for does not exist or has been removed.'}</p>
        </div>
      </div>
    );
  }

  const createdDate = data.createdAt ? new Date(data.createdAt).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) : '—';
  const meds = data.medications || [];
  const sorted = [...meds.map((m, i) => ({ ...m, _i: i }))].sort((a, b) => a.name.localeCompare(b.name));
  const pending = sorted.filter((m) => !checkedIds.has(m._i));
  const done = sorted.filter((m) => checkedIds.has(m._i));

  return (
    <div className="min-h-screen bg-slate-50 py-6 px-4" style={{ fontFamily: 'Inter, sans-serif' }}>
      <div className="max-w-lg mx-auto">
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
          {/* Header */}
          <div className="bg-[#357f62] px-5 py-4">
            <div className="flex items-center gap-3">
              <span className="material-symbols-outlined text-white text-3xl" style={{ fontVariationSettings: "'FILL' 1" }}>medical_services</span>
              <div>
                <h1 className="text-white text-xl font-bold">EasyPrescribe</h1>
                <p className="text-white/70 text-sm">Digital Prescription</p>
              </div>
            </div>
          </div>

          {/* Patient Info — name, date, doctor only */}
          <div className="px-5 py-4 border-b border-slate-100">
            <div className="space-y-1.5">
              <div className="flex justify-between">
                <span className="text-slate-500 text-sm">Patient</span>
                <span className="font-semibold text-slate-800">{data.patientName || '—'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500 text-sm">Date</span>
                <span className="font-semibold text-slate-800">{createdDate}</span>
              </div>
              {data.doctorName && (
                <div className="flex justify-between">
                  <span className="text-slate-500 text-sm">Consultant</span>
                  <span className="font-semibold text-slate-800">Dr. {data.doctorName}</span>
                </div>
              )}
            </div>
          </div>

          {/* Pending Medications */}
          <div className="px-5 py-4">
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-xs font-bold text-slate-400 uppercase tracking-widest">Medications</h2>
              <span className="text-xs text-slate-400">{pending.length} pending &bull; {done.length} done</span>
            </div>
            {pending.length > 0 || fadingId !== null ? (
              <div className="space-y-3">
                {pending.map((med) => (
                  <MedCard key={med._i} med={med} checked={false} fading={fadingId === med._i} onToggle={() => toggleMed(med._i)} />
                ))}
              </div>
            ) : (
              <div className="text-center py-6">
                <span className="material-symbols-outlined text-[#357f62] text-4xl" style={{ fontVariationSettings: "'FILL' 1" }}>task_alt</span>
                <p className="mt-2 text-sm font-medium text-[#357f62]">All medications dispensed!</p>
              </div>
            )}
          </div>

          {/* Completed Medications */}
          {done.length > 0 && (
            <div className="px-5 pb-4">
              <h2 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-3">Dispensed</h2>
              <div className="space-y-2">
                {done.map((med) => (
                  <MedCard key={med._i} med={med} checked={true} fading={false} onToggle={() => toggleMed(med._i)} />
                ))}
              </div>
            </div>
          )}

          {/* Footer */}
          <div className="px-5 py-3 bg-slate-50 border-t border-slate-100 text-center">
            <p className="text-xs text-slate-400">Verified by EasyPrescribe &bull; For pharmacist reference only</p>
          </div>
        </div>
      </div>
    </div>
  );
}
