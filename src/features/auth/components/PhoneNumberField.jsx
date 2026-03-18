export function PhoneNumberField({ phone, onPhoneChange, onFocusInput, phoneInputRef }) {
  return (
    <div className="space-y-2 group">
      <label className="block text-xs uppercase tracking-wider font-semibold text-slate-500 mb-1" htmlFor="phone">
        Mobile Number
      </label>
      <div
        className="relative flex items-center rounded-xl border border-slate-200 px-3 transition-all focus-within:border-slate-300 focus-within:ring-0"
        onClick={onFocusInput}
      >
        <span className="absolute left-3 text-slate-500 font-medium pointer-events-none">+91</span>
        <input
          ref={phoneInputRef}
          className="block w-full py-3 pl-12 pr-0 bg-transparent border-0 text-slate-800 placeholder-slate-300 focus:ring-0 focus:outline-none focus-visible:outline-none transition-all text-lg font-medium"
          id="phone"
          name="phone"
          placeholder="9876543210"
          type="text"
          value={phone}
          onChange={(event) => onPhoneChange(event.target.value)}
          inputMode="numeric"
          maxLength={10}
        />
        <div className="absolute inset-y-0 right-2 flex items-center pointer-events-none">
          <span className="material-symbols-outlined text-slate-300 group-focus-within:text-primary transition-colors">
            smartphone
          </span>
        </div>
      </div>
    </div>
  );
}
