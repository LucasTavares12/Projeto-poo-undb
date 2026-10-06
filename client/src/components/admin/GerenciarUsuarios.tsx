import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import type { FormEvent } from "react";
import { UsuarioService } from "../../services/UsuarioService";
import { ProfissionalService } from "../../services/ProfissionalService";
import { SessaoAdmin } from "../../services/SessaoAdmin";
import type { Profissional, Usuario } from "../../services/types";
import { DataAgenda } from "../../models/DataAgenda";
import { IconeMais } from "../Icones";

const usuarioService = new UsuarioService();
const profissionalService = new ProfissionalService();

// Mesma regra do servidor (Administrador.TAMANHO_MINIMO_SENHA); aqui só para avisar antes de enviar.
const TAMANHO_MINIMO_SENHA = 6;

/** Qual linha está sendo editada e o quê. */
interface Edicao {
  id: number;
  modo: "email" | "senha" | "profissional";
}

// profissionalId fica como texto do <select>: "" = nenhum (acesso total).
const CAMPOS_VAZIOS = { email: "", senha: "", confirmacao: "", senhaAtual: "", profissionalId: "" };

/** "" do select vira null (acesso total); o resto vira o id do profissional. */
function lerProfissional(valor: string): number | null {
  return valor === "" ? null : Number(valor);
}

