import { useEffect, useMemo, useRef, useState } from "react";
import { ProfissionalService } from "../../services/ProfissionalService";
import { TratamentoService } from "../../services/TratamentoService";
import { AgendamentoService } from "../../services/AgendamentoService";
import type { Agendamento, Profissional, Tratamento } from "../../services/types";
import { SeletorProfissional } from "../../components/cliente/SeletorProfissional";
import { SeletorTratamentos } from "../../components/cliente/SeletorTratamentos";
import { SeletorHorario } from "../../components/cliente/SeletorHorario";
import { LayoutCliente } from "../../components/cliente/LayoutCliente";
import { DataAgenda } from "../../models/DataAgenda";
import { Dinheiro } from "../../models/Dinheiro";
import { Telefone } from "../../models/Telefone";
import {
  IconeCalendario,
  IconeConfirmado,
  IconePessoas,
  IconeRelogio,
  IconeServico,
  IconeSetaDireita,
  IconeSetaEsquerda,
} from "../../components/Icones";

const profissionalService = new ProfissionalService();
const tratamentoService = new TratamentoService();
const agendamentoService = new AgendamentoService();

type Modo = "inicio" | "ver" | "agendar";
type Etapa = "profissional" | "servico" | "data" | "horarios" | "dados";

// "Ver horários" só consulta a agenda; o serviço e os dados do cliente entram ao agendar.
const ETAPAS_POR_MODO: Record<"ver" | "agendar", Etapa[]> = {
  ver: ["profissional", "data", "horarios"],
  agendar: ["profissional", "servico", "data", "horarios", "dados"],
};

interface ResultadoHorarios {
  consulta: string;
  horarios: string[];
}

interface SelecaoHorario {
  consulta: string;
  horario: string;
}

const TITULOS_ETAPA: Record<Etapa, string> = {
  profissional: "Escolha o Profissional",
  servico: "Escolha o Serviço",
  data: "Escolha a Data",
  horarios: "Horários Disponíveis",
  dados: "Confirme seu Agendamento",
};

