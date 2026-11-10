/**
 * Alertas de "chegou novidade" no painel: um som curto, o título da aba piscando e, se a
 * pessoa permitir, a notificação do próprio sistema (útil com o painel em outra aba ou janela).
 * O som fica a cargo do modal de avisos, que o repete até a pessoa marcar como visto.
 */
export class AlertaDoNavegador {
  private static audio: AudioContext | null = null;
  private static tituloOriginal: string | null = null;
  private static pisca: ReturnType<typeof setInterval> | null = null;

  /**
   * Os navegadores só deixam tocar som depois de algum clique ou tecla na página.
   * Chamado uma vez ao abrir o painel: no primeiro toque da pessoa o áudio fica liberado.
   */
  public static prepararSom(): void {
    const liberar = () => {
      try {
        AlertaDoNavegador.audio ??= new AudioContext();
        void AlertaDoNavegador.audio.resume();
      } catch {
        return;
      }
      window.removeEventListener("pointerdown", liberar);
      window.removeEventListener("keydown", liberar);
    };
    window.addEventListener("pointerdown", liberar);
    window.addEventListener("keydown", liberar);
  }

  /** O navegador tem notificações e a pessoa ainda não respondeu se quer recebê-las. */
  public static podePedirPermissao(): boolean {
    return "Notification" in window && Notification.permission === "default";
  }

  public static estaBloqueado(): boolean {
    return "Notification" in window && Notification.permission === "denied";
  }

  /** Precisa ser chamado a partir de um clique (regra dos navegadores). */
  public static async pedirPermissao(): Promise<boolean> {
    if (!("Notification" in window)) {
      return false;
    }
    return (await Notification.requestPermission()) === "granted";
  }

  public static avisar(titulo: string, mensagem: string, quantidade: number): void {
    // Com o painel na frente da pessoa, o aviso na tela basta; a notificação do sistema é
    // para quando ela está em outra aba ou outro programa.
    if (document.hidden || !document.hasFocus()) {
      AlertaDoNavegador.piscarTitulo(quantidade);
      if ("Notification" in window && Notification.permission === "granted") {
        const aviso = new Notification(titulo, {
          body: mensagem,
          icon: "/favicon.svg",
          tag: "agendamentos",
          requireInteraction: true,
        });
        aviso.onclick = () => {
          window.focus();
          aviso.close();
        };
      }
    }
  }

  /** Alterna o título da aba entre o normal e "(2) Novo agendamento" até a pessoa voltar. */
  private static piscarTitulo(quantidade: number): void {
    AlertaDoNavegador.pararDePiscar();
    AlertaDoNavegador.tituloOriginal = document.title;
    const aviso = `(${quantidade}) ${quantidade === 1 ? "Novo aviso" : "Novos avisos"} na agenda`;
    let mostrandoAviso = false;
    AlertaDoNavegador.pisca = setInterval(() => {
      mostrandoAviso = !mostrandoAviso;
      document.title = mostrandoAviso ? aviso : AlertaDoNavegador.tituloOriginal ?? "";
    }, 1000);
    const aoVoltar = () => {
      if (!document.hidden && document.hasFocus()) {
        AlertaDoNavegador.pararDePiscar();
        window.removeEventListener("focus", aoVoltar);
        document.removeEventListener("visibilitychange", aoVoltar);
      }
    };
    window.addEventListener("focus", aoVoltar);
    document.addEventListener("visibilitychange", aoVoltar);
  }

  private static pararDePiscar(): void {
    if (AlertaDoNavegador.pisca !== null) {
      clearInterval(AlertaDoNavegador.pisca);
      AlertaDoNavegador.pisca = null;
    }
    if (AlertaDoNavegador.tituloOriginal !== null) {
      document.title = AlertaDoNavegador.tituloOriginal;
      AlertaDoNavegador.tituloOriginal = null;
    }
  }

  /** Três toques curtos (gerados na hora, sem arquivo de áudio). */
  public static tocarSom(): void {
    try {
      AlertaDoNavegador.audio ??= new AudioContext();
      const audio = AlertaDoNavegador.audio;
      void audio.resume();
      [880, 1175, 1568].forEach((frequencia, indice) => {
        const inicio = audio.currentTime + 0.05 + indice * 0.16;
        const oscilador = audio.createOscillator();
        const volume = audio.createGain();
        oscilador.type = "sine";
        oscilador.frequency.value = frequencia;
        volume.gain.setValueAtTime(0.0001, inicio);
        volume.gain.exponentialRampToValueAtTime(0.25, inicio + 0.02);
        volume.gain.exponentialRampToValueAtTime(0.0001, inicio + 0.3);
        oscilador.connect(volume).connect(audio.destination);
        oscilador.start(inicio);
        oscilador.stop(inicio + 0.32);
      });
    } catch {
      // Sem áudio disponível (ou bloqueado pelo navegador): fica só o aviso visual.
    }
  }
}
