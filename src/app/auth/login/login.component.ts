import { ChangeDetectorRef, Component, inject, OnInit } from '@angular/core';
import {
  FormControl,
  FormGroup,
  ReactiveFormsModule,
  Validators
} from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { fadeInUp400ms } from '@vex/animations/fade-in-up.animation';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatIconModule } from '@angular/material/icon';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatButtonModule } from '@angular/material/button';
import { NgIf } from '@angular/common';
import { MatInputModule } from '@angular/material/input';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatSnackBarModule } from '@angular/material/snack-bar';
import { AuthService } from '../services/auth.service';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { ToastrService } from 'ngx-toastr';
import { OtpStateService } from '../services/OtpState.service';
import Swal from 'sweetalert2';
import { NotificationService } from '../services/Notification.service';

@Component({
  selector: 'vex-login',
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.scss'],
  animations: [fadeInUp400ms],
  standalone: true,
  imports: [
    ReactiveFormsModule,
    MatFormFieldModule,
    MatInputModule,
    NgIf,
    MatButtonModule,
    MatTooltipModule,
    MatIconModule,
    MatCheckboxModule,
    RouterLink,
    MatSnackBarModule,
    MatProgressBarModule,
    MatProgressSpinnerModule
  ]
})
export class LoginComponent implements OnInit {
  private router = inject(Router);
  private authService = inject(AuthService);
  private toastr = inject(ToastrService);
  private notificationService = inject(NotificationService);
  private otpStateService = inject(OtpStateService);
  private cd = inject(ChangeDetectorRef);
  form!: FormGroup;
  constructor() {}

  existErrorMessage: boolean = false;
  errorMessage!: string;
  isSubmitting: boolean = false;
  inputType = 'password';
  visible = false;
  ngOnInit() {
    this.form = new FormGroup({
      email: new FormControl('', [
        Validators.required,
        Validators.email,
        Validators.minLength(8),
        Validators.maxLength(50),
        Validators.pattern('^[a-z0-9._%+-]+@[a-z0-9.-]+\\.[a-z]{2,4}$')
      ]),
      password: new FormControl('', [
        Validators.required,
        Validators.minLength(8)
      ]),
      rememberme: new FormControl(false)
    });
  }

  login() {
    if (!this.form.invalid) {
      this.isSubmitting = true;
      const credentials = this.form.value;
      this.authService.login(credentials).subscribe({
        next: (response) => {
          if (response.requires_otp) {
            this.authService.checkOtp(this.form.get('email')?.value).subscribe({
              next: (responseOtp) => {
                this.showMessage(responseOtp.message);
                this.otpStateService.setOtpState(
                  responseOtp.email,
                  true,
                  responseOtp.otp_expires_in
                );
                this.router.navigate(['/otp']);
              }
            });
          } else {
            this.notificationService.success(response.message);
            this.redirectUserByRole();
          }
        },
        error: (error) => {
          if (error.error.errors?.email?.[0]) {
            this.errorMessage = error.error.errors.email[0];
            this.existErrorMessage = true;
            this.isSubmitting = false;
          } else if (error.error.status == 400 || error.error.status == 429) {
            this.errorMessage = error.error.message;
            this.existErrorMessage = true;
            this.isSubmitting = false;
          } else if (error.error.isDisabled) {
            Swal.fire({
              title: 'Compte suspendu',
              text: "Votre compte a été suspendu. Veuillez contacter l'administrateur.",
              icon: 'warning',
              confirmButtonText: 'Compris',
              confirmButtonColor: '#f59e0b',
              allowOutsideClick: false,
              customClass: {
                container: 'swal2-container-custom',
                popup: 'swal2-popup-custom',
                confirmButton: 'swal2-confirm-custom'
              },
              heightAuto: false
            });
            this.isSubmitting = false;
          } else {
            this.errorMessage = error.error.message;
            this.existErrorMessage = true;
            this.isSubmitting = false;
          }
        }
      });
    }
  }

  redirectUserByRole() {
    this.authService.getUserAuth().subscribe({
      next: (response) => {
        const roleName = response.user?.role?.name?.toLowerCase();
        if (roleName === 'owner') {
          this.router.navigate(['/index/owner/stores']);
        } else if (roleName === 'manager' || roleName === 'seller') {
          this.router.navigate(['/index/manager/home']);
        } else {
          this.router.navigate(['/index/admin/company/list']);
        }
      },
      error: (err) => {
        console.error("Erreur lors de la récupération de l'utilisateur", err);
      }
    });
  }

  goToForgotPassword() {
    this.router.navigate(['/forgot-password']);
  }

  showMessage(message: string) {
    this.toastr.success(message);
  }

  toggleVisibility() {
    if (this.visible) {
      this.inputType = 'password';
      this.visible = false;
      this.cd.markForCheck();
    } else {
      this.inputType = 'text';
      this.visible = true;
      this.cd.markForCheck();
    }
  }
}
