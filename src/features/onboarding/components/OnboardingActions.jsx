export function OnboardingActions({ onNext, isSubmitting = false }) {
  return (
    <div className="pt-6 border-t border-[#dde4e2] flex items-center justify-end gap-4">
      <button
        className="px-6 py-3 rounded-lg text-[#121715] font-medium hover:bg-[#f0f3f2] transition-colors"
        type="button"
      >
        Save as Draft
      </button>
      <button
        className="bg-[#1f7a5c] hover:bg-[#165942] text-white px-8 py-3 rounded-lg font-semibold shadow-sm transition-colors flex items-center gap-2"
        type="button"
        onClick={onNext}
        disabled={isSubmitting}
      >
        {isSubmitting ? 'Saving...' : 'Next Step'}
        <span className="material-symbols-outlined text-xl">arrow_forward</span>
      </button>
    </div>
  );
}
