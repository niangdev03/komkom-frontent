import {
  NgIf,
  NgFor,
  NgClass,
  CommonModule,
  DatePipe,
  registerLocaleData
} from '@angular/common';
import { Component, Input, LOCALE_ID, OnInit } from '@angular/core';
import {
  FormsModule,
  ReactiveFormsModule,
  UntypedFormControl
} from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatButtonToggleModule } from '@angular/material/button-toggle';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatOptionModule } from '@angular/material/core';
import { MatDialogModule } from '@angular/material/dialog';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatMenuModule } from '@angular/material/menu';
import { MatPaginatorModule, PageEvent } from '@angular/material/paginator';
import { MatSelectModule } from '@angular/material/select';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { MatSnackBarModule } from '@angular/material/snack-bar';
import { MatSortModule } from '@angular/material/sort';
import { MatTableModule } from '@angular/material/table';
import { MatTooltipModule } from '@angular/material/tooltip';
import { Router } from '@angular/router';
import { VexPageLayoutContentDirective } from '@vex/components/vex-page-layout/vex-page-layout-content.directive';
import { TableColumn } from '@vex/interfaces/table-column.interface';
import {
  debounceTime,
  distinctUntilChanged,
  map,
  Observable,
  switchMap
} from 'rxjs';
import { CategoryService } from 'src/app/auth/services/category.service';
import { ProcurementService } from 'src/app/auth/services/procurement.service';
import { Company } from 'src/app/interfaces/Company';
import {
  ProcurementResponse,
  Procurement
} from 'src/app/interfaces/Procurement';
import { Store } from 'src/app/interfaces/Store';
import {
  initialPaginationMeta,
  PaginationMeta
} from 'src/app/response-type/Type';
import Swal from 'sweetalert2';
import localeFr from '@angular/common/locales/fr';
import { AuthService } from 'src/app/auth/services/auth.service';
import { Location } from '@angular/common';

registerLocaleData(localeFr, 'fr');
@Component({
  selector: 'vex-procurement-list',
  templateUrl: './procurement-list.component.html',
  styleUrls: ['./procurement-list.component.scss'],
  standalone: true,
  imports: [
    MatButtonToggleModule,
    ReactiveFormsModule,
    VexPageLayoutContentDirective,
    NgIf,
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
    NgClass,
    MatPaginatorModule,
    FormsModule,
    MatDialogModule,
    MatInputModule,
    MatSnackBarModule,
    CommonModule,
    MatSlideToggleModule
  ],
  providers: [{ provide: LOCALE_ID, useValue: 'fr' }, DatePipe]
})
export class ProcurementListComponent implements OnInit {
  searchCtrl = new UntypedFormControl();
  data$: Observable<ProcurementResponse> =
    new Observable<ProcurementResponse>();
  procurements: Procurement[] = [];
  meta: PaginationMeta = { ...initialPaginationMeta };
  store!: Store;
  company!: Company;
  searchTerm: string = '';
  isLoading = true;

  constructor(
    private categoryService: CategoryService,
    private router: Router,
    private procurementService: ProcurementService,
    private authService: AuthService,
    private location: Location
  ) {}

  ngOnInit(): void {
    this.authService.getUserAuth().subscribe({
      next: (response) => {
        const roleName = response.user?.role?.name?.toLowerCase();

        if (roleName === 'owner') {
          // Owner : récupérer le store depuis le state de navigation
          if (history.state.store && history.state.company) {
            this.store = history.state.store;
            this.company = history.state.company;
            this.initComponent();
          } else {
            this.goBack();
          }
        } else {
          // Manager ou Seller : le store vient de l'API
          this.store = response.store;
          if (response.company) {
            this.company = response.company;
          }
          this.initComponent();
        }
      },
      error: (err) => {
        console.error("Erreur lors de la récupération de l'utilisateur", err);
        this.isLoading = false;
      }
    });
  }

  private initComponent(): void {
    this.loadProcurements();
    this.initSearch();
    this.isLoading = false;
  }

  private initSearch(): void {
    this.searchCtrl.valueChanges
      .pipe(
        debounceTime(300),
        distinctUntilChanged(),
        switchMap((searchTerm) =>
          this.procurementService.list(this.store.id, searchTerm)
        )
      )
      .subscribe((response) => {
        this.procurements = response.data;
      });
  }

  loadProcurements() {
    this.procurementService.list(this.store.id).subscribe({
      next: (response) => {
        this.procurements = response.data;
        this.meta = response.meta;
      }
    });
  }

  goBack() {
    this.location.back();
  }

  newProcurement() {
    this.router.navigate(['/index/manager/procurement/add'], {
      state: { store: this.store, company: this.company }
    });
  }

  pageEvent(page: PageEvent) {
    this.meta.per_page = page.pageSize;
    this.meta.current_page = page.pageIndex + 1;
    this.procurementService
      .list(this.store.id, '', this.meta.current_page, this.meta.per_page)
      .subscribe({
        next: (response) => {
          this.procurements = response.data;
          this.meta = response.meta;
        }
      });
  }

  getStatusLabel(status: string): string {
    switch (status) {
      case 'pending':
        return 'En attente';
      case 'received':
        return 'Reçu';
      case 'cancelled':
        return 'Annulé';
      default:
        return status;
    }
  }

