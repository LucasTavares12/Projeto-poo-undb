import { Agendamento } from "./Agendamento";
import { StatusAgendamento } from "./StatusAgendamento";
import { DataAgenda } from "./DataAgenda";
import { Pessoa } from "./Pessoa";
import { ErroDeValidacao } from "../erros/ErroDeValidacao";

/** Quantas vezes um tratamento foi feito pelo cliente. */
interface TratamentoFeito {
  nome: string;
  quantidade: number;
}

/**
 * Tudo o que a clínica sabe de um cliente: os agendamentos com o mesmo telefone e o mesmo
 * nome de quem foi atendido (sem ligar para acentos, maiúsculas e espaços). Um telefone pode
 * ter várias pessoas: a mãe que marca para ela e para a filha tem duas fichas, uma de cada.
 * Os números (gasto, visitas...) contam só os atendimentos finalizados: o que foi
 * agendado e ainda não aconteceu não entra na conta.
 */
export class HistoricoCliente {
  private readonly telefone: string; // só os números
  /** Do mais recente para o mais antigo. */
  private readonly agendamentos: Agendamento[];

  constructor(telefone: string, agendamentos: Agendamento[]) {
    if (agendamentos.length === 0) {
      throw new ErroDeValidacao("O histórico precisa de ao menos um agendamento do cliente.");
    }
    this.telefone = telefone;
    this.agendamentos = [...agendamentos].sort((a, b) =>
      HistoricoCliente.momento(b).localeCompare(HistoricoCliente.momento(a))
    );
  }

  /** Separa os agendamentos por cliente (telefone + nome) e monta um histórico para cada um. */
  public static agrupar(agendamentos: Agendamento[]): HistoricoCliente[] {
    const porPessoa = new Map<string, Agendamento[]>();
    for (const agendamento of agendamentos) {
      const pessoa = agendamento.getCliente().getIdentificador();
      porPessoa.set(pessoa, [...(porPessoa.get(pessoa) ?? []), agendamento]);
    }
    return [...porPessoa.values()].map(
      (daPessoa) => new HistoricoCliente(daPessoa[0].getCliente().getTelefoneDigitos(), daPessoa)
    );
  }

  /** "YYYY-MM-DD HH:MM": ordena certo como texto. */
  private static momento(agendamento: Agendamento): string {
    return `${DataAgenda.paraTexto(agendamento.getData())} ${agendamento.getHorarioInicio()}`;
  }

  public getTelefone(): string {
    return this.telefone;
  }

  /** O nome do agendamento mais recente (é o que o cliente usou por último). */
  public getNome(): string {
    return this.agendamentos[0].getCliente().getNome();
  }

  /** true se é a ficha desta pessoa (mesmo nome, sem ligar para acentos e maiúsculas). */
  public ehDe(nome: string): boolean {
    return this.agendamentos[0].getCliente().temNome(nome);
  }

  /** Quem já marcou para esta pessoa usando o próprio telefone (ex.: a mãe), sem repetir. */
  public getResponsaveis(): string[] {
    const porNome = new Map<string, string>();
    for (const agendamento of this.agendamentos) {
      const nome = agendamento.getResponsavelNome();
      if (nome !== null && !porNome.has(Pessoa.normalizarNome(nome))) {
        porNome.set(Pessoa.normalizarNome(nome), nome);
      }
    }
    return [...porNome.values()];
  }

  /**
   * true se o nome, o telefone ou quem marcou contém o texto buscado ("Mônica" acha
   * "monica"; buscar a mãe também acha a filha que ela agendou).
   */
  public combinaCom(busca: string): boolean {
    const texto = Pessoa.normalizarNome(busca);
    if (texto === "") {
      return true;
    }
    const digitos = texto.replace(/\D/g, "");
    const nomes = new Set([
      ...this.agendamentos.map((agendamento) => agendamento.getCliente().getNome()),
      ...this.getResponsaveis(),
    ]);
    return (
      [...nomes].some((nome) => Pessoa.normalizarNome(nome).includes(texto)) ||
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

  /**
   * Ficha completa: resumo, números e todos os agendamentos. `outrasPessoas` = os nomes das
   * outras pessoas atendidas com o mesmo telefone (para a ficha apontar para elas).
   */
  public paraFicha(hoje: string, outrasPessoas: string[] = []) {
    const primeiro = this.getPrimeiroAtendimento();
    return {
      ...this.paraResumo(hoje),
      responsaveis: this.getResponsaveis(),
      outrasPessoas,
      ticketMedio: this.getTicketMedio(),
      primeiroAtendimento: primeiro ? DataAgenda.paraTexto(primeiro.getData()) : null,
      proximoAgendamento: this.getProximoAgendamento(hoje),
      tratamentosMaisFeitos: this.getTratamentosMaisFeitos(),
      profissionais: this.getProfissionais(),
      agendamentos: this.agendamentos,
    };
  }
}
