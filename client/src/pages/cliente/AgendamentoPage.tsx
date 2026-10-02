import { useEffect, useMemo, useState } from "react";
import { ProfissionalService } from "../../services/ProfissionalService";
import { TratamentoService } from "../../services/TratamentoService";
import { AgendamentoService } from "../../services/AgendamentoService";
import type { Agendamento, Profissional, Tratamento } from "../../services/types";
import { SeletorProfissional } from "../../components/cliente/SeletorProfissional";
import { SeletorTratamentos } from "../../components/cliente/SeletorTratamentos";
import { SeletorHorario } from "../../components/cliente/SeletorHorario";
import { LayoutCliente } from "../../components/cliente/LayoutCliente";
import {
  IconeCalendario,
  IconeConfirmado,
  IconePessoas,
  IconeRelogio,
  IconeServico,
  IconeSetaDireita,
  IconeSetaEsquerda,
} from "../../components/cliente/Icones";

const profissionalService = new ProfissionalService();
const tratamentoService = new TratamentoService();
const agendamentoService = new AgendamentoService();

type Modo = "inicio" | "ver" | "agendar";
type Etapa = 1 | 2 | 3 | 4 | 5;

const TITULOS_ETAPA: Record<Etapa, string> = {
  1: "Escolha o Profissional",
  2: "Escolha o Serviço",
  3: "Escolha a Data",
  4: "Horários Disponíveis",
  5: "Confirme seu Agendamento",
};

function hoje(): string {
  const agora = new Date();
  const mes = String(agora.getMonth() + 1).padStart(2, "0");
  const dia = String(agora.getDate()).padStart(2, "0");
  return `${agora.getFullYear()}-${mes}-${dia}`;
}

/** "YYYY-MM-DD" -> "DD/MM/YYYY". */
function formatarData(data: string): string {
  const [ano, mes, dia] = data.slice(0, 10).split("-");
  return dia && mes && ano ? `${dia}/${mes}/${ano}` : data;
}

