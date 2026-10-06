import { Request, Response } from "express";
import { UsuarioService } from "../services/UsuarioService";
import { ErroAutenticacao } from "../services/ErroAutenticacao";
import { SessaoDaRequisicao } from "../middlewares/SessaoDaRequisicao";

/** Aba "Configurações" > "Usuários do sistema". Todas as rotas exigem login. */
export class UsuarioController {
  private readonly servico = new UsuarioService();

  public async listar(req: Request, res: Response): Promise<void> {
    res.json(await this.servico.listar());
  }

  public async criar(req: Request, res: Response): Promise<void> {
    await this.responder(res, 201, async () => {
      const { email, senha, profissionalId } = req.body ?? {};
      return this.servico.criar(email, senha, this.lerProfissional(profissionalId));
    });
  }

  public async alterarEmail(req: Request, res: Response): Promise<void> {
    await this.responder(res, 200, () =>
      this.servico.alterarEmail(Number(req.params.id), req.body?.email)
    );
  }

  public async alterarSenha(req: Request, res: Response): Promise<void> {
    await this.responder(res, 204, async () => {
      const { senha, senhaAtual } = req.body ?? {};
      await this.servico.alterarSenha(Number(req.params.id), senha, this.idLogado(res), senhaAtual);
    });
  }

  /** Liga a conta a um profissional ou, com `profissionalId: null`, devolve o acesso total. */
  public async vincularProfissional(req: Request, res: Response): Promise<void> {
    await this.responder(res, 200, () =>
      this.servico.vincularProfissional(
        Number(req.params.id),
        this.lerProfissional(req.body?.profissionalId)
      )
    );
  }

  public async excluir(req: Request, res: Response): Promise<void> {
    await this.responder(res, 204, () => this.servico.excluir(Number(req.params.id)));
  }

  /** Quem está logado (preenchido pelo AutenticacaoMiddleware). */
  private idLogado(res: Response): number {
    return SessaoDaRequisicao.adminId(res);
  }

  /** Vazio/null = sem profissional (acesso total). */
  private lerProfissional(valor: unknown): number | null {
    return valor === undefined || valor === null || valor === "" ? null : Number(valor);
  }

  /** Executa a ação e responde: erro esperado com o status dele; validação do modelo = 400. */
  private async responder(res: Response, status: number, acao: () => Promise<unknown>): Promise<void> {
    try {
      const resultado = await acao();
      if (status === 204) {
        res.status(204).send();
      } else {
        res.status(status).json(resultado);
      }
    } catch (erro) {
      const codigo = erro instanceof ErroAutenticacao ? erro.status : 400;
      res.status(codigo).json({ erro: (erro as Error).message });
    }
  }
}
