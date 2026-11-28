import { useEffect, useState } from "react";
import type { FormEvent } from "react";
import { RelatorioService } from "../../services/RelatorioService";
import { LucroDoMes } from "../../models/LucroDoMes";
import { EntradaDeGasto } from "../../models/EntradaDeGasto";
import { Dinheiro } from "../../models/Dinheiro";
import { MesReferencia } from "../../models/MesReferencia";
import type { DonoDoLucro } from "../../models/DonoDoLucro";
import type { LucroMensal } from "../../services/types";
import { IconeDinheiro, IconeGrafico, IconeTendencia } from "../Icones";

const relatorioService = new RelatorioService();

interface Props {
  /** "AAAA-MM". A página monta um cartão novo a cada mês/dono (key), zerando o formulário. */
  mes: string;
  /** Clínica inteira ou um profissional. */
  dono: DonoDoLucro;
}

/** O que o cartão está fazendo além de mostrar os números. */
type Modo = "vendo" | "editando" | "confirmandoExclusao";

/**
 * Parte "Lucro" dos relatórios: faturamento menos o gasto do mês, que é informado (e pode
 * ser apagado) aqui mesmo. Da clínica inteira ou de um profissional (`dono`). Sem gasto
 * informado, o cartão pede o valor e sugere o do mês anterior, que costuma se repetir.
 */
