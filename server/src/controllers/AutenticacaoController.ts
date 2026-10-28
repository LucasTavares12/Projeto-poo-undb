import { Request, Response } from "express";
import { Controlador } from "./Controlador";
import { AutenticacaoService } from "../services/AutenticacaoService";
import { ErroAutenticacao } from "../erros/ErroAutenticacao";
import { SessaoDaRequisicao } from "../middlewares/SessaoDaRequisicao";

export class AutenticacaoController extends Controlador {
  constructor(private readonly servico: AutenticacaoService) {
    super();
  }

  /** Tela de cadastro: cria a conta (e-mail + senha) para depois fazer login. */
  public async cadastrar(req: Request, res: Response): Promise<void> {
    try {
      const { email, senha } = req.body ?? {};
      const administrador = await this.servico.cadastrar(email, senha);
      res.status(201).json(administrador);
    } catch (erro) {
      this.responderErro(res, erro);
    }
  }

  /** Painel: quem está logado e, se for de um profissional, qual. */
  public async sessao(req: Request, res: Response): Promise<void> {
    try {
      res.json(await this.servico.dadosDaSessao(SessaoDaRequisicao.adminId(res)));
    } catch (erro) {
      this.responderErro(res, erro, 500);
    }
  }

  /** Tela de login: troca e-mail e senha por um token. */
  public async entrar(req: Request, res: Response): Promise<void> {
    try {
      const { email, senha } = req.body ?? {};
      const token = await this.servico.entrar(email, senha);
      res.json({ token });
    } catch (erro) {
      if (erro instanceof ErroAutenticacao) {
        res.status(erro.status).json({ erro: erro.message });
        return;
      }
      console.error(erro);
      res.status(500).json({ erro: "Não foi possível fazer login agora. Tente novamente." });
    }
  }
}
