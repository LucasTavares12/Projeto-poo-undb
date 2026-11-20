import { RowDataPacket, ResultSetHeader } from "mysql2";
import { Repositorio } from "./Repositorio";
import { Cliente } from "../module/Cliente";

interface LinhaCliente extends RowDataPacket {
  id: number;
  nome: string;
  telefone: string;
}

export class ClienteRepository extends Repositorio {
  // Telefone só com os números: "(98) 98877-6655" e "98988776655" são o mesmo.
  private static readonly TELEFONE_SO_DIGITOS =
    "REPLACE(REPLACE(REPLACE(REPLACE(REPLACE(telefone, '(', ''), ')', ''), '-', ''), ' ', ''), '+', '')";

  public async salvar(cliente: Cliente): Promise<Cliente> {
    const [resultado] = await this.pool.query<ResultSetHeader>(
      "INSERT INTO clientes (nome, telefone) VALUES (?, ?)",
      [cliente.getNome(), cliente.getTelefone()]
    );
    return new Cliente(cliente.getNome(), cliente.getTelefone(), resultado.insertId);
  }

  /**
   * Agendamento novo: reaproveita o cliente com o mesmo telefone e o mesmo nome (sem ligar
   * para acentos, maiúsculas e espaços) e só cadastra se ainda não existir. Um telefone pode
   * ter várias pessoas (ex.: a mãe e a filha): cada uma é um cliente diferente.
   */
  public async buscarOuSalvar(cliente: Cliente): Promise<Cliente> {
    const [linhas] = await this.pool.query<LinhaCliente[]>(
      `SELECT * FROM clientes WHERE ${ClienteRepository.TELEFONE_SO_DIGITOS} = ? ORDER BY id`,
      [cliente.getTelefoneDigitos()]
    );
    const existente = linhas
      .map((linha) => this.paraCliente(linha))
      .find((doTelefone) => doTelefone.ehAMesmaPessoaQue(cliente));
    return existente ?? this.salvar(cliente);
  }

  public async buscarPorId(id: number): Promise<Cliente | null> {
    const [linhas] = await this.pool.query<LinhaCliente[]>(
      "SELECT * FROM clientes WHERE id = ?",
      [id]
    );
    return linhas.length > 0 ? this.paraCliente(linhas[0]) : null;
  }

  public async listarTodos(): Promise<Cliente[]> {
    const [linhas] = await this.pool.query<LinhaCliente[]>(
      "SELECT * FROM clientes ORDER BY nome"
    );
    return linhas.map((linha) => this.paraCliente(linha));
  }

  private paraCliente(linha: LinhaCliente): Cliente {
    return new Cliente(linha.nome, linha.telefone, linha.id);
  }
}
