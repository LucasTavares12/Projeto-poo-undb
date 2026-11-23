import { useEffect, useRef, useState } from "react";
import type { CSSProperties, ChangeEvent, FormEvent } from "react";
import { ConfiguracaoService } from "../../services/ConfiguracaoService";
import type { Configuracoes } from "../../services/types";
import { CabecalhoPagina } from "../../components/admin/CabecalhoPagina";
import { LogoDaClinica } from "../../components/MarcaDaClinica";
import {
  IconeBrilho,
  IconeCalendario,
  IconeImagem,
  IconeQuadro,
  IconeRelogio,
} from "../../components/Icones";
import { ConfiguracoesCompartilhadas } from "../../models/ConfiguracoesCompartilhadas";
import { PersonalizacaoDaClinica } from "../../models/PersonalizacaoDaClinica";
import { TemaDaClinica } from "../../models/TemaDaClinica";
import { ImagemDaLogo } from "../../models/ImagemDaLogo";

const configuracaoService = new ConfiguracaoService();

/**
 * Aba "Personalização": deixa o sistema com a cara da clínica — nome na barra lateral e na
 * página de agendamento, logo no lugar do ícone e as cores do painel e da página do cliente.
 * As regras (o que mudou, cor padrão, prévia) ficam na classe PersonalizacaoDaClinica.
 */
