import { NomeDePessoa } from "./NomeDePessoa";
import { Telefone } from "./Telefone";

/** Avisos dos campos "Seus dados" (null = o campo está certo). */
export interface ErrosDeQuemAgenda {
  nome: string | null;
  responsavel: string | null;
  telefone: string | null;
}

/**
 * Os dados de quem está agendando, na etapa "Seus dados": para si mesmo ou para outra
 * pessoa (ex.: a mãe que marca para a filha com o próprio telefone). Valida os campos e
 * diz o que vai para o servidor: o cliente é sempre quem vai ser atendido.
 */
export class QuemAgenda {
  private readonly paraOutraPessoa: boolean;
  private readonly atendido: NomeDePessoa;
  private readonly responsavel: NomeDePessoa;
  private readonly telefone: string;

  constructor(
    paraOutraPessoa: boolean,
    nomeDoAtendido: string,
    nomeDoResponsavel: string,
    telefone: string
  ) {
    this.paraOutraPessoa = paraOutraPessoa;
    this.atendido = new NomeDePessoa(nomeDoAtendido);
    this.responsavel = new NomeDePessoa(paraOutraPessoa ? nomeDoResponsavel : "");
    this.telefone = telefone.trim();
  }

  public ehParaOutraPessoa(): boolean {
    return this.paraOutraPessoa;
  }

  public erros(): ErrosDeQuemAgenda {
    return {
      nome: this.atendido.estaVazio()
        ? this.paraOutraPessoa
          ? "Informe o nome de quem vai ser atendido."
          : "Informe seu nome."
        : null,
      responsavel: !this.paraOutraPessoa
        ? null
        : this.responsavel.estaVazio()
          ? "Informe o seu nome."
          : this.responsavel.ehIgualA(this.atendido)
            ? 'Os dois nomes estão iguais. Se o atendimento é para você, escolha "Para mim".'
            : null,
      telefone:
        this.telefone === ""
          ? "Informe um telefone para contato."
          : !new Telefone(this.telefone).ehValido()
            ? "Telefone incompleto: informe o DDD e o número."
            : null,
    };
  }

  public ehValido(): boolean {
    const erros = this.erros();
    return !erros.nome && !erros.responsavel && !erros.telefone;
  }

  /** Os campos do agendamento novo que o servidor espera. */
  public paraEnvio(): { clienteNome: string; clienteTelefone: string; responsavelNome: string } {
    return {
      clienteNome: this.atendido.toString(),
      clienteTelefone: this.telefone,
      responsavelNome: this.responsavel.toString(),
    };
  }
}