export function AgendamentoPage() {
  const [profissionais, setProfissionais] = useState<Profissional[]>([]);
  const [tratamentos, setTratamentos] = useState<Tratamento[]>([]);
  const [carregandoCadastros, setCarregandoCadastros] = useState(true);

  const [modo, setModo] = useState<Modo>("inicio");
  const [etapa, setEtapa] = useState<Etapa>(1);

  const [profissionalId, setProfissionalId] = useState<number | null>(null);
  const [tratamentoIds, setTratamentoIds] = useState<number[]>([]);
  const [data, setData] = useState<string>(hoje());
  const [horarioInicio, setHorarioInicio] = useState<string | null>(null);

  const [horariosDisponiveis, setHorariosDisponiveis] = useState<string[]>([]);
  const [carregandoHorarios, setCarregandoHorarios] = useState(false);

  const [clienteNome, setClienteNome] = useState("");
  const [clienteTelefone, setClienteTelefone] = useState("");

  const [enviando, setEnviando] = useState(false);
  const [erro, setErro] = useState<string | null>(null);
  const [agendamentoConfirmado, setAgendamentoConfirmado] = useState<Agendamento | null>(null);

  useEffect(() => {
    async function carregarCadastros() {
      try {
        const [listaProfissionais, listaTratamentos] = await Promise.all([
          profissionalService.listar(),
          tratamentoService.listar(),
        ]);
        setProfissionais(listaProfissionais);
        setTratamentos(listaTratamentos);
        if (listaProfissionais.length === 1) {
          setProfissionalId(listaProfissionais[0].id);
        }
      } catch {
        setErro("Não foi possível carregar os dados da clínica. Tente novamente mais tarde.");
      } finally {
        setCarregandoCadastros(false);
      }
    }
    carregarCadastros();
  }, []);

  useEffect(() => {
    setHorarioInicio(null);

    if (!profissionalId || tratamentoIds.length === 0 || !data) {
      setHorariosDisponiveis([]);
      return;
    }

    let cancelado = false;
    setCarregandoHorarios(true);

    agendamentoService
      .disponibilidade(profissionalId, data, tratamentoIds)
      .then((horarios) => {
        if (!cancelado) {
          setHorariosDisponiveis(horarios);
        }
      })
      .catch(() => {
        if (!cancelado) {
          setErro("Não foi possível carregar os horários disponíveis.");
        }
      })
      .finally(() => {
        if (!cancelado) {
          setCarregandoHorarios(false);
        }
      });

    return () => {
      cancelado = true;
    };
  }, [profissionalId, tratamentoIds, data]);

  const tratamentosSelecionados = useMemo(
    () => tratamentos.filter((tratamento) => tratamentoIds.includes(tratamento.id)),
    [tratamentos, tratamentoIds]
  );

  const valorTotal = useMemo(
    () => tratamentosSelecionados.reduce((total, tratamento) => total + tratamento.valor, 0),
    [tratamentosSelecionados]
  );

  const duracaoTotal = useMemo(
    () =>
      tratamentosSelecionados.reduce((total, tratamento) => total + tratamento.duracaoMinutos, 0),
    [tratamentosSelecionados]
  );

  const podeConfirmar =
    profissionalId !== null &&
    tratamentoIds.length > 0 &&
    horarioInicio !== null &&
    clienteNome.trim().length > 0 &&
    clienteTelefone.trim().length > 0;

  // No modo "ver" o fluxo termina na lista de horários; os dados do cliente só entram ao agendar.
  const totalEtapas = modo === "ver" ? 4 : 5;

  const podeAvancar =
    (etapa === 1 && profissionalId !== null) ||
    (etapa === 2 && tratamentoIds.length > 0) ||
    (etapa === 3 && data !== "") ||
    (etapa === 4 && horarioInicio !== null);

  function iniciarFluxo(novoModo: "ver" | "agendar"): void {
    setModo(novoModo);
    setEtapa(1);
    setErro(null);
  }

  function voltarAoInicio(): void {
    setModo("inicio");
    setEtapa(1);
    setTratamentoIds([]);
    setHorarioInicio(null);
    setClienteNome("");
    setClienteTelefone("");
    setAgendamentoConfirmado(null);
    setErro(null);
  }

  function voltarEtapa(): void {
    setEtapa((atual) => (atual > 1 ? ((atual - 1) as Etapa) : atual));
  }

  function avancarEtapa(): void {
    if (!podeAvancar) {
      return;
    }
    // Quem estava só vendo os horários e escolheu um passa para o fluxo de agendamento.
    if (etapa === 4 && modo === "ver") {
      setModo("agendar");
    }
    setEtapa((atual) => (atual < 5 ? ((atual + 1) as Etapa) : atual));
  }

  function alternarTratamento(id: number): void {
    setTratamentoIds((atual) =>
      atual.includes(id) ? atual.filter((item) => item !== id) : [...atual, id]
    );
  }

  async function confirmarAgendamento(): Promise<void> {
    if (!profissionalId || !horarioInicio) {
      return;
    }

    setEnviando(true);
    setErro(null);
    try {
      const agendamento = await agendamentoService.criar({
        clienteNome: clienteNome.trim(),
        clienteTelefone: clienteTelefone.trim(),
        profissionalId,
        tratamentoIds,
        data,
        horarioInicio,
      });
      setAgendamentoConfirmado(agendamento);
    } catch (erroRequisicao) {
      setErro((erroRequisicao as Error).message);
    } finally {
      setEnviando(false);
    }
  }

  if (carregandoCadastros) {
    return (
      <LayoutCliente>
        <p>Carregando...</p>
      </LayoutCliente>
    );
  }

  if (agendamentoConfirmado) {
    return (
      <LayoutCliente>
        <section className="passo">
          <header className="passo-cabecalho">
            <h2>Agendamento confirmado!</h2>
          </header>
          <div className="passo-corpo">
            <div className="resumo">
              <p>
                <strong>{agendamentoConfirmado.cliente.nome}</strong>, seu horário está marcado.
              </p>
              <p>Profissional: {agendamentoConfirmado.profissional.nome}</p>
              <p>
                Data: {formatarData(agendamentoConfirmado.data)} às{" "}
                {agendamentoConfirmado.horarioInicio}
              </p>
              <p>
                Serviços:{" "}
                {agendamentoConfirmado.tratamentos.map((tratamento) => tratamento.nome).join(", ")}
              </p>
              <p>Valor total: R$ {agendamentoConfirmado.valorTotal.toFixed(2)}</p>
            </div>
          </div>
          <footer className="passo-rodape">
            <span />
            <button type="button" className="botao-primario" onClick={voltarAoInicio}>
              Fazer novo agendamento
            </button>
          </footer>
        </section>
      </LayoutCliente>
    );
  }

  if (modo === "inicio") {
    return (
      <LayoutCliente>
        <section className="inicio">
          <h1>Agende seu Horário</h1>
          <p className="inicio-subtitulo">
            Faça seu agendamento de forma rápida e simples, escolhendo o melhor horário para você.
          </p>
          {erro && <p className="mensagem-erro">{erro}</p>}
          <div className="acoes-inicio">
            <button type="button" className="botao-primario" onClick={() => iniciarFluxo("agendar")}>
              Agendar Agora <IconeSetaDireita />
            </button>
            <button type="button" className="botao-contorno" onClick={() => iniciarFluxo("ver")}>
              Ver Horários <IconeRelogio />
            </button>
          </div>
        </section>

        <section className="como-funciona">
          <h2>Como funciona</h2>
          <div className="como-funciona-cartoes">
            <article>
              <span className="como-funciona-icone">
                <IconePessoas tamanho={26} />
              </span>
              <h3>Escolha o Profissional</h3>
              <p>Selecione o profissional que irá te atender.</p>
            </article>
            <article>
              <span className="como-funciona-icone">
                <IconeServico tamanho={26} />
              </span>
              <h3>Escolha o Serviço</h3>
              <p>Selecione o serviço que deseja agendar.</p>
            </article>
            <article>
              <span className="como-funciona-icone">
                <IconeCalendario tamanho={26} />
              </span>
              <h3>Selecione o Horário</h3>
              <p>Escolha a data e horário que melhor se encaixa na sua agenda.</p>
            </article>
            <article>
              <span className="como-funciona-icone">
                <IconeConfirmado tamanho={26} />
              </span>
              <h3>Confirme seu Agendamento</h3>
              <p>Preencha seus dados e confirme sua reserva.</p>
            </article>
          </div>
        </section>
      </LayoutCliente>
    );
  }

  return (
    <LayoutCliente>
      <section className="passo">
        <header className="passo-cabecalho">
          <h2>{TITULOS_ETAPA[etapa]}</h2>
          <span className="passo-indicador">
            Passo {etapa}/{totalEtapas}
          </span>
        </header>

        <div className="passo-corpo">
          {erro && <p className="mensagem-erro">{erro}</p>}

          {etapa === 1 && (
            <>
              <h3>Selecione o Profissional</h3>
              <SeletorProfissional
                profissionais={profissionais}
                selecionadoId={profissionalId}
                onSelecionar={setProfissionalId}
              />
            </>
          )}

          {etapa === 2 && (
            <>
              <h3>Selecione o(s) Serviço(s)</h3>
              <SeletorTratamentos
                tratamentos={tratamentos}
                selecionadosIds={tratamentoIds}
                onAlternar={alternarTratamento}
              />
            </>
          )}

          {etapa === 3 && (
            <>
              <h3>Selecione a Data</h3>
              <input
                type="date"
                className="campo"
                min={hoje()}
                value={data}
                onChange={(evento) => setData(evento.target.value)}
              />
            </>
          )}

          {etapa === 4 && (
            <>
              <h3>Horários em {formatarData(data)}</h3>
              <SeletorHorario
                horarios={horariosDisponiveis}
                selecionado={horarioInicio}
                onSelecionar={setHorarioInicio}
                carregando={carregandoHorarios}
              />
            </>
          )}

          {etapa === 5 && (
            <>
              <div className="resumo">
                <p>
                  Horário escolhido: {formatarData(data)} às {horarioInicio}
                </p>
                <p>
                  Duração total: {duracaoTotal} min — Valor total: R$ {valorTotal.toFixed(2)}
                </p>
              </div>
              <h3>Preencha seus Dados</h3>
              <div className="formulario-cliente">
                <input
                  type="text"
                  className="campo"
                  placeholder="Seu nome"
                  value={clienteNome}
                  onChange={(evento) => setClienteNome(evento.target.value)}
                />
                <input
                  type="tel"
                  className="campo"
                  placeholder="Telefone para contato"
                  value={clienteTelefone}
                  onChange={(evento) => setClienteTelefone(evento.target.value)}
                />
              </div>
            </>
          )}
        </div>

        <footer className="passo-rodape">
          <button
            type="button"
            className="botao-contorno"
            onClick={etapa === 1 ? voltarAoInicio : voltarEtapa}
          >
            <IconeSetaEsquerda /> {etapa === 1 ? "Cancelar" : "Voltar"}
          </button>

          {etapa === 5 ? (
            <button
              type="button"
              className="botao-primario"
              disabled={!podeConfirmar || enviando}
              onClick={confirmarAgendamento}
            >
              {enviando ? "Agendando..." : "Confirmar agendamento"}
            </button>
          ) : (
            <button
              type="button"
              className="botao-primario"
              disabled={!podeAvancar}
              onClick={avancarEtapa}
            >
              {etapa === 4 && modo === "ver" ? "Agendar este horário" : "Próximo"}{" "}
              <IconeSetaDireita />
            </button>
          )}
        </footer>
      </section>
    </LayoutCliente>
  );
}
