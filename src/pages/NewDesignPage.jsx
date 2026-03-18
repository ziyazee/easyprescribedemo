import { useState, useCallback } from 'react';

// ─── Sidebar ─────────────────────────────────────────────────────────────────
function Sidebar({ doctorName, activeItem, onNavigate }) {
  const navItems = [
    { id: 'dashboard', icon: 'dashboard', label: 'Dashboard', path: '/dashboard' },
    { id: 'patients', icon: 'person', label: 'Patients', path: '/my-patients' },
    { id: 'prescriptions', icon: 'description', label: 'Prescriptions', path: '/new-design' },
    { id: 'inventory', icon: 'inventory_2', label: 'Inventory', path: null },
    { id: 'reports', icon: 'assessment', label: 'Reports', path: null },
  ];

  return (
    <aside className="w-64 bg-md-surface-container flex flex-col border-r border-md-outline-variant/20 shrink-0">
      <div className="p-6 flex items-center gap-3">
        <div className="w-10 h-10 rounded-full bg-md-surface-container-highest flex items-center justify-center text-md-primary font-bold text-sm">
          {(doctorName || 'D').charAt(0).toUpperCase()}
        </div>
        <div>
          <p className="font-headline font-bold text-md-on-surface text-sm">Dr. {doctorName || 'Doctor'}</p>
          <p className="text-md-on-surface-variant text-xs">General Practitioner</p>
        </div>
      </div>

      <nav className="flex-1 px-4 space-y-2 mt-4">
        {navItems.map((item) => {
          const isActive = item.id === activeItem;
          return (
            <button
              key={item.id}
              type="button"
              onClick={() => item.path && onNavigate?.(item.path)}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-colors text-left ${
                isActive
                  ? 'bg-md-primary text-md-on-primary shadow-lg shadow-md-primary/20'
                  : 'text-md-on-surface-variant hover:bg-md-surface-container-high'
              }`}
            >
              <span className="material-symbols-outlined">{item.icon}</span>
              <span className="font-medium text-sm">{item.label}</span>
            </button>
          );
        })}
      </nav>

      <div className="p-4 mt-auto">
        <div className="p-4 rounded-xl bg-md-primary-container/10 border border-md-primary/10">
          <p className="text-xs font-bold text-md-primary mb-1">PRO PORTAL</p>
          <p className="text-[10px] text-md-on-surface-variant leading-relaxed">
            System status: All systems operational. Last sync 2m ago.
          </p>
        </div>
      </div>
    </aside>
  );
}

// ─── TopAppBar ───────────────────────────────────────────────────────────────
function TopAppBar({ onMenuClick }) {
  return (
    <header className="h-16 bg-md-surface-container-lowest flex items-center justify-between px-8 border-b border-md-outline-variant/10 shrink-0">
      <div className="flex items-center gap-4">
        <button type="button" onClick={onMenuClick} className="text-md-on-surface-variant cursor-pointer md:hidden">
          <span className="material-symbols-outlined">menu</span>
        </button>
        <h1 className="font-headline text-lg font-bold text-md-on-surface tracking-tight">
          Medical Prescription Portal
        </h1>
      </div>

      <div className="flex-1 max-w-xl px-12">
        <div className="relative group">
          <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-md-outline group-focus-within:text-md-primary transition-colors">
            search
          </span>
          <input
            className="w-full bg-md-surface-container-low border-none rounded-full py-2 pl-10 pr-4 text-sm text-md-on-surface placeholder:text-md-outline focus:ring-2 focus:ring-md-primary/20 transition-all"
            placeholder="Search patient, medicine or reports..."
            type="text"
          />
        </div>
      </div>

      <div className="flex items-center gap-4">
        <button type="button" className="p-2 rounded-full hover:bg-md-surface-container transition-colors relative">
          <span className="material-symbols-outlined text-md-on-surface-variant">notifications</span>
          <span className="absolute top-2 right-2 w-2 h-2 bg-md-error rounded-full border-2 border-white" />
        </button>
        <button type="button" className="p-2 rounded-full hover:bg-md-surface-container transition-colors">
          <span className="material-symbols-outlined text-md-on-surface-variant">settings</span>
        </button>
        <div className="h-8 w-[1px] bg-md-outline-variant/30 mx-2" />
        <button type="button" className="p-2 rounded-full hover:bg-md-surface-container transition-colors">
          <span className="material-symbols-outlined text-md-on-surface-variant">account_circle</span>
        </button>
      </div>
    </header>
  );
}

// ─── PatientInfoHeader ───────────────────────────────────────────────────────
function PatientInfoHeader({ patient }) {
  return (
    <div className="bg-md-surface-container-lowest p-6 rounded-xl border-l-4 border-md-primary shadow-sm flex items-center justify-between">
      <div className="flex items-center gap-6">
        <div className="h-14 w-14 rounded-full bg-md-primary/10 flex items-center justify-center">
          <span className="material-symbols-outlined text-md-primary text-3xl">person</span>
        </div>
        <div>
          <h2 className="font-headline text-2xl font-bold text-md-on-surface">
            {patient.fullName || 'New Patient'}
          </h2>
          <div className="flex items-center gap-3 mt-1">
            {patient.age && (
              <>
                <span className="text-sm font-medium text-md-on-surface-variant">{patient.age} Years</span>
                <span className="w-1 h-1 bg-md-outline-variant rounded-full" />
              </>
            )}
            {patient.gender && (
              <>
                <span className="text-sm font-medium text-md-on-surface-variant">{patient.gender}</span>
                <span className="w-1 h-1 bg-md-outline-variant rounded-full" />
              </>
            )}
            {patient.phone && (
              <span className="text-sm font-medium text-md-on-surface-variant">+91 {patient.phone}</span>
            )}
          </div>
        </div>
      </div>
      <div className="flex flex-col items-end">
        {patient.allergies ? (
          <div className="flex items-center gap-2 px-4 py-2 bg-md-error-container text-md-on-error-container rounded-lg border border-md-error/20">
            <span className="material-symbols-outlined text-lg" style={{ fontVariationSettings: "'FILL' 1" }}>
              warning
            </span>
            <span className="text-sm font-bold uppercase tracking-wide">Allergies: {patient.allergies}</span>
          </div>
        ) : (
          <div className="flex items-center gap-2 px-4 py-2 bg-md-secondary-container/40 text-md-on-surface-variant rounded-lg">
            <span className="material-symbols-outlined text-lg">verified_user</span>
            <span className="text-sm font-medium">No Known Allergies</span>
          </div>
        )}
        {patient.complaint && (
          <span className="text-[10px] text-md-on-surface-variant mt-2">
            Chief Complaint: {patient.complaint}
          </span>
        )}
      </div>
    </div>
  );
}

// ─── SmartTagBar ─────────────────────────────────────────────────────────────
function TemplateBar({ templates, selectedTemplates, onToggle, medicineSearch, onMedicineSearchChange }) {
  return (
    <div className="flex items-center justify-between gap-6">
      <div className="flex flex-wrap gap-2 items-center">
        <span className="text-xs font-bold text-md-on-surface-variant uppercase tracking-widest mr-2">
          Smart Tags:
        </span>
        {templates.map((t) => {
          const isActive = selectedTemplates.includes(t);
          return (
            <button
              key={t}
              type="button"
              onClick={() => onToggle(t)}
              className={`px-4 py-1.5 rounded-full text-sm font-medium transition-all ${
                isActive
                  ? 'bg-md-secondary-container text-md-on-secondary-container'
                  : 'bg-md-surface-container-highest text-md-on-surface-variant hover:bg-md-secondary-container hover:text-md-on-secondary-container'
              }`}
            >
              {t}
            </button>
          );
        })}
        <button
          type="button"
          className="w-8 h-8 rounded-full border border-dashed border-md-outline-variant flex items-center justify-center text-md-outline hover:text-md-primary hover:border-md-primary transition-colors"
        >
          <span className="material-symbols-outlined text-sm">add</span>
        </button>
      </div>
      <div className="relative w-64 shrink-0">
        <input
          className="w-full text-sm border-none bg-md-surface-container-low rounded-lg py-2 pl-3 pr-10 text-md-on-surface placeholder:text-md-outline focus:ring-2 focus:ring-md-primary/20"
          placeholder="Search medicines..."
          type="text"
          value={medicineSearch}
          onChange={(e) => onMedicineSearchChange(e.target.value)}
        />
        <span className="material-symbols-outlined absolute right-3 top-1/2 -translate-y-1/2 text-md-outline">
          search
        </span>
      </div>
    </div>
  );
}

// ─── MedicationRow ───────────────────────────────────────────────────────────
function MedicationRow({ med, onDelete, onUpdate }) {
  return (
    <tr>
      <td className="px-6 py-2">
        <p className="font-bold text-md-primary text-sm">{med.name}</p>
        <p className="text-[9px] text-md-on-surface-variant uppercase">{med.type || 'Oral Tablet'}</p>
      </td>
      <td className="px-6 py-2 text-center">
        <input
          type="number"
          min="1"
          value={med.qty}
          onChange={(e) => onUpdate({ ...med, qty: e.target.value })}
          className="w-14 text-center text-xs bg-transparent border-none focus:ring-1 focus:ring-md-primary/20 rounded p-1"
        />
      </td>
      <td className="px-6 py-2 text-center">
        <div className="flex items-center justify-center gap-1.5">
          {['morning', 'afternoon', 'night'].map((slot) => {
            const val = med.dosage?.[slot] ?? 0;
            const active = val > 0;
            return (
              <button
                key={slot}
                type="button"
                onClick={() =>
                  onUpdate({
                    ...med,
                    dosage: { ...med.dosage, [slot]: active ? 0 : 1 },
                  })
                }
                className={`w-7 py-0.5 rounded-md font-bold text-[10px] text-center transition-colors ${
                  active
                    ? 'bg-md-secondary-container text-md-on-secondary-container'
                    : 'bg-md-surface-container text-md-on-surface-variant'
                }`}
              >
                {val}
              </button>
            );
          })}
        </div>
      </td>
      <td className="px-6 py-2 text-center">
        <input
          type="number"
          min="1"
          value={med.days}
          onChange={(e) => onUpdate({ ...med, days: e.target.value })}
          className="w-16 text-center text-xs bg-transparent border-none focus:ring-1 focus:ring-md-primary/20 rounded p-1"
        />
        <span className="text-xs text-md-on-surface-variant ml-0.5">Days</span>
      </td>
      <td className="px-6 py-2">
        <select
          value={med.timing || 'After Food'}
          onChange={(e) => onUpdate({ ...med, timing: e.target.value })}
          className="px-2 py-0.5 rounded-full bg-md-surface-container text-md-on-surface-variant text-[10px] font-medium border-none focus:ring-1 focus:ring-md-primary/20 cursor-pointer"
        >
          <option>After Food</option>
          <option>Before Food</option>
          <option>With Food</option>
          <option>Empty Stomach</option>
        </select>
      </td>
      <td className="px-6 py-2 text-right">
        <button
          type="button"
          onClick={() => onDelete(med.id)}
          className="text-md-outline-variant hover:text-md-error transition-colors"
        >
          <span className="material-symbols-outlined text-lg">delete</span>
        </button>
      </td>
    </tr>
  );
}

// ─── MedicationTable ─────────────────────────────────────────────────────────
function MedicationTable({ medications, onDelete, onUpdate, onAdd }) {
  return (
    <div className="bg-md-surface-container-lowest rounded-xl shadow-sm border border-md-outline-variant/10 overflow-hidden">
      <table className="w-full text-left">
        <thead className="bg-md-surface-container-low">
          <tr>
            <th className="px-6 py-2.5 text-[10px] font-bold text-md-on-surface-variant uppercase tracking-wider">
              Medicine Name
            </th>
            <th className="px-6 py-2.5 text-[10px] font-bold text-md-on-surface-variant uppercase tracking-wider text-center">
              Qty
            </th>
            <th className="px-6 py-2.5 text-[10px] font-bold text-md-on-surface-variant uppercase tracking-wider text-center">
              Dosage (M-A-N)
            </th>
            <th className="px-6 py-2.5 text-[10px] font-bold text-md-on-surface-variant uppercase tracking-wider text-center">
              Days
            </th>
            <th className="px-6 py-2.5 text-[10px] font-bold text-md-on-surface-variant uppercase tracking-wider">
              Timing
            </th>
            <th className="px-6 py-2.5" />
          </tr>
        </thead>
        <tbody className="divide-y divide-md-outline-variant/10">
          {medications.length === 0 ? (
            <tr>
              <td colSpan={6} className="px-6 py-8 text-center text-sm text-md-on-surface-variant">
                No medications added yet. Use Smart Tags or search to add medicines.
              </td>
            </tr>
          ) : (
            medications.map((med) => (
              <MedicationRow key={med.id} med={med} onDelete={onDelete} onUpdate={onUpdate} />
            ))
          )}
        </tbody>
      </table>
      <div className="p-3 bg-md-surface-container-low border-t border-md-outline-variant/10">
        <button
          type="button"
          onClick={onAdd}
          className="flex items-center gap-2 text-md-primary font-bold text-sm hover:opacity-80 transition-opacity"
        >
          <span className="material-symbols-outlined">add_circle</span>
          Add New Medication
        </button>
      </div>
    </div>
  );
}

// ─── InvestigationsSection ───────────────────────────────────────────────────
function InvestigationsSection({ investigations, onToggle, onRemove }) {
  const quickOptions = ['ECG', 'CBC', 'MRI', 'X-RAY', 'Glucose', 'Thyroid', 'Lipid Panel', 'Urine R/M'];
  const [searchTerm, setSearchTerm] = useState('');

  const handleAdd = (term) => {
    if (term.trim() && !investigations.includes(term.trim())) {
      onToggle(term.trim());
    }
  };

  return (
    <div className="space-y-4">
      <h3 className="font-headline text-lg font-bold text-md-on-surface">Investigations</h3>
      <div className="bg-md-surface-container-lowest p-6 rounded-xl border border-md-outline-variant/10 space-y-6">
        <div className="flex items-center gap-4">
          <div className="relative flex-1">
            <input
              className="w-full text-sm border-none bg-md-surface-container-low rounded-lg py-3 pl-4 pr-10 text-md-on-surface placeholder:text-md-outline focus:ring-2 focus:ring-md-primary/20"
              placeholder="Search or add investigation"
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && searchTerm.trim()) {
                  handleAdd(searchTerm);
                  setSearchTerm('');
                }
              }}
            />
            <span className="material-symbols-outlined absolute right-3 top-1/2 -translate-y-1/2 text-md-outline">
              search
            </span>
          </div>
          <div className="flex flex-wrap gap-2">
            {quickOptions.map((opt) => (
              <button
                key={opt}
                type="button"
                onClick={() => onToggle(opt)}
                className={`px-4 py-2 rounded-lg text-xs font-bold transition-all ${
                  investigations.includes(opt)
                    ? 'bg-md-secondary-container text-md-on-secondary-container'
                    : 'bg-md-surface-container text-md-on-surface-variant hover:bg-md-primary/10 hover:text-md-primary'
                }`}
              >
                {opt}
              </button>
            ))}
          </div>
        </div>

        {investigations.length > 0 && (
          <div>
            <p className="text-xs font-bold text-md-on-surface-variant uppercase tracking-widest mb-3">
              Selected Investigations
            </p>
            <div className="flex flex-wrap gap-3">
              {investigations.map((inv) => (
                <span
                  key={inv}
                  className="inline-flex items-center gap-2 px-4 py-1.5 bg-md-secondary-container text-md-on-secondary-container rounded-full text-sm font-medium"
                >
                  {inv}
                  <button
                    type="button"
                    onClick={() => onRemove(inv)}
                    className="flex items-center justify-center text-md-on-secondary-container hover:bg-md-on-secondary-container/10 rounded-full"
                  >
                    <span className="material-symbols-outlined text-sm">close</span>
                  </button>
                </span>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// ─── QuickTagSection (Nutrition / Exercise) ──────────────────────────────────
function QuickTagSection({ title, icon, tags, selectedTags, onToggle, customText, onCustomTextChange, placeholder }) {
  return (
    <div className="space-y-4 bg-md-surface-container-lowest p-6 rounded-xl border border-md-outline-variant/10">
      <div className="flex items-center justify-between">
        <p className="text-xs font-bold text-md-on-surface-variant uppercase tracking-widest">{title}</p>
        <span className="material-symbols-outlined text-md-primary text-sm">{icon}</span>
      </div>
      <div className="flex flex-wrap gap-2">
        {tags.map((tag) => {
          const isActive = selectedTags.includes(tag.label);
          return (
            <button
              key={tag.label}
              type="button"
              onClick={() => onToggle(tag.label)}
              className={`px-3 py-1 rounded-md text-[11px] font-medium border transition-colors ${
                isActive
                  ? 'bg-md-secondary-container text-md-on-secondary-container font-bold border-md-primary/20'
                  : 'bg-md-surface-container-low border-md-outline-variant/20 hover:border-md-primary'
              }`}
            >
              {tag.label}
            </button>
          );
        })}
      </div>
      <textarea
        className="w-full bg-md-surface-container-low border-none rounded-lg p-3 text-sm text-md-on-surface placeholder:text-md-outline focus:ring-1 focus:ring-md-primary min-h-[80px] resize-none"
        placeholder={placeholder}
        value={customText}
        onChange={(e) => onCustomTextChange(e.target.value)}
      />
    </div>
  );
}

// ─── ClinicalInsight ─────────────────────────────────────────────────────────
function ClinicalInsight() {
  return (
    <div className="p-4 bg-md-primary/5 rounded-xl border border-md-primary/10 mt-6 max-w-2xl">
      <div className="flex items-center gap-2 mb-2">
        <span className="material-symbols-outlined text-md-primary text-sm">lightbulb</span>
        <p className="text-[10px] font-bold text-md-primary uppercase">Clinical Insight</p>
      </div>
      <p className="text-xs text-md-on-surface-variant leading-relaxed">
        Consider reviewing patient history for potential drug interactions. Smart Tags auto-apply evidence-based dosing.
      </p>
    </div>
  );
}

// ─── BottomToolbar ───────────────────────────────────────────────────────────
function BottomToolbar({ onClear, onPreview, onPrint, onSend }) {
  return (
    <footer className="h-20 bg-md-surface-container-lowest border-t border-md-outline-variant/10 px-8 flex items-center justify-between shadow-[0_-10px_40px_rgba(23,28,31,0.03)] z-10 shrink-0">
      <button
        type="button"
        onClick={onClear}
        className="flex items-center gap-2 text-md-on-surface-variant font-medium text-sm hover:text-md-error transition-colors px-4 py-2 rounded-lg"
      >
        <span className="material-symbols-outlined">delete_sweep</span>
        Clear All
      </button>
      <div className="flex items-center gap-4">
        <button
          type="button"
          onClick={onPreview}
          className="flex items-center gap-2 px-6 py-2.5 rounded-full border border-md-outline-variant/30 text-md-on-surface-variant font-bold text-sm hover:bg-md-surface-container transition-all"
        >
          <span className="material-symbols-outlined">picture_as_pdf</span>
          Preview PDF
        </button>
        <button
          type="button"
          onClick={onPrint}
          className="flex items-center gap-2 px-6 py-2.5 rounded-full border border-md-outline-variant/30 text-md-on-surface-variant font-bold text-sm hover:bg-md-surface-container transition-all"
        >
          <span className="material-symbols-outlined">print</span>
          Print
        </button>
        <button
          type="button"
          onClick={onSend}
          className="flex items-center gap-3 px-8 py-3 rounded-full bg-md-primary text-md-on-primary font-bold text-sm shadow-xl shadow-md-primary/25 hover:bg-md-primary-container transition-all transform active:scale-95"
        >
          <span className="material-symbols-outlined">send</span>
          Send Prescription
        </button>
      </div>
    </footer>
  );
}

// ─── Default data ────────────────────────────────────────────────────────────
const DEFAULT_TEMPLATES = ['Headache', 'Fever', 'Cold', 'Cough', 'Gastritis'];

const NUTRITION_TAGS = [
  { label: 'Low Sugar' },
  { label: 'High Protein' },
  { label: 'No Caffeine' },
  { label: 'Warm Water' },
  { label: 'Avoid Spicy' },
  { label: 'Soft Diet' },
  { label: 'Fiber-Rich' },
  { label: 'Low Salt' },
];

const EXERCISE_TAGS = [
  { label: 'Daily Walk' },
  { label: 'Bed Rest' },
  { label: 'Stretching' },
  { label: 'Yoga' },
  { label: 'Breathing' },
  { label: 'No Heavy Lifting' },
];

let nextMedId = 1;

// ─── Main Page Component ─────────────────────────────────────────────────────
export function NewDesignPage({ onNavigate, userSession }) {
  const doctorName = userSession?.username || 'Smith';

  // Patient state
  const [patient, setPatient] = useState({
    fullName: 'Ziya',
    age: '29',
    gender: 'Male',
    phone: '',
    allergies: 'Penicillin',
    complaint: '',
  });

  // Templates / Smart Tags
  const [selectedTemplates, setSelectedTemplates] = useState([]);

  // Medicine search
  const [medicineSearch, setMedicineSearch] = useState('');

  // Medications
  const [medications, setMedications] = useState([
    {
      id: nextMedId++,
      name: 'Paracetamol 500mg',
      type: 'Oral Tablet',
      qty: '10',
      dosage: { morning: 1, afternoon: 0, night: 1 },
      days: '5',
      timing: 'After Food',
    },
    {
      id: nextMedId++,
      name: 'Amoxicillin 250mg',
      type: 'Capsule',
      qty: '15',
      dosage: { morning: 1, afternoon: 1, night: 1 },
      days: '5',
      timing: 'Before Food',
    },
  ]);

  // Investigations
  const [investigations, setInvestigations] = useState(['CBC', 'Vitamin D']);

  // Nutrition
  const [selectedNutrition, setSelectedNutrition] = useState(['High Protein']);
  const [customNutrition, setCustomNutrition] = useState('');

  // Exercise
  const [selectedExercise, setSelectedExercise] = useState(['Daily Walk']);
  const [customExercise, setCustomExercise] = useState('');

  // ── Handlers ──
  const toggleTemplate = useCallback((name) => {
    setSelectedTemplates((prev) =>
      prev.includes(name) ? prev.filter((t) => t !== name) : [...prev, name],
    );
  }, []);

  const handleDeleteMed = useCallback((id) => {
    setMedications((prev) => prev.filter((m) => m.id !== id));
  }, []);

  const handleUpdateMed = useCallback((updated) => {
    setMedications((prev) => prev.map((m) => (m.id === updated.id ? updated : m)));
  }, []);

  const handleAddMed = useCallback(() => {
    setMedications((prev) => [
      ...prev,
      {
        id: nextMedId++,
        name: 'New Medicine',
        type: 'Tablet',
        qty: '10',
        dosage: { morning: 0, afternoon: 0, night: 0 },
        days: '5',
        timing: 'After Food',
      },
    ]);
  }, []);

  const toggleInvestigation = useCallback((name) => {
    setInvestigations((prev) =>
      prev.includes(name) ? prev.filter((i) => i !== name) : [...prev, name],
    );
  }, []);

  const removeInvestigation = useCallback((name) => {
    setInvestigations((prev) => prev.filter((i) => i !== name));
  }, []);

  const toggleNutrition = useCallback((label) => {
    setSelectedNutrition((prev) =>
      prev.includes(label) ? prev.filter((l) => l !== label) : [...prev, label],
    );
  }, []);

  const toggleExercise = useCallback((label) => {
    setSelectedExercise((prev) =>
      prev.includes(label) ? prev.filter((l) => l !== label) : [...prev, label],
    );
  }, []);

  const handleClearAll = useCallback(() => {
    setPatient({ fullName: '', age: '', gender: 'Male', phone: '', allergies: '', complaint: '' });
    setSelectedTemplates([]);
    setMedications([]);
    setInvestigations([]);
    setSelectedNutrition([]);
    setSelectedExercise([]);
    setCustomNutrition('');
    setCustomExercise('');
    setMedicineSearch('');
  }, []);

  return (
    <div className="flex h-screen w-full bg-md-surface overflow-hidden font-body text-md-on-surface">
      {/* Sidebar */}
      <Sidebar doctorName={doctorName} activeItem="prescriptions" onNavigate={onNavigate} />

      {/* Main Content Area */}
      <main className="flex-1 flex flex-col overflow-hidden">
        <TopAppBar />

        {/* Workspace Body */}
        <section className="flex-1 overflow-y-auto py-8 px-[10%] space-y-8 bg-md-surface">
          <PatientInfoHeader patient={patient} />

          <TemplateBar
            templates={DEFAULT_TEMPLATES}
            selectedTemplates={selectedTemplates}
            onToggle={toggleTemplate}
            medicineSearch={medicineSearch}
            onMedicineSearchChange={setMedicineSearch}
          />

          <MedicationTable
            medications={medications}
            onDelete={handleDeleteMed}
            onUpdate={handleUpdateMed}
            onAdd={handleAddMed}
          />

          <InvestigationsSection
            investigations={investigations}
            onToggle={toggleInvestigation}
            onRemove={removeInvestigation}
          />

          <div className="grid grid-cols-2 gap-6">
            <QuickTagSection
              title="Nutrition & Advice"
              icon="restaurant"
              tags={NUTRITION_TAGS}
              selectedTags={selectedNutrition}
              onToggle={toggleNutrition}
              customText={customNutrition}
              onCustomTextChange={setCustomNutrition}
              placeholder="Custom nutritional advice..."
            />
            <QuickTagSection
              title="Exercise & Activity"
              icon="directions_run"
              tags={EXERCISE_TAGS}
              selectedTags={selectedExercise}
              onToggle={toggleExercise}
              customText={customExercise}
              onCustomTextChange={setCustomExercise}
              placeholder="Activity restrictions or goals..."
            />
          </div>

          <ClinicalInsight />
        </section>

        {/* Bottom Toolbar */}
        <BottomToolbar
          onClear={handleClearAll}
          onPreview={() => window.print()}
          onPrint={() => window.print()}
          onSend={() => {}}
        />
      </main>
    </div>
  );
}
