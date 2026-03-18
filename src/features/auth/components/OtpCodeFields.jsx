export function OtpCodeFields({
  sent,
  otp,
  onContainerClick,
  onOtpChange,
  onOtpKeyDown,
  setOtpInputRef,
  onResend,
  onVerify,
  onRegister,
}) {
  return (
    <div
      className={`overflow-hidden transition-all duration-500 ease-out ${
        sent ? 'max-h-[24rem] opacity-100 mt-6' : 'max-h-0 opacity-0 mt-0 pointer-events-none'
      }`}
    >
      <div className="translate-y-0 transition-transform duration-500 ease-out">
        <div className="space-y-8">
          <div className="flex justify-center gap-4" onClick={onContainerClick}>
            {otp.map((digit, idx) => (
              <input
                key={idx}
                ref={(element) => setOtpInputRef(idx, element)}
                className="w-14 h-16 text-center text-3xl font-light rounded-lg border border-slate-200 bg-white text-slate-900 focus:ring-0 focus:outline-none focus-visible:outline-none focus:border-slate-300 transition-all p-0 placeholder:text-slate-300"
                maxLength={1}
                type="text"
                value={digit}
                placeholder="."
                onChange={(event) => onOtpChange(idx, event.target.value)}
                onKeyDown={(event) => onOtpKeyDown(idx, event)}
              />
            ))}
          </div>

          <button
            className="w-full py-4 px-4 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-semibold text-base shadow-lg shadow-slate-900/10 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-slate-900 transition-all transform active:scale-[0.99]"
            type="button"
            onClick={() => onVerify?.()}
          >
            Verify &amp; Login
          </button>

          <div className="text-center pt-2">
            <span className="text-sm text-slate-400">Didn&apos;t receive code?</span>
            <button
              className="text-primary hover:text-primary-dark font-medium text-sm ml-1 transition-colors"
              type="button"
              onClick={onResend}
            >
              Resend
            </button>
            <span className="mx-2 text-slate-300">|</span>
            <button
              className="text-primary hover:text-primary-dark font-medium text-sm transition-colors"
              type="button"
              onClick={onRegister}
            >
              Register
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
