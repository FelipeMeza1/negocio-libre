import { NgModule } from '@angular/core';
import { PreloadAllModules, RouterModule, Routes } from '@angular/router';

const routes: Routes = [
  {
    path: '',
    redirectTo: 'inicio',
    pathMatch: 'full'
  },
  {
    path: 'inicio',
    loadChildren: () => import('./pages/inicio/inicio.module').then( m => m.InicioPageModule)
  },
  {
    path: 'registro-cliente',
    loadChildren: () => import('./pages/registro-cliente/registro-cliente.module').then( m => m.RegistroClientePageModule)
  },
  {
    path: 'registro-vendedor',
    loadComponent: () => import('./pages/registro-vendedor/registro-vendedor.page').then( m => m.RegistroVendedorPage)
  },
  {
  path: 'login',
  loadChildren: () => import('./pages/login/login.module').then( m => m.LoginPageModule)
  },
  {
    path: 'dashboard-usuario',
    loadChildren: () => import('./pages/dashboard-usuario/dashboard-usuario.module').then( m => m.DashboardUsuarioPageModule)
  },
  {
    path: 'gestion-vendedor',
    loadComponent: () => import('./pages/gestion-vendedor/gestion-vendedor.page').then( m => m.GestionVendedorPage),
    children: [
      {
        path: 'productos', // Pestaña 1
        loadComponent: () => import('./pages/gestion-productos/gestion-productos.page').then( m => m.GestionProductosPage)
      },
      {
        path: 'ubicacion', // Pestaña 2
        // Carga la página del mapa que YA TENÍAS
        loadComponent: () => import('./pages/dashboard-vendedor/dashboard-vendedor.page').then( m => m.DashboardVendedorPage)
      },
      {
        path: 'perfil', // Pestaña 3 (¡CORRECCIÓN!)
        // Ahora cargamos el nuevo componente que acabamos de crear
        loadComponent: () => import('./pages/perfil-vendedor/perfil-vendedor.page').then( m => m.PerfilVendedorPage)
      },
      {
        path: '', // Ruta por defecto (vacía)
        redirectTo: 'productos', // Redirige a la 1ra pestaña
        pathMatch: 'full'
      }
    ]
  }
];

@NgModule({
  imports: [
    RouterModule.forRoot(routes, { preloadingStrategy: PreloadAllModules })
  ],
  exports: [RouterModule]
})
export class AppRoutingModule { }