/** Aba "Configurações" > "Usuários do sistema": criar, editar e-mail, trocar senha e excluir. */
export function GerenciarUsuarios() {
  const navegar = useNavigate();
  const idLogado = SessaoAdmin.getAdminId();

  const [usuarios, setUsuarios] = useState<Usuario[]>([]);
  const [profissionais, setProfissionais] = useState<Profissional[]>([]);
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState<string | null>(null);
  const [mensagem, setMensagem] = useState<string | null>(null);

  const [criando, setCriando] = useState(false);
  const [edicao, setEdicao] = useState<Edicao | null>(null);
  const [campos, setCampos] = useState(CAMPOS_VAZIOS);
  const [salvando, setSalvando] = useState(false);
  const [confirmandoExclusaoId, setConfirmandoExclusaoId] = useState<number | null>(null);

  useEffect(() => {
    Promise.all([usuarioService.listar(), profissionalService.listar()])
      .then(([listaUsuarios, listaProfissionais]) => {
        setUsuarios(listaUsuarios);
        setProfissionais(listaProfissionais);
      })
      .catch(() => setErro("Não foi possível carregar os usuários."))
      .finally(() => setCarregando(false));
  }, []);

  function alterarCampo(campo: keyof typeof CAMPOS_VAZIOS, valor: string): void {
    setCampos((atual) => ({ ...atual, [campo]: valor }));
  }

  function limparFormularios(): void {
    setCriando(false);
    setEdicao(null);
    setCampos(CAMPOS_VAZIOS);
    setConfirmandoExclusaoId(null);
  }

  function abrirCriacao(): void {
    limparFormularios();
    setErro(null);
    setMensagem(null);
    setCriando(true);
  }

  function abrirEdicao(usuario: Usuario, modo: Edicao["modo"]): void {
    limparFormularios();
    setErro(null);
    setMensagem(null);
    setEdicao({ id: usuario.id, modo });
    if (modo === "email") {
      alterarCampo("email", usuario.email);
    }
    if (modo === "profissional") {
      alterarCampo("profissionalId", usuario.profissionalId === null ? "" : String(usuario.profissionalId));
    }
  }

  /** Confere senha e confirmação antes de enviar; devolve a mensagem de erro, se houver. */
  function validarSenhaNova(): string | null {
    if (campos.senha.length < TAMANHO_MINIMO_SENHA) {
      return `A senha precisa ter pelo menos ${TAMANHO_MINIMO_SENHA} caracteres.`;
    }
    if (campos.senha !== campos.confirmacao) {
      return "As senhas não são iguais.";
    }
    return null;
  }

  async function executar(acao: () => Promise<void>, sucesso: string): Promise<void> {
    setSalvando(true);
    setErro(null);
    setMensagem(null);
    try {
      await acao();
      limparFormularios();
      setMensagem(sucesso);
    } catch (erroRequisicao) {
      setErro((erroRequisicao as Error).message);
    } finally {
      setSalvando(false);
    }
  }

  async function criar(evento: FormEvent): Promise<void> {
    evento.preventDefault();
    const problema = validarSenhaNova();
    if (problema) {
      setErro(problema);
      return;
    }
    await executar(async () => {
      const novo = await usuarioService.criar(
        campos.email.trim(),
        campos.senha,
        lerProfissional(campos.profissionalId)
      );
      setUsuarios((lista) => [...lista, novo].sort((a, b) => a.email.localeCompare(b.email)));
    }, "Usuário criado.");
  }

  async function salvarEdicao(evento: FormEvent, usuario: Usuario): Promise<void> {
    evento.preventDefault();
    if (!edicao) {
      return;
    }

    if (edicao.modo === "profissional") {
      const profissionalId = lerProfissional(campos.profissionalId);
      await executar(async () => {
        const atualizado = await usuarioService.vincularProfissional(usuario.id, profissionalId);
        setUsuarios((lista) => lista.map((item) => (item.id === usuario.id ? atualizado : item)));
      }, profissionalId === null
        ? `${usuario.email} agora tem acesso total.`
        : `${usuario.email} agora vê só os dados de ${nomeDoProfissional(profissionalId)}.`);
      return;
    }

    if (edicao.modo === "email") {
      await executar(async () => {
        const atualizado = await usuarioService.alterarEmail(usuario.id, campos.email.trim());
        setUsuarios((lista) => lista.map((item) => (item.id === usuario.id ? atualizado : item)));
      }, "E-mail atualizado.");
      return;
    }

    const problema = validarSenhaNova();
    if (problema) {
      setErro(problema);
      return;
    }
    const ehVoce = usuario.id === idLogado;
    await executar(
      () =>
        usuarioService.alterarSenha(usuario.id, campos.senha, ehVoce ? campos.senhaAtual : undefined),
      ehVoce ? "Sua senha foi alterada." : `Senha de ${usuario.email} redefinida.`
    );
  }

  function nomeDoProfissional(id: number | null): string {
    return profissionais.find((profissional) => profissional.id === id)?.nome ?? "—";
  }

  /** Opções do select de vínculo: um profissional já ligado a outra conta aparece desativado. */
  function opcoesDeProfissional(idDoUsuario: number | null) {
    return profissionais.map((profissional) => {
      const dono = usuarios.find(
        (usuario) => usuario.profissionalId === profissional.id && usuario.id !== idDoUsuario
      );
      return { profissional, dono };
    });
  }

  async function excluir(usuario: Usuario): Promise<void> {
    const ehVoce = usuario.id === idLogado;
    await executar(async () => {
      await usuarioService.remover(usuario.id);
      if (ehVoce) {
        // A própria conta deixou de existir: encerra a sessão e volta para o agendamento.
        SessaoAdmin.encerrar();
        navegar("/", { replace: true });
        return;
      }
      setUsuarios((lista) => lista.filter((item) => item.id !== usuario.id));
    }, `Usuário ${usuario.email} excluído.`);
  }

  return (
    <section className="admin-formulario">
      <header className="usuarios-cabecalho">
        <div>
          <h2>Usuários do sistema</h2>
          <p className="admin-dica">Quem pode entrar no painel da clínica.</p>
        </div>
        {!criando && (
          <button type="button" className="admin-botao principal" onClick={abrirCriacao}>
            <IconeMais tamanho={16} /> Novo usuário
          </button>
        )}
      </header>

      {erro && <p className="mensagem-erro">{erro}</p>}
      {mensagem && <p className="mensagem-sucesso admin-mensagem-topo">{mensagem}</p>}

      {criando && (
        <form className="usuarios-form" onSubmit={criar}>
          <h3>Novo usuário</h3>
          <div className="admin-campos">
            <label>
              E-mail
              <input
                type="email"
                required
                autoFocus
                autoComplete="off"
                value={campos.email}
                onChange={(evento) => alterarCampo("email", evento.target.value)}
              />
            </label>
            <label>
              Senha
              <input
                type="password"
                required
                minLength={TAMANHO_MINIMO_SENHA}
                autoComplete="new-password"
                value={campos.senha}
                onChange={(evento) => alterarCampo("senha", evento.target.value)}
              />
            </label>
            <label>
              Confirmar senha
              <input
                type="password"
                required
                minLength={TAMANHO_MINIMO_SENHA}
                autoComplete="new-password"
                value={campos.confirmacao}
                onChange={(evento) => alterarCampo("confirmacao", evento.target.value)}
              />
            </label>
            <SeletorDeVinculo
              valor={campos.profissionalId}
              opcoes={opcoesDeProfissional(null)}
              onAlterar={(valor) => alterarCampo("profissionalId", valor)}
            />
          </div>
          <div className="admin-acoes">
            <button type="submit" className="admin-botao principal" disabled={salvando}>
              {salvando ? "Criando..." : "Criar usuário"}
            </button>
            <button type="button" className="admin-botao" onClick={limparFormularios}>
              Cancelar
            </button>
          </div>
        </form>
      )}

      {carregando ? (
        <p>Carregando...</p>
      ) : (
        <table className="admin-tabela usuarios-tabela">
          <thead>
            <tr>
              <th>E-mail</th>
              <th>Acesso</th>
              <th>Criado em</th>
              <th />
            </tr>
          </thead>
          <tbody>
            {usuarios.map((usuario) => {
              const ehVoce = usuario.id === idLogado;
              const editandoEste = edicao?.id === usuario.id;
              return (
                <UsuarioLinha
                  key={usuario.id}
                  usuario={usuario}
                  ehVoce={ehVoce}
                  ehUnico={
                    usuario.profissionalId === null &&
                    usuarios.filter((item) => item.profissionalId === null).length <= 1
                  }
                  nomeProfissional={
                    usuario.profissionalId === null ? null : nomeDoProfissional(usuario.profissionalId)
                  }
                  opcoesDeProfissional={opcoesDeProfissional(usuario.id)}
                  edicao={editandoEste ? edicao : null}
                  campos={campos}
                  salvando={salvando}
                  confirmandoExclusao={confirmandoExclusaoId === usuario.id}
                  onAlterarCampo={alterarCampo}
                  onEditar={(modo) => abrirEdicao(usuario, modo)}
                  onSalvar={(evento) => salvarEdicao(evento, usuario)}
                  onCancelar={limparFormularios}
                  onPedirExclusao={() => {
                    limparFormularios();
                    setConfirmandoExclusaoId(usuario.id);
                  }}
                  onExcluir={() => excluir(usuario)}
                />
              );
            })}
          </tbody>
        </table>
      )}

      <p className="admin-dica usuarios-dica-unico">
        Usuários ligados a um profissional só veem os agendamentos, horários e relatórios daquele
        profissional. Sem profissional, o usuário tem acesso total. Sempre fica pelo menos um
        usuário com acesso total.
      </p>
    </section>
  );
}

