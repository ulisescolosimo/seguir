/** Formato del texto (catálogo en public.formatos_texto). */
export interface Formato {
  id: string;
  nombre: string;
  categoria: "ficcion" | "no_ficcion";
  orden: number;
  created_at?: string;
  updated_at?: string;
}

/** Agrupado por categoría para el selector (Ficción / No ficción). */
export type FormatosPorCategoria = {
  ficcion: Formato[];
  no_ficcion: Formato[];
};
