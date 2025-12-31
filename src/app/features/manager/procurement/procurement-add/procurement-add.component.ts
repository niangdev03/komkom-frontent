import { NgIf, NgFor } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import {
  FormGroup,
  Validators,
  FormArray,
  AbstractControl,
  ValidationErrors,
  FormBuilder,
  ReactiveFormsModule,
  FormControl
} from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatDialogModule } from '@angular/material/dialog';
import { MatDividerModule } from '@angular/material/divider';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatMenuModule } from '@angular/material/menu';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatSelectModule } from '@angular/material/select';
import { MatSnackBarModule } from '@angular/material/snack-bar';
import { debounceTime, distinctUntilChanged, switchMap } from 'rxjs';
import { fadeInRight400ms } from '@vex/animations/fade-in-right.animation';
import { fadeInUp400ms } from '@vex/animations/fade-in-up.animation';
import { scaleIn400ms } from '@vex/animations/scale-in.animation';
import { stagger80ms } from '@vex/animations/stagger.animation';
import { NotificationService } from 'src/app/auth/services/Notification.service';
import { ProcurementService } from 'src/app/auth/services/procurement.service';
import { ProductService } from 'src/app/auth/services/product.service';
import { SupplierService } from 'src/app/auth/services/supplier.service';
import { Company } from 'src/app/interfaces/Company';
import { AddProcurement, Procurement } from 'src/app/interfaces/Procurement';
import { Product } from 'src/app/interfaces/Product';
import { Store } from 'src/app/interfaces/Store';
import { Supplier } from 'src/app/interfaces/Supplier';
import { Location } from '@angular/common';

@Component({
  selector: 'vex-procurement-add',
  templateUrl: './procurement-add.component.html',
  styleUrls: ['./procurement-add.component.scss'],
  standalone: true,
  animations: [stagger80ms, scaleIn400ms, fadeInRight400ms, fadeInUp400ms],
  imports: [
    ReactiveFormsModule,
    MatDialogModule,
    NgIf,
    NgFor,
    MatButtonModule,
    MatMenuModule,
    MatIconModule,
    MatDividerModule,
    MatSelectModule,
    MatFormFieldModule,
    MatInputModule,
    MatSnackBarModule,
    MatProgressBarModule
  ]
})
export class ProcurementAddComponent implements OnInit {
  products: Product[] = [];
  suppliers: Supplier[] = [];
  store!: Store;
  company!: Company;

  procurementForm!: FormGroup;
  isSubmitting: boolean = false;

  // Mode édition
  isUpdateMode: boolean = false;
  procurementToUpdate?: Procurement;

  // Contrôles de recherche
  supplierSearchCtrl = new FormControl('');
  productSearchCtrls: { [key: number]: FormControl } = {};

  // États de chargement
  isLoadingSuppliers = false;
  isLoadingProducts: { [key: number]: boolean } = {};

  constructor(
    private productService: ProductService,
    private supplierService: SupplierService,
    private procurementService: ProcurementService,
    private notificationService: NotificationService,
    private location: Location,
    private fb: FormBuilder
  ) {
    if (history.state.store && history.state.company) {
      this.store = history.state.store;
      this.company = history.state.company;

      // Vérifier si on est en mode édition
      if (history.state.isUpdateMode && history.state.procurement) {
        this.isUpdateMode = true;
        this.procurementToUpdate = history.state.procurement;
      }
    } else {
      this.goBack();
    }
  }

  ngOnInit(): void {
    this.initializeForm();
    this.getSuppliers();
    this.getProducts();
    this.setupSupplierSearch();

    // Charger les données en mode édition
    if (this.isUpdateMode && this.procurementToUpdate) {
      this.populateFormWithProcurementData();
    }
  }

  setupSupplierSearch(): void {
    this.supplierSearchCtrl.valueChanges
      .pipe(
        debounceTime(300),
        distinctUntilChanged(),
        switchMap((searchTerm) => {
          this.isLoadingSuppliers = true;
          return this.supplierService.getSupplier(
            this.store.id,
            searchTerm || ''
          );
        })
      )
      .subscribe({
        next: (response) => {
          this.suppliers = response.data;
          this.isLoadingSuppliers = false;
        },
        error: () => {
          this.isLoadingSuppliers = false;
        }
      });
  }

