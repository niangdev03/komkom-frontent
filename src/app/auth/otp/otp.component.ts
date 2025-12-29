import { NgIf, NgForOf } from '@angular/common';
import { AfterViewInit, Component, ElementRef, inject, OnInit, QueryList, ViewChildren } from '@angular/core';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { AuthService } from '../services/auth.service';
import { OtpStateService } from '../services/OtpState.service';
import { Router } from '@angular/router';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { ToastrService } from 'ngx-toastr';
import { fadeInUp400ms } from '@vex/animations/fade-in-up.animation';
import { NotificationService } from '../services/Notification.service';

@Component({
  selector: 'vex-otp',
  templateUrl: './otp.component.html',
  styleUrls: ['./otp.component.scss'],
  animations: [fadeInUp400ms],
  standalone: true,
  imports: [
    ReactiveFormsModule,
    MatFormFieldModule,
    MatIconModule,
    MatInputModule,
    NgIf,
    NgForOf,
    MatButtonModule,
    MatProgressBarModule,
    MatSnackBarModule,
    FormsModule,
    MatProgressSpinnerModule
  ]
})

export class OtpComponent implements OnInit {
  email: string | null = ""
  mainFrameLoading = false
  otp: string[] = ["", "", "", "", "", ""]
  loading = false
  otpControls = new Array(6)
  errorMessage!:string;
  existErrorMessage:boolean = false;
  isSubmitting: boolean = false;

  constructor(
    private authService: AuthService,
    private otpStateService: OtpStateService,
    private router: Router,
    private notif: NotificationService,
  ) {
    this.email = otpStateService.getEmail()
    if (!this.email) {
      router.navigate(['/login']);
    }
  }

  ngOnInit(): void {
    this.maskEmail()
  }

  handleChange(event: any, index: number): void {
    const input = event.target
    const value = input.value

    // Assurez-vous que seuls des chiffres sont entrés
    if (/^\d*$/.test(value)) {
      this.otp[index] = value
      if (value && index < 5) {
        document.getElementById(`otp-${index + 1}`)?.focus()
      }
    } else {
      input.value = ""
    }
  }

  handleKeyDown(event: KeyboardEvent, index: number): void {
    if (event.key === "Backspace" && !this.otp[index] && index > 0) {
      document.getElementById(`otp-${index - 1}`)?.focus()
    }
  }

  maskEmail(): string {
    if (!this.email) return ""

    const [localPart, domain] = this.email.split("@")
    if (!domain) return ""

    const visiblePart = localPart.slice(0, 3)
    const hiddenPart = "*".repeat(7)

    return `${visiblePart}${hiddenPart}@${domain}`
  }

  isValidOTP(): boolean {
    return this.otp.every((digit) => /^\d$/.test(digit))
  }

  verify() {
    this.isSubmitting = true;
    const otpValue = this.otp.join("");

    if (otpValue.length !== 6) {
      this.notif.error('Le code OTP doit contenir 6 chiffres');
      this.isSubmitting = false;
      return;
    }

    if (this.email) {
      this.authService.verifyOtp({ email: this.email, otp: otpValue }).subscribe({
        next: (response) => {
          if (response.status) {
            this.otpStateService.clearOtpState();
            this.notif.success(response.message);
            this.isSubmitting = false;
            this.router.navigate(['/index']);
          } else {
            this.existErrorMessage = true;
            this.errorMessage = response.message;
            this.isSubmitting = false;
            this.notif.error(response.message);
          }
        },
        error: (error) => {
          this.existErrorMessage = true;
          this.errorMessage = error.message;
          this.isSubmitting = false;
          this.notif.error(this.errorMessage);
        }
      });
    }

  }

  resendCode(){

  }
}
