// Formatos que espelham o toJSON() de cada entidade do backend.

export interface Cliente {
  id: number;
  nome: string;
  telefone: string;
}

export interface Profissional {
  id: number;
  nome: string;
  telefone: string;
  especialidade: string;
}

export interface Tratamento {
  id: number;
  nome: string;
  descricao: string;
  valor: number;
  duracaoMinutos: number;
  /** Profissional que realiza o tratamento; null = todos os profissionais. */
  profissionalId: number | null;
  quantidadeSlots: number;
}

export interface HorarioDisponivel {
  id: number;
  profissionalId: number;
  diaSemana: number;
  horaInicio: string;
}

export type StatusAgendamento = "AGENDADO" | "EM_ATENDIMENTO" | "FINALIZADO";

export interface Agendamento {
  id: number;
  data: string;
  horarioInicio: string;
  status: StatusAgendamento;
  cliente: Cliente;
  profissional: Profissional;
  tratamentos: Tratamento[];
  valorTotal: number;
  duracaoTotalMinutos: number;
}

export interface Configuracoes {
  acessoPublicoLiberado: boolean;
}

export interface FaturamentoDoDia {
  data: string;
  valor: number;
  atendimentos: number;
}

export interface TratamentoRealizado {
  tratamentoId: number;
  nome: string;
  quantidade: number;
  faturamento: number;
}

export interface FaturamentoDoProfissional {
  profissionalId: number;
  nome: string;
  atendimentos: number;
  faturamento: number;
}

export interface RelatorioMensal {
  mes: string;
  /** null = todos os profissionais juntos. */
  profissionalId: number | null;
  faturamentoTotal: number;
  quantidadeAtendimentos: number;
  ticketMedio: number;
  faturamentoPorDia: FaturamentoDoDia[];
  tratamentosMaisRealizados: TratamentoRealizado[];
  faturamentoPorProfissional: FaturamentoDoProfissional[];
}

/** Usuário do painel (conta de administrador). */
export interface Usuario {
  id: number;
  email: string;
  criadoEm: string | null;
  /** Profissional a quem a conta pertence; null = acesso total. */
  profissionalId: number | null;
}

/** Quem está logado no painel. Com profissional, só vê o que é daquele profissional. */
export interface UsuarioLogado {
  id: number;
  email: string;
  profissionalId: number | null;
  profissionalNome: string | null;
}