  setupProductSearch(lineItemIndex: number): void {
    if (!this.productSearchCtrls[lineItemIndex]) {
      this.productSearchCtrls[lineItemIndex] = new FormControl('');
    }

    this.productSearchCtrls[lineItemIndex].valueChanges
      .pipe(
        debounceTime(300),
        distinctUntilChanged(),
        switchMap((searchTerm) => {
          this.isLoadingProducts[lineItemIndex] = true;
          return this.productService.list(
            this.store.id,
            null,
            searchTerm || ''
          );
        })
      )
      .subscribe({
        next: (response) => {
          this.products = response.data;
          this.isLoadingProducts[lineItemIndex] = false;
        },
        error: () => {
          this.isLoadingProducts[lineItemIndex] = false;
        }
      });
  }

  initializeForm(): void {
    this.procurementForm = this.fb.group({
      supplier_id: [null, [Validators.required]],
      status: ['pending', [Validators.required]],
      line_items: this.fb.array([])
    });
  }

  get lineItems(): FormArray {
    return this.procurementForm.get('line_items') as FormArray;
  }

  createLineItem(): FormGroup {
    const group = this.fb.group(
      {
        product_id: [null, [Validators.required]],
        quantity: [1, [Validators.required, Validators.min(1)]],
        purchase_price: [0, [Validators.required, Validators.min(0)]],
        serial_numbers: this.fb.array([])
      },
      { validators: [this.serialNumberValidator.bind(this)] }
    );

    return group;
  }

  get serialNumbersArray(): FormArray[] {
    return this.lineItems.controls.map(
      (item) => item.get('serial_numbers') as FormArray
    );
  }

  getSerialNumbers(lineItemIndex: number): FormArray {
    return this.lineItems.at(lineItemIndex).get('serial_numbers') as FormArray;
  }

  addLineItem(): void {
    const lineItem = this.createLineItem();
    const newIndex = this.lineItems.length;
    this.lineItems.push(lineItem);
    this.setupLineItemSubscriptions(newIndex);
    this.setupProductSearch(newIndex);
  }

  setupLineItemSubscriptions(lineItemIndex: number): void {
    const lineItem = this.lineItems.at(lineItemIndex);

    // Subscribe to quantity changes
    lineItem.get('quantity')?.valueChanges.subscribe(() => {
      this.onQuantityChange(lineItemIndex);
    });

    // Subscribe to product changes
    lineItem.get('product_id')?.valueChanges.subscribe((productId) => {
      // Check if this product is already selected in another line
      if (productId && this.isProductSelected(productId, lineItemIndex)) {
        // Reset the selection
        lineItem.get('product_id')?.setValue(null, { emitEvent: false });
        this.notificationService.error('Ce produit a déjà été sélectionné');
      } else {
        this.onProductChange(lineItemIndex);
      }
    });
  }

  removeLineItem(index: number): void {
    this.lineItems.removeAt(index);
  }

  addSerialNumber(lineItemIndex: number): void {
    const serialNumbers = this.getSerialNumbers(lineItemIndex);
    serialNumbers.push(this.fb.control('', [Validators.required]));
  }

  removeSerialNumber(lineItemIndex: number, serialIndex: number): void {
    const serialNumbers = this.getSerialNumbers(lineItemIndex);
    serialNumbers.removeAt(serialIndex);
  }

  onProductChange(lineItemIndex: number): void {
    const lineItem = this.lineItems.at(lineItemIndex);
    const productId = lineItem.get('product_id')?.value;
    const product = this.products.find((p) => p.id === productId);

    const serialNumbers = this.getSerialNumbers(lineItemIndex);

    // Clear existing serial numbers
    while (serialNumbers.length > 0) {
      serialNumbers.removeAt(0);
    }

    // If product requires serial numbers, add fields based on quantity
    if (product?.require_serial_number) {
      const quantity = lineItem.get('quantity')?.value || 1;
      for (let i = 0; i < quantity; i++) {
        this.addSerialNumber(lineItemIndex);
      }
    }

    // Trigger validation on current line item
    lineItem.updateValueAndValidity();
  }

