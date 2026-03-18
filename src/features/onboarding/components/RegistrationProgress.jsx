export function RegistrationProgress({ step = 1 }) {
  const percent = step === 1 ? 'w-1/4' : step === 2 ? 'w-1/2' : 'w-full';
  const subtitle = step === 1
    ? 'Please fill in your personal details and clinic information to proceed.'
    : step === 2
      ? 'Choose your primary areas of medical expertise.'
      : 'Configure smart tags to speed up recurring prescription workflows.';
  const stepLabel = step === 4 ? 'Step 4 of 4' : `Step ${step} of 4`;

  return (
    <div className="mb-10">
      <div className="flex justify-between items-end mb-2">
        <h1 className="text-3xl font-bold text-[#121715] tracking-tight">Doctor Registration</h1>
        <span className="text-[#1f7a5c] font-medium text-sm">{stepLabel}</span>
      </div>
      <p className="text-[#67837a] mb-4">{subtitle}</p>
      <div className="h-2 w-full bg-[#dde4e2] rounded-full overflow-hidden">
        <div className={`h-full bg-[#1f7a5c] ${percent} rounded-full`} />
      </div>
    </div>
  );
}
