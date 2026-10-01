/**
 * Value object que representa um horário da grade fixa de 30 em 30 minutos
 * usada pela clínica (09:00, 09:30, 10:00, ...). Toda a validação e a
 * aritmética de horários vivem aqui dentro, encapsuladas na classe — nada
 * de função solta fora de um objeto.
 */
export class Horario {
  public static readonly DURACAO_SLOT_MINUTOS = 30;

  private readonly valor: string; // formato "HH:MM"

  constructor(valor: string) {
    if (!Horario.ehValido(valor)) {
      throw new Error(
        `Horário inválido: ${valor}. Use o formato "HH:MM" alinhado à grade de 30 minutos.`
      );
    }
    this.valor = valor;
  }

  public static ehValido(valor: string): boolean {
    if (!/^\d{2}:\d{2}$/.test(valor)) {
      return false;
    }
    return Horario.textoParaMinutos(valor) % Horario.DURACAO_SLOT_MINUTOS === 0;
  }

  private static textoParaMinutos(valor: string): number {
    const [horas, minutos] = valor.split(":").map(Number);
    return horas * 60 + minutos;
  }

  private static minutosParaTexto(minutos: number): string {
    const horas = Math.floor(minutos / 60) % 24;
    const minutosRestantes = minutos % 60;
    return `${String(horas).padStart(2, "0")}:${String(minutosRestantes).padStart(2, "0")}`;
  }

  public paraMinutos(): number {
    return Horario.textoParaMinutos(this.valor);
  }

  /** Retorna um novo Horario, `quantidadeSlots` slots de 30min depois deste. */
  public somarSlots(quantidadeSlots: number): Horario {
    const minutos = this.paraMinutos() + quantidadeSlots * Horario.DURACAO_SLOT_MINUTOS;
    return new Horario(Horario.minutosParaTexto(minutos));
  }

  public equals(outro: Horario): boolean {
    return this.valor === outro.valor;
  }

  public toString(): string {
    return this.valor;
  }

  public toJSON(): string {
    return this.valor;
  }
}
