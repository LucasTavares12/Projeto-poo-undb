import { useEffect, useSyncExternalStore } from "react";
import { ConfiguracoesCompartilhadas } from "../models/ConfiguracoesCompartilhadas";
import type { Configuracoes } from "../services/types";

/**
 * Configurações do sistema; `null` enquanto carrega ou se o servidor não responder.
 * A tela é redesenhada sozinha quando alguém publica configurações novas.
 */
export function useConfiguracoes(): Configuracoes | null {
  const compartilhadas = ConfiguracoesCompartilhadas.instancia();
  const configuracoes = useSyncExternalStore(compartilhadas.inscrever, compartilhadas.obter);
  useEffect(() => compartilhadas.carregar(), [compartilhadas]);
  return configuracoes;
}
