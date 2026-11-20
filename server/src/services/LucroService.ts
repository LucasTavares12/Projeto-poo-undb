import { GastoMensal } from "../module/GastoMensal";
import { LucroMensal } from "../module/LucroMensal";
import { MesReferencia } from "../module/MesReferencia";
import { PerfilDeAcesso } from "../module/PerfilDeAcesso";
import { GastoMensalRepository } from "../repositories/GastoMensalRepository";
import { RelatorioService } from "./RelatorioService";

/**
 * Parte "Lucro" da aba "Relatórios". `filtroProfissional` null = clínica inteira
 * (faturamento de todos − gasto da clínica); com valor, o lucro daquele profissional
 * (faturamento dele − gasto próprio dele). Conta ligada a um profissional sempre vê, informa
 * e apaga só o dela, qualquer que seja o filtro pedido (a mesma regra do relatório).
 */
export class LucroService {
  private readonly gastoRepo = new GastoMensalRepository();
  private readonly relatorioService = new RelatorioService();

  public async calcular(
    mes: string,
    filtroProfissional: number | null,
    profissionalDoUsuario: number | null
  ): Promise<LucroMensal> {
    const profissionalId = this.alcance(filtroProfissional, profissionalDoUsuario);
    const relatorio = await this.relatorioService.gerarMensal(mes, profissionalId, null);
    const [gasto, gastoDoMesAnterior] = await Promise.all([
      this.gastoRepo.buscar(mes, profissionalId),
      this.gastoRepo.buscar(new MesReferencia(mes).anterior().toString(), profissionalId),
    ]);
    return new LucroMensal(relatorio, gasto, gastoDoMesAnterior);
  }

  /** Informa (ou corrige) o gasto do mês e devolve o lucro já recalculado. */
  public async informarGasto(
    mes: string,
    valor: unknown,
    filtroProfissional: number | null,
    profissionalDoUsuario: number | null
  ): Promise<LucroMensal> {
    const profissionalId = this.alcance(filtroProfissional, profissionalDoUsuario);
    await this.gastoRepo.salvar(GastoMensal.novo(mes, valor, profissionalId));
    return this.calcular(mes, profissionalId, profissionalDoUsuario);
  }

  /** Apaga o gasto do mês (informado errado) e devolve o lucro, que volta a ficar pendente. */
  public async apagarGasto(
    mes: string,
    filtroProfissional: number | null,
    profissionalDoUsuario: number | null
  ): Promise<LucroMensal> {
    const profissionalId = this.alcance(filtroProfissional, profissionalDoUsuario);
    await this.gastoRepo.apagar(new MesReferencia(mes).toString(), profissionalId);
    return this.calcular(mes, profissionalId, profissionalDoUsuario);
  }

  /** O lucro que a conta de fato consulta (conta de profissional: sempre o dela). */
  private alcance(
    filtroProfissional: number | null,
    profissionalDoUsuario: number | null
  ): number | null {
    return new PerfilDeAcesso(profissionalDoUsuario).aplicarFiltro(filtroProfissional);
  }
}
