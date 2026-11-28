import type { CodigoFormaDePagamento } from "../../services/types";
import { FormaDePagamento } from "../../models/FormaDePagamento";

interface Props {
  valor: CodigoFormaDePagamento | null;
  onAlterar: (forma: CodigoFormaDePagamento | null) => void;
  disabled?: boolean;
  /** Texto do rótulo (padrão: "Forma de pagamento"). */
  rotulo?: string;
  className?: string;
}

/** Lista de formas de pagamento do painel; "Não informada" deixa em branco. */
export function CampoFormaDePagamento({
  valor,
  onAlterar,
  disabled = false,
  rotulo = "Forma de pagamento",
  className,
}: Props) {
  return (
    <label className={className}>
      <span>{rotulo}</span>
      <select
        value={valor ?? ""}
        disabled={disabled}
        onChange={(evento) => onAlterar(FormaDePagamento.de(evento.target.value)?.getCodigo() ?? null)}
      >
        <option value="">Não informada</option>
        {FormaDePagamento.todas().map((forma) => (
          <option key={forma.getCodigo()} value={forma.getCodigo()}>
            {forma.getNome()}
          </option>
        ))}
      </select>
    </label>
  );
}
