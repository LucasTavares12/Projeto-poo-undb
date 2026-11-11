import { useCallback, useEffect, useRef, useState } from "react";
import { NotificacaoService } from "../services/NotificacaoService";
import type { Notificacao } from "../services/types";
import { AlertaDoNavegador } from "../models/AlertaDoNavegador";
import { AgendamentosAtualizados } from "../models/AgendamentosAtualizados";

const notificacaoService = new NotificacaoService();

/** De quanto em quanto tempo o painel pergunta se há novidade (ms). */
const INTERVALO = 5_000;

/** Agendamento novo abre o modal; remarcação e cancelamento ficam só no sino. */
function abreModal(notificacao: Notificacao): boolean {
  return notificacao.tipo === "NOVO_AGENDAMENTO";
}

/**
 * Avisos pendentes do painel: busca de tempos em tempos (e quando a janela volta ao foco).
 * Agendamentos novos abrem o modal com alerta sonoro; o resto espera no sino. Quando a pessoa
 * fecha o modal ou o sino, aqueles avisos saem de vez.
 */
export function useNotificacoes(ativo: boolean) {
  const [pendentes, setPendentes] = useState<Notificacao[] | null>(null);
  // Maior id já recebido: o que vier acima disso é novidade. null = primeira busca (sem som).
  const maiorConhecido = useRef<number | null>(null);
  // Já fechados nesta tela: uma busca que saiu antes do fechamento não os traz de volta.
  const fechados = useRef(new Set<number>());

  useEffect(() => {
    if (ativo) {
      AlertaDoNavegador.prepararSom();
    }
  }, [ativo]);

  const buscar = useCallback(async () => {
    try {
      const resposta = await notificacaoService.listar();
      const atuais = resposta.notificacoes.filter(
        (notificacao) => !fechados.current.has(notificacao.id)
      );
      const ultimoConhecido = maiorConhecido.current;
      if (ultimoConhecido !== null) {
        const novas = atuais.filter((notificacao) => notificacao.id > ultimoConhecido);
        const agendamentosNovos = novas.filter(abreModal);
        if (agendamentosNovos.length > 0) {
          AlertaDoNavegador.avisar(
            agendamentosNovos.length === 1
              ? agendamentosNovos[0].titulo
              : `${agendamentosNovos.length} novos agendamentos`,
            agendamentosNovos[0].mensagem,
            agendamentosNovos.length
          );
        }
        if (novas.length > 0) {
          AgendamentosAtualizados.avisar();
        }
      }
      maiorConhecido.current = Math.max(
        ultimoConhecido ?? 0,
        ...resposta.notificacoes.map((notificacao) => notificacao.id)
      );
      setPendentes(atuais);
    } catch {
      // Sem conexão agora: tenta de novo na próxima volta.
    }
  }, []);

  useEffect(() => {
    if (!ativo) {
      return;
    }
    const primeira = setTimeout(buscar, 0);
    const repetir = setInterval(buscar, INTERVALO);
    window.addEventListener("focus", buscar);
    return () => {
      clearTimeout(primeira);
      clearInterval(repetir);
      window.removeEventListener("focus", buscar);
    };
  }, [ativo, buscar]);

  /** A pessoa fechou estes avisos: somem da tela na hora e do servidor em seguida. */
  const fechar = useCallback(async (avisos: Notificacao[]) => {
    const ids = avisos.map((notificacao) => notificacao.id);
    if (ids.length === 0) {
      return;
    }
    ids.forEach((id) => fechados.current.add(id));
    setPendentes((atuais) =>
      (atuais ?? []).filter((notificacao) => !fechados.current.has(notificacao.id))
    );
    try {
      await notificacaoService.fechar(ids);
    } catch {
      // Se falhar, o servidor ainda os tem: voltam na próxima busca para não se perderem.
      ids.forEach((id) => fechados.current.delete(id));
    }
  }, []);

  const todos = pendentes ?? [];
  return {
    naoLidas: todos.length,
    /** Agendamentos novos ainda não fechados: enquanto houver, o modal fica aberto. */
    paraOModal: todos.filter(abreModal),
    /** Remarcações e cancelamentos: só no sino. */
    noSino: todos.filter((notificacao) => !abreModal(notificacao)),
    fechar,
  };
}
