import { Request, Response } from "express";
import { Controlador } from "./Controlador";
import { ConfiguracaoService } from "../services/ConfiguracaoService";

export class ConfiguracaoController extends Controlador {
  private readonly servico = new ConfiguracaoService();

  /** Pública: a página de agendamento precisa saber se mostra os botões de acesso. */
  public async obter(req: Request, res: Response): Promise<void> {
    res.json(await this.servico.obter());
  }

  /** Aba "Configurações" do painel: altera só as opções enviadas no corpo. */
  public async atualizar(req: Request, res: Response): Promise<void> {
    try {
      const { acessoPublicoLiberado } = req.body ?? {};
      res.json(await this.servico.atualizar({ acessoPublicoLiberado }));
    } catch (erro) {
      this.responderErro(res, erro);
    }
  }
}
