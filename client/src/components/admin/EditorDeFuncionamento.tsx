import { useState } from "react";
import type { FormEvent } from "react";
import { HorarioDeFuncionamento } from "../../models/HorarioDeFuncionamento";
import type { LinhaDeEdicao } from "../../models/HorarioDeFuncionamento";
import type { HorarioFuncionamentoJSON } from "../../services/types";
import { ConfiguracaoService } from "../../services/ConfiguracaoService";
import { ConfiguracoesCompartilhadas } from "../../models/ConfiguracoesCompartilhadas";

const configuracaoService = new ConfiguracaoService();

interface Props {
  /** O que está salvo (null = ainda não definido), como veio das configurações. */
  salvo: HorarioFuncionamentoJSON | null;
  /** Só quem administra a clínica altera; os demais só veem. */
  podeEditar: boolean;
}

/**
 * Aba "Horários" > "Funcionamento da clínica": os dias da semana em que a clínica abre e o
 * horário de cada um. Limita os horários que os profissionais podem liberar na grade (e,
 * com isso, os que o cliente pode agendar) e aparece na página do cliente como
 * "Aberto agora / Fechado".
 */
export function EditorDeFuncionamento({ salvo, podeEditar }: Props) {
  const funcionamento = HorarioDeFuncionamento.de(salvo);
  const [linhas, setLinhas] = useState<LinhaDeEdicao[]>(() =>
    HorarioDeFuncionamento.paraEdicao(funcionamento)
  );
  // Volta para o que está salvo quando o funcionamento muda por fora (ex: acabou de salvar).
  const [salvoAnterior, setSalvoAnterior] = useState(salvo);
  if (salvo !== salvoAnterior) {
    setSalvoAnterior(salvo);
    setLinhas(HorarioDeFuncionamento.paraEdicao(funcionamento));
  }
  const [salvando, setSalvando] = useState(false);
  const [mensagem, setMensagem] = useState<string | null>(null);
  const [erro, setErro] = useState<string | null>(null);

  function alterar(diaSemana: number, mudanca: Partial<LinhaDeEdicao>): void {
    setLinhas((atual) =>
      atual.map((linha) => (linha.diaSemana === diaSemana ? { ...linha, ...mudanca } : linha))
    );
    setMensagem(null);
    setErro(null);
  }

  /** "Repetir em todos": o horário do primeiro dia aberto vale para os outros dias abertos. */
  function repetirPrimeiroHorario(): void {
    const modelo = linhas.find((linha) => linha.aberto);
    if (!modelo) {
      return;
    }
    setLinhas((atual) =>
      atual.map((linha) =>
        linha.aberto ? { ...linha, abertura: modelo.abertura, fechamento: modelo.fechamento } : linha
      )
    );
    setMensagem(null);
  }

  async function salvar(evento: FormEvent): Promise<void> {
    evento.preventDefault();
    const problema = HorarioDeFuncionamento.validarEdicao(linhas);
    if (problema) {
      setErro(problema);
      return;
    }
    setSalvando(true);
    setErro(null);
    setMensagem(null);
    try {
      const atualizadas = await configuracaoService.atualizar({
        horarioFuncionamento: HorarioDeFuncionamento.jsonDaEdicao(linhas),
      });
      ConfiguracoesCompartilhadas.instancia().publicar(atualizadas);
      setMensagem("Funcionamento salvo. A grade abaixo já segue os novos horários.");
    } catch (erroRequisicao) {
      setErro((erroRequisicao as Error).message);
    } finally {
      setSalvando(false);
    }
  }

  if (!podeEditar) {
    return (
      <section className="admin-formulario funcionamento">
        <h2>Funcionamento da clínica</h2>
        {funcionamento ? (
          <ul className="funcionamento-resumo">
            {funcionamento.linhasDaSemana().map((linha) => (
              <li key={linha.dia.numero} className={linha.aberto ? "" : "fechado"}>
                <span>{linha.dia.nome}</span>
                <span>{linha.texto}</span>
              </li>
            ))}
          </ul>
        ) : (
          <p className="admin-dica">A clínica ainda não definiu o horário de funcionamento.</p>
        )}
        <p className="admin-dica">Só os administradores da clínica alteram o funcionamento.</p>
      </section>
    );
  }

  return (
    <form className="admin-formulario funcionamento" onSubmit={salvar}>
      <h2>Funcionamento da clínica</h2>
      <p className="admin-dica funcionamento-dica">
        Escolha os dias em que a clínica abre e o horário de cada um. Os profissionais só
        conseguem liberar horários dentro desse período, e a página de agendamento mostra se a
        clínica está aberta ou fechada.
        {!funcionamento && " Ainda não está definido: por enquanto a grade não tem limite."}
      </p>

      <ul className="funcionamento-dias">
        {linhas.map((linha) => {
          const dia = HorarioDeFuncionamento.diaPorNumero(linha.diaSemana);
          return (
            <li key={linha.diaSemana} className={linha.aberto ? "" : "fechado"}>
              <label className="funcionamento-dia">
                <input
                  type="checkbox"
                  className="admin-interruptor"
                  checked={linha.aberto}
                  onChange={(evento) => alterar(linha.diaSemana, { aberto: evento.target.checked })}
                />
                <span>{dia.nome}</span>
              </label>
              {linha.aberto ? (
                <span className="funcionamento-intervalo">
                  <select
                    aria-label={`Abertura de ${dia.nome}`}
                    value={linha.abertura}
                    onChange={(evento) => alterar(linha.diaSemana, { abertura: evento.target.value })}
                  >
                    {HorarioDeFuncionamento.OPCOES_DE_HORARIO.map((hora) => (
                      <option key={hora} value={hora}>
                        {hora}
                      </option>
                    ))}
                  </select>
                  <span aria-hidden="true">até</span>
                  <select
                    aria-label={`Fechamento de ${dia.nome}`}
                    value={linha.fechamento}
                    onChange={(evento) =>
                      alterar(linha.diaSemana, { fechamento: evento.target.value })
                    }
                  >
                    {HorarioDeFuncionamento.OPCOES_DE_HORARIO.map((hora) => (
                      <option key={hora} value={hora}>
                        {hora}
                      </option>
                    ))}
                  </select>
                </span>
              ) : (
                <span className="funcionamento-fechado">Fechado</span>
              )}
            </li>
          );
        })}
      </ul>

      {erro && <p className="mensagem-erro admin-mensagem">{erro}</p>}

      <div className="admin-acoes funcionamento-acoes">
        <button type="submit" className="admin-botao principal" disabled={salvando}>
          {salvando ? "Salvando..." : "Salvar funcionamento"}
        </button>
        <button type="button" className="admin-botao" onClick={repetirPrimeiroHorario}>
          Repetir o 1º horário nos outros dias
        </button>
      </div>
      {mensagem && <p className="mensagem-sucesso admin-mensagem">{mensagem}</p>}
    </form>
  );
}
