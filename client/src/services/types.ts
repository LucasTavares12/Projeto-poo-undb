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
  /** Posição na lista do seu grupo: a ordem em que o cliente vê os serviços. */
  ordem: number;
  /** Valor se o cliente pagar no cartão de crédito; null = o mesmo valor das outras formas. */
  valorCartaoCredito: number | null;
  /** Foto que demonstra o tratamento (data URL); null = sem foto (o cliente vê só o texto). */
  foto: string | null;
  quantidadeSlots: number;
}

export interface HorarioDisponivel {
  id: number;
  profissionalId: number;
  diaSemana: number;
  horaInicio: string;
}

export type StatusAgendamento = "AGENDADO" | "EM_ATENDIMENTO" | "FINALIZADO" | "FALTOU";

/** Como o cliente pretende pagar (ver models/FormaDePagamento). */
export type CodigoFormaDePagamento = "PIX" | "CARTAO_CREDITO" | "CARTAO_DEBITO" | "DINHEIRO";

export interface Agendamento {
  id: number;
  data: string;
  horarioInicio: string;
  status: StatusAgendamento;
  /** Quem vai ser atendido. O telefone é o contato de quem marcou. */
  cliente: Cliente;
  /** Quem marcou, quando foi para outra pessoa (null = a própria pessoa atendida marcou). */
  responsavelNome: string | null;
  profissional: Profissional;
  tratamentos: Tratamento[];
  valorTotal: number;
  duracaoTotalMinutos: number;
  /** Quando a clínica mandou o lembrete / o agradecimento pelo WhatsApp (null = não mandou). */
  lembreteEnviadoEm: string | null;
  agradecimentoEnviadoEm: string | null;
  /** Só em "Meus agendamentos": se ainda dá para remarcar/cancelar pelo site (antecedência). */
  podeAlterarPeloSite?: boolean;
  /** Como o cliente pretende pagar (null = não informou). */
  formaDePagamento: CodigoFormaDePagamento | null;
  /** Só no Kanban: quantas vezes o cliente já faltou (com qualquer profissional). */
  faltasDoCliente?: number;
}

export interface Configuracoes {
  /** Botão "Entrar" na página de agendamento (o /admin/login funciona sempre). */
  botaoEntrarVisivel: boolean;
  /** Botão "Cadastrar" na página de agendamento e criação de contas novas. */
  cadastroLiberado: boolean;
  /** Nome da clínica (barra lateral, página de agendamento e mensagens). */
  nomeClinica: string;
  /** Cor principal no formato "#rrggbb"; null = cor padrão do sistema. */
  corPrincipal: string | null;
  /** Cor da barra lateral do painel; null = cor padrão do sistema. */
  corLateral: string | null;
  /** Logo da clínica como imagem base64 (data URL); null = ícone padrão. */
  logo: string | null;
  /** Endereço por extenso (null = não mostra). */
  endereco: string | null;
  /** Link do Google Maps (null = busca pelo endereço). */
  linkMapa: string | null;
  /** Usuário do Instagram, sem "@". */
  instagram: string | null;
  /** WhatsApp da clínica, só números com DDD. */
  whatsapp: string | null;
  /** Dias e horários de funcionamento; null = ainda não definido. */
  horarioFuncionamento: HorarioFuncionamentoJSON | null;
}

/** Um dia em que a clínica abre ("HH:MM"; o fechamento é exclusivo). */
export interface ExpedienteJSON {
  /** 0 = domingo ... 6 = sábado. */
  diaSemana: number;
  abertura: string;
  fechamento: string;
}

/** Só os dias em que a clínica abre; os que não aparecem são fechados. */
export interface HorarioFuncionamentoJSON {
  dias: ExpedienteJSON[];
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
  /** Horários do mês em que o cliente não veio. */
  quantidadeFaltas: number;
  /** Faltas / (atendidos + faltas), de 0 a 1. */
  taxaDeFaltas: number;
  faturamentoPorFormaDePagamento: FaturamentoDaFormaDePagamento[];
}

export interface FaturamentoDaFormaDePagamento {
  /** null = o cliente não informou. */
  formaDePagamento: CodigoFormaDePagamento | null;
  nome: string;
  atendimentos: number;
  faturamento: number;
}

