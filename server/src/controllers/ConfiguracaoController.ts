import { Request, Response } from "express";
import { Controlador } from "./Controlador";
import { ConfiguracaoService } from "../services/ConfiguracaoService";

export class ConfiguracaoController extends Controlador {
  private readonly servico = new ConfiguracaoService();

  /**
   * Pública: a página de agendamento precisa saber se mostra os botões de acesso e
   * qual é o visual da clínica (nome, cores e logo).
   */
  public async obter(req: Request, res: Response): Promise<void> {
    try {
      res.json(await this.servico.obter());
    } catch (erro) {
      this.responderErro(res, erro);
    }
  }

  /** Abas "Configurações" e "Personalização": altera só as opções enviadas no corpo. */
  public async atualizar(req: Request, res: Response): Promise<void> {
    try {
      const {
        botaoEntrarVisivel,
        cadastroLiberado,
        nomeClinica,
        corPrincipal,
        corLateral,
        logo,
        endereco,
        linkMapa,
        instagram,
        whatsapp,
        horarioFuncionamento,
      } = req.body ?? {};
      res.json(
        await this.servico.atualizar({
          botaoEntrarVisivel,
          cadastroLiberado,
          nomeClinica,
          corPrincipal,
          corLateral,
          logo,
          endereco,
          linkMapa,
          instagram,
          whatsapp,
          horarioFuncionamento,
        })
      );
    } catch (erro) {
      this.responderErro(res, erro);
    }
  }

  /** "Personalização" > "Restaurar visual padrão". */
  public async restaurarVisual(req: Request, res: Response): Promise<void> {
    try {
      res.json(await this.servico.restaurarVisualPadrao());
    } catch (erro) {
      this.responderErro(res, erro);
    }
  }
}