export function PersonalizacaoPage() {
  const [visual, setVisual] = useState<PersonalizacaoDaClinica | null>(null);
  // Como está no servidor: ao salvar, vai só o que mudou.
  const [salvo, setSalvo] = useState<PersonalizacaoDaClinica | null>(null);
  const [salvando, setSalvando] = useState(false);
  const [preparandoLogo, setPreparandoLogo] = useState(false);
  const [confirmandoRestauracao, setConfirmandoRestauracao] = useState(false);
  const [mensagem, setMensagem] = useState<string | null>(null);
  const [erro, setErro] = useState<string | null>(null);
  const campoArquivo = useRef<HTMLInputElement>(null);

  useEffect(() => {
    configuracaoService
      .obter()
      .then(mostrarSalvas)
      .catch(() => setErro("Não foi possível carregar a personalização."));
  }, []);

  /** O que veio do servidor passa a ser o editado e o salvo. */
  function mostrarSalvas(configuracoes: Configuracoes): void {
    const personalizacao = PersonalizacaoDaClinica.de(configuracoes);
    setVisual(personalizacao);
    setSalvo(personalizacao);
  }

  /** Aplica uma alteração (ex: `(v) => v.comNome("...")`) ao que está sendo editado. */
  function alterar(mudanca: (atual: PersonalizacaoDaClinica) => PersonalizacaoDaClinica): void {
    setVisual((atual) => (atual ? mudanca(atual) : atual));
    setMensagem(null);
    setConfirmandoRestauracao(false);
  }

  async function escolherLogo(evento: ChangeEvent<HTMLInputElement>): Promise<void> {
    const arquivo = evento.target.files?.[0];
    evento.target.value = ""; // permite escolher o mesmo arquivo de novo
    if (!arquivo) {
      return;
    }
    setErro(null);
    setPreparandoLogo(true);
    try {
      const logo = await ImagemDaLogo.preparar(arquivo);
      alterar((atual) => atual.comLogo(logo));
    } catch (erroImagem) {
      setErro((erroImagem as Error).message);
    } finally {
      setPreparandoLogo(false);
    }
  }

  /** Salva no servidor e avisa o resto do sistema (painel e página do cliente mudam na hora). */
  async function enviar(acao: () => Promise<Configuracoes>, sucesso: string): Promise<void> {
    setSalvando(true);
    setErro(null);
    setMensagem(null);
    try {
      const atualizadas = await acao();
      mostrarSalvas(atualizadas);
      ConfiguracoesCompartilhadas.instancia().publicar(atualizadas);
      setConfirmandoRestauracao(false);
      setMensagem(sucesso);
    } catch (erroRequisicao) {
      setErro((erroRequisicao as Error).message);
    } finally {
      setSalvando(false);
    }
  }

  async function salvar(evento: FormEvent): Promise<void> {
    evento.preventDefault();
    if (!visual || !salvo) {
      return;
    }
    if (!visual.nomeLimpo()) {
      setErro("Informe o nome da clínica.");
      return;
    }
    if (!visual.foiAlteradaDesde(salvo)) {
      setMensagem("Nada para salvar: nada foi alterado.");
      return;
    }
    await enviar(
      () => configuracaoService.atualizar(visual.alteracoesDesde(salvo)),
      "Personalização salva. O sistema já está com o visual novo."
    );
  }

  async function restaurarPadrao(): Promise<void> {
    await enviar(
      () => configuracaoService.restaurarVisual(),
      "O visual padrão do sistema foi restaurado."
    );
  }

  const temAlteracao = visual !== null && salvo !== null && visual.foiAlteradaDesde(salvo);

  return (
    <section className="pagina">
      <CabecalhoPagina
        titulo="Personalização"
        descricao="Deixe o sistema com a cara da sua clínica: nome, logo e cores."
      />

      {erro && <p className="mensagem-erro">{erro}</p>}

      {!visual ? (
        !erro && <p>Carregando...</p>
      ) : (
        <form className="personalizacao" onSubmit={salvar}>
          <div className="personalizacao-campos">
            <section className="admin-formulario">
              <h2>Identidade</h2>
              <div className="admin-campos">
                <label className="admin-campo-largo">
                  Nome da clínica
                  <input
                    type="text"
                    required
                    maxLength={60}
                    value={visual.nomeClinica}
                    onChange={(evento) => alterar((atual) => atual.comNome(evento.target.value))}
                  />
                </label>
              </div>
              <p className="admin-dica">
                Aparece na barra lateral do painel, no topo da página de agendamento, no título da
                aba do navegador e nas mensagens de WhatsApp.
              </p>

              <div className="personalizacao-logo">
                <span className="personalizacao-logo-previa">
                  {visual.logo ? (
                    <img src={visual.logo} alt="Logo atual da clínica" />
                  ) : (
                    <IconeImagem tamanho={28} />
                  )}
                </span>
                <div>
                  <strong>Logo</strong>
                  <p className="admin-dica personalizacao-logo-dica">
                    {visual.logo
                      ? "Aparece no lugar do ícone na barra lateral e na página de agendamento."
                      : "Sem logo, aparece o ícone de calendário. PNG com fundo transparente fica melhor."}
                  </p>
                  <div className="admin-acoes personalizacao-logo-acoes">
                    <button
                      type="button"
                      className="admin-botao"
                      onClick={() => campoArquivo.current?.click()}
                      disabled={preparandoLogo}
                    >
                      {preparandoLogo ? "Preparando..." : visual.logo ? "Trocar imagem" : "Enviar imagem"}
                    </button>
                    {visual.logo && (
                      <button
                        type="button"
                        className="admin-botao perigo"
                        onClick={() => alterar((atual) => atual.comLogo(null))}
                      >
                        Remover logo
                      </button>
                    )}
                  </div>
                  <input
                    ref={campoArquivo}
                    type="file"
                    accept={ImagemDaLogo.ACEITAR}
                    hidden
                    onChange={escolherLogo}
                  />
                </div>
              </div>
            </section>

            <section className="admin-formulario">
              <h2>Cores</h2>
              <p className="admin-dica personalizacao-sugestoes-titulo">Combinações prontas</p>
              <div className="personalizacao-sugestoes">
                {TemaDaClinica.SUGESTOES.map((sugestao) => {
                  const escolhida = visual.usaSugestao(sugestao);
                  return (
                    <button
                      key={sugestao.nome}
                      type="button"
                      className={`personalizacao-sugestao ${escolhida ? "escolhida" : ""}`}
                      aria-pressed={escolhida}
                      onClick={() => alterar((atual) => atual.comSugestao(sugestao))}
                    >
                      <span className="personalizacao-amostra">
                        <span style={{ background: sugestao.lateral }} />
                        <span style={{ background: sugestao.principal }} />
                      </span>
                      {sugestao.nome}
                    </button>
                  );
                })}
              </div>

              <div className="personalizacao-cores">
                <SeletorDeCor
                  rotulo="Cor principal"
                  descricao="Botões, destaques, gráficos e a página de agendamento."
                  valor={visual.corPrincipal}
                  padrao={TemaDaClinica.COR_PRINCIPAL_PADRAO}
                  aviso="Cor muito clara: o texto branco dos botões pode ficar difícil de ler."
                  onAlterar={(cor) => alterar((atual) => atual.comCorPrincipal(cor))}
                />
                <SeletorDeCor
                  rotulo="Cor da barra lateral"
                  descricao="Fundo do menu do painel (e da barra do topo no celular)."
                  valor={visual.corLateral}
                  padrao={TemaDaClinica.COR_LATERAL_PADRAO}
                  aviso="Cor muito clara: o texto do menu é branco e pode ficar difícil de ler. Prefira um tom escuro."
                  onAlterar={(cor) => alterar((atual) => atual.comCorLateral(cor))}
                />
              </div>
            </section>
          </div>

          <aside className="personalizacao-previa-coluna">
            <span className="admin-dica personalizacao-previa-titulo">Prévia</span>
            <PreviaDoPainel visual={visual} />

            <div className="admin-acoes personalizacao-acoes">
              <button
                type="submit"
                className="admin-botao principal"
                disabled={salvando || preparandoLogo || !temAlteracao}
              >
                {salvando ? "Salvando..." : "Salvar personalização"}
              </button>
              {temAlteracao && salvo && (
                <button
                  type="button"
                  className="admin-botao"
                  onClick={() => {
                    setVisual(salvo);
                    setMensagem(null);
                  }}
                >
                  Desfazer
                </button>
              )}
            </div>
            {mensagem && <p className="mensagem-sucesso admin-mensagem">{mensagem}</p>}

            <div className="personalizacao-restaurar">
              {confirmandoRestauracao ? (
                <>
                  <span>Voltar nome, logo e cores para o padrão do sistema?</span>
                  <div className="admin-acoes">
                    <button
                      type="button"
                      className="admin-botao perigo"
                      onClick={restaurarPadrao}
                      disabled={salvando}
                    >
                      Sim, restaurar
                    </button>
                    <button
                      type="button"
                      className="admin-botao"
                      onClick={() => setConfirmandoRestauracao(false)}
                    >
                      Cancelar
                    </button>
                  </div>
                </>
              ) : (
                <button
                  type="button"
                  className="admin-botao perigo"
                  onClick={() => setConfirmandoRestauracao(true)}
                >
                  Restaurar visual padrão
                </button>
              )}
            </div>
          </aside>
        </form>
      )}
    </section>
  );
}

