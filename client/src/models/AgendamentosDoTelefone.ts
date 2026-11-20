import type { Agendamento } from "../services/types";
import { HorarioMarcado } from "./HorarioMarcado";
import { NomeDePessoa } from "./NomeDePessoa";

/**
 * "Meus agendamentos": os horários em aberto achados para um telefone. Podem ser de várias
 * pessoas (quem marcou para a filha também gerencia o horário dela); remarcar e cancelar
 * usam o mesmo telefone da busca. Cada mudança devolve uma lista nova (não altera esta).
 */
export class AgendamentosDoTelefone {
  private readonly telefone: string;
  private readonly agendamentos: Agendamento[];

  constructor(telefone: string, agendamentos: Agendamento[]) {
    this.telefone = telefone;
    this.agendamentos = [...agendamentos].sort((a, b) =>
      HorarioMarcado.de(a).compararCom(HorarioMarcado.de(b))
    );
  }

  /** Telefone da busca: remarcar e cancelar confirmam com ele. */
  public getTelefone(): string {
    return this.telefone;
  }

  public quantidade(): number {
    return this.agendamentos.length;
  }

  /** Quem vai ser atendido em cada horário, sem repetir (na ordem dos horários). */
  public pessoas(): string[] {
    const nomes: NomeDePessoa[] = [];
    for (const agendamento of this.agendamentos) {
      const nome = new NomeDePessoa(agendamento.cliente.nome);
      if (!nomes.some((outro) => outro.ehIgualA(nome))) {
        nomes.push(nome);
      }
    }
    return nomes.map((nome) => nome.toString());
  }

  /** Horários de mais de uma pessoa: cada cartão precisa dizer para quem é. */
  public temVariasPessoas(): boolean {
    return this.pessoas().length > 1;
  }

  /** Os horários de uma pessoa (null = de todas). */
  public de(pessoa: string | null): Agendamento[] {
    if (pessoa === null) {
      return this.agendamentos;
    }
    const nome = new NomeDePessoa(pessoa);
    return this.agendamentos.filter((agendamento) =>
      new NomeDePessoa(agendamento.cliente.nome).ehIgualA(nome)
    );
  }

  /** Depois de cancelar: a lista sem aquele horário. */
  public sem(agendamento: Agendamento): AgendamentosDoTelefone {
    return new AgendamentosDoTelefone(
      this.telefone,
      this.agendamentos.filter((item) => item.id !== agendamento.id)
    );
  }

  /** Depois de remarcar: a lista com o horário novo (continua em ordem de data/horário). */
  public comAtualizado(atualizado: Agendamento): AgendamentosDoTelefone {
    return new AgendamentosDoTelefone(
      this.telefone,
      this.agendamentos.map((item) => (item.id === atualizado.id ? atualizado : item))
    );
  }
}
