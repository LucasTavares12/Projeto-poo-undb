import { useEffect, useState } from "react";
import { ConfiguracaoService } from "../services/ConfiguracaoService";
import type { Configuracoes } from "../services/types";

const configuracaoService = new ConfiguracaoService();

/** Configurações do sistema; `null` enquanto carrega ou se o servidor não responder. */
export function useConfiguracoes(): Configuracoes | null {
  const [configuracoes, setConfiguracoes] = useState<Configuracoes | null>(null);

  useEffect(() => {
    let cancelado = false;
    configuracaoService
      .obter()
      .then((resultado) => {
        if (!cancelado) {
          setConfiguracoes(resultado);
        }
      })
      .catch(() => {
        // Sem resposta, cada tela usa o comportamento mais seguro (ex: esconder os botões).
      });
    return () => {
      cancelado = true;
    };
  }, []);

  return configuracoes;
}
