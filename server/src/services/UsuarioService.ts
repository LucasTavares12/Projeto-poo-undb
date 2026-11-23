import { Administrador } from "../module/Administrador";
import { AdministradorRepository } from "../repositories/AdministradorRepository";
import { ProfissionalRepository } from "../repositories/ProfissionalRepository";
import { ErroAutenticacao } from "../erros/ErroAutenticacao";
import { ErroDeConflito } from "../erros/ErroDeConflito";
import { ErroNaoEncontrado } from "../erros/ErroNaoEncontrado";

/**
 * Gerenciamento dos usuários do painel (aba "Configurações"): criar, editar o
 * e-mail, trocar a senha e excluir, sem deixar o painel sem nenhum usuário.
 */
export class UsuarioService {
  private readonly repositorio = new AdministradorRepository();
  private readonly profissionalRepo = new ProfissionalRepository();

  public listar(): Promise<Administrador[]> {
    return this.repositorio.listarTodos();
  }

  /**
   * Criado por quem já está logado: não depende do cadastro público estar liberado.
   * `profissionalId` opcional já cria a conta ligada àquele profissional; `administrador`
   * faz esse profissional também administrar a clínica.
   */
  public async criar(
    email: string,
    senha: string,
    profissionalId: number | null = null,
    administrador = false
  ): Promise<Administrador> {
    const novo = await Administrador.comSenha(email, senha);
    if (await this.repositorio.buscarPorEmail(novo.getEmail())) {
      throw new ErroDeConflito("Já existe uma conta com este e-mail.");
    }
    await this.validarProfissionalLivre(profissionalId, null);
    novo.vincularProfissional(profissionalId);
    if (profissionalId !== null) {
      novo.definirAdministrador(administrador);
    }
    return this.repositorio.salvar(novo);
  }

  /**
   * Define o acesso da conta: ligada a um profissional (vê só os agendamentos dele) ou sem
   * profissional (null: acesso total). Com profissional, `administrador` diz se ele também
   * administra a clínica. Sempre sobra ao menos uma conta que administra a clínica.
   */
  public async vincularProfissional(
    id: number,
    profissionalId: number | null,
    administrador = false
  ): Promise<Administrador> {
    const usuario = await this.buscar(id);
    await this.validarProfissionalLivre(profissionalId, id);

    const continuaAdministrando = profissionalId === null || administrador;
    if (usuario.administraClinica() && !continuaAdministrando) {
      await this.garantirOutroAdministrador(
        "É preciso manter pelo menos um usuário que administre a clínica (acesso total ou " +
          "profissional administrador). Dê esse acesso a outro usuário antes de tirar deste."
      );
    }

    usuario.vincularProfissional(profissionalId);
    if (profissionalId !== null) {
      usuario.definirAdministrador(administrador);
    }
    await this.repositorio.atualizar(usuario);
    return usuario;
  }

  public async alterarEmail(id: number, email: string): Promise<Administrador> {
    const usuario = await this.buscar(id);
    usuario.setEmail(email);

    const dono = await this.repositorio.buscarPorEmail(usuario.getEmail());
    if (dono && dono.getId() !== id) {
      throw new ErroDeConflito("Já existe uma conta com este e-mail.");
    }

    await this.repositorio.atualizar(usuario);
    return usuario;
  }

  /**
   * Para trocar a própria senha é preciso confirmar a senha atual; a senha de
   * outro usuário o administrador pode redefinir diretamente.
   */
  public async alterarSenha(
    id: number,
    novaSenha: string,
    idLogado: number,
    senhaAtual?: string
  ): Promise<void> {
    const usuario = await this.buscar(id);

    if (id === idLogado && !(await usuario.senhaConfere(String(senhaAtual ?? "")))) {
      throw new ErroAutenticacao("A senha atual está incorreta.", 400);
    }

    await usuario.alterarSenha(novaSenha);
    await this.repositorio.atualizar(usuario);
  }

  /**
   * Exclui um usuário, inclusive a própria conta de quem está logado, desde que sobre
   * pelo menos um usuário que administre a clínica: senão ninguém mais a administraria.
   */
  public async excluir(id: number): Promise<void> {
    const usuario = await this.buscar(id);
    if (usuario.administraClinica()) {
      await this.garantirOutroAdministrador(
        "Este é o único usuário que administra a clínica. Dê acesso total ou de " +
          "administrador a outro usuário antes de excluí-lo."
      );
    }
    await this.repositorio.deletar(id);
  }

  /** O profissional precisa existir e não pode já estar ligado a outra conta. */
  private async validarProfissionalLivre(
    profissionalId: number | null,
    idDoUsuario: number | null
  ): Promise<void> {
    if (profissionalId === null) {
      return;
    }
    if (!(await this.profissionalRepo.buscarPorId(profissionalId))) {
      throw new ErroNaoEncontrado("Profissional não encontrado.");
    }
    const dono = await this.repositorio.buscarPorProfissional(profissionalId);
    if (dono && dono.getId() !== idDoUsuario) {
      throw new ErroAutenticacao(
        `Este profissional já está vinculado ao usuário ${dono.getEmail()}.`,
        409
      );
    }
  }

  private async garantirOutroAdministrador(mensagem: string): Promise<void> {
    if ((await this.repositorio.contarAdministradores()) <= 1) {
      throw new ErroAutenticacao(mensagem, 400);
    }
  }

  private async buscar(id: number): Promise<Administrador> {
    const usuario = Number.isInteger(id) ? await this.repositorio.buscarPorId(id) : null;
    if (!usuario) {
      throw new ErroNaoEncontrado("Usuário não encontrado.");
    }
    return usuario;
  }
}
