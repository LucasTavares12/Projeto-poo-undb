import { useEffect } from "react";
import { useConfiguracoes } from "../hooks/useConfiguracoes";
import { Clinica } from "../models/Clinica";
import { TemaDaClinica } from "../models/TemaDaClinica";

/**
 * Aplica em todo o site o visual escolhido na aba "Personalização": cores, nome da clínica
 * (título da aba do navegador e mensagens) — e atualiza na hora quando o admin salva.
 * Não desenha nada na tela.
 */
export function VisualDaClinica() {
  const configuracoes = useConfiguracoes();
  const corPrincipal = configuracoes?.corPrincipal ?? null;
  const corLateral = configuracoes?.corLateral ?? null;
  const nome = configuracoes?.nomeClinica;

  useEffect(() => {
    new TemaDaClinica(corPrincipal, corLateral).aplicar();
  }, [corPrincipal, corLateral]);

  useEffect(() => {
    Clinica.definirNome(nome);
    document.title = Clinica.nome();
  }, [nome]);

  return null;
}