export function CartaoLucro({ mes, dono }: Props) {
  const [lucro, setLucro] = useState<LucroDoMes | null>(null);
  const [erroAoCarregar, setErroAoCarregar] = useState<string | null>(null);

  const [modo, setModo] = useState<Modo>("vendo");
  const [entrada, setEntrada] = useState(new EntradaDeGasto(""));
  const [tentouSalvar, setTentouSalvar] = useState(false);
  const [enviando, setEnviando] = useState(false);
  const [erroAoSalvar, setErroAoSalvar] = useState<string | null>(null);
  const [aviso, setAviso] = useState<string | null>(null);

  const profissionalId = dono.getProfissionalId();

  useEffect(() => {
    let cancelado = false;
    relatorioService
      .lucro(mes, profissionalId)
      .then((dados) => {
        if (!cancelado) {
          setLucro(new LucroDoMes(dados));
        }
      })
      .catch((erro: Error) => {
        if (!cancelado) {
          setErroAoCarregar(erro.message);
        }
      });
    return () => {
      cancelado = true;
    };
  }, [mes, profissionalId]);

  const referencia = MesReferencia.de(mes);
  const nomeDoMes = referencia.getNomeDoMes();
  const semGasto = lucro?.situacao() === "sem-gasto";
  // Sem gasto informado, o formulário já aparece aberto.
  const mostrarFormulario = lucro !== null && (modo === "editando" || semGasto);
  const erroDoCampo = tentouSalvar ? entrada.erro() : null;
  const sugestao = lucro?.sugestaoDeGasto() ?? null;

  function mudarModo(novo: Modo): void {
    setErroAoSalvar(null);
    setAviso(null);
    setModo(novo);
  }

  function abrirEdicao(): void {
    const gasto = lucro?.getGasto() ?? null;
    setEntrada(gasto === null ? new EntradaDeGasto("") : EntradaDeGasto.de(gasto));
    setTentouSalvar(false);
    mudarModo("editando");
  }

  /** Salva ou apaga o gasto; o servidor devolve o lucro já recalculado. */
  async function enviarAoServidor(
    acao: () => Promise<LucroMensal>,
    mensagem: string
  ): Promise<void> {
    if (enviando) {
      return;
    }
    setEnviando(true);
    setErroAoSalvar(null);
    try {
      setLucro(new LucroDoMes(await acao()));
      setModo("vendo");
      setTentouSalvar(false);
      setEntrada(new EntradaDeGasto(""));
      setAviso(mensagem);
    } catch (erro) {
      setErroAoSalvar((erro as Error).message);
    } finally {
      setEnviando(false);
    }
  }

  function salvar(valor: number | null): void {
    if (valor !== null) {
      void enviarAoServidor(
        () => relatorioService.informarGasto(mes, profissionalId, valor),
        "Gasto salvo."
      );
    }
  }

  function apagar(): void {
    void enviarAoServidor(
      () => relatorioService.apagarGasto(mes, profissionalId),
      `Gasto de ${nomeDoMes} apagado. Informe o valor certo para calcular o lucro.`
    );
  }

  function enviar(evento: FormEvent): void {
    evento.preventDefault();
    setTentouSalvar(true);
    if (entrada.erro() === null) {
      salvar(entrada.valor());
    }
  }

  return (
    <article className="relatorio-cartao relatorio-cartao-inteiro cartao-lucro">
      <header className="relatorio-cartao-cabecalho">
        <div>
          <h2>{dono.titulo()}</h2>
          <p>{dono.descricao(referencia)}</p>
        </div>
      </header>

      {erroAoCarregar && <p className="mensagem-erro">{erroAoCarregar}</p>}
      {!lucro ? (
        !erroAoCarregar && <p>Carregando...</p>
      ) : (
        <>
          <div className="lucro-numeros">
            <div className="lucro-numero">
              <span className="admin-resumo-icone">
                <IconeDinheiro />
              </span>
              <span className="admin-resumo-rotulo">Faturamento</span>
              <strong className="admin-resumo-valor">
                {new Dinheiro(lucro.getFaturamento()).formatar()}
              </strong>
              <span className="admin-resumo-detalhe">atendimentos finalizados</span>
            </div>

            <div className="lucro-numero">
              <span className="admin-resumo-icone">
                <IconeGrafico />
              </span>
              <span className="admin-resumo-rotulo">Gastos do mês</span>
              <strong className="admin-resumo-valor">
                {lucro.getGasto() === null ? "—" : new Dinheiro(lucro.getGasto()!).formatar()}
              </strong>
              {semGasto ? (
                <span className="admin-resumo-detalhe">ainda não informado</span>
              ) : (
                modo === "vendo" && (
                  <span className="lucro-acoes-gasto">
                    <button type="button" className="lucro-link" onClick={abrirEdicao}>
                      Editar
                    </button>
                    <button
                      type="button"
                      className="lucro-link perigo"
                      onClick={() => mudarModo("confirmandoExclusao")}
                    >
                      Apagar
                    </button>
                  </span>
                )
              )}
            </div>

            <div className={`lucro-numero lucro-resultado ${lucro.situacao()}`}>
              <span className="admin-resumo-icone">
                <IconeTendencia />
              </span>
              <span className="admin-resumo-rotulo">{lucro.rotuloDoResultado()}</span>
              <strong className="admin-resumo-valor">
                {lucro.getLucro() === null ? "—" : new Dinheiro(lucro.getLucro()!).formatar()}
              </strong>
              <span className="admin-resumo-detalhe">
                {semGasto
                  ? "informe o gasto para calcular"
                  : (lucro.descreverMargem() ?? "sem faturamento no mês")}
              </span>
            </div>
          </div>

          {aviso && (
            <p className="mensagem-sucesso lucro-aviso" role="status">
              {aviso}
            </p>
          )}

          {modo === "confirmandoExclusao" && !semGasto && (
            <div className="lucro-confirmacao" role="alertdialog" aria-label="Apagar gasto">
              <p>
                <strong>Apagar o gasto de {nomeDoMes}</strong> (
                {new Dinheiro(lucro.getGasto()!).formatar()})? O lucro do mês fica sem cálculo
                até um novo valor ser informado.
              </p>
              {erroAoSalvar && <p className="mensagem-erro">{erroAoSalvar}</p>}
              <div className="admin-acoes">
                <button
                  type="button"
                  className="admin-botao perigo"
                  disabled={enviando}
                  onClick={apagar}
                >
                  {enviando ? "Apagando..." : "Sim, apagar"}
                </button>
                <button
                  type="button"
                  className="admin-botao"
                  disabled={enviando}
                  onClick={() => mudarModo("vendo")}
                >
                  Cancelar
                </button>
              </div>
            </div>
          )}

          {mostrarFormulario && (
            <form className="lucro-formulario" onSubmit={enviar} noValidate>
              <div className="admin-campos">
                <label>
                  <span>Gastos de {nomeDoMes} (R$)</span>
                  <input
                    type="text"
                    inputMode="decimal"
                    placeholder="Ex.: 2.500,00"
                    autoComplete="off"
                    aria-invalid={Boolean(erroDoCampo)}
                    value={entrada.toString()}
                    onChange={(evento) => setEntrada(new EntradaDeGasto(evento.target.value))}
                  />
                  {erroDoCampo && <span className="campo-erro">{erroDoCampo}</span>}
                </label>
              </div>
              <p className="admin-dica">{dono.dicaDoGasto()}</p>
              {erroAoSalvar && <p className="mensagem-erro">{erroAoSalvar}</p>}
              <div className="admin-acoes">
                <button type="submit" className="admin-botao principal" disabled={enviando}>
                  {enviando ? "Salvando..." : "Salvar gasto"}
                </button>
                {sugestao !== null && semGasto && (
                  <button
                    type="button"
                    className="admin-botao"
                    disabled={enviando}
                    onClick={() => salvar(sugestao)}
                  >
                    Usar {new Dinheiro(sugestao).formatar()} (igual a{" "}
                    {referencia.anterior().getNomeDoMes()})
                  </button>
                )}
                {modo === "editando" && !semGasto && (
                  <button
                    type="button"
                    className="admin-botao"
                    disabled={enviando}
                    onClick={() => mudarModo("vendo")}
                  >
                    Cancelar
                  </button>
                )}
              </div>
            </form>
          )}
        </>
      )}
    </article>
  );
}
