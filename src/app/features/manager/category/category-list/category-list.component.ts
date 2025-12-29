import { NgIf, NgFor, CommonModule } from '@angular/common';
import {
  ChangeDetectorRef,
  Component,
  Input,
  OnInit,
  ViewChild
} from '@angular/core';
import {
  ReactiveFormsModule,
  FormsModule,
  UntypedFormControl,
  FormGroup,
  Validators,
  FormBuilder
} from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatButtonToggleModule } from '@angular/material/button-toggle';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatOptionModule } from '@angular/material/core';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatMenuModule } from '@angular/material/menu';
import {
  MatPaginator,
  MatPaginatorModule,
  PageEvent
} from '@angular/material/paginator';
import { MatSelectModule } from '@angular/material/select';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { MatSnackBarModule } from '@angular/material/snack-bar';
import { MatSort, MatSortModule } from '@angular/material/sort';
import { MatTableDataSource, MatTableModule } from '@angular/material/table';
import { MatTooltipModule } from '@angular/material/tooltip';
import { Router } from '@angular/router';
import { fadeInRight400ms } from '@vex/animations/fade-in-right.animation';
import { fadeInUp400ms } from '@vex/animations/fade-in-up.animation';
import { scaleIn400ms } from '@vex/animations/scale-in.animation';
import { stagger80ms } from '@vex/animations/stagger.animation';
import { VexPageLayoutContentDirective } from '@vex/components/vex-page-layout/vex-page-layout-content.directive';
import { VexPageLayoutComponent } from '@vex/components/vex-page-layout/vex-page-layout.component';
import { TableColumn } from '@vex/interfaces/table-column.interface';
import { debounceTime, distinctUntilChanged, switchMap } from 'rxjs';
import { Company } from 'src/app/interfaces/Company';
import { Store } from 'src/app/interfaces/Store';
import { Supplier } from 'src/app/interfaces/Supplier';
import {
  PaginationMeta,
  initialPaginationMeta
} from 'src/app/response-type/Type';
import Swal from 'sweetalert2';
import { Category, CategoryResponse } from 'src/app/interfaces/Category';
import { CategoryService } from 'src/app/auth/services/category.service';
import { NotificationService } from 'src/app/auth/services/Notification.service';
import { AuthService } from 'src/app/auth/services/auth.service';
import { Location } from '@angular/common';
@Component({
  selector: 'vex-category-list',
  templateUrl: './category-list.component.html',
  styleUrls: ['./category-list.component.scss'],
  standalone: true,
  animations: [stagger80ms, fadeInUp400ms, scaleIn400ms, fadeInRight400ms],
  imports: [
    VexPageLayoutComponent,
    MatButtonToggleModule,
    ReactiveFormsModule,
    VexPageLayoutContentDirective,
    NgIf,
    MatButtonModule,
    MatTooltipModule,
    MatMenuModule,
    MatTableModule,
    MatSortModule,
    MatSelectModule,
    MatOptionModule,
    MatCheckboxModule,
    NgFor,
    MatPaginatorModule,
    FormsModule,
    MatDialogModule,
    MatInputModule,
    MatSnackBarModule,
    CommonModule,
    MatSlideToggleModule,
    MatIconModule
  ]
})
export class CategoryListComponent implements OnInit {
  store!: Store;
  company: Company | null = null;
  searchCtrl = new UntypedFormControl();
  categories: Category[] = [];
  meta: PaginationMeta = { ...initialPaginationMeta };
  searchTerm: string = '';
  categoryForm!: FormGroup;
  isEditing = false;
  categorieUpdate!: Category;
  dataSource!: MatTableDataSource<Category>;
  isSeller = false; // ← Flag pour vérifier si l'utilisateur est un Seller
  @ViewChild(MatPaginator) paginator?: MatPaginator;
  @ViewChild(MatSort) sort?: MatSort;
  layoutCtrl = new UntypedFormControl('boxed');

  constructor(
    private notificationService: NotificationService,
    private authService: AuthService, // ← Ajouter AuthService
    private router: Router,
    public dialog: MatDialog,
    private categoryService: CategoryService,
    private cd: ChangeDetectorRef,
    private fb: FormBuilder,
    private location: Location
  ) {
    this.categoryForm = this.fb.group({
      name: [
        '',
        [Validators.required, Validators.minLength(2), Validators.maxLength(50)]
      ],
      description: [
        '',
        [
          Validators.required,
          Validators.minLength(2),
          Validators.maxLength(254)
        ]
      ],
      store_id: [null]
    });
  }

  get visibleColumns() {
    return this.columns
      .filter((column) => column.visible)
      .map((column) => column.property);
  }

