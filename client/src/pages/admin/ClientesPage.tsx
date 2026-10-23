import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { ClienteService } from "../../services/ClienteService";
import type { ClienteResumo } from "../../services/types";
import { DataAgenda } from "../../models/DataAgenda";
import { Dinheiro } from "../../models/Dinheiro";
import { Telefone } from "../../models/Telefone";
import { HorarioMarcado } from "../../models/HorarioMarcado";
import { CabecalhoPagina } from "../../components/admin/CabecalhoPagina";
import { useUsuarioLogado } from "../../hooks/useUsuarioLogado";
import { PerfilDeAcesso } from "../../models/PerfilDeAcesso";
import { IconeBusca, IconeCalendario, IconeSetaDireita } from "../../components/Icones";

const clienteService = new ClienteService();

/** Espera a pessoa parar de digitar antes de buscar (ms). */
const ESPERA_BUSCA = 300;

/** Resultado de uma busca, marcado com o texto buscado. */
interface Resultado {
  busca: string;
  clientes: ClienteResumo[];
}

/** Aba "Clientes": todo mundo que já agendou, com busca por nome ou telefone. */
export function ClientesPage() {
  const perfil = new PerfilDeAcesso(useUsuarioLogado());
  const [busca, setBusca] = useState("");
  const [resultado, setResultado] = useState<Resultado | null>(null);
  const [erro, setErro] = useState<string | null>(null);

  useEffect(() => {
    let cancelado = false;
    const espera = setTimeout(() => {
      clienteService
        .listar(busca.trim())
        .then((clientes) => {
          if (!cancelado) {
            setResultado({ busca, clientes });
            setErro(null);
          }
        })
        .catch((erroRequisicao: Error) => {
          if (!cancelado) {
            setErro(erroRequisicao.message);
          }
        });
    }, ESPERA_BUSCA);
    return () => {
      cancelado = true;
      clearTimeout(espera);
    };
  }, [busca]);

  const clientes = resultado?.clientes ?? [];
  const buscando = resultado === null || resultado.busca !== busca;

  return (
    <section className="pagina">
      <CabecalhoPagina
        titulo="Clientes"
        descricao={
          perfil.temAcessoTotal()
            ? "Ficha e histórico de quem já agendou na clínica."
            : "Ficha e histórico dos clientes que você atendeu."
        }
      />

      <label className="clientes-busca">
        <IconeBusca tamanho={18} />
        <input
          type="search"
          placeholder="Buscar por nome ou telefone"
          aria-label="Buscar cliente por nome ou telefone"
          value={busca}
          onChange={(evento) => setBusca(evento.target.value)}
        />
      </label>

      {erro && <p className="mensagem-erro">{erro}</p>}

      {resultado === null ? (
        <p>Carregando...</p>
      ) : clientes.length === 0 ? (
        <p className="bloqueios-vazio">
          {busca.trim()
            ? `Nenhum cliente encontrado para "${busca.trim()}".`
            : "Nenhum cliente ainda. Eles aparecem aqui depois do primeiro agendamento."}
        </p>
      ) : (
        <>
          <p className="clientes-contagem" aria-live="polite">
            {clientes.length === 1 ? "1 cliente" : `${clientes.length} clientes`}
          </p>
          <ul className={`clientes-lista ${buscando ? "atualizando" : ""}`}>
            {clientes.map((cliente) => (
              <li key={cliente.telefone}>
                <Link to={`/admin/clientes/${cliente.telefone}`} className="cliente-item">
                  <span className="admin-avatar">{cliente.nome.charAt(0).toUpperCase()}</span>
                  <span className="cliente-item-texto">
                    <strong>{cliente.nome}</strong>
                    <span>{new Telefone(cliente.telefone).formatar()}</span>
                  </span>
                  <span className="cliente-item-numeros">
                    <span>
                      <small>Atendimentos</small>
                      <b>{cliente.atendimentos}</b>
                    </span>
                    <span>
                      <small>Total gasto</small>
                      <b>{new Dinheiro(cliente.totalGasto).formatar()}</b>
                    </span>
                    <span>
                      <small>Último atendimento</small>
                      <b>
                        {cliente.ultimoAtendimento
                          ? new DataAgenda(cliente.ultimoAtendimento).formatar()
                          : "—"}
                      </b>
                    </span>
                  </span>
                  {cliente.proximoAgendamento && (
                    <span className="cliente-item-proximo">
                      <IconeCalendario tamanho={13} /> Próximo:{" "}
                      {HorarioMarcado.de(cliente.proximoAgendamento).formatar()}
                    </span>
                  )}
                  <span className="cliente-item-seta" aria-hidden="true">
                    <IconeSetaDireita tamanho={18} />
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        </>
      )}
    </section>
  );
}