  onQuantityChange(lineItemIndex: number): void {
    const lineItem = this.lineItems.at(lineItemIndex);
    const productId = lineItem.get('product_id')?.value;
    const product = this.products.find((p) => p.id === productId);
    const quantity = lineItem.get('quantity')?.value;

    if (product?.require_serial_number) {
      const serialNumbers = this.getSerialNumbers(lineItemIndex);
      const currentLength = serialNumbers.length;

      // Adjust serial numbers array to match quantity
      if (quantity > currentLength) {
        for (let i = currentLength; i < quantity; i++) {
          this.addSerialNumber(lineItemIndex);
        }
      } else if (quantity < currentLength) {
        for (let i = currentLength - 1; i >= quantity; i--) {
          this.removeSerialNumber(lineItemIndex, i);
        }
      }
    }

    // Trigger validation
    lineItem.updateValueAndValidity();
  }

  serialNumberValidator(control: AbstractControl): ValidationErrors | null {
    const productId = control.get('product_id')?.value;
    const quantity = control.get('quantity')?.value;
    const serialNumbers = control.get('serial_numbers') as FormArray;

    const product = this.products.find((p) => p.id === productId);

    if (product?.require_serial_number) {
      if (serialNumbers.length !== quantity) {
        return { serialNumbersMismatch: true };
      }
    }

    return null;
  }

  isProductSelected(productId: number, currentLineItemIndex: number): boolean {
    if (!this.lineItems || this.lineItems.length === 0) {
      return false;
    }

    // Check if this product is selected in any other line item (not the current one)
    for (let i = 0; i < this.lineItems.length; i++) {
      if (i !== currentLineItemIndex) {
        const selectedProductId = this.lineItems.at(i).get('product_id')?.value;
        if (selectedProductId === productId) {
          return true;
        }
      }
    }

    return false;
  }

  getProducts() {
    this.productService.list(this.store.id, null).subscribe({
      next: (response) => {
        this.products = response.data;
      }
    });
  }

  getSuppliers() {
    this.supplierService.getSupplier(this.store.id).subscribe({
      next: (response) => {
        this.suppliers = response.data;
      }
    });
  }

  populateFormWithProcurementData(): void {
    if (!this.procurementToUpdate) return;

    // Définir le fournisseur
    this.procurementForm.patchValue({
      supplier_id: this.procurementToUpdate.supplier.id,
      status: this.procurementToUpdate.status
    });

    // Ajouter les line items
    this.procurementToUpdate.line_items.forEach((lineItem, index) => {
      const lineItemGroup = this.createLineItem();
      this.lineItems.push(lineItemGroup);

      // Setup subscriptions pour ce line item
      this.setupLineItemSubscriptions(index);
      this.setupProductSearch(index);

      // Remplir les données du line item
      lineItemGroup.patchValue({
        product_id: lineItem.product.id,
        quantity: parseInt(lineItem.quantity),
        purchase_price: lineItem.purchase_price
      });

      // Ajouter les numéros de série si présents
      if (lineItem.serial_numbers && lineItem.serial_numbers.length > 0) {
        const serialNumbersArray = this.getSerialNumbers(index);
        lineItem.serial_numbers.forEach((serialNumber) => {
          serialNumbersArray.push(this.fb.control(serialNumber, [Validators.required]));
        });
      }
    });
  }

  save(): void {
    if (this.procurementForm.invalid) {
      // Mark all fields as touched to show validation errors
      this.procurementForm.markAllAsTouched();
      this.notificationService.error(
        'Veuillez corriger les erreurs du formulaire'
      );
      return;
    }

    this.isSubmitting = true;

    const formValue = this.procurementForm.value;
    const data: AddProcurement = {
      store_id: this.store.id,
      supplier_id: formValue.supplier_id,
      status: formValue.status || 'pending',
      line_items: formValue.line_items.map(
        (item: {
          product_id: number;
          quantity: number;
          purchase_price: number;
          serial_numbers: string[];
        }) => ({
          product_id: item.product_id,
          quantity: item.quantity,
          purchase_price: item.purchase_price,
          serial_numbers:
            item.serial_numbers.length > 0 ? item.serial_numbers : undefined
        })
      )
    };

    // Déterminer si on fait un ajout ou une mise à jour
    const request$ = this.isUpdateMode && this.procurementToUpdate
      ? this.procurementService.update(this.procurementToUpdate.id, data)
      : this.procurementService.add(data);

    request$.subscribe({
      next: (response) => {
        this.notificationService.success(response.message);
        this.goBack();
      },
      error: (error) => {
        this.notificationService.error(error.error.message);
        this.isSubmitting = false;
      }
    });
  }

  goBack() {
    this.location.back();
  }
}
