import { useRef, useState } from 'react';
import { OTP_LENGTH, PHONE_DIGITS } from '../constants';

export function useDoctorLogin() {
  const [phone, setPhone] = useState('');
  const [sent, setSent] = useState(false);
  const [otp, setOtp] = useState(Array(OTP_LENGTH).fill(''));

  const phoneInputRef = useRef(null);
  const otpInputRefs = useRef([]);

  const handlePhoneChange = (value) => {
    setPhone(value.replace(/\D/g, '').slice(0, PHONE_DIGITS));
  };

  const handleOtpChange = (index, value) => {
    const digit = value.replace(/\D/g, '').slice(-1);
    const next = [...otp];
    next[index] = digit;
    setOtp(next);

    if (digit && index < OTP_LENGTH - 1) {
      otpInputRefs.current[index + 1]?.focus();
    }
  };

  const handleOtpKeyDown = (index, event) => {
    if (event.key === 'Backspace' && !otp[index] && index > 0) {
      otpInputRefs.current[index - 1]?.focus();
    }
  };

  const focusPhoneInput = () => {
    phoneInputRef.current?.focus();
  };

  const focusOtpInput = () => {
    const firstEmpty = otp.findIndex((digit) => !digit);
    const targetIndex = firstEmpty === -1 ? OTP_LENGTH - 1 : firstEmpty;
    otpInputRefs.current[targetIndex]?.focus();
  };

  const sendOtp = () => {
    if (phone.length !== PHONE_DIGITS) {
      return;
    }

    setSent(true);
    setOtp(Array(OTP_LENGTH).fill(''));
    setTimeout(() => otpInputRefs.current[0]?.focus(), 0);
  };

  const setOtpInputRef = (index, element) => {
    otpInputRefs.current[index] = element;
  };

  return {
    phone,
    sent,
    otp,
    isPhoneValid: phone.length === PHONE_DIGITS,
    phoneInputRef,
    setOtpInputRef,
    handlePhoneChange,
    handleOtpChange,
    handleOtpKeyDown,
    focusPhoneInput,
    focusOtpInput,
    sendOtp,
  };
}
