import { useEffect, useState } from "react";
import { RelatorioService } from "../../services/RelatorioService";
import { ProfissionalService } from "../../services/ProfissionalService";
import type { Profissional, RelatorioMensal } from "../../services/types";
import { MesReferencia } from "../../models/MesReferencia";
import { Dinheiro } from "../../models/Dinheiro";
import { DataAgenda } from "../../models/DataAgenda";
import { CabecalhoPagina } from "../../components/admin/CabecalhoPagina";
import { useUsuarioLogado } from "../../hooks/useUsuarioLogado";
import { GraficoFaturamentoDiario } from "../../components/admin/GraficoFaturamentoDiario";
import { GraficoRanking } from "../../components/admin/GraficoRanking";
import {
  IconeCalendario,
  IconeConfirmado,
  IconeDinheiro,
  IconeSetaDireita,
  IconeSetaEsquerda,
  IconeTendencia,
} from "../../components/Icones";

const relatorioService = new RelatorioService();
const profissionalService = new ProfissionalService();

/** Relatório do mês escolhido e do mês anterior (para a comparação do faturamento). */
interface DadosDoMes {
  consulta: string;
  atual: RelatorioMensal;
  anterior: RelatorioMensal;
}

export function RelatoriosPage() {
  // Conta ligada a um profissional: o relatório é sempre o dele (o servidor também garante isso).
  const { profissionalId: proprioId } = useUsuarioLogado();
  const [mes, setMes] = useState<MesReferencia>(() => MesReferencia.atual());
  // null = todos os profissionais juntos
  const [profissionalId, setProfissionalId] = useState<number | null>(proprioId);
  const [profissionais, setProfissionais] = useState<Profissional[]>([]);

  const [dados, setDados] = useState<DadosDoMes | null>(null);
  const [erro, setErro] = useState<{ consulta: string; mensagem: string } | null>(null);

  // Mês + profissional: quando qualquer um dos dois muda, é outra consulta.
  const consulta = `${mes.toString()}|${profissionalId ?? "todos"}`;

  useEffect(() => {
    profissionalService
      .listar()
      .then(setProfissionais)
      .catch(() => {
        // Sem a lista, o filtro mostra só "Todos"; o relatório continua funcionando.
      });
  }, []);

  useEffect(() => {
    let cancelado = false;
    const chave = `${mes.toString()}|${profissionalId ?? "todos"}`;

    Promise.all([
      relatorioService.mensal(mes.toString(), profissionalId),
      relatorioService.mensal(mes.anterior().toString(), profissionalId),
    ])
      .then(([atual, anterior]) => {
        if (!cancelado) {
          setDados({ consulta: chave, atual, anterior });
        }
      })
      .catch((erroRequisicao: Error) => {
        if (!cancelado) {
          setErro({ consulta: chave, mensagem: erroRequisicao.message });
        }
      });

    return () => {
      cancelado = true;
    };
  }, [mes, profissionalId]);

  const mensagemErro = erro?.consulta === consulta ? erro.mensagem : null;
  // Enquanto a consulta nova carrega, a anterior continua na tela (mais apagada), sem "piscar".
  const atualizando = dados?.consulta !== consulta && !mensagemErro;
  const podeAvancar = !mes.proximo().ehDepoisDe(MesReferencia.atual());

  const profissionalSelecionado = profissionais.find(
    (profissional) => profissional.id === profissionalId
  );
  const descricao = profissionalSelecionado
    ? `Atendimentos finalizados de ${profissionalSelecionado.nome} no mês.`
    : "Atendimentos finalizados de todos os profissionais no mês.";

  const filtros = (
    <div className="relatorio-filtros">
      {proprioId === null && (
      <label className="filtro-profissional">
        <span>Profissional</span>
        <select
          value={profissionalId ?? ""}
          onChange={(evento) =>
            setProfissionalId(evento.target.value === "" ? null : Number(evento.target.value))
          }
        >
          <option value="">Todos os profissionais</option>
          {profissionais.map((profissional) => (
            <option key={profissional.id} value={profissional.id}>
              {profissional.nome}
            </option>
          ))}
        </select>
      </label>
      )}

      <div className="seletor-mes">
        <button
          type="button"
          className="admin-botao"
          onClick={() => setMes(mes.anterior())}
          aria-label="Mês anterior"
        >
          <IconeSetaEsquerda tamanho={16} />
        </button>
        <span className="seletor-mes-nome">{mes.formatar()}</span>
        <button
          type="button"
          className="admin-botao"
          onClick={() => setMes(mes.proximo())}
          disabled={!podeAvancar}
          aria-label="Próximo mês"
        >
          <IconeSetaDireita tamanho={16} />
        </button>
      </div>
    </div>
  );

  return (
    <section className="pagina pagina-larga">
      <CabecalhoPagina titulo="Relatórios" descricao={descricao} acoes={filtros} />

      {mensagemErro && <p className="mensagem-erro">{mensagemErro}</p>}

      {!dados ? (
        !mensagemErro && <p>Carregando...</p>
      ) : (
        <div className={`relatorio ${atualizando ? "atualizando" : ""}`}>
          <ResumoDoMes atual={dados.atual} anterior={dados.anterior} />

          <div className="relatorio-grade">
            <article className="relatorio-cartao relatorio-cartao-largo">
              <header className="relatorio-cartao-cabecalho">
                <div>
                  <h2>Faturamento por dia</h2>
                  <p>Soma dos atendimentos finalizados em cada dia do mês.</p>
                </div>
              </header>

              {dados.atual.quantidadeAtendimentos === 0 ? (
                <p className="relatorio-vazio">Nenhum atendimento finalizado neste mês.</p>
              ) : (
                <>
                  <GraficoFaturamentoDiario dias={dados.atual.faturamentoPorDia} />
                  <TabelaFaturamento relatorio={dados.atual} />
                </>
              )}
            </article>

            <article className="relatorio-cartao">
              <header className="relatorio-cartao-cabecalho">
                <div>
                  <h2>Tratamentos mais realizados</h2>
                  <p>Quantidade de vezes no mês e quanto cada um faturou.</p>
                </div>
              </header>

              {dados.atual.tratamentosMaisRealizados.length === 0 ? (
                <p className="relatorio-vazio">Nenhum tratamento realizado neste mês.</p>
              ) : (
                <GraficoRanking
                  itens={dados.atual.tratamentosMaisRealizados.map((tratamento) => ({
                    chave: tratamento.tratamentoId,
                    nome: tratamento.nome,
                    medida: tratamento.quantidade,
                    rotulo: `${tratamento.quantidade}×`,
                    detalhe: new Dinheiro(tratamento.faturamento).formatar(),
                  }))}
                />
              )}
            </article>

            {/* Com "Todos" selecionado, mostra cada profissional separadamente. */}
            {dados.atual.profissionalId === null && (
              <article className="relatorio-cartao relatorio-cartao-inteiro">
                <header className="relatorio-cartao-cabecalho">
                  <div>
                    <h2>Faturamento por profissional</h2>
                    <p>Quanto cada profissional faturou no mês. Clique em um para ver só os números dele.</p>
                  </div>
                </header>

                {dados.atual.faturamentoPorProfissional.length === 0 ? (
                  <p className="relatorio-vazio">Nenhum atendimento finalizado neste mês.</p>
                ) : (
                  <GraficoRanking
                    itens={dados.atual.faturamentoPorProfissional.map((item) => ({
                      chave: item.profissionalId,
                      nome: item.nome,
                      medida: item.faturamento,
                      rotulo: new Dinheiro(item.faturamento).formatar(),
                      detalhe:
                        item.atendimentos === 1 ? "1 atendimento" : `${item.atendimentos} atendimentos`,
                    }))}
                    onSelecionar={setProfissionalId}
                    dicaSelecionar="Ver o relatório só deste profissional"
                  />
                )}
              </article>
            )}
          </div>
        </div>
      )}
    </section>
  );
}

