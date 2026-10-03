import { Request, Response } from "express";
import { ConfiguracaoRepository } from "../repositories/ConfiguracaoRepository";

export class ConfiguracaoController {
  private readonly repositorio = new ConfiguracaoRepository();

  /** Pública: a página de agendamento precisa saber se mostra os botões de acesso. */
  public async obter(req: Request, res: Response): Promise<void> {
    const configuracoes = await this.repositorio.carregar();
    res.json(configuracoes);
  }

  /** Aba "Configurações" do painel: altera só as opções enviadas no corpo. */
  public async atualizar(req: Request, res: Response): Promise<void> {
    try {
      const { acessoPublicoLiberado } = req.body ?? {};
      const configuracoes = await this.repositorio.carregar();

      if (acessoPublicoLiberado !== undefined) {
        configuracoes.setAcessoPublicoLiberado(acessoPublicoLiberado);
      }

      await this.repositorio.salvar(configuracoes);
      res.json(configuracoes);
    } catch (erro) {
      res.status(400).json({ erro: (erro as Error).message });
    }
  }
}
