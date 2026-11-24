import { DataAgenda } from "../../models/DataAgenda";
import { Dinheiro } from "../../models/Dinheiro";
import { Duracao } from "../../models/Duracao";
import { IconeBrilho, IconeCalendario, IconeDinheiro, IconePessoas, IconeRelogio } from "../Icones";
import { FormaDePagamento } from "../../models/FormaDePagamento";
import type { CodigoFormaDePagamento } from "../../services/types";

interface Props {
  profissional: string;
  tratamentos: string[];
  data: string;
  horario: string | null;
  duracaoMinutos: number;
  valor: number;
  /** Como o cliente vai pagar (ausente = não mostra a linha; null = ainda não escolheu). */
  formaDePagamento?: CodigoFormaDePagamento | null;
}

/** Cartão com tudo o que foi escolhido: usado antes de confirmar e na tela de sucesso. */
export function ResumoAgendamento({
  profissional,
  tratamentos,
  data,
  horario,
  duracaoMinutos,
  valor,
  formaDePagamento,
}: Props) {
  return (
    <div className="resumo">
      <ul className="resumo-itens">
        <li>
          <IconeCalendario tamanho={18} />
          <span>
            <small>Data e horário</small>
            <strong>
              {new DataAgenda(data).formatarPorExtenso()}
              {horario && ` às ${horario}`}
            </strong>
          </span>
        </li>
        <li>
          <IconePessoas tamanho={18} />
          <span>
            <small>Profissional</small>
            <strong>{profissional}</strong>
          </span>
        </li>
        <li>
          <IconeBrilho tamanho={18} />
          <span>
            <small>{tratamentos.length === 1 ? "Serviço" : "Serviços"}</small>
            <strong>{tratamentos.join(", ")}</strong>
          </span>
        </li>
        <li>
          <IconeRelogio tamanho={18} />
          <span>
            <small>Duração</small>
            <strong>{new Duracao(duracaoMinutos).formatar()}</strong>
          </span>
        </li>
        {formaDePagamento !== undefined && (
          <li>
            <IconeDinheiro tamanho={18} />
            <span>
              <small>Forma de pagamento</small>
              <strong>{FormaDePagamento.de(formaDePagamento)?.getNome() ?? "A escolher"}</strong>
            </span>
          </li>
        )}
      </ul>
      <div className="resumo-total">
        <span>Valor total</span>
        <strong>{new Dinheiro(valor).formatar()}</strong>
      </div>
    </div>
  );
}