  ngOnInit(): void {
    this.authService.getUserAuth().subscribe({
      next: (response) => {
        const roleName = response.user?.role?.name?.toLowerCase();

        // Vérifier si l'utilisateur est un Seller
        this.isSeller = roleName === 'seller';

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
      }
    });
  }

  private initComponent(): void {
    this.createForm();
    this.loadCategories();
    this.initSearch();
  }

  private initSearch(): void {
    this.searchCtrl.valueChanges
      .pipe(
        debounceTime(300),
        distinctUntilChanged(),
        switchMap((searchTerm) =>
          this.categoryService.list(this.store.id, searchTerm)
        )
      )
      .subscribe((response) => {
        this.assignData(response);
      });
  }

  loadCategories() {
    this.categoryService.list(this.store.id).subscribe({
      next: (response) => {
        this.assignData(response);
      }
    });
  }

  goBack() {
    this.location.back();
  }

  assignData(data: CategoryResponse) {
    this.categories = data.data;
    this.meta = data.meta;
    this.dataSource = new MatTableDataSource<Category>(this.categories);
  }

  @Input()
  columns: TableColumn<Category>[] = [
    {
      label: 'Non de la catégorie',
      property: 'name',
      type: 'text',
      visible: true
    },
    {
      label: 'Description',
      property: 'description',
      type: 'text',
      visible: true
    },
    { label: 'Actions', property: 'actions', type: 'button', visible: true }
  ];

  pageEvent(page: PageEvent) {
    this.meta.per_page = page.pageSize;
    this.meta.current_page = page.pageIndex + 1;
    this.categoryService
      .list(this.store.id, '', this.meta.current_page, this.meta.per_page)
      .subscribe({
        next: (response) => {
          this.assignData(response);
        }
      });
  }

  toggleColumnVisibility(column: TableColumn<Supplier>, event: Event) {
    event.stopPropagation();
    event.stopImmediatePropagation();
    column.visible = !column.visible;
  }

  delete(category: Category) {
    this.cd.detectChanges();
    Swal.fire({
      title: 'Confirmation',
      text: `Voulez-vous vraiment supprimer cette catégorie "${category.name}" ?`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#d33',
      cancelButtonColor: '#6c757d',
      confirmButtonText: 'Oui, supprimer',
      cancelButtonText: 'Annuler'
    }).then((result) => {
      if (result.isConfirmed) {
        Swal.fire({
          title: 'Suppression en cours...',
          text: 'Veuillez patienter',
          allowOutsideClick: false,
          didOpen: () => Swal.showLoading()
        });

        this.categoryService.delete(category.id).subscribe({
          next: (response) => {
            Swal.fire({
              icon: 'success',
              title: 'Supprimé !',
              text:
                response.message || 'La catégorie a été supprimée avec succès.',
              timer: 2000,
              showConfirmButton: false
            });
            this.loadCategories();
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

  private createForm() {
    this.categoryForm = this.fb.group({
      name: [
        '',
        [Validators.required, Validators.minLength(2), Validators.maxLength(50)]
      ],
      description: [
        '',
        [
          Validators.required,
          Validators.minLength(2),
          Validators.maxLength(254)
        ]
      ],
      store_id: this.store.id
    });
  }

  resetForm() {
    this.categoryForm.reset({
      name: '',
      description: '',
      store_id: this.store.id
    });

    this.categoryForm.markAsPristine();
    this.categoryForm.markAsUntouched();

    Object.keys(this.categoryForm.controls).forEach((key) => {
      const control = this.categoryForm.get(key);
      if (control) {
        control.markAsPristine();
        control.markAsUntouched();
        control.setErrors(null);
      }
    });

    this.isEditing = false;
  }

  onSubmit() {
    if (this.categoryForm.valid) {
      if (this.isEditing) {
        this.categoryService
          .update(this.categorieUpdate.id, this.categoryForm.value)
          .subscribe({
            next: (response) => {
              this.notificationService.success(response.message);
              this.loadCategories();
            },
            error: (error) => {
              console.log(error);
            }
          });
      } else {
        this.categoryService.add(this.categoryForm.value).subscribe({
          next: (response) => {
            this.notificationService.success(response.message);
            this.loadCategories();
          },
          error: (error) => {
            console.log(error);
          }
        });
      }
      this.resetForm();
    }
  }

  editCategory(category: Category) {
    this.isEditing = true;
    this.categorieUpdate = category;
    this.categoryForm.patchValue({
      name: category.name,
      description: category.description
    });
  }

  createCategory() {
    this.resetForm();
  }
}
