/** Palabra del diccionario (catálogo en public.palabras_diccionario). */
export interface PalabraDiccionario {
  id: string;
  palabra: string;
  orden: number;
  created_at?: string;
}

/** Definición personal de un usuario para una palabra. */
export interface DefinicionDiccionario {
  user_id: string;
  palabra_id: string;
  definicion: string;
  created_at?: string;
  updated_at?: string;
}

/** Palabra con cantidad de significados (para Biblioteca). */
export interface PalabraConConteo extends PalabraDiccionario {
  cantidad_significados: number;
}

/** Definición mostrada en la biblioteca (con nombre del autor). */
export interface DefinicionPublica extends DefinicionDiccionario {
  author_name: string;
}
