import { useState } from "react";
import type { FormEvent } from "react";
import { Link, Navigate, useNavigate } from "react-router-dom";
import { AutenticacaoService } from "../../services/AutenticacaoService";
import { SessaoAdmin } from "../../services/SessaoAdmin";
import { useConfiguracoes } from "../../hooks/useConfiguracoes";
import { Senha } from "../../models/Senha";

const autenticacaoService = new AutenticacaoService();

export function CadastroPage() {
  const navegar = useNavigate();
  const configuracoes = useConfiguracoes();

  const [email, setEmail] = useState("");
  const [senha, setSenha] = useState("");
  const [confirmacao, setConfirmacao] = useState("");
  const [enviando, setEnviando] = useState(false);
  const [erro, setErro] = useState<string | null>(null);

  if (SessaoAdmin.estaAtiva()) {
    return <Navigate to="/admin" replace />;
  }

  if (configuracoes && !configuracoes.acessoPublicoLiberado) {
    return (
      <main className="login">
        <div className="login-cartao">
          <Link to="/" className="login-voltar">
            ← Voltar para o agendamento
          </Link>
          <span className="admin-lateral-titulo">Painel da Clínica</span>
          <h1>Cadastro desativado</h1>
          <p>O cadastro de novas contas está desativado pela clínica.</p>
          <p className="login-alternativa">
            Já tem conta? <Link to="/admin/login">Entrar</Link>
          </p>
        </div>
      </main>
    );
  }

  async function cadastrar(evento: FormEvent): Promise<void> {
    evento.preventDefault();

    const problemaNaSenha = Senha.validarNova(senha, confirmacao);
    if (problemaNaSenha) {
      setErro(problemaNaSenha);
      return;
    }

    setEnviando(true);
    setErro(null);
    try {
      await autenticacaoService.cadastrar(email.trim(), senha);
      navegar("/admin/login", { replace: true, state: { emailCadastrado: email.trim() } });
    } catch (erroRequisicao) {
      setErro((erroRequisicao as Error).message);
      setEnviando(false);
    }
  }

  return (
    <main className="login">
      <form className="login-cartao" onSubmit={cadastrar}>
        <Link to="/" className="login-voltar">
          ← Voltar para o agendamento
        </Link>
        <span className="admin-lateral-titulo">Painel da Clínica</span>
        <h1>Criar conta</h1>

        {erro && <p className="mensagem-erro">{erro}</p>}

        <div className="admin-campos">
          <label>
            E-mail
            <input
              type="email"
              autoComplete="email"
              required
              autoFocus
              value={email}
              onChange={(evento) => setEmail(evento.target.value)}
            />
          </label>
          <label>
            Senha
            <input
              type="password"
              autoComplete="new-password"
              required
              minLength={Senha.TAMANHO_MINIMO}
              value={senha}
              onChange={(evento) => setSenha(evento.target.value)}
            />
          </label>
          <label>
            Confirmar senha
            <input
              type="password"
              autoComplete="new-password"
              required
              minLength={Senha.TAMANHO_MINIMO}
              value={confirmacao}
              onChange={(evento) => setConfirmacao(evento.target.value)}
            />
          </label>
        </div>

        <button type="submit" className="admin-botao principal" disabled={enviando}>
          {enviando ? "Cadastrando..." : "Cadastrar"}
        </button>

        <p className="login-alternativa">
          Já tem conta? <Link to="/admin/login">Entrar</Link>
        </p>
      </form>
    </main>
  );
}
