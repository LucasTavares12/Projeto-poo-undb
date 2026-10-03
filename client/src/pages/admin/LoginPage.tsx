import { useState } from "react";
import type { FormEvent } from "react";
import { Link, Navigate, useLocation, useNavigate } from "react-router-dom";
import { AutenticacaoService } from "../../services/AutenticacaoService";
import { SessaoAdmin } from "../../services/SessaoAdmin";
import { useConfiguracoes } from "../../hooks/useConfiguracoes";

const autenticacaoService = new AutenticacaoService();

/** Enviado pela tela de cadastro ao redirecionar para cá. */
interface EstadoNavegacao {
  emailCadastrado?: string;
}

export function LoginPage() {
  const navegar = useNavigate();
  const { emailCadastrado } = (useLocation().state ?? {}) as EstadoNavegacao;
  const configuracoes = useConfiguracoes();

  const [email, setEmail] = useState(emailCadastrado ?? "");
  const [senha, setSenha] = useState("");
  const [entrando, setEntrando] = useState(false);
  const [erro, setErro] = useState<string | null>(null);

  if (SessaoAdmin.estaAtiva()) {
    return <Navigate to="/admin" replace />;
  }

  async function entrar(evento: FormEvent): Promise<void> {
    evento.preventDefault();
    setEntrando(true);
    setErro(null);
    try {
      await autenticacaoService.entrar(email.trim(), senha);
      navegar("/admin", { replace: true });
    } catch (erroRequisicao) {
      setErro((erroRequisicao as Error).message);
      setEntrando(false);
    }
  }

  return (
    <main className="login">
      <form className="login-cartao" onSubmit={entrar}>
        <Link to="/" className="login-voltar">
          ← Voltar para o agendamento
        </Link>
        <span className="admin-lateral-titulo">Painel da Clínica</span>
        <h1>Entrar</h1>

        {emailCadastrado && !erro && (
          <p className="mensagem-sucesso">Cadastro realizado! Agora é só entrar com sua senha.</p>
        )}
        {erro && <p className="mensagem-erro">{erro}</p>}

        <div className="admin-campos">
          <label>
            E-mail
            <input
              type="email"
              autoComplete="email"
              required
              autoFocus={!emailCadastrado}
              value={email}
              onChange={(evento) => setEmail(evento.target.value)}
            />
          </label>
          <label>
            Senha
            <input
              type="password"
              autoComplete="current-password"
              required
              autoFocus={Boolean(emailCadastrado)}
              value={senha}
              onChange={(evento) => setSenha(evento.target.value)}
            />
          </label>
        </div>

        <button type="submit" className="admin-botao principal" disabled={entrando}>
          {entrando ? "Entrando..." : "Entrar"}
        </button>

        {configuracoes?.acessoPublicoLiberado && (
          <p className="login-alternativa">
            Não tem conta? <Link to="/admin/cadastro">Cadastre-se</Link>
          </p>
        )}
      </form>
    </main>
  );
}
