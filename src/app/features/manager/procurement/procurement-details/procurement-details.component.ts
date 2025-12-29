import { NgIf, NgFor, NgClass, CommonModule, DatePipe, registerLocaleData } from '@angular/common';
import { Component, LOCALE_ID, OnInit } from '@angular/core';
import { ReactiveFormsModule, FormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatButtonToggleModule } from '@angular/material/button-toggle';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatOptionModule } from '@angular/material/core';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatMenuModule } from '@angular/material/menu';
import { MatPaginatorModule } from '@angular/material/paginator';
import { MatSelectModule } from '@angular/material/select';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatSortModule } from '@angular/material/sort';
import { MatTableModule } from '@angular/material/table';
import { MatTooltipModule } from '@angular/material/tooltip';
import { Router } from '@angular/router';
import { Procurement } from 'src/app/interfaces/Procurement';
import { Store } from 'src/app/interfaces/Store';
import { Company } from 'src/app/interfaces/Company';
import { ProcurementService } from 'src/app/auth/services/procurement.service';
import { MatCardModule } from '@angular/material/card';
import { MatDividerModule } from '@angular/material/divider';
import localeFr from '@angular/common/locales/fr';
registerLocaleData(localeFr, 'fr');
@Component({
  selector: 'vex-procurement-details',
  templateUrl: './procurement-details.component.html',
  styleUrls: ['./procurement-details.component.scss'],
  standalone: true,
  imports: [
    MatButtonToggleModule,
    ReactiveFormsModule,
    MatButtonModule,
    MatTooltipModule,
    MatIconModule,
    MatMenuModule,
    MatTableModule,
    MatSortModule,
    MatSelectModule,
    MatOptionModule,
    MatCheckboxModule,
    NgFor,
    NgIf,
    NgClass,
    MatPaginatorModule,
    FormsModule,
    MatDialogModule,
    MatInputModule,
    MatSnackBarModule,
    CommonModule,
    MatSlideToggleModule,
    MatCardModule,
    MatDividerModule,
  ],
  providers: [{ provide: LOCALE_ID, useValue: 'fr' }, DatePipe]
})
export class ProcurementDetailsComponent implements OnInit {
  procurement: Procurement | null = null;
  store: Store | null = null;
  company: Company | null = null;
  displayedColumns: string[] = ['product', 'quantity', 'purchase_price', 'total', 'serial_numbers'];
  isLoading = false;

  constructor(
    private router: Router,
    private procurementService: ProcurementService,
    private snackBar: MatSnackBar,
    private dialog: MatDialog
  ) {}

  ngOnInit(): void {
    const navigation = this.router.getCurrentNavigation();
    const state = navigation?.extras.state || history.state;

    if (state) {
      this.procurement = state['procurement'];
      this.store = state['store'];
      this.company = state['company'];
    }

    if (!this.procurement) {
      this.router.navigate(['/index/manager/procurement/list']);
    }
  }

  goBack(): void {
    this.router.navigate(['/index/manager/procurement/list']);
  }

  getStatusLabel(status: string): string {
    const statusMap: { [key: string]: string } = {
      'pending': 'En attente',
      'received': 'Reçu',
      'cancelled': 'Annulé'
    };
    return statusMap[status] || status;
  }

  getStatusClass(status: string): string {
    const classMap: { [key: string]: string } = {
      'pending': 'bg-orange-500/10 text-orange-500',
      'received': 'bg-green-500/10 text-green-500',
      'cancelled': 'bg-red-500/10 text-red-500'
    };
    return classMap[status] || '';
  }

  canValidate(): boolean {
    return this.procurement?.status === 'pending';
  }

  canCancel(): boolean {
    return this.procurement?.status === 'pending';
  }

  validateProcurement(): void {
    if (!this.procurement || !this.store) return;

    const confirmMessage = `Êtes-vous sûr de vouloir valider l'approvisionnement ${this.procurement.order_number} ?`;

    if (confirm(confirmMessage)) {
      this.isLoading = true;

      this.procurementService.validate(this.store.id, this.procurement.id).subscribe({
        next: (response) => {
          this.snackBar.open('Approvisionnement validé avec succès', 'Fermer', {
            duration: 3000,
            horizontalPosition: 'end',
            verticalPosition: 'top',
            panelClass: ['snackbar-success']
          });

          if (this.procurement) {
            this.procurement.status = 'received';
          }
          this.isLoading = false;
        },
        error: (error) => {
          this.snackBar.open(
            error.error?.message || 'Erreur lors de la validation',
            'Fermer',
            {
              duration: 5000,
              horizontalPosition: 'end',
              verticalPosition: 'top',
              panelClass: ['snackbar-error']
            }
          );
          this.isLoading = false;
        }
      });
    }
  }

  cancelProcurement(): void {
    if (!this.procurement || !this.store) return;

    const confirmMessage = `Êtes-vous sûr de vouloir annuler l'approvisionnement ${this.procurement.order_number} ? Cette action est irréversible.`;

    if (confirm(confirmMessage)) {
      this.isLoading = true;

      this.procurementService.cancel(this.store.id, this.procurement.id).subscribe({
        next: (response) => {
          this.snackBar.open('Approvisionnement annulé avec succès', 'Fermer', {
            duration: 3000,
            horizontalPosition: 'end',
            verticalPosition: 'top',
            panelClass: ['snackbar-success']
          });

          if (this.procurement) {
            this.procurement.status = 'cancelled';
          }
          this.isLoading = false;
        },
        error: (error) => {
          this.snackBar.open(
            error.error?.message || 'Erreur lors de l\'annulation',
            'Fermer',
            {
              duration: 5000,
              horizontalPosition: 'end',
              verticalPosition: 'top',
              panelClass: ['snackbar-error']
            }
          );
          this.isLoading = false;
        }
      });
    }
  }
}
