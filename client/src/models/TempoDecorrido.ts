/** Há quanto tempo algo aconteceu, do jeito curto das notificações ("há 5 min", "ontem"). */
export class TempoDecorrido {
  private static readonly HORA = new Intl.DateTimeFormat("pt-BR", {
    hour: "2-digit",
    minute: "2-digit",
  });

  private readonly instante: Date;

  constructor(instante: string | Date) {
    this.instante = new Date(instante);
  }

  public formatar(agora: Date = new Date()): string {
    const minutos = Math.floor((agora.getTime() - this.instante.getTime()) / 60000);
    if (minutos < 1) {
      return "agora";
    }
    if (minutos < 60) {
      return `há ${minutos} min`;
    }
    const horas = Math.floor(minutos / 60);
    if (horas < 24 && this.instante.getDate() === agora.getDate()) {
      return `há ${horas} h`;
    }
    const ontem = new Date(agora);
    ontem.setDate(agora.getDate() - 1);
    if (this.instante.toDateString() === ontem.toDateString()) {
      return `ontem às ${TempoDecorrido.HORA.format(this.instante)}`;
    }
    const dia = String(this.instante.getDate()).padStart(2, "0");
    const mes = String(this.instante.getMonth() + 1).padStart(2, "0");
    return `${dia}/${mes} às ${TempoDecorrido.HORA.format(this.instante)}`;
  }
}
