import { Administrador } from "../module/Administrador";
import { AdministradorRepository } from "../repositories/AdministradorRepository";
import { ProfissionalRepository } from "../repositories/ProfissionalRepository";
import { ErroAutenticacao } from "./ErroAutenticacao";

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
   * `profissionalId` opcional já cria a conta ligada àquele profissional.
   */
  public async criar(
    email: string,
    senha: string,
    profissionalId: number | null = null
  ): Promise<Administrador> {
    const novo = await Administrador.comSenha(email, senha);
    if (await this.repositorio.buscarPorEmail(novo.getEmail())) {
      throw new ErroAutenticacao("Já existe uma conta com este e-mail.", 409);
    }
    await this.validarProfissionalLivre(profissionalId, null);
    novo.vincularProfissional(profissionalId);
    return this.repositorio.salvar(novo);
  }

  /**
   * Liga a conta a um profissional (ela passa a ver só o que é dele) ou desliga
   * (null: volta a ter acesso total). Sempre sobra ao menos uma conta com acesso total.
   */
  public async vincularProfissional(id: number, profissionalId: number | null): Promise<Administrador> {
    const usuario = await this.buscar(id);
    await this.validarProfissionalLivre(profissionalId, id);

    if (usuario.temAcessoTotal() && profissionalId !== null) {
      await this.garantirOutroComAcessoTotal(
        "É preciso manter pelo menos um usuário com acesso total. Crie outro usuário sem " +
          "profissional antes de vincular este."
      );
    }

    usuario.vincularProfissional(profissionalId);
    await this.repositorio.atualizar(usuario);
    return usuario;
  }

  public async alterarEmail(id: number, email: string): Promise<Administrador> {
    const usuario = await this.buscar(id);
    usuario.setEmail(email);

    const dono = await this.repositorio.buscarPorEmail(usuario.getEmail());
    if (dono && dono.getId() !== id) {
      throw new ErroAutenticacao("Já existe uma conta com este e-mail.", 409);
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
   * pelo menos um usuário com acesso total: senão ninguém mais administraria a clínica.
   */
  public async excluir(id: number): Promise<void> {
    const usuario = await this.buscar(id);
    if (usuario.temAcessoTotal()) {
      await this.garantirOutroComAcessoTotal(
        "Este é o único usuário com acesso total. Crie outro usuário sem profissional " +
          "antes de excluí-lo."
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
      throw new ErroAutenticacao("Profissional não encontrado.", 404);
    }
    const dono = await this.repositorio.buscarPorProfissional(profissionalId);
    if (dono && dono.getId() !== idDoUsuario) {
      throw new ErroAutenticacao(
        `Este profissional já está vinculado ao usuário ${dono.getEmail()}.`,
        409
      );
    }
  }

  private async garantirOutroComAcessoTotal(mensagem: string): Promise<void> {
    if ((await this.repositorio.contarComAcessoTotal()) <= 1) {
      throw new ErroAutenticacao(mensagem, 400);
    }
  }

  private async buscar(id: number): Promise<Administrador> {
    const usuario = Number.isInteger(id) ? await this.repositorio.buscarPorId(id) : null;
    if (!usuario) {
      throw new ErroAutenticacao("Usuário não encontrado.", 404);
    }
    return usuario;
  }
}
