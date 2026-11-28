import type { CodigoFormaDePagamento } from "../../services/types";
import { FormaDePagamento } from "../../models/FormaDePagamento";
import { Dinheiro } from "../../models/Dinheiro";
import { IconeCartao, IconeDinheiro, IconePix } from "../Icones";

interface Props {
  valor: CodigoFormaDePagamento | null;
  onEscolher: (forma: CodigoFormaDePagamento) => void;
  /** Mensagem de campo obrigatório (null = sem erro). */
  erro: string | null;
  /**
   * Total do atendimento nas formas comuns e no cartão de crédito (que pode ser diferente,
   * ex.: taxa da maquininha). Ausente = não mostra valores aqui.
   */
  totais?: { normal: number; credito: number };
}

/** O símbolo de cada forma de pagamento. */
const ICONES: Record<CodigoFormaDePagamento, typeof IconePix> = {
  PIX: IconePix,
  CARTAO_CREDITO: IconeCartao,
  CARTAO_DEBITO: IconeCartao,
  DINHEIRO: IconeDinheiro,
};

/**
 * Etapa "Seus dados": o cliente diz como pretende pagar. A clínica já fica sabendo e
 * agiliza a hora do pagamento. Se algum serviço custa diferente no cartão de crédito, ao
 * escolher o crédito o valor muda na hora e o cliente é avisado do novo valor logo aqui.
 */
export function SeletorFormaDePagamento({ valor, onEscolher, erro, totais }: Props) {
  const diferenca = totais ? totais.credito - totais.normal : 0;
  const creditoMuda = Math.abs(diferenca) >= 0.005;
  const noCredito = valor === "CARTAO_CREDITO";

  return (
    <fieldset className="pagamento">
      <legend>
        Como você prefere pagar? <span className="campo-obrigatorio">*</span>
      </legend>
      <p className="pagamento-dica">O pagamento é feito no dia do atendimento, isso ajuda na agilidade.</p>
      <div
        className={`pagamento-opcoes ${erro ? "invalido" : ""}`}
        role="radiogroup"
        aria-label="Forma de pagamento"
      >
        {FormaDePagamento.todas().map((forma) => {
          const escolhida = valor === forma.getCodigo();
          const Icone = ICONES[forma.getCodigo()];
          return (
            <button
              key={forma.getCodigo()}
              type="button"
              role="radio"
              aria-checked={escolhida}
              className={`pagamento-opcao ${escolhida ? "selecionada" : ""}`}
              onClick={() => onEscolher(forma.getCodigo())}
            >
              <span className="pagamento-icone" aria-hidden="true">
                <Icone tamanho={18} />
              </span>
              <span>{forma.getNome()}</span>
              {creditoMuda && forma.getCodigo() === "CARTAO_CREDITO" && (
                <small className="pagamento-acrescimo">
                  {diferenca > 0 ? "+ " : "- "}
                  {new Dinheiro(Math.abs(diferenca)).formatar()}
                </small>
              )}
            </button>
          );
        })}
      </div>

      {/* Sempre presente: leitores de tela anunciam quando o valor muda. */}
      <div aria-live="polite">
        {totais && valor !== null && creditoMuda && noCredito && (
          <div className="pagamento-novo-valor" key="credito">
            <span className="pagamento-novo-valor-titulo">
              Valor alterado para cartão de crédito
            </span>
            <span className="pagamento-novo-valor-precos">
              <s aria-label={`Antes: ${new Dinheiro(totais.normal).formatar()}`}>
                {new Dinheiro(totais.normal).formatar()}
              </s>
              <strong>{new Dinheiro(totais.credito).formatar()}</strong>
            </span>
            <small>
              No Pix, débito ou dinheiro o valor é {new Dinheiro(totais.normal).formatar()}.
            </small>
          </div>
        )}
        {totais && valor !== null && !(creditoMuda && noCredito) && (
          <p className="pagamento-total" key="normal">
            Valor do atendimento: <strong>{new Dinheiro(totais.normal).formatar()}</strong>
            {creditoMuda && (
              <small> · no cartão de crédito: {new Dinheiro(totais.credito).formatar()}</small>
            )}
          </p>
        )}
      </div>
      {erro && <span className="campo-erro">{erro}</span>}
    </fieldset>
  );
}
