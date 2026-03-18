export function LoginBrand() {
  return (
    <div className="mb-10 flex items-center justify-start gap-4">
      <div className="w-14 h-14 rounded-full overflow-hidden border-2 border-slate-200 shadow-sm flex-shrink-0">
        <img src="/img.png" alt="EasyPrescribe Logo" className="h-full w-full object-cover" />
      </div>
      <div className="flex flex-col min-w-0">
        <h1 className="text-2xl font-bold text-slate-800 leading-tight">Easy Prescribe</h1>
        <span className="text-xs text-slate-500 leading-tight">simplifying clinical workflows</span>
      </div>
    </div>
  );
}
