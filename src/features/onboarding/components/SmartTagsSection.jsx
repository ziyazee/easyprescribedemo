import { useState } from 'react';
import { SmartTagEditor } from './SmartTagEditor';

function SmartTagCard({ item, onEdit, onDelete }) {
  return (
    <div className="relative group flex flex-col bg-white rounded-xl shadow-sm border border-slate-200 hover:shadow-md hover:border-[#1f7a5c]/50 transition-all p-5">
      <div className="flex justify-between items-start mb-4">
        <div className="flex items-center gap-2">
          <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#1f7a5c]/10 text-[#1f7a5c]">
            <span className="material-symbols-outlined text-[18px]">label</span>
          </span>
          <div>
            <h3 className="font-bold text-slate-900 leading-none">#{item.tagName}</h3>
            <span className="text-xs text-slate-400 font-medium">{item.specialty || 'General'}</span>
          </div>
        </div>
        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
          <button
            type="button"
            className="p-1.5 rounded-lg text-slate-400 hover:text-[#1f7a5c] hover:bg-[#1f7a5c]/10 transition-colors"
            title="Edit tag"
            onClick={() => onEdit?.(item)}
          >
            <span className="material-symbols-outlined text-[18px]">edit</span>
          </button>
          <button
            type="button"
            className="p-1.5 rounded-lg text-slate-400 hover:text-red-600 hover:bg-red-50 transition-colors"
            title="Delete tag"
            onClick={() => onDelete?.(item.tagName)}
          >
            <span className="material-symbols-outlined text-[18px]">delete</span>
          </button>
        </div>
      </div>

      <div className="flex-1 flex flex-col gap-3">
        <div className="p-3 rounded-lg bg-slate-50 border border-slate-100">
          <div className="flex items-center gap-2 mb-1.5">
            <span className="material-symbols-outlined text-[16px] text-slate-400">pill</span>
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Medications</span>
          </div>
          <ul className="text-sm text-slate-600 space-y-1 ml-6 list-disc marker:text-slate-300">
            {item.medications?.length ? item.medications.map((med) => <li key={med}>{med}</li>) : <li>No medicines added</li>}
          </ul>
        </div>
        {item.description ? (
          <div className="flex items-center gap-2 text-xs text-slate-500 mt-1">
            <span className="material-symbols-outlined text-[16px]">info</span>
            <span>{item.description}</span>
          </div>
        ) : null}
      </div>
    </div>
  );
}

export function SmartTagsSection({ onBack, onProceed, smartTags = [], onSmartTagsChange, hideNavigation = false }) {
  const [isCreating, setIsCreating] = useState(false);
  const [editingTag, setEditingTag] = useState(null);

  const handleDelete = (tagName) => {
    const updated = smartTags.filter((t) => t.tagName !== tagName);
    onSmartTagsChange?.(updated);
  };

  if (isCreating || editingTag) {
    return (
      <SmartTagEditor
        initialTag={editingTag || undefined}
        onCancel={() => { setIsCreating(false); setEditingTag(null); }}
        onSave={(savedTag) => {
          if (editingTag) {
            const updated = smartTags.map((t) => t.tagName === editingTag.tagName ? savedTag : t);
            onSmartTagsChange?.(updated);
          } else {
            onSmartTagsChange?.([...smartTags, savedTag]);
          }
          setIsCreating(false);
          setEditingTag(null);
        }}
      />
    );
  }

  return (
    <section className="space-y-8 pb-10">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="max-w-2xl">
          <h2 className="text-3xl font-black tracking-tight text-slate-900">Smart Tags Management</h2>
          <p className="text-slate-500 text-base mt-1">
            Speed up your workflow by creating templates for common diagnoses.
          </p>
        </div>
        {!hideNavigation ? (
          <div className="flex items-center gap-3">
            <button className="hidden sm:flex text-slate-500 hover:text-slate-700 text-sm font-medium px-4 py-2" type="button" onClick={() => onProceed?.()}>
              Skip for now
            </button>
            <button className="flex items-center justify-center rounded-lg bg-[#1f7a5c] hover:bg-[#165942] text-white text-sm font-bold h-10 px-6 shadow-sm transition-all" type="button" onClick={() => onProceed?.()}>
              Proceed to Dashboard
              <span className="material-symbols-outlined text-lg ml-2">arrow_forward</span>
            </button>
          </div>
        ) : null}
      </div>

      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div className="relative w-full max-w-md">
          <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none text-slate-400">
            <span className="material-symbols-outlined">search</span>
          </div>
          <input
            className="block w-full rounded-lg border-0 py-2.5 pl-10 pr-4 text-slate-900 ring-1 ring-inset ring-slate-200 placeholder:text-slate-400 focus:ring-2 focus:ring-inset focus:ring-[#1f7a5c] sm:text-sm sm:leading-6 bg-white"
            placeholder="Search tags (e.g. fever, pain)..."
            type="text"
          />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
        <button
          className="group relative flex flex-col items-center justify-center min-h-[200px] rounded-xl border-2 border-dashed border-slate-300 hover:border-[#1f7a5c] bg-slate-50 hover:bg-[#1f7a5c]/5 transition-all duration-200 cursor-pointer text-center p-6"
          type="button"
          onClick={() => setIsCreating(true)}
        >
          <div className="h-12 w-12 rounded-full bg-[#1f7a5c]/10 flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
            <span className="material-symbols-outlined text-[#1f7a5c] text-2xl">add</span>
          </div>
          <h3 className="text-base font-bold text-slate-900 mb-1">Create New Smart Tag</h3>
          <p className="text-sm text-slate-500">Build a custom prescription template</p>
        </button>

        {smartTags.map((item) => (
          <SmartTagCard key={item.tagName} item={item} onEdit={setEditingTag} onDelete={handleDelete} />
        ))}
      </div>

      {!smartTags.length ? (
        <div className="rounded-lg border border-dashed border-slate-300 bg-white p-6 text-center text-sm text-slate-500">
          No smart tags yet. You can continue now and add tags later.
        </div>
      ) : null}

      {!hideNavigation ? (
        <div className="flex items-center justify-between border-t border-[#dde4e2] pt-8">
          <button className="text-[#67837a] font-medium px-6 py-3 rounded-lg hover:bg-slate-100 transition-colors" type="button" onClick={onBack}>
            Back
          </button>
        </div>
      ) : null}
    </section>
  );
}