export function AgendamentoPage() {
  const [profissionais, setProfissionais] = useState<Profissional[]>([]);
  const [tratamentos, setTratamentos] = useState<Tratamento[]>([]);
  const [carregandoCadastros, setCarregandoCadastros] = useState(true);

  const [modo, setModo] = useState<Modo>("inicio");
  const [etapa, setEtapa] = useState<Etapa>("profissional");

  const [profissionalId, setProfissionalId] = useState<number | null>(null);
  const [tratamentoIds, setTratamentoIds] = useState<number[]>([]);
  const [data, setData] = useState<string>(DataAgenda.hoje().toString());

  // Resposta da API e horário escolhido ficam marcados com a consulta (profissional + data +
  // serviços) a que pertencem: se a consulta muda, eles deixam de valer sozinhos.
  const [resultadoHorarios, setResultadoHorarios] = useState<ResultadoHorarios | null>(null);
  const [selecaoHorario, setSelecaoHorario] = useState<SelecaoHorario | null>(null);
  // Horário que o cliente escolheu em "Ver horários": volta pré-selecionado ao agendar, se couber.
  const horarioPreferido = useRef<string | null>(null);

  const [clienteNome, setClienteNome] = useState("");
  const [clienteTelefone, setClienteTelefone] = useState("");
  // Só mostra os avisos de campo obrigatório depois da primeira tentativa de confirmar.
  const [tentouConfirmar, setTentouConfirmar] = useState(false);

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

  // No "Agendar" os horários dependem dos serviços escolhidos; no "Ver horários", não.
  const consultaHorarios =
    profissionalId !== null && data !== "" && (modo !== "agendar" || tratamentoIds.length > 0)
      ? `${profissionalId}|${data}|${tratamentoIds.join(",")}`
      : null;

  useEffect(() => {
    if (consultaHorarios === null || profissionalId === null) {
      return;
    }

    let cancelado = false;

    agendamentoService
      .disponibilidade(profissionalId, data, tratamentoIds)
      .then((horarios) => {
        if (cancelado) {
          return;
        }
        setResultadoHorarios({ consulta: consultaHorarios, horarios });
        const preferido = horarioPreferido.current;
        if (preferido && horarios.includes(preferido)) {
          setSelecaoHorario({ consulta: consultaHorarios, horario: preferido });
        }
      })
      .catch(() => {
        if (!cancelado) {
          setResultadoHorarios({ consulta: consultaHorarios, horarios: [] });
          setErro("Não foi possível carregar os horários disponíveis.");
        }
      });

    return () => {
      cancelado = true;
    };
  }, [consultaHorarios, profissionalId, data, tratamentoIds]);

  const horariosDisponiveis =
    resultadoHorarios?.consulta === consultaHorarios ? resultadoHorarios.horarios : [];
  const carregandoHorarios =
    consultaHorarios !== null && resultadoHorarios?.consulta !== consultaHorarios;
  const horarioInicio =
    selecaoHorario?.consulta === consultaHorarios ? selecaoHorario.horario : null;

  function selecionarHorario(horario: string): void {
    if (consultaHorarios !== null) {
      setSelecaoHorario({ consulta: consultaHorarios, horario });
    }
  }

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

  // Campos obrigatórios do agendamento: nome, telefone, data e horário.
  const errosDosDados = {
    nome: clienteNome.trim() === "" ? "Informe seu nome." : null,
    telefone:
      clienteTelefone.trim() === ""
        ? "Informe um telefone para contato."
        : !new Telefone(clienteTelefone).ehValido()
          ? "Telefone incompleto: informe o DDD e o número."
          : null,
    dataHorario: data === "" || horarioInicio === null ? "Escolha a data e o horário." : null,
  };
  const dadosValidos = !errosDosDados.nome && !errosDosDados.telefone && !errosDosDados.dataHorario;

  const etapas = ETAPAS_POR_MODO[modo === "agendar" ? "agendar" : "ver"];
  const indiceEtapa = etapas.indexOf(etapa);

  const podeAvancar =
    (etapa === "profissional" && profissionalId !== null) ||
    (etapa === "servico" && tratamentoIds.length > 0) ||
    (etapa === "data" && data !== "") ||
    (etapa === "horarios" && horarioInicio !== null);

  function iniciarFluxo(novoModo: "ver" | "agendar"): void {
    setModo(novoModo);
    setEtapa("profissional");
    setErro(null);
  }

  function voltarAoInicio(): void {
    setModo("inicio");
    setEtapa("profissional");
    horarioPreferido.current = null;
    setTratamentoIds([]);
    setSelecaoHorario(null);
    setClienteNome("");
    setClienteTelefone("");
    setTentouConfirmar(false);
    setAgendamentoConfirmado(null);
    setErro(null);
  }

  function voltarEtapa(): void {
    if (indiceEtapa > 0) {
      setEtapa(etapas[indiceEtapa - 1]);
    }
  }

  function avancarEtapa(): void {
    if (!podeAvancar) {
      return;
    }
    // Quem estava só vendo os horários e escolheu um passa a agendar: falta escolher o serviço.
    if (modo === "ver" && etapa === "horarios") {
      horarioPreferido.current = horarioInicio;
      setModo("agendar");
      setEtapa("servico");
      return;
    }
    if (indiceEtapa < etapas.length - 1) {
      setEtapa(etapas[indiceEtapa + 1]);
    }
  }

  function alternarTratamento(id: number): void {
    setTratamentoIds((atual) =>
      atual.includes(id) ? atual.filter((item) => item !== id) : [...atual, id]
    );
  }

  async function confirmarAgendamento(): Promise<void> {
    setTentouConfirmar(true);
    if (!dadosValidos || !profissionalId || !horarioInicio || tratamentoIds.length === 0) {
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
                Data: {new DataAgenda(agendamentoConfirmado.data).formatar()} às{" "}
                {agendamentoConfirmado.horarioInicio}
              </p>
              <p>
                Serviços:{" "}
                {agendamentoConfirmado.tratamentos.map((tratamento) => tratamento.nome).join(", ")}
              </p>
              <p>Valor total: {new Dinheiro(agendamentoConfirmado.valorTotal).formatar()}</p>
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
            Passo {indiceEtapa + 1}/{etapas.length}
          </span>
        </header>

        <div className="passo-corpo">
          {erro && <p className="mensagem-erro">{erro}</p>}

          {etapa === "profissional" && (
            <>
              <h3>Selecione o Profissional</h3>
              <SeletorProfissional
                profissionais={profissionais}
                selecionadoId={profissionalId}
                onSelecionar={setProfissionalId}
              />
            </>
          )}

          {etapa === "servico" && (
            <>
              <h3>Selecione o(s) Serviço(s)</h3>
              <SeletorTratamentos
                tratamentos={tratamentos}
                selecionadosIds={tratamentoIds}
                onAlternar={alternarTratamento}
              />
            </>
          )}

          {etapa === "data" && (
            <>
              <h3>
                Selecione a Data <span className="campo-obrigatorio">*</span>
              </h3>
              <input
                type="date"
                className="campo"
                min={DataAgenda.hoje().toString()}
                value={data}
                onChange={(evento) => setData(evento.target.value)}
              />
            </>
          )}

          {etapa === "horarios" && (
            <>
              <h3>
                Horários em {new DataAgenda(data).formatar()}{" "}
                {modo === "agendar" && <span className="campo-obrigatorio">*</span>}
              </h3>
              {modo === "ver" && (
                <p className="passo-dica">
                  Horários livres para atendimentos
                </p>
              )}
              <SeletorHorario
                horarios={horariosDisponiveis}
                selecionado={horarioInicio}
                onSelecionar={selecionarHorario}
                carregando={carregandoHorarios}
              />
            </>
          )}

          {etapa === "dados" && (
            <>
              <div className="resumo">
                <p>
                  Horário escolhido: {new DataAgenda(data).formatar()} às {horarioInicio}
                </p>
                <p>
                  Duração total: {duracaoTotal} min — Valor total: {new Dinheiro(valorTotal).formatar()}
                </p>
              </div>
              <h3>Preencha seus Dados</h3>
              {tentouConfirmar && errosDosDados.dataHorario && (
                <p className="mensagem-erro">{errosDosDados.dataHorario}</p>
              )}
              <div className="formulario-cliente">
                <label className="campo-rotulo">
                  <span>
                    Nome <span className="campo-obrigatorio">*</span>
                  </span>
                  <input
                    type="text"
                    className={`campo ${tentouConfirmar && errosDosDados.nome ? "invalido" : ""}`}
                    placeholder="Seu nome completo"
                    autoComplete="name"
                    required
                    aria-invalid={tentouConfirmar && Boolean(errosDosDados.nome)}
                    value={clienteNome}
                    onChange={(evento) => setClienteNome(evento.target.value)}
                  />
                  {tentouConfirmar && errosDosDados.nome && (
                    <span className="campo-erro">{errosDosDados.nome}</span>
                  )}
                </label>
                <label className="campo-rotulo">
                  <span>
                    Telefone <span className="campo-obrigatorio">*</span>
                  </span>
                  <input
                    type="tel"
                    className={`campo ${tentouConfirmar && errosDosDados.telefone ? "invalido" : ""}`}
                    placeholder="(00) 00000-0000"
                    autoComplete="tel"
                    inputMode="tel"
                    required
                    aria-invalid={tentouConfirmar && Boolean(errosDosDados.telefone)}
                    value={clienteTelefone}
                    onChange={(evento) =>
                      setClienteTelefone(new Telefone(evento.target.value).formatar())
                    }
                  />
                  {tentouConfirmar && errosDosDados.telefone && (
                    <span className="campo-erro">{errosDosDados.telefone}</span>
                  )}
                </label>
                <p className="campo-legenda">
                  <span className="campo-obrigatorio">*</span> Campos obrigatórios
                </p>
              </div>
            </>
          )}
        </div>

        <footer className="passo-rodape">
          <button
            type="button"
            className="botao-contorno"
            onClick={indiceEtapa === 0 ? voltarAoInicio : voltarEtapa}
          >
            <IconeSetaEsquerda /> {indiceEtapa === 0 ? "Cancelar" : "Voltar"}
          </button>

          {etapa === "dados" ? (
            <button
              type="button"
              className="botao-primario"
              disabled={enviando}
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
              {etapa === "horarios" && modo === "ver" ? "Agendar este horário" : "Próximo"}{" "}
              <IconeSetaDireita />
            </button>
          )}
        </footer>
      </section>
    </LayoutCliente>
  );
}
