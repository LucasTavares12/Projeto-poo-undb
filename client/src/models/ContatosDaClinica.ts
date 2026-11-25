import type { Configuracoes } from "../services/types";
import { Telefone } from "./Telefone";

type DadosDeContato = Pick<Configuracoes, "endereco" | "linkMapa" | "instagram" | "whatsapp">;

/**
 * Como o cliente fala com a clínica e chega até ela: WhatsApp, Instagram e localização
 * (aba "Personalização"). Monta os links dos botões da página de agendamento.
 */
export class ContatosDaClinica {
  private readonly dados: DadosDeContato;

  constructor(dados: DadosDeContato) {
    this.dados = dados;
  }

  /** true se há pelo menos um contato para mostrar. */
  public temAlgum(): boolean {
    return Boolean(this.linkWhatsApp() || this.linkInstagram() || this.linkMapa());
  }

  public linkWhatsApp(): string | null {
    const telefone = this.dados.whatsapp ? new Telefone(this.dados.whatsapp) : null;
    return telefone?.ehValido() ? telefone.linkWhatsApp() : null;
  }

  /** "(98) 98877-6655" */
  public whatsappFormatado(): string | null {
    return this.dados.whatsapp ? new Telefone(this.dados.whatsapp).formatar() : null;
  }

  public linkInstagram(): string | null {
    return this.dados.instagram ? `https://www.instagram.com/${this.dados.instagram}/` : null;
  }

  /** "@suaclinica" */
  public instagramComArroba(): string | null {
    return this.dados.instagram ? `@${this.dados.instagram}` : null;
  }

  public getEndereco(): string | null {
    return this.dados.endereco;
  }

  /** O link do Maps informado ou, sem ele, a busca pelo endereço no Google Maps. */
  public linkMapa(): string | null {
    if (this.dados.linkMapa) {
      return this.dados.linkMapa;
    }
    return this.dados.endereco
      ? `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(this.dados.endereco)}`
      : null;
  }
}
