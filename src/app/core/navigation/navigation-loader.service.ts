import { Injectable } from '@angular/core';
import { VexLayoutService } from '@vex/services/vex-layout.service';
import { NavigationItem } from './navigation-item.interface';
import { BehaviorSubject, filter, map, Observable, take } from 'rxjs';
import { AuthService } from 'src/app/auth/services/auth.service';

@Injectable({
  providedIn: 'root'
})
export class NavigationLoaderService {
  private readonly _items: BehaviorSubject<NavigationItem[]> =
    new BehaviorSubject<NavigationItem[]>([]);

  get items$(): Observable<NavigationItem[]> {
    return this._items.asObservable();
  }

  constructor(
    private readonly layoutService: VexLayoutService,
    private authService: AuthService
  ) {
    this.loadNavigationBasedOnRole();
  }

  loadNavigationBasedOnRole(): void {
    this.authService
      .getCurrentUser()
      .pipe(
        take(1),
        filter((user) => user !== null),
        map((user) => this.buildNavigationForRole(user!.role.name))
      )
      .subscribe((navigation) => {
        this._items.next(navigation);
      });
  }

  private buildNavigationForRole(roleName: string): NavigationItem[] {
    switch (roleName) {
      case 'Admin':
        return this.getAdminNavigation();
      case 'Owner':
        return this.getOwnerNavigation();
      case 'Manager':
        return this.getManagerNavigation();
      case 'Seller':
        return this.getSellerNavigation();
      default:
        return this.getDefaultNavigation();
    }
  }

  private getAdminNavigation(): NavigationItem[] {
    return [
      {
        type: 'subheading',
        label: 'Administrateur',
        children: [
          {
            type: 'link',
            label: 'Gestion Entreprise',
            route: '/index/admin/company/list',
            icon: 'mat:analytics'
          }
        ]
      },
      {
        type: 'subheading',
        label: 'Configuration Système',
        children: [
          {
            type: 'link',
            label: 'Paramètres Généraux',
            route: '/admin/settings',
            icon: 'mat:settings'
          }
        ]
      }
    ];
  }

  private getOwnerNavigation(): NavigationItem[] {
    return [
      {
        type: 'subheading',
        label: 'Tableaux de Bord',
        children: [
          {
            type: 'link',
            label: 'Mes boutiques',
            route: '/index/owner/stores',
            icon: 'mat:storefront',
            routerLinkActiveOptions: { exact: true }
          }
        ]
      },
      {
        type: 'subheading',
        label: 'Gestion Business',
        children: [
          {
            type: 'link',
            label: 'Mon Entreprise',
            route: '/index/owner/my-company',
            icon: 'mat:store'
          },
          {
            type: 'link',
            label: 'Utilisateurs',
            route: '/index/owner/users',
            icon: 'mat:supervisor_account'
          }
        ]
      }
    ];
  }

  private getManagerNavigation(): NavigationItem[] {
    return [
      {
        type: 'subheading',
        label: 'Gestion des utilisateurs',
        children: [
          {
            type: 'link',
            label: 'Accueil',
            route: '/index/manager/home',
            icon: 'mat:home',
            routerLinkActiveOptions: { exact: true }
          },
          {
            type: 'link',
            label: 'Clients',
            route: '/index/manager/customer',
            icon: 'mat:person',
            routerLinkActiveOptions: { exact: true }
          },
          {
            type: 'link',
            label: 'Fournisseurs',
            route: '/index/manager/supplier',
            icon: 'mat:local_mall',
            routerLinkActiveOptions: { exact: true }
          }
        ]
      },
      {
        type: 'subheading',
        label: 'Gestion des produits',
        children: [
          {
            type: 'link',
            label: 'Catégories',
            route: '/index/manager/category',
            icon: 'mat:category',
            routerLinkActiveOptions: { exact: true }
          },
          {
            type: 'link',
            label: 'Produits',
            route: '/index/manager/product',
            icon: 'mat:inventory_2',
            routerLinkActiveOptions: { exact: true }
          },
          {
            type: 'link',
            label: 'Approvisionnements',
            route: '/index/manager/procurement/list',
            icon: 'mat:local_shipping',
            routerLinkActiveOptions: { exact: true }
          }
        ]
      },
      {
        type: 'subheading',
        label: 'Gestion des ventes',
        children: [
          {
            type: 'dropdown',
            label: 'Point de vente',
            icon: 'mat:point_of_sale',
            children: [
              {
                type: 'link',
                label: 'Liste des ventes',
                route: '/index/manager/sale/list',
                routerLinkActiveOptions: { exact: true }
              },
              {
                type: 'link',
                label: 'Nouvelle vente',
                route: '/index/manager/sale/add',
                routerLinkActiveOptions: { exact: true }
              }
            ]
          },
          {
            type: 'link',
            label: 'Factures & reçus',
            route: '/index/manager/invoice',
            icon: 'mat:receipt_long',
            routerLinkActiveOptions: { exact: true }
          }
        ]
      },
      {
        type: 'subheading',
        label: 'Finances',
        children: [
          {
            type: 'link',
            label: 'Dépenses quotidiennes',
            route: '/index/manager/expense',
            icon: 'mat:attach_money',
            routerLinkActiveOptions: { exact: true }
          }
        ]
      }
    ];
  }

  private getSellerNavigation(): NavigationItem[] {
    return [
      {
        type: 'subheading',
        label: 'Tableaux de Bord',
        children: [
          {
            type: 'link',
            label: 'Accueil',
            route: '/index/manager/home',
            icon: 'mat:home',
            routerLinkActiveOptions: { exact: true }
          }
        ]
      },
      {
        type: 'subheading',
        label: 'Gestion des produits',
        children: [
          {
            type: 'link',
            label: 'Catégories',
            route: '/index/manager/category',
            icon: 'mat:category',
            routerLinkActiveOptions: { exact: true }
          },
          {
            type: 'link',
            label: 'Produits',
            route: '/index/manager/product',
            icon: 'mat:inventory_2',
            routerLinkActiveOptions: { exact: true }
          }
        ]
      },
      {
        type: 'subheading',
        label: 'Ventes',
        children: [
          {
            type: 'link',
            label: 'Nouvelle Vente',
            route: '/index/manager/sale/add',
            icon: 'mat:add_shopping_cart'
          },
          {
            type: 'link',
            label: 'Mes Ventes',
            route: '/index/manager/sale/list',
            icon: 'mat:receipt'
          },
          {
            type: 'link',
            label: 'Clients',
            route: '/index/manager/customer',
            icon: 'mat:person',
            routerLinkActiveOptions: { exact: true }
          },
          {
            type: 'link',
            label: 'Factures & reçus',
            route: '/index/manager/invoice',
            icon: 'mat:receipt_long',
            routerLinkActiveOptions: { exact: true }
          }
        ]
      }
    ];
  }

  private getDefaultNavigation(): NavigationItem[] {
    return [
      {
        type: 'subheading',
        label: 'Tableaux de Bord',
        children: [
          {
            type: 'link',
            label: 'Tableau de Bord',
            route: '/',
            icon: 'mat:dashboard',
            routerLinkActiveOptions: { exact: true }
          }
        ]
      }
    ];
  }

  // Méthode pour rafraîchir la navigation
  refreshNavigation(): void {
    this.loadNavigationBasedOnRole();
  }

  // Méthode pour obtenir la navigation basée sur un rôle spécifique
  getNavigationForRole(roleName: string): NavigationItem[] {
    return this.buildNavigationForRole(roleName);
  }
}
