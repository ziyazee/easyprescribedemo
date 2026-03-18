import { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { useMedicineSearch } from '../../../hooks/useMedicineSearch';

const INITIAL_ROWS = [
  {
    id: 1,
    medicine: '',
    dosage: '',
    morning: false,
    afternoon: false,
    night: false,
    duration: '',
    food: 'Select',
    notes: '',
  },
];

const INPUT_CLASS =
  'block w-full h-10 rounded-md border-0 px-3 py-0 text-sm leading-5 text-slate-900 bg-white ring-1 ring-inset ring-slate-300/80 placeholder:text-slate-400 focus:ring-2 focus:ring-inset focus:ring-[#1f7a5c] transition-shadow';

const FREQ_BOX_CLASS =
  'h-7 w-7 rounded-[6px] border flex items-center justify-center text-[11px] font-bold leading-none transition-colors cursor-pointer select-none';

function FrequencyBox({ checked, label, onChange }) {
  return (
    <button
      type="button"
      className={`${FREQ_BOX_CLASS} ${checked ? 'bg-[#1f7a5c] border-[#1f7a5c] text-white' : 'border-slate-300 bg-white text-slate-400 hover:border-slate-400'}`}
      onClick={onChange}
      aria-label={label}
    >
      {label}
    </button>
  );
}

function EditablePoint({ value, onSave }) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(value);
  const inputRef = useRef(null);

  useEffect(() => {
    if (editing && inputRef.current) inputRef.current.focus();
  }, [editing]);

  if (editing) {
    return (
      <input
        ref={inputRef}
        className="flex-1 text-sm text-slate-900 bg-transparent border-b border-[#22c55e] outline-none py-0.5 leading-relaxed"
        value={draft}
        onChange={(e) => setDraft(e.target.value)}
        onBlur={() => {
          if (draft.trim()) onSave(draft.trim());
          setEditing(false);
        }}
        onKeyDown={(e) => {
          if (e.key === 'Enter') {
            e.preventDefault();
            if (draft.trim()) onSave(draft.trim());
            setEditing(false);
          } else if (e.key === 'Escape') {
            setDraft(value);
            setEditing(false);
          }
        }}
      />
    );
  }

  return (
    <span
      className="flex-1 text-sm text-slate-700 leading-relaxed cursor-pointer hover:text-slate-900 transition-colors"
      onClick={() => { setDraft(value); setEditing(true); }}
    >
      {value}
    </span>
  );
}

