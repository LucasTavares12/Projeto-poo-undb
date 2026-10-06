import { useOutletContext } from "react-router-dom";
import type { UsuarioLogado } from "../services/types";

/**
 * Quem está logado no painel (e, se for de um profissional, qual). Fornecido pelo
 * AdminLayout para todas as páginas do painel.
 */
export function useUsuarioLogado(): UsuarioLogado {
  return useOutletContext<UsuarioLogado>();
}
