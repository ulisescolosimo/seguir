/** Recurso de escritura (tabla public.recursos). El admin puede marcar uno como destacado. */
export interface Recurso {
  id: string;
  titulo: string;
  descripcion: string;
  ejemplo_label: string | null;
  ejemplo_texto: string | null;
  destacado: boolean;
  orden: number;
  created_at?: string;
  updated_at?: string;
}

/** Respuesta de Supabase puede devolver snake_case; usamos este tipo para las filas. */
export type RecursoRow = Recurso;