function MedicineRow({ row, onChange, onDelete }) {
  const [focused, setFocused] = useState(false);
  const inputRef = useRef(null);
  const { results, loading } = useMedicineSearch(focused ? row.medicine : '');
  const showDropdown = focused && row.medicine.trim().length >= 2 && (results.length > 0 || loading);
  const [pos, setPos] = useState({ top: 0, left: 0, width: 0 });

  useEffect(() => {
    if (showDropdown && inputRef.current) {
      const rect = inputRef.current.getBoundingClientRect();
      setPos({ top: rect.bottom + window.scrollY + 4, left: rect.left + window.scrollX, width: rect.width });
    }
  }, [showDropdown, row.medicine]);

  const dropdown = showDropdown
    ? createPortal(
        <div
          className="rounded-lg border border-slate-200 bg-white shadow-lg max-h-48 overflow-y-auto p-1 space-y-0.5"
          style={{ position: 'absolute', top: pos.top, left: pos.left, width: pos.width, zIndex: 9999 }}
        >
          {loading && !results.length ? (
            <div className="px-2 py-1.5 text-xs text-slate-400">Searching...</div>
          ) : results.map((name) => (
            <button
              key={name}
              type="button"
              className="w-full text-left px-2 py-1.5 rounded hover:bg-slate-100 text-sm"
              onMouseDown={(e) => {
                e.preventDefault();
                onChange(row.id, 'medicine', name);
                setFocused(false);
                inputRef.current?.blur();
              }}
            >
              + {name}
            </button>
          ))}
          {!loading && !results.length ? (
            <button
              type="button"
              className="w-full text-left px-2 py-1.5 rounded hover:bg-slate-100 text-sm text-[#1f7a5c]"
              onMouseDown={(e) => {
                e.preventDefault();
                setFocused(false);
              }}
            >
              + Add "{row.medicine.trim()}"
            </button>
          ) : null}
        </div>,
        document.body,
      )
    : null;

  return (
    <tr className="group hover:bg-[#1f7a5c]/[0.03] transition-colors">
      <td className="whitespace-nowrap py-2 pl-4 pr-2 text-sm font-medium text-slate-900">
        <div className="relative">
          {(!row.medicine || focused) && <span className="material-symbols-outlined absolute left-2.5 top-[9px] text-slate-400 text-[16px]">search</span>}
          <input
            ref={inputRef}
            className={`${INPUT_CLASS} min-w-[180px] ${!row.medicine || focused ? 'pl-8' : 'pl-3'}`}
            placeholder="Search medicine..."
            type="text"
            value={row.medicine}
            onChange={(e) => onChange(row.id, 'medicine', e.target.value)}
            onFocus={() => setFocused(true)}
            onBlur={() => setTimeout(() => setFocused(false), 200)}
          />
          {dropdown}
        </div>
      </td>
      <td className="whitespace-nowrap px-2 py-2 text-sm text-slate-500">
        <input
          className={`${INPUT_CLASS} min-w-[100px]`}
          type="text"
          placeholder="e.g. 100mg"
          value={row.dosage}
          onChange={(e) => onChange(row.id, 'dosage', e.target.value)}
        />
      </td>
      <td className="whitespace-nowrap px-2 py-2 text-sm text-slate-500">
        <div className="flex items-center justify-center gap-2">
          <FrequencyBox checked={row.morning} label="M" onChange={() => onChange(row.id, 'morning', !row.morning)} />
          <FrequencyBox checked={row.afternoon} label="A" onChange={() => onChange(row.id, 'afternoon', !row.afternoon)} />
          <FrequencyBox checked={row.night} label="N" onChange={() => onChange(row.id, 'night', !row.night)} />
        </div>
      </td>
      <td className="whitespace-nowrap px-2 py-2 text-sm text-slate-500">
        <div className="flex items-center rounded-md bg-white ring-1 ring-inset ring-slate-300/80 transition-shadow focus-within:ring-2 focus-within:ring-[#1f7a5c]">
          <input
            className="block min-w-[40px] w-full border-0 bg-transparent py-0 h-10 pl-2.5 pr-1 text-sm leading-5 text-slate-900 focus:ring-0"
            placeholder="0"
            type="text"
            inputMode="numeric"
            value={row.duration}
            onChange={(e) => onChange(row.id, 'duration', e.target.value)}
          />
          <span className="pr-2.5 text-[11px] font-medium text-slate-400 uppercase">days</span>
        </div>
      </td>
      <td className="whitespace-nowrap px-2 py-2 text-sm text-slate-500">
        <select
          className={`${INPUT_CLASS} min-w-[110px]`}
          value={row.food}
          onChange={(e) => onChange(row.id, 'food', e.target.value)}
        >
          <option>Select</option>
          <option>After Food</option>
          <option>Before Food</option>
          <option>With Food</option>
        </select>
      </td>
      <td className="whitespace-nowrap px-2 py-2 text-sm text-slate-500">
        <input
          className={`${INPUT_CLASS} min-w-[140px]`}
          placeholder="Add note"
          type="text"
          value={row.notes}
          onChange={(e) => onChange(row.id, 'notes', e.target.value)}
        />
      </td>
      <td className="whitespace-nowrap py-2 pl-2 pr-4 text-right text-sm font-medium">
        <button className="text-slate-300 hover:text-red-500 transition-colors p-1 rounded hover:bg-red-50" type="button" onClick={() => onDelete(row.id)}>
          <span className="material-symbols-outlined text-[18px]">delete</span>
        </button>
      </td>
    </tr>
  );
}

function toMedicationLine(row) {
  const namePart = row.medicine.trim();
  if (!namePart) {
    return '';
  }

  const detailParts = [];
  if (row.dosage.trim()) {
    detailParts.push(row.dosage.trim());
  }
  if (row.food !== 'Select') {
    detailParts.push(row.food);
  }
  if (row.duration.trim()) {
    detailParts.push(`${row.duration.trim()} days`);
  }
  if (row.notes.trim()) {
    detailParts.push(row.notes.trim());
  }

  return detailParts.length ? `${namePart} (${detailParts.join(', ')})` : namePart;
}

