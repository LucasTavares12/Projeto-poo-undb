import { Response } from "express";
import { ErroDaAplicacao } from "../erros/ErroDaAplicacao";
import { ErroDeValidacao } from "../erros/ErroDeValidacao";

/**
 * Base de todos os controllers: o jeito de responder um erro e de ler números da
 * requisição fica num lugar só.
 * Erro esperado da aplicação (validação, não encontrado, sem acesso, conflito...) usa o
 * status dele e a mensagem vai para a tela. Qualquer outro erro é falha inesperada
 * (ex: banco fora do ar): fica no log e a tela recebe só uma mensagem genérica.
 */
export abstract class Controlador {
  protected responderErro(res: Response, erro: unknown): void {
    if (erro instanceof ErroDaAplicacao) {
      res.status(erro.status).json({ erro: erro.message });
      return;
    }
    console.error(erro);
    res.status(500).json({ erro: "Erro interno no servidor." });
  }

  /**
   * Identificador vindo da URL, da query ou do corpo: precisa ser um número inteiro
   * positivo. Assim um "abc" vira erro de validação (400), e não uma consulta quebrada no banco.
   */
  protected lerId(valor: unknown, mensagem = "Identificador inválido."): number {
    const numero = Controlador.paraNumero(valor);
    if (numero === null || !Number.isInteger(numero) || numero <= 0) {
      throw new ErroDeValidacao(mensagem);
    }
    return numero;
  }

  /** Como `lerId`, mas vazio (undefined, null ou "") significa "nenhum" e vira null. */
  protected lerIdOpcional(valor: unknown, mensagem = "Identificador inválido."): number | null {
    return Controlador.estaVazio(valor) ? null : this.lerId(valor, mensagem);
  }

  /** Lista de identificadores (ex: tratamentos escolhidos). Todos precisam ser válidos. */
  protected lerIds(valores: unknown, mensagem = "Identificador inválido."): number[] {
    return Array.isArray(valores) ? valores.map((valor) => this.lerId(valor, mensagem)) : [];
  }

  /** Número inteiro opcional (ex: ?limite=, ?dias=): vazio usa o `padrao`. */
  protected lerInteiro(valor: unknown, padrao: number, mensagem: string): number {
    if (Controlador.estaVazio(valor)) {
      return padrao;
    }
    const numero = Controlador.paraNumero(valor);
    if (numero === null || !Number.isInteger(numero)) {
      throw new ErroDeValidacao(mensagem);
    }
    return numero;
  }

  private static estaVazio(valor: unknown): boolean {
    return valor === undefined || valor === null || valor === "";
  }

  private static paraNumero(valor: unknown): number | null {
    if (typeof valor === "number") {
      return valor;
    }
    if (typeof valor === "string" && valor.trim() !== "") {
      return Number(valor);
    }
    return null;
  }
}