function ResumoDoMes({ atual, anterior }: { atual: RelatorioMensal; anterior: RelatorioMensal }) {
  const melhorDia = atual.faturamentoPorDia.reduce<RelatorioMensal["faturamentoPorDia"][number] | null>(
    (melhor, dia) => (dia.valor > (melhor?.valor ?? 0) ? dia : melhor),
    null
  );

  const variacao =
    anterior.faturamentoTotal > 0
      ? ((atual.faturamentoTotal - anterior.faturamentoTotal) / anterior.faturamentoTotal) * 100
      : null;
  const nomeMesAnterior = MesReferencia.de(anterior.mes).getNomeDoMes();

  return (
    <div className="relatorio-resumo">
      <div className="relatorio-destaque">
        <span className="admin-resumo-icone">
          <IconeDinheiro />
        </span>
        <span className="admin-resumo-rotulo">Faturamento do mês</span>
        <strong className="relatorio-destaque-valor">
          {new Dinheiro(atual.faturamentoTotal).formatar()}
        </strong>
        {variacao === null ? (
          <span className="relatorio-variacao neutra">
            Sem faturamento em {nomeMesAnterior} para comparar
          </span>
        ) : (
          <span className={`relatorio-variacao ${variacao >= 0 ? "alta" : "baixa"}`}>
            {variacao >= 0 ? "▲" : "▼"} {Math.abs(variacao).toFixed(0)}%{" "}
            <span>em relação a {nomeMesAnterior}</span>
          </span>
        )}
      </div>

      <div className="admin-resumo-cartao">
        <span className="admin-resumo-icone">
          <IconeConfirmado />
        </span>
        <span className="admin-resumo-rotulo">Atendimentos</span>
        <strong className="admin-resumo-valor">{atual.quantidadeAtendimentos}</strong>
        <span className="admin-resumo-detalhe">finalizados no mês</span>
      </div>

      <div className="admin-resumo-cartao">
        <span className="admin-resumo-icone">
          <IconeTendencia />
        </span>
        <span className="admin-resumo-rotulo">Ticket médio</span>
        <strong className="admin-resumo-valor">{new Dinheiro(atual.ticketMedio).formatar()}</strong>
        <span className="admin-resumo-detalhe">por atendimento</span>
      </div>

      <div className="admin-resumo-cartao">
        <span className="admin-resumo-icone">
          <IconeCalendario />
        </span>
        <span className="admin-resumo-rotulo">Melhor dia</span>
        <strong className="admin-resumo-valor">
          {melhorDia ? new DataAgenda(melhorDia.data).formatar().slice(0, 5) : "—"}
        </strong>
        <span className="admin-resumo-detalhe">
          {melhorDia ? new Dinheiro(melhorDia.valor).formatar() : "sem atendimentos"}
        </span>
      </div>

    </div>
  );
}

/** Os mesmos números do gráfico, em tabela (só os dias com atendimento). */
function TabelaFaturamento({ relatorio }: { relatorio: RelatorioMensal }) {
  const diasComMovimento = relatorio.faturamentoPorDia.filter((dia) => dia.atendimentos > 0);

  return (
    <details className="relatorio-tabela">
      <summary>Ver os valores em tabela</summary>
      <table className="admin-tabela">
        <thead>
          <tr>
            <th>Dia</th>
            <th>Atendimentos</th>
            <th className="admin-tabela-valor">Faturamento</th>
          </tr>
        </thead>
        <tbody>
          {diasComMovimento.map((dia) => (
            <tr key={dia.data}>
              <td>{new DataAgenda(dia.data).formatar()}</td>
              <td>{dia.atendimentos}</td>
              <td className="admin-tabela-valor">{new Dinheiro(dia.valor).formatar()}</td>
            </tr>
          ))}
          <tr className="relatorio-tabela-total">
            <td>Total do mês</td>
            <td>{relatorio.quantidadeAtendimentos}</td>
            <td className="admin-tabela-valor">
              {new Dinheiro(relatorio.faturamentoTotal).formatar()}
            </td>
          </tr>
        </tbody>
      </table>
    </details>
  );
}
