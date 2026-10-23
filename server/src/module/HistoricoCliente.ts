import { Agendamento } from "./Agendamento";
import { StatusAgendamento } from "./StatusAgendamento";
import { DataAgenda } from "./DataAgenda";

/** Quantas vezes um tratamento foi feito pelo cliente. */
interface TratamentoFeito {
  nome: string;
  quantidade: number;
}

/**
 * Tudo o que a clínica sabe de um cliente: os agendamentos feitos com o mesmo telefone
 * (cada agendamento guarda o nome digitado na hora, então o telefone é o que une tudo).
 * Os números (gasto, visitas...) contam só os atendimentos finalizados: o que foi
 * agendado e ainda não aconteceu não entra na conta.
 */
export class HistoricoCliente {
  private readonly telefone: string; // só os números
  /** Do mais recente para o mais antigo. */
  private readonly agendamentos: Agendamento[];

  constructor(telefone: string, agendamentos: Agendamento[]) {
    if (agendamentos.length === 0) {
      throw new Error("O histórico precisa de ao menos um agendamento do cliente.");
    }
    this.telefone = telefone;
    this.agendamentos = [...agendamentos].sort((a, b) =>
      HistoricoCliente.momento(b).localeCompare(HistoricoCliente.momento(a))
    );
  }

  /** Separa os agendamentos por cliente (telefone) e monta um histórico para cada um. */
  public static agrupar(agendamentos: Agendamento[]): HistoricoCliente[] {
    const porTelefone = new Map<string, Agendamento[]>();
    for (const agendamento of agendamentos) {
      const telefone = agendamento.getCliente().getTelefoneDigitos();
      porTelefone.set(telefone, [...(porTelefone.get(telefone) ?? []), agendamento]);
    }
    return [...porTelefone].map(
      ([telefone, doCliente]) => new HistoricoCliente(telefone, doCliente)
    );
  }

  /** "YYYY-MM-DD HH:MM": ordena certo como texto. */
  private static momento(agendamento: Agendamento): string {
    return `${DataAgenda.paraTexto(agendamento.getData())} ${agendamento.getHorarioInicio()}`;
  }

  /** Para busca sem diferenciar maiúsculas e acentos ("Mônica" acha "monica"). */
  private static normalizar(texto: string): string {
    return texto
      .normalize("NFD")
      .replace(/[̀-ͯ]/g, "")
      .toLowerCase()
      .trim();
  }

  public getTelefone(): string {
    return this.telefone;
  }

  /** O nome do agendamento mais recente (é o que o cliente usou por último). */
  public getNome(): string {
    return this.agendamentos[0].getCliente().getNome();
  }

  /** true se o nome ou o telefone contém o texto buscado. */
  public combinaCom(busca: string): boolean {
    const texto = HistoricoCliente.normalizar(busca);
    if (texto === "") {
      return true;
    }
    const digitos = texto.replace(/\D/g, "");
    const nomes = new Set(this.agendamentos.map((agendamento) => agendamento.getCliente().getNome()));
    return (
      [...nomes].some((nome) => HistoricoCliente.normalizar(nome).includes(texto)) ||
      (digitos.length >= 3 && this.telefone.includes(digitos))
    );
  }

  /** Atendimentos que de fato aconteceram, do mais recente para o mais antigo. */
  public getAtendimentos(): Agendamento[] {
    return this.agendamentos.filter(
      (agendamento) => agendamento.getStatus() === StatusAgendamento.FINALIZADO
    );
  }

  public getTotalGasto(): number {
    return this.getAtendimentos().reduce(
      (total, agendamento) => total + agendamento.getValorTotal(),
      0
    );
  }

  public getTicketMedio(): number {
    const quantidade = this.getAtendimentos().length;
    return quantidade === 0 ? 0 : this.getTotalGasto() / quantidade;
  }

  public getUltimoAtendimento(): Agendamento | null {
    return this.getAtendimentos()[0] ?? null;
  }

  public getPrimeiroAtendimento(): Agendamento | null {
    return this.getAtendimentos().at(-1) ?? null;
  }

  /** O próximo horário marcado a partir de `hoje` ("YYYY-MM-DD"), se houver. */
  public getProximoAgendamento(hoje: string): Agendamento | null {
    const futuros = this.agendamentos.filter(
      (agendamento) =>
        agendamento.getStatus() === StatusAgendamento.AGENDADO &&
        DataAgenda.paraTexto(agendamento.getData()) >= hoje
    );
    return futuros.at(-1) ?? null;
  }

  /** Tratamentos já feitos, do mais frequente para o menos. */
  public getTratamentosMaisFeitos(): TratamentoFeito[] {
    const contagem = new Map<string, number>();
    for (const agendamento of this.getAtendimentos()) {
      for (const tratamento of agendamento.getTratamentos()) {
        contagem.set(tratamento.getNome(), (contagem.get(tratamento.getNome()) ?? 0) + 1);
      }
    }
    return [...contagem]
      .map(([nome, quantidade]) => ({ nome, quantidade }))
      .sort((a, b) => b.quantidade - a.quantidade || a.nome.localeCompare(b.nome));
  }

  /** Profissionais que já atenderam o cliente. */
  public getProfissionais(): string[] {
    return [
      ...new Set(this.getAtendimentos().map((agendamento) => agendamento.getProfissional().getNome())),
    ];
  }

  /** Linha da lista de clientes. */
  public paraResumo(hoje: string) {
    const ultimo = this.getUltimoAtendimento();
    const proximo = this.getProximoAgendamento(hoje);
    return {
      telefone: this.telefone,
      nome: this.getNome(),
      atendimentos: this.getAtendimentos().length,
      totalGasto: this.getTotalGasto(),
      ultimoAtendimento: ultimo ? DataAgenda.paraTexto(ultimo.getData()) : null,
      proximoAgendamento: proximo
        ? { data: DataAgenda.paraTexto(proximo.getData()), horarioInicio: proximo.getHorarioInicio() }
        : null,
    };
  }

  /** Ficha completa: resumo, números e todos os agendamentos. */
  public paraFicha(hoje: string) {
    const primeiro = this.getPrimeiroAtendimento();
    return {
      ...this.paraResumo(hoje),
      ticketMedio: this.getTicketMedio(),
      primeiroAtendimento: primeiro ? DataAgenda.paraTexto(primeiro.getData()) : null,
      proximoAgendamento: this.getProximoAgendamento(hoje),
      tratamentosMaisFeitos: this.getTratamentosMaisFeitos(),
      profissionais: this.getProfissionais(),
      agendamentos: this.agendamentos,
    };
  }
}
