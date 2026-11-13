import { RowDataPacket } from "mysql2/promise";
import { Repositorio } from "./Repositorio";
import { ErroDeConflito } from "../erros/ErroDeConflito";

interface LinhaTrava extends RowDataPacket {
  obtida: number | null;
}

/**
 * Garante que só uma operação por vez mexa na agenda de um mesmo profissional.
 *
 * Agendar (ou remarcar) é "conferir se o horário está livre" e depois "gravar". Sem trava,
 * dois clientes clicando no mesmo horário ao mesmo tempo passam os dois pela conferência
 * e o horário fica marcado duas vezes. Com a trava, o segundo espera o primeiro terminar
 * e, quando confere, já vê o horário ocupado.
 *
 * Usa a trava nomeada do próprio MySQL (GET_LOCK), então vale mesmo com mais de uma
 * instância do servidor rodando ao mesmo tempo.
 */
export class TravaDaAgenda extends Repositorio {
  /** Quanto tempo uma operação espera a outra terminar antes de desistir. */
  private static readonly ESPERA_MAXIMA_SEGUNDOS = 10;

  /**
   * Fila por profissional dentro deste servidor: as operações de um mesmo profissional
   * entram uma de cada vez, e só a da vez ocupa uma conexão do pool esperando a trava.
   */
  private static readonly filas = new Map<number, Promise<unknown>>();

  /** Executa `acao` com a agenda do profissional travada e sempre destrava no final. */
  public executar<T>(profissionalId: number, acao: () => Promise<T>): Promise<T> {
    const anterior = TravaDaAgenda.filas.get(profissionalId) ?? Promise.resolve();
    const atual = anterior
      .catch(() => undefined) // erro da operação anterior não impede a próxima
      .then(() => this.executarComTravaDoBanco(profissionalId, acao));

    TravaDaAgenda.filas.set(profissionalId, atual);
    // Fila vazia: tira do mapa para não acumular profissionais na memória.
    const limpar = () => {
      if (TravaDaAgenda.filas.get(profissionalId) === atual) {
        TravaDaAgenda.filas.delete(profissionalId);
      }
    };
    atual.then(limpar, limpar);
    return atual;
  }

  private async executarComTravaDoBanco<T>(
    profissionalId: number,
    acao: () => Promise<T>
  ): Promise<T> {
    // A trava é da sessão do MySQL: pega e solta pela mesma conexão.
    const conexao = await this.pool.getConnection();
    const nome = `agenda:${profissionalId}`;
    try {
      const [linhas] = await conexao.query<LinhaTrava[]>(
        "SELECT GET_LOCK(CONCAT(DATABASE(), ':', ?), ?) AS obtida",
        [nome, TravaDaAgenda.ESPERA_MAXIMA_SEGUNDOS]
      );
      if (linhas[0]?.obtida !== 1) {
        throw new ErroDeConflito(
          "A agenda está sendo atualizada agora. Tente de novo em alguns segundos."
        );
      }

      try {
        return await acao();
      } finally {
        await conexao.query("SELECT RELEASE_LOCK(CONCAT(DATABASE(), ':', ?))", [nome]);
      }
    } finally {
      conexao.release();
    }
  }
}
