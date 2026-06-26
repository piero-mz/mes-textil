// ── SS-05: Administración ──
export interface Usuario {
  id: number
  username: string
  nombre: string
  email: string
  password: string
  rol: string
  activo: boolean
  created_at?: string
}

export interface Rol {
  id: number
  descripcion: string
}

export interface Permiso {
  id: number
  nombre: string
  descripcion: string
}

export interface Sesion {
  id: number
  fechaHoraInicio: string
  fechaHoraFin: string
  estadoSesion: string
  idUsuario: number
}

// ── SS-01: Planificación ──
export interface OrdenProduccion {
  id: number
  codigo: string
  producto: string
  cantidad_m: number
  fecha_inicio: string
  estado: string
  responsable: number
  created_at?: string
}

export interface Lote {
  id: number
  codigo: string
  orden_id: number
  etapa_actual: string
  avance_pct: number
  created_at?: string
  orden_produccion?: OrdenProduccion
}

// ── SS-02: Ejecución de Planta ──
export interface AvanceProduccion {
  id: number
  lote_id: number
  estacion: string
  hora_inicio?: string
  hora_fin?: string
  metros_prod: number
  observacion?: string
  operario: number
}

export interface Merma {
  id: number
  lote_id: number
  estacion: string
  cantidad_kg: number
  porcentaje: number
  operario: number
  fecha?: string
}

// ── SS-03: Calidad y Trazabilidad ──
export interface ControlCalidad {
  id: number
  lote_id: number
  punto_control: string
  resultado: string
  defectos?: string
  acciones?: string
  coordinador: number
  fecha?: string
  lote?: Lote
}

// ── SS-04: Reportes y BI ──
export interface Reporte {
  id: number
  tipo: string
  periodo: string
  formato: string
  fechaGeneracion: string
}

export interface KPI {
  id: number
  nombre: string
  valor: number
  fechaCalculo: string
  idReporte: number
}
