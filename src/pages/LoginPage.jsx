import { MedicalBackground } from '../components/layout/MedicalBackground';
import { DoctorLoginCard } from '../features/auth/components/DoctorLoginCard';
import { LoginBrand } from '../features/auth/components/LoginBrand';
import { useDoctorLogin } from '../features/auth/hooks/useDoctorLogin';

export function LoginPage({ onOtpVerified, onRegister }) {
  const viewModel = useDoctorLogin();

  return (
    <MedicalBackground>
      <LoginBrand />
      <DoctorLoginCard viewModel={viewModel} onVerifyOtp={onOtpVerified} onRegister={onRegister} />
      <div className="mt-8 flex justify-center items-center gap-2 text-slate-400 opacity-60">
        <span className="material-symbols-outlined text-[18px]">lock</span>
        <span className="text-xs font-medium">HIPAA Compliant Secure Login</span>
      </div>
    </MedicalBackground>
  );
}
