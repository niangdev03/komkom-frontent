import { NgIf, NgFor } from '@angular/common';
import { Component } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatMenuModule } from '@angular/material/menu';
import { MatTabsModule } from '@angular/material/tabs';
import { MatTooltipModule } from '@angular/material/tooltip';
import { Router } from '@angular/router';
import { fadeInRight400ms } from '@vex/animations/fade-in-right.animation';
import { scaleIn400ms } from '@vex/animations/scale-in.animation';
import { VexPageLayoutComponent } from '@vex/components/vex-page-layout/vex-page-layout.component';
import { AuthService } from 'src/app/auth/services/auth.service';
import { Store } from 'src/app/interfaces/Store';
import { CurrentUserAuth } from 'src/app/response-type/Type';
import { CompanyStoreAddComponent } from '../../admin/company/company-store-add/company-store-add.component';
import { MatDialog } from '@angular/material/dialog';

@Component({
  selector: 'vex-company-home',
  templateUrl: './company-home.component.html',
  styleUrls: ['./company-home.component.scss'],
  animations: [scaleIn400ms, fadeInRight400ms],
  standalone: true,
  imports: [VexPageLayoutComponent, NgIf, MatTabsModule, NgFor, MatMenuModule , MatIconModule, MatIconModule, MatTooltipModule, MatButtonModule]
})
export class CompanyHomeComponent {
  userConnet:CurrentUserAuth | null = null;
    constructor(
      private authService: AuthService,
      private router: Router,
      private dialog:MatDialog
    ) {
    }

  ngOnInit() {
    this.initData();
  }

  initData(){
    this.authService.getUserAuth().subscribe({
        next:(response)=>{
          this.userConnet = response;
        }
      })
  }

    // Dans votre composant TypeScript
  goToStore(store: Store) {
    this.router.navigate(['/index/owner/store'],{ state: { store:store, company:this.userConnet?.company}})
  }

    editStore(store:Store) {
      const dialogRef = this.dialog.open(CompanyStoreAddComponent, {
        width: '800px',
        disableClose: true,
        data: {
          isUpdateMode: true,
          title: "Modifier la boutique",
          company: this.userConnet?.company,
          store:store
        }
      });

      dialogRef.afterClosed().subscribe((result) => {
        if (result) {
          this.initData();
        }
      });
    }
}
