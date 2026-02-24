export type ConsignaTipo =
  | "POESÍA"
  | "FICCIÓN"
  | "NO FICCIÓN"
  | "OTRO"
  | "RECURSOS"
  | "TEMAS";

export interface Consigna {
  id: string;
  titulo: string;
  descripcion: string;
  tipo: ConsignaTipo;
  orden: number;
  formato_id?: string | null;
  created_at: string;
  updated_at: string;
  /** Nombre del formato cuando se hace join con formatos_texto */
  formatos_texto?: { nombre: string } | null;
}
