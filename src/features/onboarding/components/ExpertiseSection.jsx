import { useMemo, useState } from 'react';

const SPECIALTIES = [
  { id: 'general-practice', name: 'General Practice', icon: 'stethoscope', description: 'Primary care & family medicine' },
  { id: 'dentist', name: 'Dentist', icon: 'dentistry', description: 'Dental care, oral health & treatment' },
  { id: 'cardiology', name: 'Cardiology', icon: 'cardiology', description: 'Heart & vascular systems' },
  { id: 'dermatology', name: 'Dermatology', icon: 'dermatology', description: 'Skin, hair & nails' },
  { id: 'pediatrics', name: 'Pediatrics', icon: 'child_care', description: 'Infants, children & adolescents' },
  { id: 'orthopedics', name: 'Orthopedics', icon: 'orthopedics', description: 'Musculoskeletal system' },
  { id: 'neurology', name: 'Neurology', icon: 'neurology', description: 'Nervous system disorders' },
  { id: 'psychiatry', name: 'Psychiatry', icon: 'psychology', description: 'Mental health disorders' },
  { id: 'oncology', name: 'Oncology', icon: 'monitor_heart', description: 'Cancer diagnosis & treatment' },
  { id: 'endocrinology', name: 'Endocrinology', icon: 'vaccines', description: 'Hormone related conditions' },
  { id: 'gastroenterology', name: 'Gastroenterology', icon: 'gastroenterology', description: 'Digestive system disorders' },
  { id: 'urology', name: 'Urology', icon: 'water_drop', description: 'Urinary tract system' },
];

export function ExpertiseSection({ onBack, onNext, selected = [], onSelectionChange }) {
  const [query, setQuery] = useState('');
  const selectedSet = useMemo(() => new Set(selected), [selected]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return SPECIALTIES;
    return SPECIALTIES.filter((s) => s.name.toLowerCase().includes(q) || s.description.toLowerCase().includes(q));
  }, [query]);

  const toggle = (id) => {
    const next = new Set(selectedSet);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    onSelectionChange?.([...next]);
  };

  return (
    <section>
      <div className="mb-10">
        <h2 className="text-3xl lg:text-4xl font-extrabold text-[#121715] tracking-tight mb-3">Select Your Medical Expertise</h2>
        <p className="text-lg text-[#67837a] max-w-2xl">
          Choose your primary areas of practice. This helps us customize your prescription templates and dashboard shortcuts.
        </p>
      </div>

      <div className="mb-8 relative group">
        <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
          <span className="material-symbols-outlined text-[#67837a]">search</span>
        </div>
        <input
          className="w-full pl-12 pr-4 py-4 bg-white border border-[#dde4e2] rounded-xl text-[#121715] placeholder-[#67837a]/70 focus:ring-0"
          placeholder="Search specialties (e.g., Cardiology, Pediatrics...)"
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
        />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 mb-12">
        {filtered.map((item) => {
          const isSelected = selectedSet.has(item.id);
          return (
            <button
              key={item.id}
              className={`relative group flex flex-col items-start p-5 rounded-xl transition-all cursor-pointer ${
                isSelected ? 'border-2 border-[#1f7a5c] bg-[#1f7a5c]/5 shadow-sm' : 'border border-[#dde4e2] bg-white hover:border-[#1f7a5c]/50 hover:shadow-md'
              }`}
              onClick={() => toggle(item.id)}
              type="button"
            >
              <div className={`absolute top-4 right-4 text-[#1f7a5c] transition-all ${isSelected ? 'opacity-100 scale-100' : 'opacity-0 scale-90 group-hover:opacity-50 group-hover:scale-100'}`}>
                <span className="material-symbols-outlined">{isSelected ? 'check_circle' : 'radio_button_unchecked'}</span>
              </div>
              <div className={`w-12 h-12 rounded-lg flex items-center justify-center mb-4 transition-colors ${isSelected ? 'bg-white text-[#1f7a5c]' : 'bg-slate-50 text-slate-600 group-hover:bg-[#1f7a5c]/10 group-hover:text-[#1f7a5c]'}`}>
                <span className="material-symbols-outlined text-2xl">{item.icon}</span>
              </div>
              <h3 className="text-base font-bold text-[#121715] mb-1">{item.name}</h3>
              <p className="text-xs text-[#67837a] text-left">{item.description}</p>
            </button>
          );
        })}
      </div>

      <div className="flex items-center justify-between border-t border-[#dde4e2] pt-8 pb-12 sticky bottom-0 bg-[#f6f8f7]/95 backdrop-blur-sm z-10">
        <button className="text-[#67837a] font-medium px-6 py-3 rounded-lg hover:bg-slate-100 transition-colors" type="button" onClick={onBack}>
          Back
        </button>
        <button
          className="bg-[#1f7a5c] hover:bg-[#165942] text-white px-8 py-3 rounded-lg font-semibold shadow-lg transition-all flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
          type="button"
          onClick={onNext}
          disabled={!selected.length}
        >
          Next Step
          <span className="material-symbols-outlined text-sm">arrow_forward</span>
        </button>
      </div>
    </section>
  );
}
