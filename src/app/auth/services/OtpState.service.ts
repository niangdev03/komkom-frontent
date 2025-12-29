import { Injectable } from '@angular/core';

@Injectable({
    providedIn: 'root'
  })
  export class OtpStateService {
    private readonly EMAIL_KEY = 'otpEmail';
    private readonly REQUIRES_OTP_KEY = 'requiresOtp';
    private readonly TIME_OTP_KEY = 'timeOtp';

  setOtpState(email: string, requiresOtp: boolean, timeOtp:number) {
    localStorage.setItem(this.EMAIL_KEY, email);
    localStorage.setItem(this.TIME_OTP_KEY, JSON.stringify(timeOtp));
    localStorage.setItem(this.REQUIRES_OTP_KEY, JSON.stringify(requiresOtp));
  }

  getEmail(): string | null {
    return localStorage.getItem(this.EMAIL_KEY);
  }

  getRequiresOtp(): boolean {
    return JSON.parse(localStorage.getItem(this.REQUIRES_OTP_KEY) || 'false');
  }

  clearOtpState() {
    localStorage.removeItem(this.EMAIL_KEY);
    localStorage.removeItem(this.REQUIRES_OTP_KEY);
  }
  }