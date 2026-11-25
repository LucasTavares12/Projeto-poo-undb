import type { CodigoFormaDePagamento } from "../../services/types";
import { FormaDePagamento } from "../../models/FormaDePagamento";
import { IconeCartao, IconeDinheiro, IconePix } from "../Icones";

interface Props {
  valor: CodigoFormaDePagamento | null;
  onEscolher: (forma: CodigoFormaDePagamento) => void;
  /** Mensagem de campo obrigatório (null = sem erro). */
  erro: string | null;
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
 * agiliza a hora do pagamento.
 */
export function SeletorFormaDePagamento({ valor, onEscolher, erro }: Props) {
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
            </button>
          );
        })}
      </div>
      {erro && <span className="campo-erro">{erro}</span>}
    </fieldset>
  );
}
