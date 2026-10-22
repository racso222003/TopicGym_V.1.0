import { Routes } from '@angular/router';
import { authGuard } from './core/guards/auth.guard';
import { publicGuard } from './core/guards/public.guard';

export const routes: Routes = [
  {
    path: 'auth/verify/:token',
    loadComponent: () => import('./features/verificar-correo/verificar-correo').then((m) => m.VerificarCorreo),
  },
  {
    path: 'login',
    canActivate: [publicGuard],
    loadComponent: () => import('./features/login/login').then((m) => m.Login),
  },
  {
    path: 'registro',
    canActivate: [publicGuard],
    loadComponent: () => import('./features/registro/registro').then((m) => m.Registro),
  },
  {
    path: 'teacher-dashboard',
    canActivate: [authGuard],
    loadComponent: () => import('./features/teacher-dashboard/teacher-dashboard').then((m) => m.TeacherDashboard),
  },
  {
    path: '',
    canActivate: [authGuard],
    loadComponent: () => import('./layout/shell/shell').then((m) => m.Shell),
    children: [
      { path: '', pathMatch: 'full', redirectTo: 'dashboard' },
      {
        path: 'dashboard',
        loadComponent: () => import('./features/dashboard/dashboard').then((m) => m.Dashboard),
      },
      {
        path: 'catalogo',
        loadComponent: () => import('./features/catalogo/catalogo').then((m) => m.Catalogo),
      },
      {
        path: 'tema/:temaId',
        loadComponent: () => import('./features/tema/tema').then((m) => m.Tema),
      },
      {
        path: 'logica/:temaId',
        loadComponent: () => import('./features/logica/logica').then((m) => m.Logica),
      },
      {
        path: 'progreso',
        loadComponent: () => import('./features/progreso/progreso').then((m) => m.Progreso),
      },
      {
        path: 'logros',
        loadComponent: () => import('./features/logros/logros').then((m) => m.Logros),
      },
      {
        path: 'perfil',
        loadComponent: () => import('./features/perfil/perfil').then((m) => m.Perfil),
      },
    ],
  },
  { path: '**', redirectTo: '' },
];
