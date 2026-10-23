export type Rol = 'ESTUDIANTE' | 'DOCENTE' | 'ADMIN';
export type Nivel = 'FACIL' | 'MEDIO' | 'DIFICIL';
export type TipoEjercicio = 'OPCION_MULTIPLE' | 'PSEUDOCODIGO';

export interface Usuario {
  id: string | number;
  nombre: string;
  correo?: string;
  correo_institucional?: string;
  rol?: Rol;
  rol_codigo?: Rol;
  rol_id?: number;
  activo?: boolean;
  creado_en?: string;
  email_verificado?: boolean;
  telefono?: string | null;
  direccion?: string | null;
  ciudad?: string | null;
}

export interface Semestre {
  id: number;
  numero: number;
  nombre: string;
  estado: 'ACTIVO' | 'PROXIMAMENTE';
}

export interface Asignatura {
  id: number;
  nombre: string;
  orden: number;
  tiene_contenido?: boolean;
}

export interface TemaResumen {
  id: number;
  titulo: string;
  descripcion: string;
  dificultad_base: Nivel;
  orden: number;
}

export interface Video {
  id: number;
  titulo: string;
  url_youtube: string;
  duracion_seg: number;
  orden: number;
}

export interface TemaDetalle extends TemaResumen {
  asignatura_id: number;
  asignatura: string;
  semestre_numero: number;
  videos: Video[];
}

export interface Opcion {
  id: number;
  texto: string;
  orden: number;
}

export interface Ejercicio {
  id: number;
  nivel: Nivel;
  tipo: TipoEjercicio;
  titulo: string;
  enunciado: string;
  codigo_referencia: string | null;
  pista: string | null;
  puntos_ponderados: number;
  orden: number;
  opciones: Opcion[];
}

export interface LogroOtorgado {
  codigo: string;
  nombre: string;
  puntos: number;
}

export interface ResultadoValidacion {
  correcta: boolean;
  puntos: number;
  intento: number;
  primerIntento: boolean;
  explicacion: string | null;
  retroalimentacionOpcion?: string | null;
  opcionCorrectaId: number | null;
  logros: LogroOtorgado[];
}

export interface ProgresoTema {
  tema_id: number;
  tema: string;
  ejercicios_resueltos: number;
  puntos: number;
  actualizado_en: string;
}

export interface Logro {
  id: number;
  codigo: string;
  nombre: string;
  descripcion: string;
  puntos: number;
  obtenido: boolean;
  obtenido_en: string | null;
}

export interface Stats {
  puntos_totales: number;
  aciertos: number;
  intentos: number;
  racha_actual: number;
  racha_maxima: number;
  dias_activos: number;
}