/** Lucro de um mês (faturamento − gasto informado), da clínica ou de um profissional. */
export interface LucroMensal {
  mes: string;
  /** null = clínica inteira (faturamento de todos − gasto da clínica). */
  profissionalId: number | null;
  faturamento: number;
  /** null = o gasto do mês ainda não foi informado. */
  gasto: number | null;
  /** Pode ser negativo (prejuízo). null = falta informar o gasto. */
  lucro: number | null;
  /** Lucro em % do faturamento (null sem gasto ou sem faturamento). */
  margem: number | null;
  /** Para sugerir o mesmo valor do mês anterior. */
  gastoDoMesAnterior: number | null;
}

/** Usuário do painel (conta de administrador). */
export interface Usuario {
  id: number;
  email: string;
  criadoEm: string | null;
  /** Profissional a quem a conta pertence; null = acesso total. */
  profissionalId: number | null;
  /** Profissional que também administra a clínica (vê só os próprios agendamentos). */
  administrador: boolean;
}

/** Quem está logado no painel. Com profissional, só vê o que é daquele profissional. */
export interface UsuarioLogado {
  id: number;
  email: string;
  profissionalId: number | null;
  profissionalNome: string | null;
  /** Profissional que também administra a clínica. */
  administrador: boolean;
}

/** Folga/férias de um profissional ou feriado da clínica (profissionalId null). */
export interface BloqueioAgenda {
  id: number;
  profissionalId: number | null;
  dataInicio: string;
  dataFim: string;
  motivo: string;
  quantidadeDias: number;
}

/** Período fechado como a página do cliente vê (sem o motivo). */
export interface PeriodoBloqueado {
  dataInicio: string;
  dataFim: string;
}

/** Linha da lista de clientes (telefone, só números, + nome identificam o cliente). */
export interface ClienteResumo {
  telefone: string;
  nome: string;
  /** Atendimentos finalizados. */
  atendimentos: number;
  /** Horários em que não compareceu. */
  faltas: number;
  totalGasto: number;
  ultimoAtendimento: string | null;
  proximoAgendamento: { data: string; horarioInicio: string } | null;
}

/** Ficha completa do cliente, com o histórico de agendamentos (mais recente primeiro). */
export interface FichaDoCliente extends Omit<ClienteResumo, "proximoAgendamento"> {
  ticketMedio: number;
  /** Faltas / (atendidos + faltas), de 0 a 1. */
  taxaDeFaltas: number;
  primeiroAtendimento: string | null;
  /** Quem já marcou para esta pessoa usando o próprio telefone (ex.: a mãe). */
  responsaveis: string[];
  /** Outras pessoas atendidas com o mesmo telefone. */
  outrasPessoas: string[];
  proximoAgendamento: Agendamento | null;
  tratamentosMaisFeitos: { nome: string; quantidade: number }[];
  profissionais: string[];
  agendamentos: Agendamento[];
}

/** O que ocupa uma faixa da agenda: atendimento marcado ou horário livre/passado/fechado. */
export interface BlocoDaAgenda {
  tipo: "agendamento" | "livre" | "passado" | "fechado";
  horario: string;
  /** Quantas faixas de 30min o bloco ocupa (agendamentos podem ocupar várias). */
  slots: number;
  agendamento?: Agendamento;
}

export interface DiaDaAgenda {
  data: string;
  fechado: boolean;
  motivoFechado: string | null;
  agendamentos: number;
  livres: number;
  blocos: BlocoDaAgenda[];
}

/** Agenda de um profissional num período (normalmente uma semana). */
export interface AgendaSemanal {
  profissional: Profissional;
  inicio: string;
  /** Linhas da agenda (horários de 30min), na ordem. */
  horarios: string[];
  dias: DiaDaAgenda[];
}

export type TipoNotificacao =
  | "NOVO_AGENDAMENTO"
  | "AGENDAMENTO_REMARCADO"
  | "AGENDAMENTO_CANCELADO";

/** Aviso do sino do painel. */
export interface Notificacao {
  id: number;
  tipo: TipoNotificacao;
  profissionalId: number;
  agendamentoId: number | null;
  titulo: string;
  mensagem: string;
  origem: "CLIENTE" | "EQUIPE";
  criadaEm: string;
}

export interface ResumoDeNotificacoes {
  naoLidas: number;
  notificacoes: Notificacao[];
}