interface LinhaProps {
  usuario: Usuario;
  ehVoce: boolean;
  /** Único usuário com acesso total: não pode ser excluído nem vinculado. */
  ehUnico: boolean;
  /** Nome do profissional vinculado; null = acesso total. */
  nomeProfissional: string | null;
  opcoesDeProfissional: { profissional: Profissional; dono?: Usuario }[];
  edicao: Edicao | null;
  campos: typeof CAMPOS_VAZIOS;
  salvando: boolean;
  confirmandoExclusao: boolean;
  onAlterarCampo: (campo: keyof typeof CAMPOS_VAZIOS, valor: string) => void;
  onEditar: (modo: Edicao["modo"]) => void;
  onSalvar: (evento: FormEvent) => void;
  onCancelar: () => void;
  onPedirExclusao: () => void;
  onExcluir: () => void;
}

function UsuarioLinha({
  usuario,
  ehVoce,
  ehUnico,
  nomeProfissional,
  opcoesDeProfissional,
  edicao,
  campos,
  salvando,
  confirmandoExclusao,
  onAlterarCampo,
  onEditar,
  onSalvar,
  onCancelar,
  onPedirExclusao,
  onExcluir,
}: LinhaProps) {
  return (
    <>
      <tr>
        <td>
          <span className="admin-tabela-nome">
            <span className="admin-avatar pequeno">{usuario.email.charAt(0).toUpperCase()}</span>
            {usuario.email}
            {ehVoce && <span className="admin-etiqueta">Você</span>}
          </span>
        </td>
        <td>
          {nomeProfissional ? (
            <span className="usuarios-acesso profissional">{nomeProfissional}</span>
          ) : (
            <span className="usuarios-acesso">Acesso total</span>
          )}
        </td>
        <td>{usuario.criadoEm ? new DataAgenda(usuario.criadoEm).formatar() : "—"}</td>
        <td className="admin-tabela-acoes">
          {confirmandoExclusao ? (
            <>
              {ehVoce && <span className="usuarios-aviso">Você sairá do painel.</span>}
              <button type="button" className="admin-botao perigo" onClick={onExcluir} disabled={salvando}>
                {ehVoce ? "Excluir minha conta" : "Confirmar exclusão"}
              </button>
              <button type="button" className="admin-botao" onClick={onCancelar}>
                Cancelar
              </button>
            </>
          ) : (
            <>
              <button type="button" className="admin-botao" onClick={() => onEditar("email")}>
                Editar e-mail
              </button>
              <button type="button" className="admin-botao" onClick={() => onEditar("senha")}>
                {ehVoce ? "Alterar senha" : "Redefinir senha"}
              </button>
              <button
                type="button"
                className="admin-botao"
                onClick={() => onEditar("profissional")}
                disabled={ehUnico}
                title={ehUnico ? "Precisa sobrar pelo menos um usuário com acesso total." : undefined}
              >
                Profissional
              </button>
              <button
                type="button"
                className="admin-botao perigo"
                onClick={onPedirExclusao}
                disabled={ehUnico}
                title={ehUnico ? "Precisa sobrar pelo menos um usuário com acesso total." : undefined}
              >
                Excluir
              </button>
            </>
          )}
        </td>
      </tr>

      {edicao && (
        <tr className="usuarios-edicao">
          <td colSpan={4}>
            <form onSubmit={onSalvar}>
              <div className="admin-campos">
                {edicao.modo === "profissional" ? (
                  <SeletorDeVinculo
                    valor={campos.profissionalId}
                    opcoes={opcoesDeProfissional}
                    onAlterar={(valor) => onAlterarCampo("profissionalId", valor)}
                  />
                ) : edicao.modo === "email" ? (
                  <label>
                    Novo e-mail
                    <input
                      type="email"
                      required
                      autoFocus
                      value={campos.email}
                      onChange={(evento) => onAlterarCampo("email", evento.target.value)}
                    />
                  </label>
                ) : (
                  <>
                    {ehVoce && (
                      <label>
                        Senha atual
                        <input
                          type="password"
                          required
                          autoFocus
                          autoComplete="current-password"
                          value={campos.senhaAtual}
                          onChange={(evento) => onAlterarCampo("senhaAtual", evento.target.value)}
                        />
                      </label>
                    )}
                    <label>
                      Nova senha
                      <input
                        type="password"
                        required
                        autoFocus={!ehVoce}
                        minLength={TAMANHO_MINIMO_SENHA}
                        autoComplete="new-password"
                        value={campos.senha}
                        onChange={(evento) => onAlterarCampo("senha", evento.target.value)}
                      />
                    </label>
                    <label>
                      Confirmar nova senha
                      <input
                        type="password"
                        required
                        minLength={TAMANHO_MINIMO_SENHA}
                        autoComplete="new-password"
                        value={campos.confirmacao}
                        onChange={(evento) => onAlterarCampo("confirmacao", evento.target.value)}
                      />
                    </label>
                  </>
                )}
              </div>
              <div className="admin-acoes">
                <button type="submit" className="admin-botao principal" disabled={salvando}>
                  {salvando
                    ? "Salvando..."
                    : edicao.modo === "email"
                      ? "Salvar e-mail"
                      : edicao.modo === "profissional"
                        ? "Salvar vínculo"
                        : "Salvar senha"}
                </button>
                <button type="button" className="admin-botao" onClick={onCancelar}>
                  Cancelar
                </button>
              </div>
            </form>
          </td>
        </tr>
      )}
    </>
  );
}

interface SeletorDeVinculoProps {
  valor: string;
  opcoes: { profissional: Profissional; dono?: Usuario }[];
  onAlterar: (valor: string) => void;
}

/** Escolhe o profissional da conta; "Nenhum" = acesso total. */
function SeletorDeVinculo({ valor, opcoes, onAlterar }: SeletorDeVinculoProps) {
  return (
    <label>
      Profissional vinculado
      <select value={valor} onChange={(evento) => onAlterar(evento.target.value)}>
        <option value="">Nenhum (acesso total)</option>
        {opcoes.map(({ profissional, dono }) => (
          <option key={profissional.id} value={profissional.id} disabled={Boolean(dono)}>
            {profissional.nome}
            {dono ? ` (já vinculado a ${dono.email})` : ""}
          </option>
        ))}
      </select>
    </label>
  );
}
