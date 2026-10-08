import express, { Express } from "express";
import cors from "cors";
import { HealthController } from "./controllers/HealthController";
import { ProfissionalController } from "./controllers/ProfissionalController";
import { TratamentoController } from "./controllers/TratamentoController";
import { HorarioDisponivelController } from "./controllers/HorarioDisponivelController";
import { AgendamentoController } from "./controllers/AgendamentoController";
import { AutenticacaoController } from "./controllers/AutenticacaoController";
import { ConfiguracaoController } from "./controllers/ConfiguracaoController";
import { RelatorioController } from "./controllers/RelatorioController";
import { UsuarioController } from "./controllers/UsuarioController";
import { ErrorHandlerMiddleware } from "./middlewares/ErrorHandlerMiddleware";
import { AutenticacaoMiddleware } from "./middlewares/AutenticacaoMiddleware";
import { AutenticacaoService } from "./services/AutenticacaoService";

/**
 * Classe responsável por montar a aplicação Express: middlewares, rotas
 * e o próprio servidor HTTP. Novos controllers serão registrados em
 * `configurarRotas()` à medida que forem criados.
 */
export class App {
  private readonly app: Express;
  private readonly healthController = new HealthController();
  private readonly profissionalController = new ProfissionalController();
  private readonly tratamentoController = new TratamentoController();
  private readonly horarioDisponivelController = new HorarioDisponivelController();
  private readonly agendamentoController = new AgendamentoController();
  private readonly configuracaoController = new ConfiguracaoController();
  private readonly relatorioController = new RelatorioController();
  private readonly usuarioController = new UsuarioController();
  private readonly errorHandlerMiddleware = new ErrorHandlerMiddleware();

  // Controller de login e middleware compartilham o mesmo serviço (mesmo segredo de assinatura).
  private readonly autenticacaoService = new AutenticacaoService();
  private readonly autenticacaoController = new AutenticacaoController(this.autenticacaoService);
  private readonly autenticacaoMiddleware = new AutenticacaoMiddleware(this.autenticacaoService);

  /** Colocado antes do handler nas rotas que só o administrador pode usar. */
  private readonly exigirAdmin: express.RequestHandler = (req, res, next) =>
    this.autenticacaoMiddleware.verificar(req, res, next);

  /**
   * Depois de `exigirAdmin`, nas áreas da clínica inteira (usuários, configurações,
   * tratamentos, cadastro e exclusão de profissionais): conta ligada a profissional não entra.
   */
  private readonly soAcessoTotal: express.RequestHandler = (req, res, next) =>
    this.autenticacaoMiddleware.exigirAcessoTotal(req, res, next);

  constructor() {
    this.app = express();

    this.configurarMiddlewares();
    this.configurarRotas();
    this.configurarTratamentoDeErros();
  }

  private configurarMiddlewares(): void {
    this.app.use(cors());
    this.app.use(express.json());
  }

  /** Precisa ser registrado DEPOIS das rotas: só assim o Express sabe que é um error handler. */
  private configurarTratamentoDeErros(): void {
    this.app.use((erro: Error, req: express.Request, res: express.Response, next: express.NextFunction) =>
      this.errorHandlerMiddleware.tratar(erro, req, res, next)
    );
  }

  private configurarRotas(): void {
    this.app.get("/health", (req, res) => this.healthController.check(req, res));
    this.app.get("/health/db", (req, res) => this.healthController.checkDatabase(req, res));

    this.app.post("/login", (req, res) => this.autenticacaoController.entrar(req, res));
    this.app.post("/cadastro", (req, res) => this.autenticacaoController.cadastrar(req, res));
    this.app.get("/sessao", this.exigirAdmin, (req, res) =>
      this.autenticacaoController.sessao(req, res)
    );

    this.configurarRotasDeProfissionais();
    this.configurarRotasDeTratamentos();
    this.configurarRotasDeHorariosDisponiveis();
    this.configurarRotasDeAgendamentos();
    this.configurarRotasDeConfiguracoes();
    this.configurarRotasDeRelatorios();
    this.configurarRotasDeUsuarios();
  }

  private configurarRotasDeProfissionais(): void {
    this.app.get("/profissionais", (req, res) => this.profissionalController.listar(req, res));
    this.app.post("/profissionais", this.exigirAdmin, this.soAcessoTotal, (req, res) =>
      this.profissionalController.criar(req, res)
    );
    this.app.put("/profissionais/:id", this.exigirAdmin, (req, res) =>
      this.profissionalController.atualizar(req, res)
    );
    this.app.delete("/profissionais/:id", this.exigirAdmin, this.soAcessoTotal, (req, res) =>
      this.profissionalController.deletar(req, res)
    );
  }

