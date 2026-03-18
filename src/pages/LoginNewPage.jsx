import { useRef, useState } from 'react';
import { apiPost } from '../lib/apiClient';
import { loginByPhone } from '../features/auth/services/authService';

export function LoginNewPage({ onOtpResolved, onReceptionistLogin }) {
  const [loginMode, setLoginMode] = useState('doctor'); // 'doctor' | 'receptionist'
  const [recPhone, setRecPhone] = useState('');
  const [recPassword, setRecPassword] = useState('');
  const [recError, setRecError] = useState('');
  const [recLoading, setRecLoading] = useState(false);

  const handleReceptionistLogin = async (e) => {
    e.preventDefault();
    if (!recPhone.trim() || !recPassword) return;
    setRecError('');
    setRecLoading(true);
    try {
      const result = await loginByPhone({ phone: recPhone.trim(), password: recPassword });
      onReceptionistLogin?.(result);
    } catch (err) {
      setRecError(err.message || 'Login failed');
    } finally {
      setRecLoading(false);
    }
  };

  const [mobile, setMobile] = useState('+91 ');
  const [otpDigits, setOtpDigits] = useState(['', '', '', '', '', '']);
  const [otpRequested, setOtpRequested] = useState(false);
  const [otpSessionId, setOtpSessionId] = useState('');
  const [isSendingOtp, setIsSendingOtp] = useState(false);
  const [isVerifyingOtp, setIsVerifyingOtp] = useState(false);
  const [mobileError, setMobileError] = useState('');
  const [otpError, setOtpError] = useState('');
  const [otpSuccess, setOtpSuccess] = useState('');
  const [activeOtpIndex, setActiveOtpIndex] = useState(-1);
  const otpRefs = useRef([]);

  const handleMobileChange = (event) => {
    const raw = event.target.value;
    const digits = raw.replace(/\D/g, '');
    const withoutCountryCode = digits.startsWith('91') ? digits.slice(2) : digits;
    const limited = withoutCountryCode.slice(0, 10);
    setMobile(`+91 ${limited}`);
    if (mobileError) setMobileError('');
    if (otpRequested) {
      setOtpRequested(false);
      setOtpSessionId('');
      setOtpDigits(['', '', '', '', '', '']);
      setOtpError('');
      setOtpSuccess('');
    }
  };

  const handleMobileKeyDown = (event) => {
    if ((event.key === 'Backspace' || event.key === 'Delete') && (event.currentTarget.selectionStart || 0) <= 4) {
      event.preventDefault();
    }
  };

  const handleMobileFocus = (event) => {
    if (!event.target.value.startsWith('+91 ')) {
      setMobile('+91 ');
    }
  };

  const getLocalDigits = () => {
    const digits = mobile.replace(/\D/g, '');
    return digits.startsWith('91') ? digits.slice(2) : digits;
  };

  const handleSendOtp = async () => {
    const localDigits = getLocalDigits();
    if (localDigits.length !== 10) {
      setMobileError('Enter a valid 10-digit mobile number');
      setOtpRequested(false);
      return;
    }
    setMobileError('');
    setOtpError('');
    setOtpSuccess('');
    setIsSendingOtp(true);
    try {
      const response = await apiPost('/api/otp/send', { phoneNumber: `+91${localDigits}` });
      setOtpSessionId(response?.sessionId || '');
      setOtpRequested(true);
      setOtpDigits(['', '', '', '', '', '']);
      setOtpSuccess(`Demo OTP: ${response?.demoOtp || '123456'}`);
      setTimeout(() => otpRefs.current[0]?.focus(), 80);
    } catch (error) {
      setOtpRequested(false);
      setOtpSessionId('');
      setOtpError(error.message || 'Failed to send OTP. Please try again.');
    } finally {
      setIsSendingOtp(false);
    }
  };

  const handleVerifyOtp = async (event) => {
    event.preventDefault();
    if (!otpSessionId) {
      setOtpError('Please request OTP again.');
      return;
    }
    if (otpValue.length < 6) return;
    setOtpError('');
    setOtpSuccess('');
    setIsVerifyingOtp(true);
    try {
      const response = await apiPost('/api/otp/verify', {
        sessionId: otpSessionId,
        phoneNumber: `+91${getLocalDigits()}`,
        otp: otpValue,
      });
      setOtpSuccess('OTP verified successfully.');
      onOtpResolved?.(response);
    } catch (error) {
      setOtpError(error.message || 'Invalid OTP. Please try again.');
    } finally {
      setIsVerifyingOtp(false);
    }
  };

  const handleOtpChange = (index, value) => {
    const digit = value.replace(/\D/g, '').slice(-1);
    setOtpDigits((prev) => {
      const next = [...prev];
      next[index] = digit;
      return next;
    });
    if (digit && index < otpDigits.length - 1) {
      otpRefs.current[index + 1]?.focus();
    }
  };

  const handleOtpKeyDown = (index, event) => {
    if (event.key === 'Backspace' && !otpDigits[index] && index > 0) {
      otpRefs.current[index - 1]?.focus();
    }
  };

  const handleOtpPaste = (event) => {
    event.preventDefault();
    const pasted = event.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6);
    if (!pasted) return;
    const next = ['', '', '', '', '', ''];
    for (let index = 0; index < pasted.length; index += 1) {
      next[index] = pasted[index];
    }
    setOtpDigits(next);
    const focusIndex = Math.min(pasted.length, otpDigits.length - 1);
    otpRefs.current[focusIndex]?.focus();
  };

  const otpValue = otpDigits.join('');

  return (
    <div className="bg-white m-0 p-0 overflow-x-hidden">
      <div className="w-full min-h-screen flex flex-col md:flex-row">
        <div className="md:w-1/2 relative hidden md:block bg-gradient-to-br from-primary-light to-primary-dark overflow-hidden flex-shrink-0 min-h-screen">
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none opacity-90">
            <svg className="w-full h-full max-h-screen object-contain p-8" viewBox="0 0 800 800" aria-hidden="true">
              <circle cx="400" cy="400" fill="none" r="250" stroke="rgba(255,255,255,0.1)" strokeDasharray="10 10" strokeWidth="2" />
              <circle cx="400" cy="400" fill="none" r="350" stroke="rgba(255,255,255,0.05)" strokeWidth="40" />
              <path d="M 300 500 C 350 350, 450 350, 520 280" fill="none" opacity="0.8" stroke="white" strokeDasharray="12 12" strokeWidth="4" />
              <g transform="translate(100, 450)">
                <rect fill="white" height="150" opacity="0.95" rx="12" width="220" x="0" y="0" />
                <rect fill="#f1f5f9" height="130" rx="6" width="200" x="10" y="10" />
                <rect fill="#cbd5e1" height="10" rx="4" width="80" x="20" y="20" />
                <rect fill="#e2e8f0" height="4" rx="2" width="160" x="20" y="40" />
                <rect fill="#e2e8f0" height="4" rx="2" width="140" x="20" y="50" />
                <rect fill="#e2e8f0" height="20" rx="4" width="100" x="20" y="70" />
                <rect fill="#e2e8f0" height="20" rx="4" width="100" x="20" y="100" />
                <rect fill="#0d9488" height="30" rx="6" width="50" x="140" y="90" />
                <path d="M 165 140 L 165 110 L 180 120 Z" fill="#334155" opacity="0.8" />
              </g>
              <circle cx="410" cy="380" fill="#ccfbf1" r="8" />
              <circle cx="410" cy="380" fill="white" r="4" />
              <g transform="translate(480, 150)">
                <rect fill="white" height="240" opacity="0.95" rx="16" width="120" x="0" y="0" />
                <rect fill="#f1f5f9" height="230" rx="12" width="110" x="5" y="5" />
                <rect fill="#cbd5e1" height="10" rx="5" width="40" x="40" y="10" />
                <rect fill="#e2e8f0" height="20" rx="10" width="60" x="15" y="40" />
                <path d="M 85 80 L 85 130 C 85 135, 80 140, 75 140 L 25 140 C 20 140, 15 135, 15 130 L 15 90 C 15 85, 20 80, 25 80 L 85 80 Z M 85 130 L 95 135 L 85 120" fill="#22c55e" opacity="0.9" />
                <rect fill="white" height="6" opacity="0.8" rx="3" width="50" x="25" y="90" />
                <rect fill="white" height="6" opacity="0.8" rx="3" width="40" x="25" y="105" />
                <circle cx="70" cy="120" fill="white" opacity="0.9" r="6" />
                <rect fill="#dcf8c6" height="20" rx="10" width="60" x="45" y="160" />
              </g>
              <circle cx="650" cy="300" fill="white" opacity="0.1" r="30" />
              <path d="M 640 290 L 660 310 M 660 290 L 640 310" opacity="0.3" stroke="white" strokeLinecap="round" strokeWidth="3" />
              <circle cx="200" cy="200" fill="white" opacity="0.15" r="20" />
            </svg>
          </div>

          <div className="absolute bottom-0 left-0 p-12 text-white w-full">
            <div className="flex items-center space-x-3 mb-6 relative z-10">
              <div className="w-12 h-12 bg-white rounded-full flex items-center justify-center">
                <span className="material-icons text-primary text-2xl">medical_services</span>
              </div>
              <h2 className="text-3xl font-bold tracking-wider">Easy prescribe</h2>
            </div>
            <p className="text-2xl font-semibold leading-snug max-w-md relative z-10 text-white shadow-sm">
              Digital Prescriptions,
              <br />
              Delivered Instantly via WhatsApp.
            </p>
          </div>
        </div>

        <div className="w-full md:w-1/2 p-8 md:p-16 flex flex-col justify-center bg-white relative z-10 min-h-screen">
          <div className="max-w-md w-full mx-auto space-y-8">
            <div className="md:hidden flex items-center justify-center space-x-2 mb-8">
              <div className="w-10 h-10 bg-primary rounded-full flex items-center justify-center">
                <span className="material-icons text-white">medical_services</span>
              </div>
              <h2 className="text-2xl font-bold text-gray-900">Easy prescribe</h2>
            </div>

            <div className="space-y-2 text-center md:text-left">
              <div className="hidden md:flex items-center space-x-2 mb-6 text-primary">
                <span className="material-icons text-3xl">medication</span>
              </div>
              <h1 className="text-3xl font-bold text-gray-900">{loginMode === 'doctor' ? 'Doctor Login' : 'Receptionist Login'}</h1>
              <p className="text-gray-500">Access your clinic portal.</p>
            </div>

            {/* Role toggle */}
            <div className="flex bg-gray-100 rounded-lg p-1 gap-1">
              <button
                type="button"
                className={`flex-1 py-2 px-3 rounded-md text-sm font-semibold transition-all ${loginMode === 'doctor' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
                onClick={() => setLoginMode('doctor')}
              >Doctor</button>
              <button
                type="button"
                className={`flex-1 py-2 px-3 rounded-md text-sm font-semibold transition-all ${loginMode === 'receptionist' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
                onClick={() => setLoginMode('receptionist')}
              >Receptionist</button>
            </div>

            {loginMode === 'receptionist' ? (
              <form className="space-y-5" onSubmit={handleReceptionistLogin}>
                <div className="space-y-2">
                  <label className="block text-sm font-medium text-gray-700" htmlFor="rec-phone">Phone Number</label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <span className="material-icons text-gray-400">phone</span>
                    </div>
                    <input
                      className="block w-full pl-10 pr-3 py-3 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary sm:text-sm bg-white text-gray-900 placeholder-gray-400"
                      id="rec-phone"
                      type="tel"
                      inputMode="numeric"
                      placeholder="9876543210"
                      value={recPhone}
                      onChange={(e) => { setRecPhone(e.target.value.replace(/\D/g, '').slice(0, 10)); setRecError(''); }}
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <label className="block text-sm font-medium text-gray-700" htmlFor="rec-password">Password</label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <span className="material-icons text-gray-400">lock</span>
                    </div>
                    <input
                      className="block w-full pl-10 pr-3 py-3 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary sm:text-sm bg-white text-gray-900 placeholder-gray-400"
                      id="rec-password"
                      type="password"
                      placeholder="Enter your password"
                      value={recPassword}
                      onChange={(e) => { setRecPassword(e.target.value); setRecError(''); }}
                    />
                  </div>
                </div>
                {recError ? <p className="text-xs text-red-600 text-center">{recError}</p> : null}
                <button
                  className="w-full flex justify-center py-3 px-4 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-primary hover:bg-primary-dark focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary transition-colors disabled:opacity-50"
                  type="submit"
                  disabled={recLoading || !recPhone || !recPassword}
                >{recLoading ? 'Logging in...' : 'Login'}</button>
              </form>
            ) : (

            <form className="space-y-6" onSubmit={(event) => event.preventDefault()}>
              <div className="space-y-2">
                <label className="block text-sm font-medium text-gray-700" htmlFor="mobile">
                  Mobile Number
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <span className="material-icons text-gray-400">phone</span>
                  </div>
                  <input
                    className="block w-full pl-10 pr-3 py-3 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary sm:text-sm bg-white text-gray-900 placeholder-gray-400 transition-colors"
                    id="mobile"
                    name="mobile"
                    placeholder="+91 9876543210"
                    required
                    type="tel"
                    inputMode="numeric"
                    value={mobile}
                    onChange={handleMobileChange}
                    onKeyDown={handleMobileKeyDown}
                    onFocus={handleMobileFocus}
                  />
                </div>
                {mobileError ? <p className="text-xs text-red-600">{mobileError}</p> : null}
              </div>

              <button
                className="w-full flex justify-center py-3 px-4 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-primary hover:bg-primary-dark focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary transition-colors"
                type="button"
                onClick={handleSendOtp}
                disabled={isSendingOtp}
              >
                {isSendingOtp ? 'Sending OTP...' : 'Send OTP'}
              </button>

              <div
                className={`-mt-6 overflow-hidden transition-all duration-500 ease-in-out ${
                  otpRequested ? 'max-h-72 opacity-100 translate-y-0' : 'max-h-0 opacity-0 -translate-y-1'
                }`}
                aria-hidden={!otpRequested}
              >
                <div className="border-t border-gray-200 pt-4">
                  <div>
                    <div className="min-w-0 flex items-center justify-center gap-3 pb-4">
                      {otpDigits.map((digit, index) => (
                        <div key={index} className="relative">
                          {!digit && activeOtpIndex !== index ? (
                            <span className="pointer-events-none absolute inset-0 flex items-center justify-center text-slate-300/80 text-xl leading-none">•</span>
                          ) : null}
                          <input
                            ref={(element) => {
                              otpRefs.current[index] = element;
                            }}
                            className="w-11 h-12 border border-slate-400 rounded-lg bg-[#f8fbfb] text-slate-900 text-2xl font-semibold tracking-[0.04em] text-center transition-all duration-200 ease-out focus:border-primary focus:outline-none focus:bg-white focus:-translate-y-0.5 focus:shadow-[0_0_0_5px_rgba(13,148,136,0.18)]"
                            aria-label={`OTP digit ${index + 1}`}
                            inputMode="numeric"
                            type="text"
                            maxLength={1}
                            value={digit}
                            onChange={(event) => handleOtpChange(index, event.target.value)}
                            onKeyDown={(event) => handleOtpKeyDown(index, event)}
                            onPaste={handleOtpPaste}
                            onFocus={() => setActiveOtpIndex(index)}
                            onBlur={() => setActiveOtpIndex(-1)}
                          />
                        </div>
                      ))}
                    </div>
                    <button
                      className="w-full flex justify-center py-3 px-4 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-[#06163A] hover:bg-[#081d4a] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#06163A] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                      type="button"
                      onClick={handleVerifyOtp}
                      disabled={otpValue.length < 6 || isVerifyingOtp}
                    >
                      {isVerifyingOtp ? 'Verifying...' : 'Verify & Login'}
                    </button>
                    {otpError ? <p className="mt-3 text-xs text-red-600 text-center">{otpError}</p> : null}
                    {otpSuccess ? <p className="mt-3 text-xs text-emerald-700 text-center">{otpSuccess}</p> : null}
                  </div>
                </div>
              </div>
            </form>
            )}

            <div className="text-center mt-8">
              <p className="text-sm text-gray-600">
                Need help accessing your account? <br className="md:hidden" />
                <a className="font-medium text-primary hover:text-primary-dark transition-colors" href="#">
                  Contact IT Support
                </a>
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
