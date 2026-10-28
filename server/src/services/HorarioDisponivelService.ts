import { HorarioDisponivel } from "../module/HorarioDisponivel";
import { Horario } from "../module/Horario";
import { DiaSemana } from "../module/DiaSemana";
import { PerfilDeAcesso } from "../module/PerfilDeAcesso";
import { HorarioDisponivelRepository } from "../repositories/HorarioDisponivelRepository";
import { ProfissionalRepository } from "../repositories/ProfissionalRepository";
import { ErroNaoEncontrado } from "../erros/ErroNaoEncontrado";
import { ErroDeConflito } from "../erros/ErroDeConflito";

/**
 * Grade semanal de cada profissional (aba "Horários"). Conta ligada a profissional
 * só vê e altera a grade dele.
 */
export class HorarioDisponivelService {
  private static readonly SEM_PERMISSAO = "Você só pode alterar os horários do seu profissional.";

  private readonly repositorio = new HorarioDisponivelRepository();
  private readonly profissionalRepo = new ProfissionalRepository();

  public listarDoProfissional(
    profissionalId: number,
    profissionalDoUsuario: number | null
  ): Promise<HorarioDisponivel[]> {
    new PerfilDeAcesso(profissionalDoUsuario).exigir(
      profissionalId,
      "Você só pode ver os horários do seu profissional."
    );
    return this.repositorio.listarPorProfissional(profissionalId);
  }

  public async liberar(
    profissionalId: number,
    diaSemana: number,
    horaInicio: string,
    profissionalDoUsuario: number | null
  ): Promise<HorarioDisponivel> {
    new PerfilDeAcesso(profissionalDoUsuario).exigir(
      profissionalId,
      HorarioDisponivelService.SEM_PERMISSAO
    );
    if (!Object.values(DiaSemana).includes(diaSemana)) {
      throw new Error("Dia da semana inválido.");
    }
    if (!(await this.profissionalRepo.buscarPorId(profissionalId))) {
      throw new ErroNaoEncontrado("Profissional não encontrado.");
    }

    const horario = new HorarioDisponivel(
      profissionalId,
      diaSemana as DiaSemana,
      new Horario(horaInicio)
    );
    try {
      return await this.repositorio.salvar(horario);
    } catch (erro) {
      // Chave única (profissional + dia + hora): o horário já estava liberado.
      if ((erro as { code?: string }).code === "ER_DUP_ENTRY") {
        throw new ErroDeConflito("Esse horário já está liberado.");
      }
      throw erro;
    }
  }

  public async bloquear(id: number, profissionalDoUsuario: number | null): Promise<void> {
    const horario = await this.repositorio.buscarPorId(id);
    if (!horario) {
      // Já não estava liberado: o resultado é o mesmo que o pedido.
      return;
    }
    new PerfilDeAcesso(profissionalDoUsuario).exigir(
      horario.getProfissionalId(),
      HorarioDisponivelService.SEM_PERMISSAO
    );
    await this.repositorio.deletar(id);
  }
}
