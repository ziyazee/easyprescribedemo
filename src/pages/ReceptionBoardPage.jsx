import { useState, useCallback, useEffect } from 'react';
import { broadcastPatientUpdate } from '../lib/patientChannel';
import { addToQueue, getTodayQueue, updateQueueStatus, callNextInQueue } from '../features/dashboard/services/queueService';
import { apiGet } from '../lib/apiClient';

const COMPLAINTS = ['Fever', 'Headache', 'Chest Pain', 'Cough', 'Injury', 'Other'];

// Map API response to local queue item format
function mapEntry(e) {
  const statusMap = { WAITING: 'waiting', WITH_DOCTOR: 'with-doctor', DONE: 'done', SKIPPED: 'done' };
  return {
    id: e.queueEntryUid,
    token: e.tokenNumber,
    name: e.patientName,
    gender: e.gender || '',
    age: e.age || 0,
    complaint: e.complaint || '',
    allergies: e.allergies || '',
    status: statusMap[e.status] || 'waiting',
    priority: e.priority || false,
    waitMins: 0,
    phone: e.patientPhone || '',
    patientUid: e.patientUid,
  };
}

function getInitials(name) {
  return name.split(' ').map((w) => w[0]).join('').toUpperCase().slice(0, 2);
}

export function ReceptionBoardPage({ onNavigate, userSession }) {
  const [queue, setQueue] = useState([]);
  const [phone, setPhone] = useState('');
  const [fullName, setFullName] = useState('');
  const [dob, setDob] = useState('');
  const [gender, setGender] = useState('Male');
  const [allergies, setAllergies] = useState('');
  const [selectedComplaints, setSelectedComplaints] = useState([]);
  const [complaintDetail, setComplaintDetail] = useState('');
  const [additionalNotes, setAdditionalNotes] = useState('');
  const [isPriority, setIsPriority] = useState(false);
  const [toast, setToast] = useState(null);
  const [lookupStatus, setLookupStatus] = useState('idle'); // idle | found | new
  const [mobileTab, setMobileTab] = useState('checkin'); // checkin | queue
  const [submitting, setSubmitting] = useState(false);

  // Resolve the doctorUserUid: for receptionists it's stored in session.doctorUserUid, for doctors it's session.userUid
  const doctorUid = userSession?.doctorUserUid || userSession?.userUid;

  const pendingCount = queue.filter((p) => p.status === 'waiting').length;
  const inProgressCount = queue.filter((p) => p.status === 'with-doctor').length;
  const completedCount = queue.filter((p) => p.status === 'done').length;
  const activePatient = queue.find((p) => p.status === 'with-doctor');
  const doctorName = userSession?.fullName || userSession?.username || 'Doctor';

  // Load queue from API on mount
  const loadQueue = useCallback(async () => {
    if (!doctorUid) return;
    try {
      const data = await getTodayQueue(doctorUid);
      setQueue(Array.isArray(data) ? data.map(mapEntry) : []);
    } catch (err) {
      console.error('Failed to load queue:', err);
    }
  }, [doctorUid]);

  useEffect(() => { loadQueue(); }, [loadQueue]);

  // Compute who's next in line (same logic as callNext)
  const nextPatient = (() => {
    const sorted = [...queue].filter(p => p.status === 'waiting').sort((a, b) => {
      if (a.priority && !b.priority) return -1;
      if (!a.priority && b.priority) return 1;
      return a.token - b.token;
    });
    return sorted[0] || null;
  })();

  const showToast = useCallback((msg) => {
    setToast(msg);
    setTimeout(() => setToast(null), 4000);
  }, []);

  const handlePhoneChange = async (e) => {
    const val = e.target.value.replace(/\D/g, '').slice(0, 10);
    setPhone(val);
    if (val.length === 10) {
      // Try to look up patient in DB
      try {
        const patient = await apiGet(`/api/patients/by-phone/${val}`);
        if (patient?.fullName) {
          setLookupStatus('found');
          setFullName(patient.fullName);
          setGender(patient.gender || 'Male');
          setAllergies(patient.allergies || '');
          setSelectedComplaints([]);
          setComplaintDetail(patient.complaint || '');
          if (patient.dateOfBirth) setDob(patient.dateOfBirth);
          return;
        }
      } catch {
        // Not found in DB, check local queue
      }
      const existing = queue.find((p) => p.phone === val);
      if (existing) {
        setLookupStatus('found');
        setFullName(existing.name);
        setGender(existing.gender);
        setAllergies(existing.allergies || '');
        setComplaintDetail(existing.complaint || '');
      } else {
        setLookupStatus('new');
        setFullName('');
        setGender('Male');
        setAllergies('');
        setComplaintDetail('');
      }
    } else {
      setLookupStatus('idle');
    }
  };

  const toggleComplaint = (c) => {
    setSelectedComplaints((prev) => prev.includes(c) ? prev.filter((x) => x !== c) : [...prev, c]);
  };

  const handleAddToQueue = async () => {
    if (!fullName.trim() || !doctorUid || submitting) return;
    setSubmitting(true);
    const age = dob ? Math.floor((Date.now() - new Date(dob).getTime()) / (365.25 * 24 * 60 * 60 * 1000)) : 0;
    const complaint = selectedComplaints.join(', ') || complaintDetail || 'General';
    try {
      const entry = await addToQueue(doctorUid, {
        name: fullName.trim(),
        phone,
        gender,
        age,
        complaint,
        allergies,
        priority: isPriority,
      });
      const mapped = mapEntry(entry);
      setQueue((prev) => [...prev, mapped]);
      broadcastPatientUpdate('patient_queued', mapped);
      showToast(`${fullName.trim()} added to queue | Position: #${mapped.token} | Est. Wait: ${pendingCount * 6} mins`);
      // Reset form
      setPhone('');
      setFullName('');
      setDob('');
      setGender('Male');
      setAllergies('');
      setSelectedComplaints([]);
      setComplaintDetail('');
      setAdditionalNotes('');
      setIsPriority(false);
      setLookupStatus('idle');
    } catch (err) {
      showToast(`Error: ${err.message || 'Failed to add patient'}`);
    } finally {
      setSubmitting(false);
    }
  };

  const callNext = async () => {
    if (!doctorUid || !nextPatient) return;
    try {
      const entry = await callNextInQueue(doctorUid);
      const mapped = mapEntry(entry);
      setQueue((prev) => prev.map((p) => p.id === mapped.id ? mapped : p));
      showToast(`Calling ${mapped.name} — Token #${mapped.token}`);
      broadcastPatientUpdate('patient_sent_to_doctor', mapped);
    } catch (err) {
      showToast(`Error: ${err.message || 'Failed to call next'}`);
    }
  };

  const markDone = async (id) => {
    try {
      await updateQueueStatus(id, 'DONE');
      setQueue((prev) => prev.map((p) => p.id === id ? { ...p, status: 'done' } : p));
    } catch (err) {
      showToast(`Error: ${err.message}`);
    }
  };

  const skipPatient = async (id) => {
    try {
      await updateQueueStatus(id, 'SKIPPED');
      setQueue((prev) => prev.map((p) => p.id === id ? { ...p, status: 'done' } : p));
    } catch (err) {
      showToast(`Error: ${err.message}`);
    }
  };

  // Sort: priority waiting first, then waiting by token, then with-doctor, then done
  const sortedQueue = [...queue]
    .filter((p) => p.status !== 'done')
    .sort((a, b) => {
      const statusOrder = { 'waiting': 0, 'with-doctor': 1, 'done': 2 };
      if (a.status === 'waiting' && b.status === 'waiting') {
        if (a.priority && !b.priority) return -1;
        if (!a.priority && b.priority) return 1;
        return a.token - b.token;
      }
      return (statusOrder[a.status] || 0) - (statusOrder[b.status] || 0);
    });

  const itemClass = (active) =>
    active
      ? 'flex items-center gap-3 px-3 py-2.5 rounded-lg border border-[#1f7a5c]/20 bg-[#1f7a5c]/12 text-[#145539] shadow-sm shadow-[#1f7a5c]/10 transition-all duration-200'
      : 'flex items-center gap-3 px-3 py-2.5 rounded-lg text-slate-600 hover:bg-slate-50 hover:text-[#1f7a5c] hover:border hover:border-slate-200/80 transition-all duration-200';

  return (
    <>
    <div className="h-screen flex bg-[#f7f9fc] text-[#191c1e] overflow-hidden">
      {/* Desktop Sidebar — hidden on mobile */}
      <aside className="hidden lg:flex w-64 flex-shrink-0 flex-col bg-[#fdfefe] border-r border-slate-200/90 h-full">
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

          <button className={`${itemClass(false)} w-full text-left`} type="button" onClick={() => onNavigate?.('/dashboard')}>
            <span className="material-symbols-outlined text-[20px]">dashboard</span>
            <span className="text-sm font-medium">Dashboard</span>
          </button>
          <button className={`${itemClass(true)} w-full text-left`} type="button" onClick={() => onNavigate?.('/reception-board')}>
            <span className="material-symbols-outlined text-[20px]">assignment_ind</span>
            <span className="text-sm font-medium">Reception Board</span>
          </button>
          <button className={`${itemClass(false)} w-full text-left`} type="button" onClick={() => onNavigate?.('/history')}>
            <span className="material-symbols-outlined text-[20px]">history</span>
            <span className="text-sm font-medium">History</span>
          </button>
          <button className={`${itemClass(false)} w-full text-left`} type="button" onClick={() => onNavigate?.('/smart-tags')}>
            <span className="material-symbols-outlined text-[20px]">label</span>
            <span className="text-sm font-medium">Smart Tags</span>
          </button>
          <button className={`${itemClass(false)} w-full text-left`} type="button" onClick={() => onNavigate?.('/appointments')}>
            <span className="material-symbols-outlined text-[20px]">calendar_month</span>
            <span className="text-sm font-medium">Appointments</span>
          </button>

          <div className="my-2 border-t border-slate-200" />

          <button className={`${itemClass(false)} w-full text-left`} type="button" onClick={() => onNavigate?.('/profile')}>
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
            onClick={() => {}}
          >
            <span className="material-symbols-outlined text-[20px]">logout</span>
            <span className="text-sm font-medium">Sign Out</span>
          </button>
        </nav>
      </aside>

      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden">

        {/* ── Mobile Header ── logo left, user right */}
        <header className="shrink-0 lg:hidden bg-white border-b border-slate-200 px-4 h-14 flex items-center justify-between safe-area-top">
          <div className="flex items-center gap-2.5">
            <div className="h-8 w-8 rounded-full overflow-hidden border-2 border-slate-200 shadow-sm flex-shrink-0">
              <img src="/img.png" alt="Logo" className="h-full w-full object-cover" />
            </div>
            <span className="text-[15px] font-bold text-slate-800 leading-tight" style={{ fontFamily: 'Manrope, sans-serif' }}>Easy Prescribe</span>
          </div>
          <div className="flex items-center gap-2">
            <button className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-slate-100 transition-colors relative">
              <span className="material-symbols-outlined text-slate-500 text-xl">notifications</span>
              <span className="absolute top-1 right-1 w-2 h-2 rounded-full bg-red-500"></span>
            </button>
            <div className="w-8 h-8 rounded-full bg-[#1f7a5c] flex items-center justify-center overflow-hidden">
              <span className="material-symbols-outlined text-white" style={{ fontSize: '18px', fontVariationSettings: "'FILL' 1" }}>person</span>
            </div>
          </div>
        </header>

        {/* ── Desktop Top Bar ── */}
        <header className="shrink-0 hidden lg:flex bg-white border-b border-[#e0e3e6] px-4 h-12 items-center justify-between">
          <h1 className="text-base font-bold text-[#191c1e]" style={{ fontFamily: 'Manrope, sans-serif' }}>Reception Board</h1>
          <div className="flex items-center gap-3">
            <button className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-[#eceef1] transition-colors">
              <span className="material-symbols-outlined text-[#3d4949] text-xl">notifications</span>
            </button>
            <div className="w-8 h-8 rounded-full bg-[#bfebe9] flex items-center justify-center border-2 border-[#e0e3e6] overflow-hidden">
              <span className="material-symbols-outlined text-[#426b6b]">account_circle</span>
            </div>
          </div>
        </header>

        <main className="flex-1 px-3 sm:px-4 py-2 sm:py-3 pb-20 lg:pb-3 space-y-2 sm:space-y-3 overflow-y-auto">
        {/* Main 60/40 layout */}
        <div className="flex flex-col lg:flex-row gap-3 sm:gap-4 min-h-0">
          {/* LEFT: Check-in Panel */}
          <section className={`lg:w-[60%] ${mobileTab !== 'checkin' ? 'hidden lg:block' : ''}`}>
            <div className="bg-white p-3 sm:p-4 rounded-lg border border-[#eceef1]">
              <header className="mb-3">
                <h2 className="text-lg font-bold text-[#191c1e]" style={{ fontFamily: 'Manrope, sans-serif' }}>Check-in Patient</h2>
                <p className="text-[#3d4949] text-xs mt-0.5">Search existing or create new medical records.</p>
              </header>

              {/* Phone Search */}
              <div className="mb-3">
                <label className="block text-[10px] font-bold text-[#3d4949] mb-1 tracking-widest uppercase">Phone Number</label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-base font-bold text-[#006a69]" style={{ fontFamily: 'Manrope, sans-serif' }}>+91</span>
                  <input
                    className="w-full bg-[#f2f4f7] border-none rounded-lg h-10 pl-12 pr-3 text-base font-bold tracking-widest text-[#191c1e] focus:ring-2 focus:ring-[#7df5f4] transition-all"
                    style={{ fontFamily: 'Manrope, sans-serif' }}
                    placeholder="__________"
                    type="text"
                    inputMode="numeric"
                    value={phone}
                    onChange={handlePhoneChange}
                  />
                </div>
                {lookupStatus !== 'idle' && (
                  <div className={`mt-2 flex items-center gap-2 px-3 py-2 rounded-lg border text-xs ${lookupStatus === 'found' ? 'bg-[#bfebe9]/30 border-[#006a69]/30' : 'bg-[#eceef1] border-[#bcc9c8]'}`}>
                    <span className="material-symbols-outlined text-[#006a69] text-base">{ lookupStatus === 'found' ? 'check_circle' : 'info'}</span>
                    <span className="text-[#3d4949] font-medium">
                      {lookupStatus === 'found' ? `Existing Patient: ${fullName}` : 'New Patient — Creating profile.'}
                    </span>
                  </div>
                )}
              </div>

              {/* Patient Fields */}
              <div className="space-y-3">
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  <div className="col-span-2">
                    <label className="block text-[10px] font-bold text-[#3d4949] mb-1 uppercase">Full Name</label>
                    <input
                      className="w-full bg-[#f2f4f7] border-none rounded-lg h-9 px-3 text-sm focus:ring-2 focus:ring-[#7df5f4]"
                      placeholder="Enter patient name"
                      type="text"
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-[#3d4949] mb-1 uppercase">DOB</label>
                    <input
                      className="w-full bg-[#f2f4f7] border-none rounded-lg h-9 px-3 text-sm focus:ring-2 focus:ring-[#7df5f4]"
                      type="date"
                      value={dob}
                      onChange={(e) => setDob(e.target.value)}
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-[#3d4949] mb-1 uppercase">Gender</label>
                    <div className="flex p-0.5 bg-[#f2f4f7] rounded-lg gap-0.5 h-9">
                      {['Male', 'Female', 'Other'].map((g) => (
                        <button
                          key={g}
                          type="button"
                          className={`flex-1 text-xs font-semibold rounded-md transition-all flex items-center justify-center ${gender === g ? 'bg-[#006a69] text-white shadow-sm' : 'text-[#3d4949] hover:bg-[#eceef1] hover:text-[#191c1e]'}`}
                          onClick={() => setGender(g)}
                        >{g}</button>
                      ))}
                    </div>
                  </div>
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-[#3d4949] mb-1 uppercase">Known Allergies</label>
                  <input
                    className="w-full bg-[#f2f4f7] border-none rounded-lg h-9 px-3 text-sm focus:ring-2 focus:ring-[#7df5f4]"
                    placeholder="e.g., Penicillin, Peanuts (or 'None')"
                    type="text"
                    value={allergies}
                    onChange={(e) => setAllergies(e.target.value)}
                  />
                </div>

                {/* Chief Complaint */}
                <div className="pt-3 border-t border-[#eceef1]">
                  <label className="block text-[10px] font-bold text-[#3d4949] mb-2 uppercase tracking-widest">Chief Complaint</label>
                  <div className="flex flex-wrap gap-1.5 mb-3">
                    {COMPLAINTS.map((c) => (
                      <button
                        key={c}
                        type="button"
                        className={`px-3 py-1 rounded-full border text-xs font-medium transition-all ${selectedComplaints.includes(c) ? 'bg-[#006a69] text-white border-[#006a69]' : 'border-[#e0e3e6] hover:bg-[#006a69] hover:text-white'}`}
                        onClick={() => toggleComplaint(c)}
                      >{c}</button>
                    ))}
                  </div>
                  <input
                    className="w-full bg-[#f2f4f7] border-none rounded-lg h-9 px-3 text-sm mb-2 focus:ring-2 focus:ring-[#7df5f4]"
                    placeholder="Describe symptoms in detail..."
                    type="text"
                    value={complaintDetail}
                    onChange={(e) => setComplaintDetail(e.target.value)}
                  />
                  <textarea
                    className="w-full bg-[#f2f4f7] border-none rounded-lg p-3 h-16 text-sm focus:ring-2 focus:ring-[#7df5f4] resize-none"
                    placeholder="Additional Notes (Symptoms, history, etc...)"
                    value={additionalNotes}
                    onChange={(e) => setAdditionalNotes(e.target.value)}
                  />
                </div>

                {/* Actions */}
                <div className="flex items-center justify-between pt-3">
                  <div className="flex items-center gap-2">
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input type="checkbox" className="sr-only peer" checked={isPriority} onChange={(e) => setIsPriority(e.target.checked)} />
                      <div className="w-9 h-5 bg-[#e0e3e6] rounded-full peer peer-checked:after:translate-x-full peer-checked:bg-[#ba1a1a] after:content-[''] after:absolute after:top-0.5 after:left-[2px] after:bg-white after:rounded-full after:h-4 after:w-4 after:transition-all"></div>
                    </label>
                    <span className="text-xs font-bold text-[#191c1e] uppercase">Priority</span>
                  </div>
                  <button
                    type="button"
                    className="bg-[#006a69] hover:bg-[#002020] text-white font-bold h-9 px-6 rounded-lg shadow-sm transition-all flex items-center gap-2 text-sm disabled:opacity-40 disabled:cursor-not-allowed"
                    style={{ fontFamily: 'Manrope, sans-serif' }}
                    disabled={!fullName.trim()}
                    onClick={handleAddToQueue}
                  >
                    <span className="material-symbols-outlined text-lg">person_add</span>
                    Add to Queue
                  </button>
                </div>
              </div>
            </div>
          </section>

          {/* RIGHT: Live Queue */}
          <section className={`lg:w-[40%] flex flex-col min-h-0 ${mobileTab !== 'queue' ? 'hidden lg:flex' : ''}`}>
            <div className="bg-white rounded-xl border border-slate-200/80 shadow-sm flex flex-col flex-1 min-h-0 overflow-hidden">

              {/* ── Header ── */}
              <div className="px-3 sm:px-5 pt-3 sm:pt-4 pb-2 sm:pb-3">
                <div className="flex items-center justify-between mb-2 sm:mb-3">
                  <div className="flex items-center gap-2">
                    <h2 className="text-sm font-bold text-slate-800" style={{ fontFamily: 'Manrope, sans-serif' }}>Patient Queue</h2>
                    <span className="text-[10px] font-semibold text-blue-600 bg-blue-50 px-1.5 py-0.5 rounded-full">~{sortedQueue.filter(p => p.status === 'waiting').length > 0 ? Math.round(sortedQueue.filter(p => p.status === 'waiting').reduce((s, p) => s + p.waitMins, 0) / sortedQueue.filter(p => p.status === 'waiting').length) : 0}m avg</span>
                  </div>
                  <div className="flex items-center gap-1.5 bg-emerald-50 text-emerald-700 pl-1.5 pr-2 py-0.5 rounded-full">
                    <span className="relative flex h-2 w-2"><span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span><span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span></span>
                    <span className="text-[10px] font-semibold uppercase tracking-wider">Live</span>
                  </div>
                </div>

                {/* Stats strip */}
                <div className="grid grid-cols-3 gap-1.5 sm:gap-2 mb-2 sm:mb-3">
                  <div className="bg-amber-50 rounded-lg px-2 sm:px-3 py-2 sm:py-2.5 text-center flex flex-col items-center justify-center">
                    <p className="text-lg sm:text-xl font-extrabold text-amber-600 h-7 flex items-center justify-center" style={{ fontFamily: 'Manrope, sans-serif' }}>{pendingCount}</p>
                    <p className="text-[8px] sm:text-[9px] font-semibold text-amber-600/70 uppercase tracking-wider">Waiting</p>
                  </div>
                  <div className="bg-emerald-50 rounded-lg px-2 sm:px-3 py-2 sm:py-2.5 text-center flex flex-col items-center justify-center">
                    <p className="text-[11px] sm:text-sm font-bold text-[#1f7a5c] truncate w-full h-7 flex items-center justify-center leading-tight" style={{ fontFamily: 'Manrope, sans-serif' }}>{activePatient ? activePatient.name : '\u2014'}</p>
                    <p className="text-[8px] sm:text-[9px] font-semibold text-[#1f7a5c]/70 uppercase tracking-wider">With Doctor</p>
                  </div>
                  <div className="bg-slate-50 rounded-lg px-2 sm:px-3 py-2 sm:py-2.5 text-center flex flex-col items-center justify-center">
                    <p className="text-lg sm:text-xl font-extrabold text-slate-600 h-7 flex items-center justify-center" style={{ fontFamily: 'Manrope, sans-serif' }}>{completedCount}</p>
                    <p className="text-[8px] sm:text-[9px] font-semibold text-slate-500 uppercase tracking-wider">Done</p>
                  </div>
                </div>

                {/* CTA row */}
                <button
                  type="button"
                  className="w-full bg-[#1f7a5c] hover:bg-[#186349] active:bg-[#145539] text-white font-bold rounded-lg shadow-md shadow-[#1f7a5c]/25 hover:shadow-lg transition-all flex items-center justify-center gap-1.5 h-9 sm:h-10 px-3 sm:px-4 text-[11px] sm:text-xs disabled:opacity-40 disabled:cursor-not-allowed"
                  onClick={callNext}
                  disabled={!nextPatient}
                >
                  <span className="material-symbols-outlined text-base" style={{ fontVariationSettings: "'FILL' 1" }}>campaign</span>
                  <span className="truncate">{nextPatient ? `Send ${nextPatient.name}` : 'No patients waiting'}</span>
                </button>
              </div>

              {/* ── Column header ── */}
              <div className="px-3 sm:px-5 py-1.5 bg-slate-50 border-y border-slate-100 flex items-center gap-2 sm:gap-3 text-[9px] font-bold text-slate-400 uppercase tracking-widest">
                <span className="w-5 sm:w-6 text-center">#</span>
                <span className="flex-1">Patient</span>
                <span className="w-14 sm:w-16 text-center">Status</span>
                <span className="w-14 text-center hidden sm:block">Wait</span>
                <span className="w-10 sm:w-20 text-right">Actions</span>
              </div>

              {/* ── Queue Rows ── */}
              <div className="flex-1 overflow-y-auto min-h-0">
                {sortedQueue.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-16 text-slate-300">
                    <span className="material-symbols-outlined text-4xl mb-2">group_off</span>
                    <p className="text-xs font-medium text-slate-400">No patients in queue</p>
                    <p className="text-[10px] text-slate-400 mt-0.5">Check in a patient to get started</p>
                  </div>
                ) : (
                  <div>
                    {sortedQueue.map((patient, idx) => {
                      const isWithDoctor = patient.status === 'with-doctor';
                      const isPriorityPatient = patient.priority && patient.status === 'waiting';
                      const initials = getInitials(patient.name);
                      const isNext = !isPriorityPatient && !isWithDoctor && idx === sortedQueue.findIndex(p => p.status === 'waiting' && !p.priority);

                      let rowStyle = '';
                      let avatarStyle = 'bg-slate-100 text-slate-600 border border-slate-200/60';
                      let tokenColor = 'text-slate-400';

                      if (isPriorityPatient) {
                        rowStyle = 'bg-red-50/50 border-l-2 border-l-red-400';
                        avatarStyle = 'bg-red-50 text-red-600 border border-red-200 ring-1 ring-red-100';
                        tokenColor = 'text-red-400';
                      } else if (isWithDoctor) {
                        rowStyle = 'bg-emerald-50/30 border-l-2 border-l-[#1f7a5c]';
                        avatarStyle = 'bg-emerald-50 text-[#1f7a5c] border border-emerald-200';
                        tokenColor = 'text-[#1f7a5c]';
                      } else if (isNext) {
                        rowStyle = 'bg-amber-50/30 border-l-2 border-l-amber-400';
                        avatarStyle = 'bg-amber-50 text-amber-700 border border-amber-200';
                        tokenColor = 'text-amber-500';
                      } else {
                        rowStyle = idx % 2 === 0 ? 'bg-white' : 'bg-slate-50/30';
                      }

                      const statusBadge = isPriorityPatient ? (
                        <span className="inline-flex items-center gap-0.5 text-[9px] font-bold text-red-600 bg-red-100 px-1.5 py-0.5 rounded-full">
                          <span className="material-symbols-outlined" style={{ fontSize: '10px' }}>warning</span>
                          URGENT
                        </span>
                      ) : isWithDoctor ? (
                        <span className="inline-flex items-center gap-0.5 text-[9px] font-bold text-[#1f7a5c] bg-emerald-100 px-1.5 py-0.5 rounded-full">
                          <span className="material-symbols-outlined" style={{ fontSize: '10px', fontVariationSettings: "'FILL' 1" }}>person</span>
                          ACTIVE
                        </span>
                      ) : isNext ? (
                        <span className="inline-flex items-center gap-0.5 text-[9px] font-bold text-amber-600 bg-amber-100 px-1.5 py-0.5 rounded-full">NEXT</span>
                      ) : (
                        <span className="text-[9px] font-medium text-slate-400 bg-slate-100 px-1.5 py-0.5 rounded-full">Queue</span>
                      );

                      return (
                        <div key={patient.id} className={`${rowStyle} px-3 sm:px-5 py-2 flex items-center gap-2 sm:gap-3 group hover:bg-slate-100/50 transition-all duration-150 cursor-default border-b border-slate-50`}>
                          {/* Token */}
                          <span className={`w-6 sm:w-7 text-center text-sm sm:text-base font-mono font-extrabold ${tokenColor} shrink-0`}>{patient.token}</span>

                          {/* Avatar + Info */}
                          <div className={`w-7 h-7 rounded-full shrink-0 flex items-center justify-center text-[10px] font-bold ${avatarStyle}`}>
                            {initials}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-xs sm:text-[13px] font-semibold text-slate-800 truncate leading-tight" style={{ fontFamily: 'Manrope, sans-serif' }}>{patient.name}</p>
                            <p className="text-[10px] text-slate-500 truncate leading-tight">
                              <span className="sm:hidden">{patient.complaint}{!isWithDoctor && ` · ${patient.waitMins}m`}</span>
                              <span className="hidden sm:inline">{patient.gender} · {patient.age}y · {patient.complaint}</span>
                            </p>
                          </div>

                          {/* Status badge */}
                          <div className="w-14 sm:w-16 flex justify-center shrink-0">{statusBadge}</div>

                          {/* Wait time — hidden on mobile (shown inline in subtitle) */}
                          <div className="w-14 text-center shrink-0 hidden sm:block">
                            {isWithDoctor ? (
                              <span className="text-[10px] font-medium text-[#1f7a5c]">—</span>
                            ) : (
                              <span className={`text-[11px] font-semibold tabular-nums ${patient.waitMins >= 20 ? 'text-red-500' : patient.waitMins >= 10 ? 'text-amber-500' : 'text-slate-500'}`}>{patient.waitMins}m</span>
                            )}
                          </div>

                          {/* Actions — single button on mobile, full set on desktop */}
                          <div className="w-10 sm:w-20 flex items-center justify-end gap-1 shrink-0">
                            {isWithDoctor ? (
                              <button type="button" className="h-6 px-1.5 sm:px-2 rounded-md text-[10px] font-semibold bg-emerald-50 text-[#1f7a5c] border border-emerald-200/60 hover:bg-[#1f7a5c] hover:text-white hover:border-[#1f7a5c] transition-all" onClick={() => markDone(patient.id)}>
                                <span className="material-symbols-outlined sm:hidden" style={{ fontSize: '14px' }}>check</span>
                                <span className="hidden sm:inline">Done</span>
                              </button>
                            ) : (
                              <>
                                <button type="button" className="h-6 px-1.5 sm:px-2 rounded-md flex items-center justify-center gap-0.5 text-slate-500 bg-slate-50 border border-slate-200/60 hover:bg-[#1f7a5c] hover:text-white hover:border-[#1f7a5c] transition-all" title="Send In" onClick={callNext}>
                                  <span className="material-symbols-outlined" style={{ fontSize: '13px', fontVariationSettings: "'FILL' 1" }}>campaign</span>
                                  <span className="text-[9px] font-semibold hidden sm:inline">Send</span>
                                </button>
                                <button type="button" className="w-6 h-6 rounded-md items-center justify-center text-slate-400 hover:bg-amber-100 hover:text-amber-600 transition-all hidden sm:flex" title="Move to End" onClick={() => skipPatient(patient.id)}>
                                  <span className="material-symbols-outlined" style={{ fontSize: '14px' }}>low_priority</span>
                                </button>
                                <button type="button" className="w-6 h-6 rounded-md items-center justify-center text-slate-400 hover:bg-emerald-100 hover:text-[#1f7a5c] transition-all hidden sm:flex" title="Done" onClick={() => markDone(patient.id)}>
                                  <span className="material-symbols-outlined" style={{ fontSize: '14px' }}>check</span>
                                </button>
                              </>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* ── Footer ── */}
              <div className="px-3 sm:px-5 py-2 border-t border-slate-100 bg-slate-50/60 flex items-center justify-between">
                <div className="flex items-center gap-2 sm:gap-3 text-[8px] sm:text-[9px] text-slate-400 font-medium">
                  <span className="flex items-center gap-1"><span className="w-1.5 h-1.5 rounded-full bg-red-400"></span>Urgent</span>
                  <span className="flex items-center gap-1"><span className="w-1.5 h-1.5 rounded-full bg-[#1f7a5c]"></span>Active</span>
                  <span className="flex items-center gap-1 hidden sm:flex"><span className="w-1.5 h-1.5 rounded-full bg-amber-400"></span>Next</span>
                  <span className="flex items-center gap-1 hidden sm:flex"><span className="w-1.5 h-1.5 rounded-full bg-slate-300"></span>Queue</span>
                </div>
                <span className="text-[8px] sm:text-[9px] text-slate-400 font-medium">{sortedQueue.length} total</span>
              </div>
            </div>
          </section>
        </div>
      </main>

      {/* Desktop Footer — hidden on mobile */}
      <footer className="shrink-0 py-2 border-t border-[#eceef1] bg-[#f2f4f7] text-center hidden lg:block">
        <p className="text-[10px] font-medium text-[#3d4949] uppercase tracking-widest">EasyPrescribe Terminal v2.4 • Precise Professional Healthcare Systems</p>
      </footer>
      </div>{/* end Main Content wrapper */}
    </div>

    {/* ── Mobile Bottom Tab Bar ── native app style, OUTSIDE overflow-hidden */}
    <nav className="lg:hidden fixed bottom-0 left-0 right-0 z-50 bg-white border-t border-slate-200 safe-area-bottom">
      <div className="flex items-stretch h-14">
        <button
          type="button"
          className={`flex-1 flex flex-col items-center justify-center gap-0.5 transition-colors relative ${mobileTab === 'checkin' ? 'text-[#1f7a5c]' : 'text-slate-400'}`}
          onClick={() => setMobileTab('checkin')}
        >
          {mobileTab === 'checkin' && <span className="absolute top-0 left-1/2 -translate-x-1/2 w-12 h-0.5 rounded-full bg-[#1f7a5c]"></span>}
          <span className="material-symbols-outlined text-[22px]" style={{ fontVariationSettings: mobileTab === 'checkin' ? "'FILL' 1" : "'FILL' 0" }}>person_add</span>
          <span className="text-[10px] font-semibold">Check-in</span>
        </button>
        <button
          type="button"
          className={`flex-1 flex flex-col items-center justify-center gap-0.5 transition-colors relative ${mobileTab === 'queue' ? 'text-[#1f7a5c]' : 'text-slate-400'}`}
          onClick={() => setMobileTab('queue')}
        >
          {mobileTab === 'queue' && <span className="absolute top-0 left-1/2 -translate-x-1/2 w-12 h-0.5 rounded-full bg-[#1f7a5c]"></span>}
          <span className="material-symbols-outlined text-[22px]" style={{ fontVariationSettings: mobileTab === 'queue' ? "'FILL' 1" : "'FILL' 0" }}>queue</span>
          <span className="text-[10px] font-semibold">Queue</span>
          {pendingCount > 0 && <span className="absolute top-2 left-1/2 ml-2 w-4 h-4 rounded-full bg-red-500 text-white text-[8px] font-bold flex items-center justify-center">{pendingCount}</span>}
        </button>
      </div>
    </nav>

    {/* Toast Notification — above bottom bar on mobile, OUTSIDE overflow-hidden */}
    {toast && (
      <div className="fixed bottom-16 lg:bottom-6 left-1/2 -translate-x-1/2 z-[100] bg-[#2d3133] text-[#eff1f4] px-4 sm:px-6 py-2.5 sm:py-3 rounded-full shadow-xl flex items-center gap-3 sm:gap-4 animate-bounce max-w-[85vw] sm:max-w-[90vw]">
        <div className="flex items-center gap-2 text-xs sm:text-sm font-medium min-w-0">
          <span className="material-symbols-outlined text-[#7df5f4] text-base sm:text-lg shrink-0">check_circle</span>
          <span className="truncate">{toast}</span>
        </div>
        <button type="button" className="text-[10px] sm:text-xs font-bold uppercase opacity-70 hover:opacity-100 transition-opacity shrink-0" onClick={() => setToast(null)}>Dismiss</button>
      </div>
    )}
    </>
  );
}
