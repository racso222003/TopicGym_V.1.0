import { Component, computed, inject, OnInit, signal } from '@angular/core';
import { DatePipe } from '@angular/common';
import { Router } from '@angular/router';
import { AlumnoProgreso, CodigoClase, TeachersService } from '../../core/services/teachers.service';
import { AuthService } from '../../core/services/auth.service';

@Component({
  selector: 'app-teacher-dashboard',
  imports: [DatePipe],
  templateUrl: './teacher-dashboard.html',
  styleUrl: './teacher-dashboard.css',
})
export class TeacherDashboard implements OnInit {
  private readonly teachersService = inject(TeachersService);
  private readonly auth = inject(AuthService);
  private readonly router = inject(Router);

  readonly usuario = this.auth.usuario;
  readonly cargandoCodigos = signal(false);
  readonly cargandoAlumnos = signal(false);
  readonly generandoCodigo = signal(false);
  readonly error = signal<string | null>(null);
  readonly exito = signal<string | null>(null);
  readonly vistaActiva = signal<'seguimiento' | 'codigos'>('seguimiento');
  readonly drawerAbierto = signal(false);
  readonly alumnoSeleccionado = signal<AlumnoProgreso | null>(null);

  readonly codigos = signal<CodigoClase[]>([]);
  readonly alumnos = signal<AlumnoProgreso[]>([]);
  readonly asignaturas = signal<any[]>([]);
  readonly asignaturaSeleccionada = signal<number | null>(null);

  readonly codigosActivos = computed(() => this.codigos().filter((c) => c.activo));
  readonly totalAlumnos = computed(() => this.alumnos().length);
  readonly totalPuntos = computed(() =>
    this.alumnos().reduce((acc, a) => acc + Number(a.puntos_totales || 0), 0),
  );
  readonly totalEjercicios = computed(() =>
    this.alumnos().reduce((acc, a) => acc + Number(a.ejercicios_resueltos || 0), 0),
  );

  ngOnInit(): void {
    this.cargarAsignaturas();
    this.cargarCodigos();
    this.cargarAlumnos();
  }

  cargarAsignaturas(): void {
    this.teachersService.listarAsignaturas().subscribe({
      next: (res: any) => {
        this.asignaturas.set(res.asignaturas ?? []);
      },
      error: () => {
        // no bloquear si falla
      },
    });
  }

  cargarCodigos(): void {
    this.cargandoCodigos.set(true);
    this.teachersService.listarCodigos().subscribe({
      next: (res) => {
        this.codigos.set(res.codigos ?? []);
        this.cargandoCodigos.set(false);
      },
      error: (err) => {
        this.cargandoCodigos.set(false);
        this.error.set(err?.error?.error ?? 'No se pudieron cargar los códigos de clase.');
      },
    });
  }

  cargarAlumnos(): void {
    this.cargandoAlumnos.set(true);
    this.teachersService.obtenerProgresoAlumnos().subscribe({
      next: (res) => {
        this.alumnos.set(res.alumnos ?? []);
        this.cargandoAlumnos.set(false);
      },
      error: (err) => {
        this.cargandoAlumnos.set(false);
        this.error.set(err?.error?.error ?? 'No se pudo cargar el progreso de los alumnos.');
      },
    });
  }

  generarCodigo(): void {
    this.generandoCodigo.set(true);
    this.error.set(null);
    this.exito.set(null);

    this.teachersService.generarCodigo(this.asignaturaSeleccionada()).subscribe({
      next: (res) => {
        this.generandoCodigo.set(false);
        this.exito.set(`Código generado: ${res.codigo.codigo}`);
        this.cargarCodigos();
        this.cargarAlumnos();
        setTimeout(() => this.exito.set(null), 4000);
      },
      error: (err) => {
        this.generandoCodigo.set(false);
        this.error.set(err?.error?.error ?? 'No se pudo generar un nuevo código de clase.');
      },
    });
  }

  refrescarTodo(): void {
    this.error.set(null);
    this.cargarCodigos();
    this.cargarAlumnos();
  }

  setVista(vista: 'seguimiento' | 'codigos'): void {
    this.vistaActiva.set(vista);
  }

  verDetalle(alumno: AlumnoProgreso): void {
    this.alumnoSeleccionado.set(alumno);
    this.drawerAbierto.set(true);
  }

  cerrarDetalle(): void {
    this.drawerAbierto.set(false);
    this.alumnoSeleccionado.set(null);
  }

  cerrarSesion(): void {
    this.auth.logout().subscribe({
      next: () => this.router.navigateByUrl('/login'),
      error: () => this.router.navigateByUrl('/login'),
    });
  }

  inicialAlumno(nombre: string | undefined): string {
    return (nombre?.trim().charAt(0) || '?').toUpperCase();
  }
}

