import { RowDataPacket, ResultSetHeader } from "mysql2";
import { Repositorio } from "./Repositorio";
import { Cliente } from "../module/Cliente";

interface LinhaCliente extends RowDataPacket {
  id: number;
  nome: string;
  telefone: string;
}

export class ClienteRepository extends Repositorio {
  public async salvar(cliente: Cliente): Promise<Cliente> {
    const [resultado] = await this.pool.query<ResultSetHeader>(
      "INSERT INTO clientes (nome, telefone) VALUES (?, ?)",
      [cliente.getNome(), cliente.getTelefone()]
    );
    return new Cliente(cliente.getNome(), cliente.getTelefone(), resultado.insertId);
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
