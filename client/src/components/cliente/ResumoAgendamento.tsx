import { DataAgenda } from "../../models/DataAgenda";
import { Dinheiro } from "../../models/Dinheiro";
import { Duracao } from "../../models/Duracao";
import { IconeBrilho, IconeCalendario, IconePessoas, IconeRelogio } from "../Icones";

interface Props {
  profissional: string;
  tratamentos: string[];
  data: string;
  horario: string | null;
  duracaoMinutos: number;
  valor: number;
}

/** Cartão com tudo o que foi escolhido: usado antes de confirmar e na tela de sucesso. */
export function ResumoAgendamento({
  profissional,
  tratamentos,
  data,
  horario,
  duracaoMinutos,
  valor,
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
      </ul>
      <div className="resumo-total">
        <span>Valor total</span>
        <strong>{new Dinheiro(valor).formatar()}</strong>
      </div>
    </div>
  );
}
