import type { CodigoFormaDePagamento } from "../../services/types";
import { FormaDePagamento } from "../../models/FormaDePagamento";

interface Props {
  valor: CodigoFormaDePagamento | null;
  onEscolher: (forma: CodigoFormaDePagamento) => void;
  /** Mensagem de campo obrigatório (null = sem erro). */
  erro: string | null;
}

/**
 * Etapa "Seus dados": o cliente diz como pretende pagar. A clínica já fica sabendo e
 * agiliza a hora do pagamento.
 */
export function SeletorFormaDePagamento({ valor, onEscolher, erro }: Props) {
  return (
    <fieldset className="pagamento">
      <legend>
        Forma de pagamento <span className="campo-obrigatorio">*</span>
      </legend>
      <p className="pagamento-dica">
        Como você pretende pagar? Assim a clínica já deixa tudo pronto. O pagamento é feito no
        dia do atendimento.
      </p>
      <div
        className={`pagamento-opcoes ${erro ? "invalido" : ""}`}
        role="radiogroup"
        aria-label="Forma de pagamento"
      >
        {FormaDePagamento.todas().map((forma) => {
          const escolhida = valor === forma.getCodigo();
          return (
            <button
              key={forma.getCodigo()}
              type="button"
              role="radio"
              aria-checked={escolhida}
              className={`pagamento-opcao ${escolhida ? "selecionada" : ""}`}
              onClick={() => onEscolher(forma.getCodigo())}
            >
              <strong>{forma.getNome()}</strong>
              <small>{forma.getDetalhe()}</small>
            </button>
          );
        })}
      </div>
      {erro && <span className="campo-erro">{erro}</span>}
    </fieldset>
  );
}
