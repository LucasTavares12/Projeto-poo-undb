/**
 * Prepara a imagem escolhida para ser a logo da clínica: confere o tipo e o tamanho do
 * arquivo e reduz a imagem (no próprio navegador) para no máximo 256px no lado maior,
 * em PNG — mantém a transparência e fica leve para guardar no banco e carregar rápido.
 */
export class ImagemDaLogo {
  private static readonly LADO_MAXIMO = 256;
  private static readonly TAMANHO_MAXIMO_ARQUIVO = 5 * 1024 * 1024; // 5 MB
  private static readonly TIPOS_ACEITOS = ["image/png", "image/jpeg", "image/webp", "image/svg+xml"];

  /** Valor para o atributo `accept` do campo de arquivo. */
  public static readonly ACEITAR = ImagemDaLogo.TIPOS_ACEITOS.join(",");

  /** Devolve a imagem pronta como data URL PNG, ou lança um Error com a mensagem para a tela. */
  public static async preparar(arquivo: File): Promise<string> {
    if (!ImagemDaLogo.TIPOS_ACEITOS.includes(arquivo.type)) {
      throw new Error("Escolha uma imagem PNG, JPG, WebP ou SVG.");
    }
    if (arquivo.size > ImagemDaLogo.TAMANHO_MAXIMO_ARQUIVO) {
      throw new Error("A imagem é grande demais (máximo de 5 MB).");
    }

    const imagem = await ImagemDaLogo.carregar(arquivo);
    const largura = imagem.naturalWidth || ImagemDaLogo.LADO_MAXIMO;
    const altura = imagem.naturalHeight || ImagemDaLogo.LADO_MAXIMO;
    const escala = Math.min(1, ImagemDaLogo.LADO_MAXIMO / Math.max(largura, altura));

    const canvas = document.createElement("canvas");
    canvas.width = Math.max(1, Math.round(largura * escala));
    canvas.height = Math.max(1, Math.round(altura * escala));
    const contexto = canvas.getContext("2d");
    if (!contexto) {
      throw new Error("Não foi possível processar a imagem neste navegador.");
    }
    contexto.imageSmoothingQuality = "high";
    contexto.drawImage(imagem, 0, 0, canvas.width, canvas.height);
    return canvas.toDataURL("image/png");
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
        reject(new Error("Não foi possível abrir esta imagem. Tente outro arquivo."));
      };
      imagem.src = endereco;
    });
  }
}
