import { Request, Response } from "express";
import { AutenticacaoService } from "../services/AutenticacaoService";
import { ErroAutenticacao } from "../services/ErroAutenticacao";

export class AutenticacaoController {
  constructor(private readonly servico: AutenticacaoService) {}

  /** Tela de cadastro: cria a conta (e-mail + senha) para depois fazer login. */
  public async cadastrar(req: Request, res: Response): Promise<void> {
    try {
      const { email, senha } = req.body ?? {};
      const administrador = await this.servico.cadastrar(email, senha);
      res.status(201).json(administrador);
    } catch (erro) {
      const status = erro instanceof ErroAutenticacao ? erro.status : 400;
      res.status(status).json({ erro: (erro as Error).message });
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
