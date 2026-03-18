import { OtpCodeFields } from './OtpCodeFields';
import { PhoneNumberField } from './PhoneNumberField';

export function DoctorLoginCard({ viewModel, onVerifyOtp, onRegister }) {
  const {
    phone,
    sent,
    otp,
    isPhoneValid,
    phoneInputRef,
    focusPhoneInput,
    focusOtpInput,
    handlePhoneChange,
    handleOtpChange,
    handleOtpKeyDown,
    setOtpInputRef,
    sendOtp,
  } = viewModel;

  return (
    <div className="bg-white rounded-2xl shadow-soft overflow-hidden relative">
      <div className="p-10 sm:p-12">
        <div className="text-center mb-10">
          <h2 className="text-xl font-semibold text-text-main mb-2">Doctor Portal Login</h2>
          <p className="text-text-sub text-sm font-normal leading-relaxed max-w-[280px] mx-auto">
            Please enter your registered mobile number to receive a verification code.
          </p>
        </div>

        <div className="space-y-8">
          <PhoneNumberField
            phone={phone}
            onPhoneChange={handlePhoneChange}
            onFocusInput={focusPhoneInput}
            phoneInputRef={phoneInputRef}
          />

          <button
            className="w-full py-4 px-4 rounded-xl bg-primary hover:bg-primary-dark text-white font-semibold text-base shadow-lg shadow-primary/20 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary transition-all transform active:scale-[0.99] disabled:cursor-not-allowed disabled:opacity-60"
            type="button"
            onClick={sendOtp}
            disabled={!isPhoneValid}
          >
            {sent ? 'Resend Verification Code' : 'Send Verification Code'}
          </button>
        </div>

        <OtpCodeFields
          sent={sent}
          otp={otp}
          onContainerClick={focusOtpInput}
          onOtpChange={handleOtpChange}
          onOtpKeyDown={handleOtpKeyDown}
          setOtpInputRef={setOtpInputRef}
          onResend={sendOtp}
          onVerify={onVerifyOtp}
          onRegister={onRegister}
        />
      </div>

      <div className="bg-slate-50/50 px-10 py-5 border-t border-slate-100 flex items-center justify-center gap-6">
        <a className="text-xs font-medium text-slate-400 hover:text-slate-600 transition-colors" href="#">
          Help Center
        </a>
        <span className="w-1 h-1 rounded-full bg-slate-300" />
        <a className="text-xs font-medium text-slate-400 hover:text-slate-600 transition-colors" href="#">
          Privacy
        </a>
        <span className="w-1 h-1 rounded-full bg-slate-300" />
        <a className="text-xs font-medium text-slate-400 hover:text-slate-600 transition-colors" href="#">
          Terms
        </a>
      </div>
    </div>
  );
}
