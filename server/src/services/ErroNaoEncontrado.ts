/**
 * Erro esperado quando o recurso pedido não existe (ou o usuário não pode vê-lo).
 * Permite ao controller responder 404 em vez do 400 dos erros de validação.
 */
export class ErroNaoEncontrado extends Error {
  constructor(mensagem: string) {
    super(mensagem);
    this.name = "ErroNaoEncontrado";
  }
}