interface SeletorDeCorProps {
  rotulo: string;
  descricao: string;
  /** null = cor padrão do sistema. */
  valor: string | null;
  padrao: string;
  aviso: string;
  onAlterar: (cor: string | null) => void;
}

/** Escolha de uma cor: paleta do sistema operacional + campo "#rrggbb" + voltar ao padrão. */
function SeletorDeCor({ rotulo, descricao, valor, padrao, aviso, onAlterar }: SeletorDeCorProps) {
  const cor = valor ?? padrao;
  const [texto, setTexto] = useState(cor);
  // Mantém o campo de texto em dia quando a cor muda por fora (sugestões, desfazer).
  const [corAnterior, setCorAnterior] = useState(cor);
  if (cor !== corAnterior) {
    setCorAnterior(cor);
    setTexto(cor);
  }

  function escolher(nova: string): void {
    onAlterar(TemaDaClinica.paraEscolha(nova, padrao));
  }

  function digitar(digitado: string): void {
    const codigo = TemaDaClinica.comCerquilha(digitado);
    setTexto(codigo);
    if (TemaDaClinica.ehCorValida(codigo)) {
      escolher(codigo);
    }
  }

  return (
    <div className="personalizacao-cor">
      <span className="personalizacao-cor-rotulo">
        <strong>{rotulo}</strong>
        <span className="admin-opcao-descricao">{descricao}</span>
      </span>
      <div className="personalizacao-cor-controles">
        <input
          type="color"
          className="personalizacao-cor-paleta"
          value={cor}
          onChange={(evento) => escolher(evento.target.value)}
          aria-label={rotulo}
        />
        <input
          type="text"
          className="personalizacao-cor-texto"
          value={texto}
          maxLength={7}
          spellCheck={false}
          aria-label={`${rotulo} (código)`}
          aria-invalid={!TemaDaClinica.ehCorValida(texto)}
          onChange={(evento) => digitar(evento.target.value)}
          onBlur={() => setTexto(cor)}
        />
        {valor !== null && (
          <button type="button" className="admin-botao" onClick={() => onAlterar(null)}>
            Padrão
          </button>
        )}
      </div>
      {TemaDaClinica.ehClaraDemais(cor) && <p className="personalizacao-aviso">{aviso}</p>}
    </div>
  );
}

/**
 * Miniatura do painel com as cores, o nome e a logo escolhidos, antes de salvar.
 * As variáveis --tema-* no estilo do bloco valem só dentro dele.
 */
function PreviaDoPainel({ visual }: { visual: PersonalizacaoDaClinica }) {
  const variaveis = visual.temaDaPrevia().variaveis();
  return (
    <div className="previa-painel" style={variaveis as CSSProperties} aria-hidden="true">
      <div className="previa-lateral">
        <div className="previa-marca">
          <LogoDaClinica logo={visual.logo} tamanho={16} />
          <span className="previa-nome">{visual.nomeLimpo() || "Nome da clínica"}</span>
        </div>
        <span className="previa-item ativo">
          <IconeQuadro tamanho={14} /> Agendamentos
        </span>
        <span className="previa-item">
          <IconeCalendario tamanho={14} /> Agenda
        </span>
        <span className="previa-item">
          <IconeRelogio tamanho={14} /> Horários
        </span>
        <span className="previa-item">
          <IconeBrilho tamanho={14} /> Tratamentos
        </span>
      </div>
      <div className="previa-conteudo">
        <span className="previa-titulo" />
        <span className="previa-linha" />
        <span className="previa-cartao">
          <span className="previa-etiqueta">Agendado</span>
          <span className="previa-linha curta" />
        </span>
        <span className="previa-botao">Novo agendamento</span>
      </div>
    </div>
  );
}