  delete(item: Procurement): void {
    Swal.fire({
      title: 'Confirmation',
      text: `Voulez-vous vraiment supprimer l'approvisionnement "${item.order_number}" ?`,
      icon: 'warning',
      showCancelButton: true,
      buttonsStyling: false,
      confirmButtonText: 'Oui, supprimer',
      cancelButtonText: 'Annuler',
      customClass: {
        container: 'swal2-container-custom',
        popup: 'swal2-popup-custom',
        actions: 'swal2-actions-custom',
        confirmButton: 'swal2-confirm-custom',
        cancelButton: 'swal2-cancel-custom'
      }
    }).then((result) => {
      if (result.isConfirmed) {
        Swal.fire({
          title: 'Suppression en cours...',
          text: 'Veuillez patienter',
          allowOutsideClick: false,
          didOpen: () => Swal.showLoading()
        });

        this.categoryService.delete(item.id).subscribe({
          next: (response) => {
            Swal.fire({
              icon: 'success',
              title: 'Supprimé !',
              text:
                response.message ||
                "L'approvisionnement a été supprimé avec succès.",
              timer: 2000,
              showConfirmButton: false
            });
            this.loadProcurements();
          },
          error: (error) => {
            Swal.fire({
              icon: 'error',
              title: 'Erreur',
              text:
                error?.message ||
                'Une erreur est survenue lors de la suppression.',
              confirmButtonColor: '#d33'
            });
          }
        });
      }
    });
  }

  edit(data: Procurement) {
    this.router.navigate(['/index/manager/procurement/add'], {
      state: {
        store: this.store,
        company: this.company,
        procurement: data,
        isUpdateMode: true
      }
    });
  }

  details(data: Procurement) {
    this.router.navigate(['/index/manager/procurement/details'], {
      state: { store: this.store, company: this.company, procurement: data }
    });
  }

  validateProcurement(procurement: Procurement): void {
    Swal.fire({
      title: 'Confirmation',
      text: `Voulez-vous vraiment valider l'approvisionnement "${procurement.order_number}" ?`,
      icon: 'question',
      showCancelButton: true,
      buttonsStyling: false,
      confirmButtonText: 'Oui, valider',
      cancelButtonText: 'Non',
      customClass: {
        confirmButton: 'swal2-confirm-custom',
        cancelButton: 'swal2-cancel-custom',
        actions: 'swal2-actions-custom'
      }
    }).then((result) => {
      if (result.isConfirmed) {
        Swal.fire({
          title: 'Validation en cours...',
          text: 'Veuillez patienter',
          allowOutsideClick: false,
          didOpen: () => Swal.showLoading()
        });

        this.procurementService
          .validate(this.store.id, procurement.id)
          .subscribe({
            next: (response) => {
              Swal.fire({
                icon: 'success',
                title: 'Validé !',
                text:
                  response.message ||
                  "L'approvisionnement a été validé avec succès et le stock a été mis à jour.",
                timer: 2000,
                showConfirmButton: false
              });
              this.loadProcurements();
            },
            error: (error) => {
              Swal.fire({
                icon: 'error',
                title: 'Erreur',
                text:
                  error?.error?.message ||
                  'Une erreur est survenue lors de la validation.',
                confirmButtonColor: '#d33'
              });
            }
          });
      }
    });
  }

  cancelProcurement(procurement: Procurement): void {
    Swal.fire({
      title: 'Confirmation',
      text: `Voulez-vous vraiment annuler l'approvisionnement "${procurement.order_number}" ?`,
      icon: 'warning',
      showCancelButton: true,
      buttonsStyling: false,
      confirmButtonText: 'Oui, annuler',
      cancelButtonText: 'Non',
      customClass: {
        confirmButton: 'swal2-confirm-custom',
        cancelButton: 'swal2-cancel-custom',
        actions: 'swal2-actions-custom'
      }
    }).then((result) => {
      if (result.isConfirmed) {
        Swal.fire({
          title: 'Annulation en cours...',
          text: 'Veuillez patienter',
          allowOutsideClick: false,
          didOpen: () => Swal.showLoading()
        });

        this.procurementService
          .cancel(this.store.id, procurement.id)
          .subscribe({
            next: (response) => {
              Swal.fire({
                icon: 'success',
                title: 'Annulé !',
                text:
                  response.message ||
                  "L'approvisionnement a été annulé avec succès.",
                timer: 2000,
                showConfirmButton: false
              });
              this.loadProcurements();
            },
            error: (error) => {
              Swal.fire({
                icon: 'error',
                title: 'Erreur',
                text:
                  error?.error?.message ||
                  "Une erreur est survenue lors de l'annulation.",
                confirmButtonColor: '#d33'
              });
            }
          });
      }
    });
  }

  @Input()
  columns: TableColumn<Procurement>[] = [
    {
      label: 'Fournisseur',
      property: 'supplier_name',
      type: 'text',
      visible: true,
      cssClasses: ['font-medium']
    },
    {
      label: 'Contact Fournisseur',
      property: 'supplier_phone',
      type: 'text',
      visible: true,
      cssClasses: ['text-secondary', 'font-medium']
    },
    {
      label: 'Date',
      property: 'procurement_date',
      type: 'text',
      visible: true
    },
    {
      label: 'Montant (Fcfa)',
      property: 'total_amount',
      type: 'text',
      visible: true
    },
    { label: 'Actions', property: 'actions', type: 'button', visible: true }
  ];
}
