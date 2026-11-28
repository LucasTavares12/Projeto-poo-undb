import { Telefone } from "./Telefone";

/**
 * Endereço da ficha de um cliente no painel. Telefone + nome identificam a pessoa:
 * um mesmo número pode ter várias (ex.: a mãe que marca para ela e para a filha).
 */
export class FichaDoClienteLink {
  public static para(telefone: string, nome: string): string {
    const query = new URLSearchParams({ nome: nome.trim() });
    return `/admin/clientes/${new Telefone(telefone).getDigitos()}?${query.toString()}`;
  }
}
