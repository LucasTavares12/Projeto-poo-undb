/**
 * Erro esperado das regras do sistema (não encontrado, sem permissão, conflito...).
 * Cada tipo de erro sabe o status HTTP que representa; os controllers só repassam
 * (ver `Controlador.responderErro`). Erros que não são desta família são falhas
 * inesperadas ou de validação dos modelos.
 */
export abstract class ErroDaAplicacao extends Error {
  public abstract readonly status: number;

  constructor(mensagem: string) {
    super(mensagem);
    this.name = new.target.name;
  }
}
