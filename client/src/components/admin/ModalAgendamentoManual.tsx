import { useEffect, useState } from "react";
import type { FormEvent } from "react";
import { ProfissionalService } from "../../services/ProfissionalService";
import { TratamentoService } from "../../services/TratamentoService";
import { AgendamentoService } from "../../services/AgendamentoService";
import type { Agendamento, Profissional, Tratamento } from "../../services/types";
import { DataAgenda } from "../../models/DataAgenda";
import { Dinheiro } from "../../models/Dinheiro";
import { Duracao } from "../../models/Duracao";
import { Telefone } from "../../models/Telefone";
import { IconeFechar } from "../Icones";

const profissionalService = new ProfissionalService();
const tratamentoService = new TratamentoService();
const agendamentoService = new AgendamentoService();

interface Props {
  /** Conta ligada a um profissional: o agendamento é sempre para ele (select travado). */
  profissionalFixo?: number | null;
  onFechar: () => void;
  onCriado: (agendamento: Agendamento) => void;
}

/** Horários livres na agenda do profissional, marcados com a consulta a que pertencem. */
interface HorariosDisponiveis {
  consulta: string;
  horarios: string[];
}

export function ModalAgendamentoManual({ profissionalFixo = null, onFechar, onCriado }: Props) {
  const [profissionais, setProfissionais] = useState<Profissional[]>([]);
  const [tratamentos, setTratamentos] = useState<Tratamento[]>([]);

  const [clienteNome, setClienteNome] = useState("");
  const [clienteTelefone, setClienteTelefone] = useState("");
  const [profissionalId, setProfissionalId] = useState<number | null>(profissionalFixo);
  const [tratamentoIds, setTratamentoIds] = useState<number[]>([]);
  const [data, setData] = useState(DataAgenda.hoje().toString());
  const [horario, setHorario] = useState("");

  const [disponiveis, setDisponiveis] = useState<HorariosDisponiveis | null>(null);
  const [enviando, setEnviando] = useState(false);
  const [erro, setErro] = useState<string | null>(null);
  // Só mostra os avisos de campo obrigatório depois da primeira tentativa de agendar.
  const [tentouEnviar, setTentouEnviar] = useState(false);

  useEffect(() => {
    Promise.all([profissionalService.listar(), tratamentoService.listar()])
      .then(([listaProfissionais, listaTratamentos]) => {
        setProfissionais(listaProfissionais);
        setTratamentos(listaTratamentos);
        if (profissionalFixo === null && listaProfissionais.length === 1) {
          setProfissionalId(listaProfissionais[0].id);
        }
      })
      .catch(() => setErro("Não foi possível carregar profissionais e tratamentos."));
  }, [profissionalFixo]);

  // Esc fecha a janela.
  useEffect(() => {
    function aoTeclar(evento: KeyboardEvent) {
      if (evento.key === "Escape") {
        onFechar();
      }
    }
    window.addEventListener("keydown", aoTeclar);
    return () => window.removeEventListener("keydown", aoTeclar);
  }, [onFechar]);

  // Os horários dependem do profissional, da data e dos tratamentos (duração total).
  const consulta =
    profissionalId !== null && data !== "" && tratamentoIds.length > 0
      ? `${profissionalId}|${data}|${tratamentoIds.join(",")}`
      : null;

  useEffect(() => {
    if (consulta === null || profissionalId === null) {
      return;
    }
    let cancelado = false;
    agendamentoService
      .disponibilidade(profissionalId, data, tratamentoIds)
      .then((horarios) => {
        if (!cancelado) {
          setDisponiveis({ consulta, horarios });
        }
      })
      .catch(() => {
        if (!cancelado) {
          setDisponiveis({ consulta, horarios: [] });
          setErro("Não foi possível carregar os horários disponíveis.");
        }
      });
    return () => {
      cancelado = true;
    };
  }, [consulta, profissionalId, data, tratamentoIds]);

  const resultado = disponiveis?.consulta === consulta ? disponiveis : null;
  const carregandoHorarios = consulta !== null && resultado === null;
  const horariosVisiveis = resultado?.horarios ?? [];
  // Se mudar profissional/data/tratamentos e o horário escolhido deixar de estar
  // disponível, ele deixa de valer: o select volta para "Selecione...".
  const horarioEscolhido = horariosVisiveis.includes(horario) ? horario : "";

  const textoSemHorario =
    consulta === null
      ? "Escolha profissional e tratamentos"
      : carregandoHorarios
        ? "Carregando horários..."
        : horariosVisiveis.length === 0
          ? "Nenhum horário disponível"
          : "Selecione...";

  // Só os tratamentos que o profissional escolhido realiza (os sem profissional valem para todos).
  const tratamentosDoProfissional = tratamentos.filter(
    (tratamento) =>
      tratamento.profissionalId === null || tratamento.profissionalId === profissionalId
  );
  const selecionados = tratamentos.filter((tratamento) => tratamentoIds.includes(tratamento.id));
  const duracaoTotal = selecionados.reduce((total, tratamento) => total + tratamento.duracaoMinutos, 0);
  const valorTotal = selecionados.reduce((total, tratamento) => total + tratamento.valor, 0);

  const erros = {
    nome: clienteNome.trim() === "" ? "Informe o nome do cliente." : null,
    telefone:
      clienteTelefone.trim() === ""
        ? "Informe o telefone do cliente."
        : !new Telefone(clienteTelefone).ehValido()
          ? "Telefone incompleto: informe o DDD e o número."
          : null,
    profissional: profissionalId === null ? "Escolha o profissional." : null,
    tratamentos: tratamentoIds.length === 0 ? "Escolha ao menos um tratamento." : null,
    data: data === "" ? "Informe a data." : null,
    horario: horarioEscolhido === "" ? "Escolha o horário." : null,
  };
  const formularioValido = Object.values(erros).every((mensagem) => mensagem === null);
  const mostrarErro = (campo: keyof typeof erros) => (tentouEnviar ? erros[campo] : null);

  /** Trocar de profissional desmarca os tratamentos que o novo profissional não realiza. */
  function selecionarProfissional(id: number | null): void {
    setProfissionalId(id);
    setTratamentoIds((atual) =>
      atual.filter((tratamentoId) => {
        const dono = tratamentos.find((tratamento) => tratamento.id === tratamentoId)?.profissionalId;
        return dono === null || dono === id;
      })
    );
  }

  function alternarTratamento(id: number): void {
    setTratamentoIds((atual) =>
      atual.includes(id) ? atual.filter((item) => item !== id) : [...atual, id]
    );
  }

  async function agendar(evento: FormEvent): Promise<void> {
    evento.preventDefault();
    setTentouEnviar(true);
    if (!formularioValido || enviando || profissionalId === null) {
      return;
    }

    setEnviando(true);
    setErro(null);
    try {
      const criado = await agendamentoService.criar({
        clienteNome: clienteNome.trim(),
        clienteTelefone: clienteTelefone.trim(),
        profissionalId,
        tratamentoIds,
        data,
        horarioInicio: horarioEscolhido,
      });
      onCriado(criado);
    } catch (erroRequisicao) {
      setErro((erroRequisicao as Error).message);
      setEnviando(false);
    }
  }

  return (
    <div className="modal-fundo" onMouseDown={onFechar}>
      <form
        className="modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby="modal-agendamento-titulo"
        onMouseDown={(evento) => evento.stopPropagation()}
        onSubmit={agendar}
        noValidate
      >
        <header className="modal-cabecalho">
          <div>
            <h2 id="modal-agendamento-titulo">Novo agendamento</h2>
            <p>Agende pelo painel em um dos horários disponíveis.</p>
          </div>
          <button type="button" className="modal-fechar" onClick={onFechar} aria-label="Fechar">
            <IconeFechar tamanho={18} />
          </button>
        </header>

        <div className="modal-corpo">
          {erro && <p className="mensagem-erro">{erro}</p>}

          <div className="admin-campos">
            <label>
              <span>
                Nome do cliente <span className="campo-obrigatorio">*</span>
              </span>
              <input
                type="text"
                required
                autoFocus
                aria-invalid={Boolean(mostrarErro("nome"))}
                value={clienteNome}
                onChange={(evento) => setClienteNome(evento.target.value)}
              />
              {mostrarErro("nome") && <span className="campo-erro">{erros.nome}</span>}
            </label>
            <label>
              <span>
                Telefone <span className="campo-obrigatorio">*</span>
              </span>
              <input
                type="tel"
                inputMode="tel"
                placeholder="(00) 00000-0000"
                required
                aria-invalid={Boolean(mostrarErro("telefone"))}
                value={clienteTelefone}
                onChange={(evento) =>
                  setClienteTelefone(new Telefone(evento.target.value).formatar())
                }
              />
              {mostrarErro("telefone") && <span className="campo-erro">{erros.telefone}</span>}
            </label>
            <label className="admin-campo-largo">
              <span>
                Profissional <span className="campo-obrigatorio">*</span>
              </span>
              <select
                required
                aria-invalid={Boolean(mostrarErro("profissional"))}
                value={profissionalId ?? ""}
                disabled={profissionalFixo !== null}
                onChange={(evento) =>
                  selecionarProfissional(
                    evento.target.value === "" ? null : Number(evento.target.value)
                  )
                }
              >
                <option value="" disabled>
                  Selecione...
                </option>
                {profissionais.map((profissional) => (
                  <option key={profissional.id} value={profissional.id}>
                    {profissional.nome}
                  </option>
                ))}
              </select>
              {mostrarErro("profissional") && (
                <span className="campo-erro">{erros.profissional}</span>
              )}
            </label>
          </div>

          <fieldset className="modal-grupo">
            <legend>
              Tratamentos <span className="campo-obrigatorio">*</span>
            </legend>
            <div className="modal-opcoes">
              {tratamentosDoProfissional.map((tratamento) => {
                const marcado = tratamentoIds.includes(tratamento.id);
                return (
                  <button
                    key={tratamento.id}
                    type="button"
                    className={`modal-opcao ${marcado ? "marcada" : ""}`}
                    aria-pressed={marcado}
                    onClick={() => alternarTratamento(tratamento.id)}
                  >
                    {tratamento.nome}
                    <span>{new Duracao(tratamento.duracaoMinutos).formatar()}</span>
                  </button>
                );
              })}
              {tratamentosDoProfissional.length === 0 && (
                <p className="admin-dica">
                  {tratamentos.length === 0
                    ? "Nenhum tratamento cadastrado."
                    : "Nenhum tratamento cadastrado para este profissional."}
                </p>
              )}
            </div>
            {mostrarErro("tratamentos") && (
              <span className="campo-erro">{erros.tratamentos}</span>
            )}
            {selecionados.length > 0 && (
              <p className="modal-total">
                Total: <strong>{new Duracao(duracaoTotal).formatar()}</strong> ·{" "}
                <strong>{new Dinheiro(valorTotal).formatar()}</strong>
              </p>
            )}
          </fieldset>

          <div className="admin-campos">
            <label>
              <span>
                Data <span className="campo-obrigatorio">*</span>
              </span>
              <input
                type="date"
                required
                aria-invalid={Boolean(mostrarErro("data"))}
                value={data}
                onChange={(evento) => setData(evento.target.value)}
              />
              {mostrarErro("data") && <span className="campo-erro">{erros.data}</span>}
            </label>
            <label>
              <span>
                Horário <span className="campo-obrigatorio">*</span>
              </span>
              <select
                required
                aria-invalid={Boolean(mostrarErro("horario"))}
                disabled={horariosVisiveis.length === 0}
                value={horarioEscolhido}
                onChange={(evento) => setHorario(evento.target.value)}
              >
                <option value="" disabled>
                  {textoSemHorario}
                </option>
                {horariosVisiveis.map((opcao) => (
                  <option key={opcao} value={opcao}>
                    {opcao} — disponível
                  </option>
                ))}
              </select>
              {mostrarErro("horario") && <span className="campo-erro">{erros.horario}</span>}
            </label>
          </div>

          {consulta === null ? (
            <p className="admin-dica">
              Escolha o profissional e os tratamentos para ver os horários disponíveis.
            </p>
          ) : (
            !carregandoHorarios &&
            horariosVisiveis.length === 0 && (
              <p className="admin-dica">
                Nenhum horário disponível na agenda desse profissional nesse dia. Escolha outra
                data.
              </p>
            )
          )}
        </div>

        <footer className="modal-rodape">
          <span className="campo-legenda">
            <span className="campo-obrigatorio">*</span> Campos obrigatórios
          </span>
          <button type="button" className="admin-botao" onClick={onFechar}>
            Cancelar
          </button>
          <button type="submit" className="admin-botao principal" disabled={enviando}>
            {enviando ? "Agendando..." : "Agendar"}
          </button>
        </footer>
      </form>
    </div>
  );
}