function parseMedicationRows(medications) {
  if (!medications?.length) return INITIAL_ROWS;
  return medications.map((med, i) => {
    const match = med.match(/^(.+?)\s*(?:\((.*)\))?$/);
    const medicine = match ? match[1].trim() : med;
    const details = match?.[2] || '';
    let dosage = '', food = 'Select', duration = '', notes = '';
    if (details) {
      const parts = details.split(',').map((p) => p.trim());
      parts.forEach((p) => {
        if (/^(After|Before|With) Food$/i.test(p)) food = p;
        else if (/^\d+\s*days?$/i.test(p)) duration = p.replace(/\s*days?$/i, '');
        else if (!dosage) dosage = p;
        else notes = notes ? `${notes}, ${p}` : p;
      });
    }
    return { id: i + 1, medicine, dosage, morning: false, afternoon: false, night: false, duration, food, notes };
  });
}

export function SmartTagEditor({ onCancel, onSave, initialTag }) {
  const isEdit = !!initialTag;
  const [rows, setRows] = useState(() => initialTag ? parseMedicationRows(initialTag.medications) : INITIAL_ROWS);
  const [tagName, setTagName] = useState(initialTag?.tagName || '');
  const [description, setDescription] = useState(initialTag?.description || '');
  const [nutritionPoints, setNutritionPoints] = useState(() =>
    initialTag?.nutritionAdvice ? initialTag.nutritionAdvice.split(';').map((s) => s.trim()).filter(Boolean) : []
  );
  const [lifestylePoints, setLifestylePoints] = useState(() =>
    initialTag?.lifestyleAdvice ? initialTag.lifestyleAdvice.split(';').map((s) => s.trim()).filter(Boolean) : []
  );
  const [nutritionInput, setNutritionInput] = useState('');
  const [lifestyleInput, setLifestyleInput] = useState('');

  const updateRow = (rowId, key, value) => {
    setRows((prev) => prev.map((row) => (row.id === rowId ? { ...row, [key]: value } : row)));
  };

  const deleteRow = (rowId) => {
    setRows((prev) => prev.filter((row) => row.id !== rowId));
  };

  const addRow = () => {
    setRows((prev) => [
      ...prev,
      {
        id: Date.now(),
        medicine: '',
        dosage: '',
        morning: false,
        afternoon: false,
        night: false,
        duration: '',
        food: 'Select',
        notes: '',
      },
    ]);
  };

  const handleSave = () => {
    const cleanTagName = tagName.trim().replace(/^#/, '');
    if (!cleanTagName) {
      return;
    }

    const medications = rows.map(toMedicationLine).filter(Boolean);

    onSave?.({
      tagName: cleanTagName,
      description: description.trim(),
      specialty: '',
      medications,
      nutritionAdvice: nutritionPoints.join('; '),
      lifestyleAdvice: lifestylePoints.join('; '),
    });
  };

  return (
    <section className="space-y-6">
      <header className="px-2 py-1 flex flex-wrap items-center justify-between gap-4">
        <div className="flex flex-col gap-1">
          <div className="flex items-center gap-2 text-sm text-slate-500">
            <span className="hover:text-[#1f7a5c] transition-colors">Settings</span>
            <span className="material-symbols-outlined text-sm">chevron_right</span>
            <span className="hover:text-[#1f7a5c] transition-colors">Smart Tags</span>
            <span className="material-symbols-outlined text-sm">chevron_right</span>
            <span className="text-slate-900 font-medium">{isEdit ? 'Edit Tag' : 'New Tag'}</span>
          </div>
          <h2 className="text-2xl font-bold tracking-tight text-slate-900">{isEdit ? 'Edit Smart Tag' : 'Create New Smart Tag'}</h2>
        </div>
        <div className="flex items-center gap-3">
          <button
            className="text-slate-500 hover:text-slate-700 text-sm font-medium px-4 py-2 bg-slate-100 rounded-lg transition-colors"
            type="button"
            onClick={onCancel}
          >
            Cancel
          </button>
          <button className="flex items-center justify-center rounded-lg bg-[#1f7a5c] hover:bg-[#165942] text-white text-sm font-bold h-10 px-6 shadow-sm transition-all" type="button" onClick={handleSave}>
            <span className="material-symbols-outlined text-[20px] mr-2">save</span>
            {isEdit ? 'Update Smart Tag' : 'Save Smart Tag'}
          </button>
        </div>
      </header>

      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="h-1 bg-gradient-to-r from-[#1f7a5c] to-[#0ea4a4]" />
        <div className="p-6">
        <h3 className="text-lg font-bold text-slate-900 mb-4 flex items-center gap-2">
          <span className="material-symbols-outlined text-[#1f7a5c]">label</span>
          Tag Details
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="col-span-1">
            <label className="block text-sm font-medium text-slate-700 mb-1" htmlFor="tag-name">Tag Name</label>
            <div className="relative rounded-md shadow-sm">
              <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                <span className="text-slate-500 sm:text-sm font-bold">#</span>
              </div>
              <input className={`${INPUT_CLASS} pl-7`} id="tag-name" placeholder="e.g. DiabetesControl" type="text" value={tagName} onChange={(e) => setTagName(e.target.value)} />
            </div>
            <p className="mt-1 text-xs text-slate-500">This will be the shortcut keyword.</p>
          </div>
          <div className="col-span-1 md:col-span-2">
            <label className="block text-sm font-medium text-slate-700 mb-1" htmlFor="tag-desc">Description (Optional)</label>
            <input className={INPUT_CLASS} id="tag-desc" placeholder="Brief description for reference (e.g. Standard protocol for Type 2)" type="text" value={description} onChange={(e) => setDescription(e.target.value)} />
          </div>
        </div>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6">
        <div className="bg-white rounded-xl shadow-[0_1px_3px_rgba(0,0,0,0.06),0_8px_24px_rgba(31,122,92,0.06)] border border-[#1f7a5c]/15">
          <div className="border-l-[3px] border-l-[#1f7a5c]">
            <div className="px-6 py-4 bg-[#1f7a5c]/[0.03] border-b border-[#1f7a5c]/10 flex items-center gap-3">
              <div className="h-9 w-9 rounded-lg bg-[#1f7a5c]/10 flex items-center justify-center">
                <span className="material-symbols-outlined text-[#1f7a5c] text-[20px]">medication</span>
              </div>
              <div>
                <h3 className="text-base font-bold text-slate-900">Prescription Template</h3>
                <p className="text-[11px] text-slate-500 font-medium">{rows.length} medicine{rows.length !== 1 ? 's' : ''} configured</p>
              </div>
            </div>

            <div className="overflow-visible">
              <table className="min-w-full">
                <thead>
                  <tr className="bg-slate-50/80 border-b border-slate-200">
                    <th className="py-2.5 pl-4 pr-3 text-left text-[10px] font-bold text-slate-500 uppercase tracking-wider w-[25%]" scope="col">Medicine Name</th>
                    <th className="px-3 py-2.5 text-left text-[10px] font-bold text-slate-500 uppercase tracking-wider w-[12%]" scope="col">Dosage</th>
                    <th className="px-3 py-2.5 text-center text-[10px] font-bold text-slate-500 uppercase tracking-wider w-[18%]" scope="col">Freq (M-A-N)</th>
                    <th className="px-3 py-2.5 text-left text-[10px] font-bold text-slate-500 uppercase tracking-wider w-[12%]" scope="col">Duration</th>
                    <th className="px-3 py-2.5 text-left text-[10px] font-bold text-slate-500 uppercase tracking-wider w-[15%]" scope="col">Food</th>
                    <th className="px-3 py-2.5 text-left text-[10px] font-bold text-slate-500 uppercase tracking-wider" scope="col">Notes</th>
                    <th className="relative py-2.5 pl-3 pr-4 sm:pr-0 w-10" scope="col" />
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {rows.map((row) => (
                    <MedicineRow key={row.id} row={row} onChange={updateRow} onDelete={deleteRow} />
                  ))}
                </tbody>
              </table>
            </div>

            <div className="px-6 py-3 border-t border-slate-200 bg-slate-50/50">
              <button className="inline-flex items-center rounded-md bg-white px-3 py-2 text-xs font-bold text-[#1f7a5c] shadow-sm ring-1 ring-inset ring-[#1f7a5c]/20 hover:bg-[#1f7a5c]/[0.04] hover:ring-[#1f7a5c]/30 transition-all" type="button" onClick={addRow}>
                <span className="material-symbols-outlined text-[16px] mr-1.5">add</span>
                Add Medicine Row
              </button>
            </div>
          </div>
        </div>

      </div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6 mt-6">
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 flex flex-col">
          <div className="p-6 flex flex-col flex-1">
            <h3 className="font-extrabold text-slate-900 text-lg flex items-center gap-2.5 mb-5">
              <span className="text-[#22c55e] text-xl">🍴</span>
              Nutrition Advice
            </h3>
            <div className="flex gap-2.5 mb-5 items-center">
              <textarea
                className="block w-full min-h-[44px] max-h-[120px] rounded-xl border border-slate-200 bg-slate-50 px-4 py-2.5 text-sm text-slate-900 placeholder:text-slate-400 focus:border-[#22c55e] focus:ring-2 focus:ring-[#22c55e]/20 focus:outline-none transition-shadow resize-none"
                placeholder="Add new nutrition advice..."
                rows={2}
                value={nutritionInput}
                onChange={(e) => setNutritionInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey && nutritionInput.trim()) {
                    e.preventDefault();
                    setNutritionPoints((prev) => [...prev, nutritionInput.trim()]);
                    setNutritionInput('');
                  }
                }}
              />
              <button
                type="button"
                className="h-11 w-11 flex-shrink-0 rounded-full bg-[#22c55e] hover:bg-[#16a34a] text-white flex items-center justify-center transition-colors shadow-sm"
                onClick={() => {
                  if (nutritionInput.trim()) {
                    setNutritionPoints((prev) => [...prev, nutritionInput.trim()]);
                    setNutritionInput('');
                  }
                }}
              >
                <span className="material-symbols-outlined text-xl">add</span>
              </button>
            </div>
            <ul className="space-y-3 flex-1">
              {!nutritionPoints.length ? (
                <li className="text-sm text-slate-400 italic">No advice points added yet.</li>
              ) : nutritionPoints.map((point, i) => (
                <li key={i} className="flex items-center gap-3 group">
                  <span className="material-symbols-outlined text-[#22c55e] text-[20px] flex-shrink-0">check_circle</span>
                  <EditablePoint value={point} onSave={(val) => setNutritionPoints((prev) => prev.map((p, idx) => idx === i ? val : p))} />
                  <button
                    type="button"
                    className="text-slate-300 hover:text-red-500 transition-colors p-0.5 rounded opacity-0 group-hover:opacity-100"
                    onClick={() => setNutritionPoints((prev) => prev.filter((_, idx) => idx !== i))}
                  >
                    <span className="material-symbols-outlined text-[16px]">close</span>
                  </button>
                </li>
              ))}
            </ul>
          </div>
        </div>

        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 flex flex-col">
          <div className="p-6 flex flex-col flex-1">
            <h3 className="font-extrabold text-slate-900 text-lg flex items-center gap-2.5 mb-5">
              <span className="text-[#22c55e] text-xl">🏃</span>
              Exercise &amp; Lifestyle
            </h3>
            <div className="flex gap-2.5 mb-5 items-center">
              <textarea
                className="block w-full min-h-[44px] max-h-[120px] rounded-xl border border-slate-200 bg-slate-50 px-4 py-2.5 text-sm text-slate-900 placeholder:text-slate-400 focus:border-[#22c55e] focus:ring-2 focus:ring-[#22c55e]/20 focus:outline-none transition-shadow resize-none"
                placeholder="Add new exercise or lifestyle advice..."
                rows={2}
                value={lifestyleInput}
                onChange={(e) => setLifestyleInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey && lifestyleInput.trim()) {
                    e.preventDefault();
                    setLifestylePoints((prev) => [...prev, lifestyleInput.trim()]);
                    setLifestyleInput('');
                  }
                }}
              />
              <button
                type="button"
                className="h-11 w-11 flex-shrink-0 rounded-full bg-[#22c55e] hover:bg-[#16a34a] text-white flex items-center justify-center transition-colors shadow-sm"
                onClick={() => {
                  if (lifestyleInput.trim()) {
                    setLifestylePoints((prev) => [...prev, lifestyleInput.trim()]);
                    setLifestyleInput('');
                  }
                }}
              >
                <span className="material-symbols-outlined text-xl">add</span>
              </button>
            </div>
            <ul className="space-y-3 flex-1">
              {!lifestylePoints.length ? (
                <li className="text-sm text-slate-400 italic">No advice points added yet.</li>
              ) : lifestylePoints.map((point, i) => (
                <li key={i} className="flex items-center gap-3 group">
                  <span className="material-symbols-outlined text-[#22c55e] text-[20px] flex-shrink-0">check_circle</span>
                  <EditablePoint value={point} onSave={(val) => setLifestylePoints((prev) => prev.map((p, idx) => idx === i ? val : p))} />
                  <button
                    type="button"
                    className="text-slate-300 hover:text-red-500 transition-colors p-0.5 rounded opacity-0 group-hover:opacity-100"
                    onClick={() => setLifestylePoints((prev) => prev.filter((_, idx) => idx !== i))}
                  >
                    <span className="material-symbols-outlined text-[16px]">close</span>
                  </button>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    </section>
  );
}