  private configurarRotasDeTratamentos(): void {
    this.app.get("/tratamentos", (req, res) => this.tratamentoController.listar(req, res));
    this.app.post("/tratamentos", this.exigirAdmin, this.soAcessoTotal, (req, res) =>
      this.tratamentoController.criar(req, res)
    );
    this.app.put("/tratamentos/:id", this.exigirAdmin, this.soAcessoTotal, (req, res) =>
      this.tratamentoController.atualizar(req, res)
    );
    this.app.delete("/tratamentos/:id", this.exigirAdmin, this.soAcessoTotal, (req, res) =>
      this.tratamentoController.deletar(req, res)
    );
  }

  private configurarRotasDeHorariosDisponiveis(): void {
    this.app.get("/profissionais/:profissionalId/horarios", this.exigirAdmin, (req, res) =>
      this.horarioDisponivelController.listarPorProfissional(req, res)
    );
    this.app.post("/horarios", this.exigirAdmin, (req, res) =>
      this.horarioDisponivelController.criar(req, res)
    );
    this.app.delete("/horarios/:id", this.exigirAdmin, (req, res) =>
      this.horarioDisponivelController.deletar(req, res)
    );
  }

  private configurarRotasDeAgendamentos(): void {
    this.app.get("/disponibilidade", (req, res) =>
      this.agendamentoController.disponibilidade(req, res)
    );
    // Públicas: o cliente acha e cancela o próprio agendamento pelo telefone.
    this.app.get("/meus-agendamentos", (req, res) =>
      this.agendamentoController.listarDoCliente(req, res)
    );
    this.app.delete("/meus-agendamentos/:id", (req, res) =>
      this.agendamentoController.cancelarDoCliente(req, res)
    );
    this.app.get("/agendamentos", this.exigirAdmin, (req, res) =>
      this.agendamentoController.listar(req, res)
    );
    this.app.post("/agendamentos", (req, res) => this.agendamentoController.criar(req, res));
    this.app.post("/agendamentos/finalizados/arquivar", this.exigirAdmin, (req, res) =>
      this.agendamentoController.arquivarFinalizados(req, res)
    );
    this.app.get("/agendamentos/arquivados/quantidade", this.exigirAdmin, (req, res) =>
      this.agendamentoController.contarArquivados(req, res)
    );
    this.app.post("/agendamentos/arquivados/restaurar", this.exigirAdmin, (req, res) =>
      this.agendamentoController.restaurarArquivados(req, res)
    );
    this.app.delete("/agendamentos/:id", this.exigirAdmin, (req, res) =>
      this.agendamentoController.cancelar(req, res)
    );
    this.app.patch("/agendamentos/:id/status", this.exigirAdmin, (req, res) =>
      this.agendamentoController.atualizarStatus(req, res)
    );
  }

  private configurarRotasDeConfiguracoes(): void {
    this.app.get("/configuracoes", (req, res) => this.configuracaoController.obter(req, res));
    this.app.put("/configuracoes", this.exigirAdmin, this.soAcessoTotal, (req, res) =>
      this.configuracaoController.atualizar(req, res)
    );
  }

  private configurarRotasDeRelatorios(): void {
    this.app.get("/relatorios/mensal", this.exigirAdmin, (req, res) =>
      this.relatorioController.mensal(req, res)
    );
  }

  private configurarRotasDeUsuarios(): void {
    this.app.get("/usuarios", this.exigirAdmin, this.soAcessoTotal, (req, res) =>
      this.usuarioController.listar(req, res)
    );
    this.app.post("/usuarios", this.exigirAdmin, this.soAcessoTotal, (req, res) =>
      this.usuarioController.criar(req, res)
    );
    this.app.put("/usuarios/:id/email", this.exigirAdmin, this.soAcessoTotal, (req, res) =>
      this.usuarioController.alterarEmail(req, res)
    );
    this.app.put("/usuarios/:id/senha", this.exigirAdmin, this.soAcessoTotal, (req, res) =>
      this.usuarioController.alterarSenha(req, res)
    );
    this.app.put("/usuarios/:id/profissional", this.exigirAdmin, this.soAcessoTotal, (req, res) =>
      this.usuarioController.vincularProfissional(req, res)
    );
    this.app.delete("/usuarios/:id", this.exigirAdmin, this.soAcessoTotal, (req, res) =>
      this.usuarioController.excluir(req, res)
    );
  }

  public getExpressApp(): Express {
    return this.app;
  }

  public iniciar(porta: number): void {
    this.app.listen(porta, () => {
      console.log(`Servidor rodando em http://localhost:${porta}`);
    });
  }
}
