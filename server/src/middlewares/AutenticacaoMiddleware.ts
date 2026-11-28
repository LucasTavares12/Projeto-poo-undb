import { Request, Response, NextFunction } from "express";
import { AutenticacaoService } from "../services/AutenticacaoService";
import { SessaoDaRequisicao } from "./SessaoDaRequisicao";

/**
 * Protege as rotas do painel admin: só deixa a requisição seguir se vier
 * com um token válido no cabeçalho "Authorization: Bearer <token>" de uma
 * conta que ainda existe. Deixa em `res.locals` quem está logado (adminId),
 * se a conta for de um profissional, qual (profissionalId) e se ele também administra a
 * clínica (administrador).
 */
export class AutenticacaoMiddleware {
  constructor(private readonly servico: AutenticacaoService) {}

  public async verificar(req: Request, res: Response, next: NextFunction): Promise<void> {
    const cabecalho = req.headers.authorization ?? "";
    const token = cabecalho.startsWith("Bearer ") ? cabecalho.slice("Bearer ".length) : "";

    try {
      const usuario = token ? await this.servico.usuarioDaSessao(token) : null;
      if (!usuario) {
        res.status(401).json({ erro: "Faça login como administrador para continuar." });
        return;
      }

      res.locals.adminId = usuario.getId();
      res.locals.profissionalId = usuario.getProfissionalId();
      res.locals.administrador = usuario.ehProfissionalAdministrador();
      next();
    } catch (erro) {
      next(erro);
    }
  }

  /**
   * Rotas públicas usadas também pelo painel (ver horários, agendar): nunca barra.
   * Se vier um login válido, anota quem é, como o `verificar`; sem login, segue como cliente.
   */
  public async identificar(req: Request, res: Response, next: NextFunction): Promise<void> {
    const cabecalho = req.headers.authorization ?? "";
    const token = cabecalho.startsWith("Bearer ") ? cabecalho.slice("Bearer ".length) : "";
    try {
      const usuario = token ? await this.servico.usuarioDaSessao(token) : null;
      if (usuario) {
        res.locals.adminId = usuario.getId();
        res.locals.profissionalId = usuario.getProfissionalId();
        res.locals.administrador = usuario.ehProfissionalAdministrador();
      }
      next();
    } catch {
      // Token inválido numa rota pública: segue como cliente.
      next();
    }
  }

  /**
   * Depois de `verificar`: só deixa passar quem administra a clínica (conta sem profissional
   * ou profissional administrador). Usado no que é da clínica inteira: usuários,
   * configurações, personalização, tratamentos, cadastro de profissionais.
   */
  public exigirAdministracao(req: Request, res: Response, next: NextFunction): void {
    if (!SessaoDaRequisicao.perfil(res).administraClinica()) {
      res.status(403).json({ erro: "Esta área é só para administradores da clínica." });
      return;
    }
    next();
  }
}
