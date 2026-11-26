/**
 * Prepara a foto que demonstra um tratamento para o cliente: confere o tipo e o tamanho do
 * arquivo e reduz a imagem (no próprio navegador) para no máximo 800px no lado maior, em
 * JPEG — fica leve para guardar no banco e carregar rápido na página de agendamento.
 */
export class FotoDoTratamento {
  private static readonly LADO_MAXIMO = 800;
  private static readonly QUALIDADE_JPEG = 0.82;
  private static readonly TAMANHO_MAXIMO_ARQUIVO = 10 * 1024 * 1024; // 10 MB
  private static readonly TIPOS_ACEITOS = ["image/png", "image/jpeg", "image/webp"];

  /** Valor para o atributo `accept` do campo de arquivo. */
  public static readonly ACEITAR = FotoDoTratamento.TIPOS_ACEITOS.join(",");

  /** Devolve a foto pronta como data URL JPEG, ou lança um Error com a mensagem para a tela. */
  public static async preparar(arquivo: File): Promise<string> {
    if (!FotoDoTratamento.TIPOS_ACEITOS.includes(arquivo.type)) {
      throw new Error("Escolha uma foto PNG, JPG ou WebP.");
    }
    if (arquivo.size > FotoDoTratamento.TAMANHO_MAXIMO_ARQUIVO) {
      throw new Error("A foto é grande demais (máximo de 10 MB).");
    }

    const imagem = await FotoDoTratamento.carregar(arquivo);
    const largura = imagem.naturalWidth || FotoDoTratamento.LADO_MAXIMO;
    const altura = imagem.naturalHeight || FotoDoTratamento.LADO_MAXIMO;
    const escala = Math.min(1, FotoDoTratamento.LADO_MAXIMO / Math.max(largura, altura));

    const canvas = document.createElement("canvas");
    canvas.width = Math.max(1, Math.round(largura * escala));
    canvas.height = Math.max(1, Math.round(altura * escala));
    const contexto = canvas.getContext("2d");
    if (!contexto) {
      throw new Error("Não foi possível processar a foto neste navegador.");
    }
    // JPEG não tem transparência: o fundo transparente de um PNG vira branco (e não preto).
    contexto.fillStyle = "#ffffff";
    contexto.fillRect(0, 0, canvas.width, canvas.height);
    contexto.imageSmoothingQuality = "high";
    contexto.drawImage(imagem, 0, 0, canvas.width, canvas.height);
    return canvas.toDataURL("image/jpeg", FotoDoTratamento.QUALIDADE_JPEG);
  }

  private static carregar(arquivo: File): Promise<HTMLImageElement> {
    return new Promise((resolve, reject) => {
      const endereco = URL.createObjectURL(arquivo);
      const imagem = new Image();
      imagem.onload = () => {
        URL.revokeObjectURL(endereco);
        resolve(imagem);
      };
      imagem.onerror = () => {
        URL.revokeObjectURL(endereco);
        reject(new Error("Não foi possível abrir esta foto. Tente outro arquivo."));
      };
      imagem.src = endereco;
    });
  }
}
