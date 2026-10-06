import { useEffect, useState } from "react";
import type { FormEvent } from "react";
import { ConfiguracaoService } from "../../services/ConfiguracaoService";
import type { Configuracoes } from "../../services/types";
import { CabecalhoPagina } from "../../components/admin/CabecalhoPagina";

const configuracaoService = new ConfiguracaoService();

export function ConfiguracoesPage() {
  const [configuracoes, setConfiguracoes] = useState<Configuracoes | null>(null);
  const [salvando, setSalvando] = useState(false);
  const [mensagem, setMensagem] = useState<string | null>(null);
  const [erro, setErro] = useState<string | null>(null);

  useEffect(() => {
    async function carregar() {
      try {
        setConfiguracoes(await configuracaoService.obter());
      } catch {
        setErro("Não foi possível carregar as configurações.");
      }
    }
    carregar();
  }, []);

  function alterar(campo: keyof Configuracoes, valor: boolean): void {
    setConfiguracoes((atual) => (atual ? { ...atual, [campo]: valor } : atual));
    setMensagem(null);
  }

  async function salvar(evento: FormEvent): Promise<void> {
    evento.preventDefault();
    if (!configuracoes) {
      return;
    }

    setSalvando(true);
    setErro(null);
    setMensagem(null);
    try {
      setConfiguracoes(await configuracaoService.atualizar(configuracoes));
      setMensagem("Configurações salvas.");
    } catch (erroRequisicao) {
      setErro((erroRequisicao as Error).message);
    } finally {
      setSalvando(false);
    }
  }

  const enderecoLogin = `${window.location.origin}/admin/login`;

  return (
    <section className="pagina">
      <CabecalhoPagina
        titulo="Configurações"
        descricao="Preferências gerais do sistema."
      />

      {erro && <p className="mensagem-erro">{erro}</p>}

      {!configuracoes ? (
        !erro && <p>Carregando...</p>
      ) : (
        <form className="admin-formulario" onSubmit={salvar}>
          <h2>Acesso ao painel</h2>

          <label className="admin-opcao">
            <input
              type="checkbox"
              className="admin-interruptor"
              checked={configuracoes.acessoPublicoLiberado}
              onChange={(evento) => alterar("acessoPublicoLiberado", evento.target.checked)}
            />
            <span>
              <strong>Mostrar "Entrar" e "Cadastrar" na página de agendamento</strong>
              <span className="admin-opcao-descricao">
                Desligado, os clientes não veem esses botões e ninguém consegue criar conta nova.
                Quem já tem conta continua entrando pelo endereço <code>{enderecoLogin}</code>.
              </span>
            </span>
          </label>

          <div className="admin-acoes">
            <button type="submit" className="admin-botao principal" disabled={salvando}>
              {salvando ? "Salvando..." : "Salvar"}
            </button>
          </div>

          {mensagem && <p className="mensagem-sucesso admin-mensagem">{mensagem}</p>}
        </form>
      )}
    </section>
  );
}
